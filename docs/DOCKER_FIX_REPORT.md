# EVAT containerisation — root-cause report and applied fixes

**Repo:** `/Users/vansh/EVAT` (branch `main`)
**Date:** 18 August 2026

---

## 0. The headline finding

Before this change the repository contained **exactly one** container artefact:
`server/node-api/Dockerfile`. There was no `docker-compose.yml`, no Nginx
configuration, no Python image and no frontend image — on `main` or on any of
the 23 remote branches (`git ls-tree` across `origin/docker-integration-test`,
`origin/github-actions-cicd`, `origin/combined-python` confirms only
`server/node-api/Dockerfile` and a `.dockerignore` on one branch).

`docs/MACHINE_LEARNING_DEPLOYMENT_GUIDE.md` §9.1 states this outright:

> "The repository currently contains only `server/node-api/Dockerfile`. That
> image builds the Node API and does not package the Python ML services. There
> is no committed Python Dockerfile or Docker Compose definition."

So four of the five reported issues were not regressions in existing config —
they were **missing layers**. The one file that did exist was internally
inconsistent. That is the underlying reason all five symptoms appeared at once.

---

## 1. Backend runtime command

**Reported:** the image copies `server.js`, so run `node server.js` instead of
`npm run server`.

**Why it broke.** The old `server/node-api/Dockerfile` was:

```dockerfile
RUN npm install --production   # ← devDependencies skipped
COPY . .
RUN npm run build && ls -la    # ← "build" is `tsc`, and typescript is a devDependency
CMD ["node", "server.js"]
```

Three separate faults in four lines:

| Fault | Consequence |
|---|---|
| `npm install --production` omits `typescript`, `ts-node-dev` and every `@types/*` package (`package.json` lines 14–34) | `npm run build` (`tsc`) has no compiler and no type declarations available in the image |
| `npm run server` = `ts-node-dev --files server.ts` — also a devDependency | Running the container with `npm run server` fails with "command not found" on a production install, which is what prompted this ticket |
| `COPY . .` with no `.dockerignore` | The host's macOS `node_modules` (with darwin/arm64 native binaries) and any local `.env` were copied into the image, overwriting the installed tree and baking secrets in |

`tsconfig.json` deliberately has **no `outDir`**, so `tsc` emits `server.js`
beside `server.ts` at `/app/server.js`. `node server.js` is therefore the
correct entrypoint — the image just never reliably produced that file.

**Fix applied.** `server/node-api/Dockerfile` is now a two-stage build:

* stage `build` — `npm install` (full, dev deps included) → `npm run build` →
  asserts `/app/server.js` exists;
* stage `runtime` — `npm install --omit=dev`, copies only `server.js` and
  `src/`, drops to the non-root `node` user, `CMD ["node", "server.js"]`.

`src/**/*.ts` is still copied into the runtime image on purpose: `server.ts`
line 90 points swagger-jsdoc at `"./src/routes/*.ts"`, so deleting the sources
would empty `/api/docs`.

A new `server/node-api/.dockerignore` excludes `node_modules`, `.env*`, `test/`
and `*credentials*.json`.

---

## 2. Python dependencies

**Reported:** install everything `main.py` needs, including `googlemaps`,
`holidays`, `python-dotenv`.

**Why it broke.** Two independent causes.

**(a) No Python image existed.** The documented container workflow
(`docs/MACHINE_LEARNING_DEPLOYMENT_GUIDE.md` §9.1) was a throwaway
`docker run python:3.11-slim … pip install -r … && uvicorn`, which the guide
itself flags: *"This command installs packages every time. Create a reviewed
Python Dockerfile before using containers routinely or in production."*
Nothing pinned that list into a reproducible image.

**(b) `python-requirements.txt` was itself wrong.** Tracing every import in
`main.py`'s dependency graph against the old file:

