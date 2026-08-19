#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# EVAT Docker smoke test
#
#   ./scripts/docker-smoke-test.sh            # test an already-running stack
#   ./scripts/docker-smoke-test.sh --up       # build + start the stack first
#   ./scripts/docker-smoke-test.sh --up --down  # ... and tear it down after
#
# Writes a shareable report to docker-test-results.txt in the repo root.
# ---------------------------------------------------------------------------

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

REPORT="$REPO_ROOT/docker-test-results.txt"

# Host ports must match docker-compose.yml. Override the same way Compose does:
#   API_HOST_PORT=9090 ./scripts/docker-smoke-test.sh
[ -f "$REPO_ROOT/.env" ] && . "$REPO_ROOT/.env" 2>/dev/null
WEB=http://localhost:${WEB_HOST_PORT:-3000}
API=http://localhost:${API_HOST_PORT:-8081}
PY=http://localhost:${PY_HOST_PORT:-5000}

DO_UP=0
DO_DOWN=0
for arg in "$@"; do
  case "$arg" in
    --up)   DO_UP=1 ;;
    --down) DO_DOWN=1 ;;
  esac
done

PASS=0
FAIL=0
WARN=0

: > "$REPORT"
log()  { printf '%s\n' "$*" | tee -a "$REPORT"; }
head1() { log ""; log "=============================================================="; log "$*"; log "=============================================================="; }

ok()   { PASS=$((PASS+1)); log "  PASS  $*"; }
bad()  { FAIL=$((FAIL+1)); log "  FAIL  $*"; }
warn() { WARN=$((WARN+1)); log "  WARN  $*"; }

# check_http <label> <url> <expected-status> [curl args...]
check_http() {
  local label="$1" url="$2" want="$3"; shift 3
  local got
  got=$(curl -s -o /tmp/evat_body.$$ -w '%{http_code}' --max-time 30 "$@" "$url" 2>/dev/null)
  if [ "$got" = "$want" ]; then
    ok "$label  ($got) $url"
  else
    bad "$label  (got $got, want $want) $url"
    log "        body: $(head -c 300 /tmp/evat_body.$$ 2>/dev/null | tr '\n' ' ')"
  fi
  rm -f /tmp/evat_body.$$
}

# check_body <label> <url> <grep-pattern>
check_body() {
  local label="$1" url="$2" pat="$3"
  local body
  body=$(curl -s --max-time 30 "$url" 2>/dev/null)
  if printf '%s' "$body" | grep -q "$pat"; then
    ok "$label  (matched '$pat')"
  else
    bad "$label  (no '$pat' in response) $url"
    log "        body: $(printf '%s' "$body" | head -c 300 | tr '\n' ' ')"
  fi
}

head1 "EVAT Docker smoke test"
log "date        : $(date)"
log "repo        : $REPO_ROOT"
log "git branch  : $(git rev-parse --abbrev-ref HEAD 2>/dev/null)"
log "git commit  : $(git rev-parse --short HEAD 2>/dev/null)"
log "docker      : $(docker --version 2>/dev/null)"
log "compose     : $(docker compose version 2>/dev/null)"
log "host        : $(uname -srm)"

# ---------------------------------------------------------------------------
head1 "0. Pre-flight"
# ---------------------------------------------------------------------------
if ! docker info >/dev/null 2>&1; then
  bad "Docker daemon is not running - start Docker Desktop and re-run"
  exit 1
fi
ok "Docker daemon reachable"

if [ -f server/node-api/.env ]; then
  ok "server/node-api/.env exists"
  for v in MONGODB_URI JWT_SECRET GOOGLE_MAPS_API_KEY; do
    if grep -q "^${v}=.\+" server/node-api/.env; then
      ok "  $v is set"
    else
      warn "  $v is empty or missing (some tests below will fail)"
    fi
  done
  if grep -qE '^PYTHON_API_URL=.*127\.0\.0\.1' server/node-api/.env; then
    log "  note: .env still has PYTHON_API_URL=127.0.0.1 - compose overrides it, test 3.1 proves it"
  fi
else
  warn "server/node-api/.env missing - copy .env.example and fill it in"
fi

if docker compose config >/dev/null 2>&1; then
  ok "docker compose config parses"
