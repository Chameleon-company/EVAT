# Testing the EVAT Docker stack locally in VS Code

Everything below runs from the repo root (`~/EVAT`) in the VS Code integrated
terminal (`Ctrl+` ` / `View → Terminal`). Total time on a first run: roughly
10–20 minutes, most of it the Python image build.

At the end you will have a file called **`docker-test-results.txt`** — send me
that file and we go through anything that failed before you open the PR.

---

## Before you start

**1. Docker Desktop must be running.** Whale icon in the menu bar → "Docker
Desktop is running". Check in the terminal:

```bash
docker info | head -3
```

**2. Useful VS Code extensions** (Cmd+Shift+X):

| Extension | Why |
|---|---|
| `ms-azuretools.vscode-docker` | Containers/Images sidebar, right-click → View Logs / Attach Shell |
| `ms-azuretools.vscode-containers` | port forwarding + container explorer on newer VS Code builds |
| `humao.rest-client` | optional — lets you fire API requests from a `.http` file |

**3. Work on a branch, not `main`:**

```bash
cd ~/EVAT
git checkout -b feature/docker-compose-stack
git status          # you should see the 11 changed/new files
```

**4. Create your backend `.env`** (this is the only manual config step):

```bash
cp server/node-api/.env.example server/node-api/.env
code server/node-api/.env
```

Fill in at minimum:

```dotenv
MONGODB_URI=<your company MongoDB connection string>
JWT_SECRET=<any long random string for local testing>
GOOGLE_MAPS_API_KEY=<your key>
```

Leave `PYTHON_API_URL` as `http://127.0.0.1:5000` — that is deliberate. Compose
overrides it to `http://pythonsvc:5000` at runtime, and test 3.1 below proves the
override works. That is exactly the bug we fixed.

> If your company MongoDB is Atlas, make sure your current IP is in the Network
> Access allowlist, otherwise register/login tests (5.5–5.10) will time out.

---

## The one-command path

```bash
chmod +x scripts/docker-smoke-test.sh     # first time only
./scripts/docker-smoke-test.sh --up
```

That builds the images, starts the stack, waits for the Python service to become
healthy, runs ~35 checks and writes `docker-test-results.txt`.

In VS Code you can also run it from **Terminal → Run Task…**:

* `EVAT: Build + up + smoke test (one shot)`
* or step by step: `EVAT: 1 - Compose build` → `EVAT: 2 - Compose up` → `EVAT: 3 - Smoke test`

(The tasks live in `.vscode/tasks.json`. Note `.gitignore` excludes `.vscode/`,
so that file stays local to your machine.)

---

## The step-by-step path

Use this the first time so you can see where a failure comes from.

### Step 1 — Build

```bash
docker compose build
```

What should happen:

* `pythonsvc` — `python:3.11-slim`, `apt-get install libgomp1`, then a long
  `pip install` (LightGBM, XGBoost, geopandas, scikit-learn). **5–15 minutes on
  first build**, seconds afterwards thanks to layer caching.
* `api` — two stages. Watch for `npm run build` succeeding and the
  `ls -la /app/server.js` line printing a real file. That line is the proof that
  Issue 1 is fixed.
* `web` — `npm install` then `vite build`, then copies `dist` into Nginx.

If the build fails, the whole log is in `docker-build.log` when you use the
script; otherwise re-run with `docker compose build 2>&1 | tee docker-build.log`
and send me that.

### Step 2 — Start

```bash
docker compose up -d
docker compose ps
```

`pythonsvc` will sit in `health: starting` for **1–4 minutes** — on boot it
trains the cost-comparison model and loads the price-prediction model. That is
normal. Watch it:

```bash
docker compose logs -f pythonsvc
```

You want to see:

```
[startup] Training model...
[startup] Loading price prediction model...
[startup] Models ready.
INFO:     Uvicorn running on http://0.0.0.0:5000
```

Then `docker compose ps` shows `healthy`.

In the Docker sidebar (whale icon) you can right-click any container →
**View Logs** or **Attach Shell** instead of using the terminal.

### Step 3 — Run the checks

```bash
./scripts/docker-smoke-test.sh
```

### Step 4 — Look at it in the browser

Open <http://localhost:3000>.

Three things to check by hand, because they are the ones a script reads only
indirectly:

1. **SPA fallback (Issue 4).** Navigate to any in-app page, then press **Cmd+R
   to hard-refresh on that URL** (e.g. `http://localhost:3000/profile`). Before
   the fix this is a 404 from the static server. Now it must render the app.
2. **Same-origin API calls.** DevTools → **Network** tab → click around. Request
   URLs must look like `http://localhost:3000/api/...`, **not**
   `undefined/...` and not `http://localhost:8080/...`. That confirms
   `VITE_API_URL=/api` reached the Vite build and Nginx is proxying.
3. **No console errors** of the form `Unexpected token '<'` — that would mean a
   missing asset fell through to `index.html`.

Also worth opening: <http://localhost:8080/api/docs> (Swagger UI) and
<http://localhost:5000/docs> (FastAPI's auto docs, handy for trying ML payloads).

### Step 5 — Backend unit tests still pass

The Jest suite runs against the source, not the container, but merge hygiene:

```bash
npm run test:server
```

---

## Host port overrides

The stack publishes `3000` (web), `8081` (api) and `5000` (pythonsvc) by
default. `8081` rather than `8080` because a local Jenkins commonly owns 8080 -
if you `curl localhost:8080` with Jenkins running you get a 403
"No valid crumb was included in the request", which looks like an app bug and
is not one.

Any of the three can be moved from the root `.env`:

```dotenv
WEB_HOST_PORT=3000
API_HOST_PORT=8081
PY_HOST_PORT=5001      # if macOS AirPlay Receiver owns 5000
```

Only the host side moves. Inside the Compose network the services always listen
on 80 / 8080 / 5000, so `PYTHON_API_URL=http://pythonsvc:5000` and the Nginx
`/api` proxy are unaffected. The smoke-test script reads the same three
variables, so it follows whatever you set.

## What the script checks, mapped to the five issues

| Test | Proves |
|---|---|
| 2.x — `Config.Cmd` is `node server.js`, `/app/server.js` exists, `typescript` pruned, runs as `node` | **Issue 1** |
| 2b — imports `dotenv`, `googlemaps`, `holidays`, `lightgbm`, `xgboost` … inside the container; model files resolve from the CWD | **Issue 2** |
| 3.1 `PYTHON_API_URL` = `http://pythonsvc:5000` · 3.2 DNS resolves · 3.3 `GET /api/predict/price/health` returns 200 | **Issue 3** |
| 6.1 `try_files` in the running Nginx config · 6.3–6.5 deep links return the SPA shell · 6.6 missing asset 404s · 6.7 `/api` proxied | **Issue 4** |
| the whole run + `docker-test-results.txt` | **Issue 5** |
| 4.x direct Python endpoints, 5.x Node endpoints incl. register/login/authed ML proxy | end-to-end features |

`GET /api/predict/price/health` is the single most useful check: it is a
**public** Node route that proxies to the Python service, so a 200 there means
the container network, the service name and the Python app are all correct.

---

## Expected failures — do not chase these

| Symptom | Why |
|---|---|
| `/api/reliability/*` fails | `reliability_scoring_api` (port 8003) is a separate uvicorn app that is not containerised yet. There is a commented stub at the bottom of `docker-compose.yml` — say the word and I'll add it as a fourth service. |
| `/api/weather-aware-routing/predict` returns 4xx/5xx | Needs a working `GOOGLE_MAPS_API_KEY` with Directions + Distance Matrix enabled. This is a key/quota problem, not a container problem. |
| `5.5 register -> 000/500` | MongoDB unreachable: wrong `MONGODB_URI`, or your IP is not allowlisted in Atlas. |
| First `pythonsvc` request after boot is slow | Models load lazily on some paths. |

---

## Troubleshooting

**Port 5000 already in use (very common on macOS).** AirPlay Receiver owns 5000.
Either turn it off in System Settings → General → AirDrop & Handoff, or publish a
different host port — edit `docker-compose.yml`:

```yaml
  pythonsvc:
    ports:
      - "5001:5000"     # host:container - only the host side changes
```

The container-internal port stays 5000, so `PYTHON_API_URL=http://pythonsvc:5000`
is unaffected; only your direct `curl http://localhost:5000` tests move to 5001.

**Ports 3000 / 8080 in use.** Usually a leftover `npm run dev`. Find it with
`lsof -nP -iTCP:3000 -sTCP:LISTEN`, or change the host side of the mapping.

**`web` exits immediately with `host not found in upstream "api"`.** Should not
happen — the Nginx config resolves `api` at request time via Docker's embedded
DNS (127.0.0.11) precisely to avoid this. If you see it, tell me, it means the
old config is still baked in: `docker compose build --no-cache web`.

**Changes not showing up.** These are production images, not bind mounts — code
changes need a rebuild:

```bash
docker compose up -d --build web      # or api / pythonsvc
```

For day-to-day coding keep using `npm run dev` on the host; use Compose to
verify the deployable artefact.

**Clean slate:**

```bash
docker compose down -v
docker system prune -f
docker compose build --no-cache
```

**Apple Silicon.** Everything here builds native arm64. The first
`pip install` of LightGBM/XGBoost is the slow part; there is no emulation
involved and no `platform:` override is needed.

---

## What to send me

1. **`docker-test-results.txt`** — the main one. Status codes and log tails only,
   no secrets. Paste it in or attach it.
2. **`docker-build.log`** — only if the build failed.
3. A screenshot of `http://localhost:3000/profile` **after a hard refresh**, plus
   the DevTools Network tab if anything looks off.
4. Anything you saw that the script did not catch.

I will go through the failures with you and patch whatever is broken before this
goes near `main`.