| Package | Needed by | Status before |
|---|---|---|
| `python-dotenv` | `weatherAwareRouting/config.py:2` — `from dotenv import load_dotenv, find_dotenv` | **Wrong package listed.** The file said `dotenv`. The PyPI project named `dotenv` is a different, unrelated package; the import `from dotenv import load_dotenv` is provided by **`python-dotenv`**. On a clean container this fails at import time and takes the whole FastAPI app down. |
| `requests` | `weatherAwareRouting/services.py:1`, `demandForecasting/demandForecasting.py:10` | **Missing entirely.** It only ever resolved because `googlemaps` pulls it in transitively — an accident, not a declaration. |
| `googlemaps` | `weatherAwareRouting/services.py:2` | listed, but never installed in any image |
| `holidays` | `demandForecasting/demandForecasting.py:12` | listed, but never installed in any image |
| `kmodes` | needed to *unpickle* `personalisedEVInsights/kproto_bundle.pkl` | listed |
| `numpy`, `pydantic` | imported directly in several modules | implicit only (via pandas/fastapi) |
| `libgomp1` (OS package) | LightGBM / XGBoost shared library | **Missing** — `python:3.11-slim` does not ship it, and the guide's own troubleshooting section documents the resulting "Docker cannot load LightGBM or XGBoost" failure |

**Fix applied.**

* `python-requirements.txt` rewritten: `dotenv` → `python-dotenv`, `requests`,
  `numpy`, `pydantic` and `uvicorn[standard]` added explicitly, with comments
  explaining the `dotenv` trap so it does not get "corrected" back.
* New `server/python-services/Dockerfile` — `python:3.11-slim`, installs
  `libgomp1` + `curl`, installs requirements in a cached layer, then copies the
  service.

Two details in that Dockerfile that are easy to get wrong:

* **Build context is the repository root** (`docker build -f
  server/python-services/Dockerfile .`) because `python-requirements.txt` lives
  at the root. A root `.dockerignore` keeps the context small by excluding
  `.git`, `client/`, `docs/` and all `node_modules`.
* **`WORKDIR /app` with the *contents* of `python-services` copied into it**,
  because the service loads its models through **CWD-relative** paths —
  `demandForecasting/ev_demand_model.pkl`, `costComparison/data/dummy_data.csv`,
  `personalisedEVInsights/kproto_bundle.pkl` (that last one runs at *import*
  time, so a wrong CWD kills startup, not just one endpoint).
* `CMD` binds **`--host 0.0.0.0`**. The repo's `npm run dev:python` uses
  `--host 127.0.0.1`, which inside a container is unreachable from any other
  container or from the host.

---

## 3. `PYTHON_API_URL` pointing at 127.0.0.1

**Reported:** set `PYTHON_API_URL=http://pythonsvc:5000` in Compose instead of
`127.0.0.1`.

**Why it broke.** Six backend services read this variable directly from
`process.env`:

```
src/services/predict-service.ts:6
src/services/recommendation-ranking-service.ts:4
src/services/price-prediction-service.ts:3
src/services/personalised-ev-insights-service.ts:7
src/services/weather-aware-routing-service.ts:3
src/services/env-impact-analysis-service.ts:113   → || "http://127.0.0.1:5000"
```

and the loopback default is reinforced everywhere a developer would look:
`README.md` line 72 and the deployment guide lines 163/181 both tell you to set
`PYTHON_API_URL=http://127.0.0.1:5000`.

Critically, **`PYTHON_API_URL` was not in `server/node-api/.env.example` and not
in `src/config/env.ts`** — unlike every other backend variable. It was invisible
configuration: nothing prompted anyone to change it for a container, and inside
a container `127.0.0.1` is the API container's own loopback interface, so all
six ML proxy routes fail with `ECONNREFUSED`.

The guide had actually predicted this (§9 note): *"If Node runs in another
container, both containers need a shared Docker network and the URL must use the
Python container's service name."* Nothing enforced it.

**Fix applied.**