else
  bad "docker compose config failed:"
  docker compose config 2>&1 | tail -5 | tee -a "$REPORT"
  exit 1
fi

# ---------------------------------------------------------------------------
if [ "$DO_UP" = "1" ]; then
  head1 "0b. Build and start"
  log "Building (first run pulls base images + the ML wheels; 5-15 min is normal)..."
  docker compose build > "$REPO_ROOT/docker-build.log" 2>&1
  build_rc=$?
  tail -25 "$REPO_ROOT/docker-build.log" | tee -a "$REPORT"
  if [ "$build_rc" -eq 0 ]; then
    ok "docker compose build completed (full output: docker-build.log)"
  else
    bad "docker compose build FAILED (rc=$build_rc) - full output in docker-build.log"
    exit 1
  fi
  docker compose up -d 2>&1 | tail -10 | tee -a "$REPORT"

  log ""
  log "Waiting for pythonsvc to become healthy (it trains the cost model and"
  log "loads the price model at startup - up to ~4 minutes)..."
  for i in $(seq 1 60); do
    state=$(docker inspect --format '{{.State.Health.Status}}' evat-pythonsvc 2>/dev/null)
    printf '  [%02d/60] pythonsvc: %s\n' "$i" "${state:-starting}"
    [ "$state" = "healthy" ] && break
    sleep 10
  done
  log ""
fi

# ---------------------------------------------------------------------------
head1 "1. Container state"
# ---------------------------------------------------------------------------
docker compose ps 2>&1 | tee -a "$REPORT"
log ""
WEB_UP=0; API_UP=0; PY_UP=0
for c in evat-web evat-api evat-pythonsvc; do
  st=$(docker inspect --format '{{.State.Status}}' "$c" 2>/dev/null)
  if [ "$st" = "running" ]; then
    ok "$c is running"
    case "$c" in evat-web) WEB_UP=1 ;; evat-api) API_UP=1 ;; evat-pythonsvc) PY_UP=1 ;; esac
  else
    bad "$c is '${st:-not created}' (expected running)"
  fi
done
if [ "$((WEB_UP+API_UP+PY_UP))" -lt 3 ]; then
  log ""
  log "  Not all containers are up. Start them first:"
  log "      docker compose up -d          (or re-run this script with --up)"
fi

# A crash-looping container makes every downstream test meaningless - surface
# the actual crash here instead of leaving it in section 8.
for c in evat-api evat-pythonsvc evat-web; do
  st=$(docker inspect --format '{{.State.Status}}' "$c" 2>/dev/null)
  rc=$(docker inspect --format '{{.State.ExitCode}}' "$c" 2>/dev/null)
  if [ "$st" = "restarting" ] || { [ "$st" = "exited" ] && [ "$rc" != "0" ]; }; then
    log ""
    log "  >>> $c is crash-looping (status=$st exit=$rc). Its last 30 log lines:"
    docker logs --tail=30 "$c" 2>&1 | sed 's/^/      /' | tee -a "$REPORT" >/dev/null
    docker logs --tail=30 "$c" 2>&1 | sed 's/^/      /'
  fi
done

# Detect a non-EVAT service squatting on the API host port (a local Jenkins on
# 8080 is the classic one - it answers 403 "No valid crumb", which looks like an
# app bug but is not.)
probe=$(curl -s --max-time 10 "$API/api-docs/json" 2>/dev/null | head -c 400)
case "$probe" in
  *crumb*|*Jenkins*|*jenkins*)
    bad "Another service (looks like Jenkins) owns $API - the API tests below are hitting it, not EVAT"
    log "        Fix: set API_HOST_PORT to a free port in the root .env, or stop that service."
    ;;
esac

# ---------------------------------------------------------------------------
head1 "2. ISSUE 1 - backend runs 'node server.js', not 'npm run server'"
# ---------------------------------------------------------------------------
cmd=$(docker inspect --format '{{json .Config.Cmd}}' evat-api 2>/dev/null)
log "  image CMD   : $cmd"
case "$cmd" in
  *node*server.js*) ok "CMD is node server.js" ;;
  *)                bad "CMD is not 'node server.js' -> $cmd" ;;
esac

# Inspect the IMAGE, not the running container, so this still works while the
# container is crash-looping.
if docker run --rm --entrypoint sh evat-api:local -c 'ls -l /app/server.js' >/tmp/evat_srv.$$ 2>&1; then
  ok "/app/server.js exists inside the image (tsc output)"
  sed 's/^/        /' /tmp/evat_srv.$$ | tee -a "$REPORT"
else
  bad "/app/server.js is missing from the image - the TypeScript build did not run"
  sed 's/^/        /' /tmp/evat_srv.$$ | tee -a "$REPORT"
fi
rm -f /tmp/evat_srv.$$

if [ "$API_UP" = "1" ]; then
  if docker compose exec -T api sh -c '[ -d node_modules/typescript ]' 2>/dev/null; then
    warn "typescript is present in the runtime image (should have been pruned)"
  else
    ok "devDependencies pruned from the runtime image"
  fi
fi

if [ "$API_UP" = "1" ]; then
  whoami_api=$(docker compose exec -T api whoami 2>/dev/null | tr -d '\r')
  [ "$whoami_api" = "node" ] && ok "api runs as non-root user '$whoami_api'" || warn "api runs as '$whoami_api'"
fi

# ---------------------------------------------------------------------------
head1 "3. ISSUE 3 - PYTHON_API_URL points at the pythonsvc service"
# ---------------------------------------------------------------------------
if [ "$API_UP" != "1" ]; then
  log "  SKIP 3.1/3.2 - the api container is not running, so docker exec cannot"
  log "       read its environment. Fix the crash above first."
else
  val=$(docker compose exec -T api printenv PYTHON_API_URL 2>/dev/null | tr -d '\r')
  log "  PYTHON_API_URL in container = '$val'"
  if [ "$val" = "http://pythonsvc:5000" ]; then
    ok "3.1 PYTHON_API_URL is http://pythonsvc:5000"
  else
    bad "3.1 PYTHON_API_URL is '$val' (expected http://pythonsvc:5000)"
  fi

  if docker compose exec -T api getent hosts pythonsvc >/dev/null 2>&1; then
    ok "3.2 api container resolves DNS name 'pythonsvc'"
    docker compose exec -T api getent hosts pythonsvc 2>&1 | sed 's/^/        /' | tee -a "$REPORT"
  else
    bad "3.2 api container cannot resolve 'pythonsvc'"
  fi

  # env_file secrets must survive into the container (value never printed).
  for v in MONGODB_URI JWT_SECRET GOOGLE_MAPS_API_KEY; do
    if [ -n "$(docker compose exec -T api printenv "$v" 2>/dev/null | tr -d '\r')" ]; then
      ok "3.4 $v is present in the api container"
    else
      bad "3.4 $v is EMPTY in the api container - env_file did not reach it"
    fi
  done
fi

# The real end-to-end proof: a public Node route that proxies to Python.
check_http "3.3 node -> python proxy  GET /api/predict/price/health" \
           "$API/api/predict/price/health" 200

# ---------------------------------------------------------------------------
head1 "2b. ISSUE 2 - Python dependencies are installed in the image"
# ---------------------------------------------------------------------------
docker compose exec -T pythonsvc python - <<'PYEOF' 2>&1 | tee -a "$REPORT"
mods = ["fastapi","uvicorn","dotenv","googlemaps","holidays","requests",
        "pandas","numpy","sklearn","joblib","kmodes","lightgbm","xgboost","pydantic"]
bad = []
for m in mods:
    try:
        __import__(m)
        print(f"  ok      import {m}")
    except Exception as e:
        bad.append(m)
        print(f"  MISSING import {m}: {type(e).__name__}: {e}")
print("RESULT:", "ALL_IMPORTS_OK" if not bad else "MISSING=" + ",".join(bad))
PYEOF
if docker compose exec -T pythonsvc python -c "import dotenv,googlemaps,holidays,lightgbm,xgboost" >/dev/null 2>&1; then
  ok "2.1 googlemaps / holidays / python-dotenv / lightgbm / xgboost all import"
else
  bad "2.1 one or more required Python packages failed to import (see list above)"
fi

# CWD-relative model files must resolve
if docker compose exec -T pythonsvc sh -c 'cd /app && ls demandForecasting/ev_demand_model.pkl costComparison/data/dummy_data.csv personalisedEVInsights/kproto_bundle.pkl' >/dev/null 2>&1; then
  ok "2.2 model/data files resolve from the working directory"