* `docker-compose.yml` sets `PYTHON_API_URL: "http://pythonsvc:5000"` under the
  `api` service's **`environment:`** block, not `env_file:`. That ordering
  matters: `environment` wins over `env_file`, so a stale
  `PYTHON_API_URL=http://127.0.0.1:5000` in your local
  `server/node-api/.env` can no longer poison the container.
* Both services join an explicit `evat` bridge network so the `pythonsvc` DNS
  name resolves.
* `server/node-api/.env.example` now documents `PORT`, `PYTHON_API_URL` and
  `RELIABILITY_API_URL`, with the local vs docker values side by side.

---

## 4. Nginx SPA fallback

**Reported:** add `try_files $uri $uri/ /index.html`.

**Why it broke.** There was no Nginx configuration and no frontend image at all
— the frontend has only ever been run via `vite dev` on port 3000.

The only SPA fallback that exists anywhere in the codebase is in `server.ts`:

```ts
const buildPath = path.join(__dirname, "/build");   // line 136
app.use(express.static(buildPath));
app.get("*", (req, res) => res.sendFile(path.join(buildPath, "index.html")));
```

That path is **never populated** — nothing in the Node Dockerfile, the root
`package.json` scripts, or CI copies `client/web-app/dist` into
`server/node-api/build`. So a containerised deployment had no server able to
answer a deep link like `/profile` on refresh: the Node catch-all `sendFile`s a
file that does not exist, and there was no Nginx to do it instead.

A second trap sits in `client/web-app/vite.config.js`. Vite inlines
`VITE_*` values at **build** time, and this config only maps keys it finds in
`.env` **files**:

```js
const env = { parsed: { ...dotenv.config({path: "../../.env"}).parsed, ...dotenv.config({path: "./.env"}).parsed } };
for (const key in env.parsed) { if (key.startsWith("VITE_")) processEnv[...] = ... }
```

It iterates `dotenv`'s parsed output, **not `process.env`**. Passing
`VITE_API_URL` as a docker build arg or `ENV` therefore has *no effect* — the
bundle ships with `import.meta.env.VITE_API_URL` undefined and every fetch goes
to `undefined/profile`.

**Fix applied.**

* `client/web-app/nginx.conf`:
  * `location / { try_files $uri $uri/ /index.html; }` — the requested fallback;
  * `location /api/` reverse-proxies to the `api` service, so the SPA is
    same-origin and no CORS/hard-coded host is needed;
  * `location /assets/ { try_files $uri =404; }` so a missing hashed bundle
    returns 404 instead of falling through to `index.html` (that fallthrough is
    what produces `Unexpected token '<'` in the console);
  * `index.html` served `no-store` so users cannot pin an old bundle;
  * upstream resolved at request time via Docker's embedded DNS
    (`resolver 127.0.0.11`), otherwise Nginx resolves `api` once at startup and
    exits with `host not found in upstream` whenever the API is slower to boot.
* `client/web-app/Dockerfile`: Vite build stage on **`node:20-alpine`** (Vite 7
  in `package.json` requires Node ≥ 20.19 — `node:18` fails at `vite build`),
  which **writes the build args into `.env` before running `npm run build`** to
  work around the `vite.config.js` behaviour above; runtime stage is
  `nginx:1.27-alpine` serving `/app/dist`.

---

## 5. Verification