else
  bad "2.2 model files not found at the expected CWD-relative paths"
fi

# ---------------------------------------------------------------------------
head1 "4. Python service endpoints (direct, port 5000)"
# ---------------------------------------------------------------------------
check_body "4.1 GET /"                        "$PY/"                          "API Running"
check_http "4.2 GET /pricePrediction/health"  "$PY/pricePrediction/health" 200
check_http "4.3 GET /demandForecasting/postcodes" "$PY/demandForecasting/postcodes" 200
check_http "4.4 GET /costComparison/vehicles/ev"  "$PY/costComparison/vehicles/ev"  200
check_http "4.5 POST /environmentalImpact/predict" "$PY/environmentalImpact/predict" 200 \
  -X POST -H 'Content-Type: application/json' \
  -d '{"Make_EV":"Tesla","Make_ICE":"Toyota","BodyStyle_EV":"SUV","BodyStyle_ICE":"SUV","FuelType_ICE":"Petrol95","YearDiff":5,"ICE_CO2_Baseline":220.4}'
check_http "4.6 POST /costComparison/predict" "$PY/costComparison/predict" 200 \
  -X POST -H 'Content-Type: application/json' \
  -d '{"distance_km":100,"electricity_price_per_kwh":0.30,"petrol_price_per_l":2.10}'

# ---------------------------------------------------------------------------
head1 "5. Node API endpoints (direct, port 8080)"
# ---------------------------------------------------------------------------
check_http "5.1 GET /api-docs/json (swagger spec)" "$API/api-docs/json" 200
check_http "5.2 GET /api/docs (swagger UI)"        "$API/api/docs/"     200
check_http "5.3 GET /api/predict/price/health"     "$API/api/predict/price/health" 200
check_http "5.4 GET /api/chargers without token -> 401" "$API/api/chargers" 401

# --- authenticated path (needs a reachable MongoDB) ---
log ""
log "  --- authenticated flow (requires MONGODB_URI to be reachable) ---"
TS=$(date +%s)
EMAIL="dockertest+${TS}@example.com"
REG=$(curl -s --max-time 30 -o /tmp/evat_reg.$$ -w '%{http_code}' -X POST "$API/api/auth/register" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$EMAIL\",\"password\":\"Test123!\",\"firstName\":\"Docker\",\"lastName\":\"Test\",\"mobile\":\"0400000000\"}")
if [ "$REG" = "201" ]; then
  ok "5.5 POST /api/auth/register -> 201 (MongoDB write works)"
else
  bad "5.5 POST /api/auth/register -> $REG (expected 201; MongoDB unreachable?)"
  log "        body: $(head -c 300 /tmp/evat_reg.$$ | tr '\n' ' ')"
fi
rm -f /tmp/evat_reg.$$

LOGIN=$(curl -s --max-time 30 -X POST "$API/api/auth/login" \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"$EMAIL\",\"password\":\"Test123!\"}")
TOKEN=$(printf '%s' "$LOGIN" | sed -n 's/.*"accessToken":{"accessToken":"\([^"]*\)".*/\1/p')
if [ -n "$TOKEN" ]; then
  ok "5.6 POST /api/auth/login returned an access token"
  check_http "5.7 GET /api/predict/demand/postcodes (authed -> python)" \
             "$API/api/predict/demand/postcodes" 200 -H "Authorization: Bearer $TOKEN"
  check_http "5.8 GET /api/predict/vehicles/ev (authed -> python)" \
             "$API/api/predict/vehicles/ev" 200 -H "Authorization: Bearer $TOKEN"
  # This route needs real vehicle ObjectIds from the database, which a smoke
  # test cannot invent. Assert the route is reachable and its validation runs
  # (400 + a field-specific message) rather than faking a 200.
  check_http "5.9 POST /api/env-impact-analysis/compare (authed, validation reachable)" \
             "$API/api/env-impact-analysis/compare" 400 \
             -X POST -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
             -d '{}'
  check_http "5.10 GET /api/chargers (authed -> MongoDB)" \
             "$API/api/chargers" 200 -H "Authorization: Bearer $TOKEN"
else
  warn "5.6 could not obtain a token - skipping authenticated route tests"
  log "        login response: $(printf '%s' "$LOGIN" | head -c 300 | tr '\n' ' ')"
fi

# ---------------------------------------------------------------------------
head1 "6. ISSUE 4 - Nginx SPA fallback + reverse proxy (port 3000)"
# ---------------------------------------------------------------------------
if docker compose exec -T web grep -q "try_files \$uri \$uri/ /index.html" /etc/nginx/conf.d/default.conf 2>/dev/null; then
  ok "6.1 try_files \$uri \$uri/ /index.html present in the running config"
else
  bad "6.1 SPA fallback directive not found in /etc/nginx/conf.d/default.conf"
fi

check_http "6.2 GET /            (index)"          "$WEB/"                     200
check_http "6.3 GET /profile     (SPA deep link)"  "$WEB/profile"              200
check_http "6.4 GET /some/deep/route"              "$WEB/some/deep/route"      200
check_body "6.5 deep link returns the SPA shell"   "$WEB/profile"              '<div id="root"'
check_http "6.6 GET /assets/does-not-exist.js -> 404 (not index.html)" \
                                                   "$WEB/assets/does-not-exist.js" 404
check_http "6.7 GET /api/predict/price/health via nginx proxy" \
                                                   "$WEB/api/predict/price/health" 200
check_http "6.8 GET /api/chargers via nginx proxy -> 401 from Express" \
                                                   "$WEB/api/chargers" 401

# the built bundle must carry the same-origin API base, not "undefined"
hit=$(docker compose exec -T web sh -c "grep -rl '/api' /usr/share/nginx/html/assets 2>/dev/null | head -1" 2>/dev/null | tr -d '\r')
if [ -n "$hit" ]; then
  ok "6.9 built bundle references the /api base URL ($hit)"
else
  warn "6.9 could not confirm VITE_API_URL=/api in the built bundle (check the Network tab in DevTools)"
fi
if [ "$WEB_UP" = "1" ]; then
  if docker compose exec -T web sh -c "grep -rlq 'undefined/profile\|undefined/auth' /usr/share/nginx/html/assets" 2>/dev/null; then
    bad "6.10 bundle contains 'undefined/...' URLs - VITE_API_URL did not reach the build"
  else
    ok "6.10 no 'undefined/...' API URLs in the bundle"
  fi
fi

# ---------------------------------------------------------------------------
head1 "7. Known-failing / out of scope"
# ---------------------------------------------------------------------------
rel=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$API/api/reliability/health" 2>/dev/null)
log "  GET /api/reliability/health -> $rel"
log "  EXPECTED TO FAIL: reliability_scoring_api (port 8003) is not containerised yet."
log "  Weather-aware routing needs a valid GOOGLE_MAPS_API_KEY; a 4xx/5xx here"
log "  means the key, not the container wiring."
wx=$(curl -s -o /dev/null -w '%{http_code}' --max-time 40 -X POST "$API/api/weather-aware-routing/predict" \
     -H 'Content-Type: application/json' \
     -d '{"origin":"Melbourne VIC","destination":"Geelong VIC","ac_on":true}' 2>/dev/null)
log "  POST /api/weather-aware-routing/predict -> $wx"

# ---------------------------------------------------------------------------
head1 "8. Recent container logs (last 40 lines each)"
# ---------------------------------------------------------------------------
for c in pythonsvc api web; do
  log ""
  log "--- $c ---"
  docker compose logs --tail=40 "$c" 2>&1 | sed 's/^/  /' >> "$REPORT"
done

# ---------------------------------------------------------------------------
head1 "SUMMARY"
# ---------------------------------------------------------------------------
log "  PASS : $PASS"
log "  FAIL : $FAIL"
log "  WARN : $WARN"
log ""
if [ "$FAIL" -eq 0 ]; then
  log "  RESULT: ALL CHECKS PASSED"
else
  log "  RESULT: $FAIL CHECK(S) FAILED - see the FAIL lines above"
fi
log ""
log "Full report written to: $REPORT"
log "Share that file (it contains no secrets - only status codes and logs)."

if [ "$DO_DOWN" = "1" ]; then
  head1 "Tearing down"
  docker compose down 2>&1 | tail -5 | tee -a "$REPORT"
fi

exit 0