Per your instruction, I did not run the full `docker compose build` / `up`
(your Mac's bridge has neither Docker nor network access from this session).
What I did run:

* `docker compose config` — **passes**; substitutions resolve, and
  `PYTHON_API_URL` renders as `http://pythonsvc:5000`, `VITE_API_URL` as `/api`.
* `nginx -t` against the new `nginx.conf` — **syntax OK**.

To finish the verification on your machine:

```bash
cd ~/EVAT

# 1. Backend secrets (company MongoDB URI, JWT secret, Google keys)
cp server/node-api/.env.example server/node-api/.env   # then fill it in

# 2. Build and start
docker compose build
docker compose up -d
docker compose ps          # pythonsvc becomes healthy only after model load (~1-3 min)

# 3. Backend routes
curl -i http://localhost:8080/api-docs/json          # Swagger spec  -> 200
curl -i http://localhost:5000/                       # {"message":"API Running"}
curl -i -X POST http://localhost:8080/api/env-impact-analysis/predict \
     -H 'Content-Type: application/json' \
     -d '{"Make_EV":"Tesla","Make_ICE":"Toyota","BodyStyle_EV":"SUV","BodyStyle_ICE":"SUV","FuelType_ICE":"Petrol95","YearDiff":5,"ICE_CO2_Baseline":220.4}'
     # ^ this one specifically proves api -> pythonsvc DNS works

# 4. Frontend routes
curl -i http://localhost:3000/                       # index.html -> 200
curl -i http://localhost:3000/profile                # SPA fallback -> 200 + index.html
curl -i http://localhost:3000/api/api-docs/json      # not a route -> proxied 404 from Express, not Nginx
curl -i http://localhost:3000/assets/does-not-exist.js   # -> 404, NOT index.html

docker compose logs -f pythonsvc                     # watch model load if anything 502s
```

---

## 6. Other gaps found while reading the code

Not part of your five items — flagged, not changed unless noted.

1. **`server.ts:58` calls `createDefaultAdmin()` without awaiting `connectDB()`.**
   Against a remote/company MongoDB the first query can fire before the
   connection is established. Mongoose buffers by default, so it usually
   survives, but it will surface as a boot-time `MongooseError: buffering timed
   out` when the DB is slow — a classic "works locally, fails in CI/Docker"
   symptom.
2. **No health endpoint.** There is no `/health` or `/api/health` on the Node
   API, so the Compose healthcheck has to hit `/api-docs/json`, which serialises
   the whole Swagger spec every 30 s. A three-line `app.get("/api/health")`
   would be better.
3. **Reliability scoring is still un-containerised.**
   `src/services/reliability-scoring-service.ts:18` defaults to
   `http://localhost:8003`, and `server/python-services/reliability_scoring_api`
   is a separate uvicorn app with its own `requirements.txt` (it needs `pymongo`
   and `vaderSentiment`, which are not in the root requirements). Every
   `/api/reliability/*` route will fail under Compose until it is added as a
   fourth service. There is a commented stub at the bottom of
   `docker-compose.yml`.
4. **`.gitignore` had a typo:** it ignored `google-credintials.json`, while the
   README (line 137) tells everyone to save the service-account key as
   `google-credentials.json` — i.e. the real filename was **not** ignored.
   *Fixed:* both spellings are now ignored, and `*credentials*.json` is in the
   backend `.dockerignore`.
5. **`src/config/env.ts` loads `/app/.env` with `override: true`.** If a `.env`
   ever gets into the image it silently beats everything Compose passes in. The
   new `.dockerignore` files are what stand between you and a very confusing
   debugging session; keep them.
6. **Python requirements are unpinned.** The pickled models
   (`co2_savings_model.pkl`, `price_best_model_latest.joblib`,
   `kproto_bundle.pkl`) were trained against specific scikit-learn / kmodes
   versions. An unpinned `pip install` will eventually load them with a newer
   scikit-learn and either warn or fail. Recommend pinning from a working
   container: `docker compose exec pythonsvc pip freeze > python-requirements.lock.txt`.
7. **`npm install` rather than `npm ci`** in both Node images. `npm ci` is the
   reproducible choice, but `server/node-api/package-lock.json` is a workspace
   member lockfile and `client/web-app` has no lockfile of its own, so `npm ci`
   would likely fail today. Worth fixing the lockfiles, then switching.
8. **The Python container runs as root.** The Node image drops to `node` and
   the Nginx image drops privileges after binding :80; the Python image does
   not. Add a non-root `USER` before this goes anywhere near production.

---

## 7. Files changed

| File | Change |
|---|---|
| `docker-compose.yml` | **new** — `web` / `api` / `pythonsvc`, shared `evat` network, `PYTHON_API_URL=http://pythonsvc:5000`, healthchecks, external MongoDB via `MONGODB_URI` |
| `.dockerignore` | **new** — trims the root build context used by the Python image |
| `python-requirements.txt` | fixed — `python-dotenv` (was `dotenv`), `+requests`, `+numpy`, `+pydantic`, `uvicorn[standard]` |
| `server/node-api/Dockerfile` | rewritten — two-stage, dev deps for `tsc`, pruned runtime, non-root, `CMD ["node","server.js"]` |
| `server/node-api/.dockerignore` | **new** — excludes `node_modules`, `.env*`, `test/`, credentials |
| `server/node-api/.env.example` | added `PORT`, `PYTHON_API_URL`, `RELIABILITY_API_URL` with local vs docker values |
| `server/python-services/Dockerfile` | **new** — `python:3.11-slim` + `libgomp1`, CWD-correct, binds `0.0.0.0:5000`, healthcheck |
| `client/web-app/Dockerfile` | **new** — Vite build on `node:20-alpine` (writes build args to `.env`), served by `nginx:1.27-alpine` |
| `client/web-app/nginx.conf` | **new** — `try_files $uri $uri/ /index.html`, `/api` reverse proxy, asset 404s, cache headers |
| `client/web-app/.dockerignore` | **new** |
| `.gitignore` | added `google-credentials.json` (existing rule had a typo) |

---

## 8. Verification results (19 Aug 2026)

Run on macOS 15 / arm64, Docker 29.7.2, Compose v5.4.0, branch
`feature/docker-compose-stack`, via `./scripts/docker-smoke-test.sh --up`.

Final: **45 PASS / 1 FAIL / 1 WARN**, where the single FAIL was a bad payload in
the test harness (now corrected) and the WARN was a packaging nit (now fixed).
All five reported issues verified fixed end to end, including
`register -> login -> authed ML proxy -> MongoDB write`.

Three defects surfaced during verification that were NOT in the original list:

1. **`node-fetch@3` is ESM-only** but the backend compiles to CommonJS, so the
   API crash-looped with `ERR_REQUIRE_ESM` at `require("node-fetch")` in
   `predict-service.js`. It never showed up in local dev because npm workspace
   hoisting puts a v2 copy in the root `node_modules`; the container installs
   only `node-api`'s own dependencies and got v3. Pinned to `^2.7.0`, which also
   matches the already-declared `@types/node-fetch: ^2.6.12`.
2. **`ts-node` sat in `dependencies`.** npm auto-installs peer dependencies, so
   `typescript` was pulled into the pruned runtime image. Moved to
   `devDependencies`.
3. **Signin/Signup referenced `../src/assets/logo.png`** - a dev-server path.
   In a production build it 404s and falls through to `index.html`, so the logo
   rendered broken. Replaced with a Vite asset import.

Plus one bug in this change set, found by the harness and fixed:
`environment: MONGODB_URI: "${MONGODB_URI:-}"` in `docker-compose.yml` resolved
to an empty string (no root `.env`, nothing exported) and **overrode** the real
value coming from `env_file`. `environment` beats `env_file`; only variables
that must differ inside a container belong there. The smoke test now asserts
that `MONGODB_URI`, `JWT_SECRET` and `GOOGLE_MAPS_API_KEY` are non-empty inside
the api container.

Still outstanding, unrelated to containerisation:

- `GET /api/reliability/health -> 503` - `reliability_scoring_api` (port 8003)
  is not containerised. Stub in `docker-compose.yml`.
- `POST /api/weather-aware-routing/predict -> 500` - the Google Maps key is
  rejected by the **Elevation API** (`REQUEST_DENIED: This API key is not
  authorized to use this service`), called from
  `weatherAwareRouting/services.py:31`. Enable Elevation API for the key in the
  Google Cloud Console; the container wiring is correct.
