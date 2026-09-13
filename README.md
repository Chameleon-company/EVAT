# ⚡ EVAT (Electric Vehicle Adoption Tool)

**Company:** Chameleon  
**Project:** EV Adoption Tools  
**Team:** Web/App

This repository is a **Monorepo** containing the Vite + React frontend web application, the Express + Node.js backend API, and consolidated Python services. The JavaScript packages are managed through npm workspaces, while the Python environment and dependencies are managed through uv.

---

## 🛠️ Tech Stack

**Frontend (Client):** Vite, React, Chart.js, Leaflet  
**Backend (Server):** Node.js, TypeScript, Express.js, MongoDB, JWT, Nodemailer  
**Python services:** FastAPI, uv

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) 20.19+ or 22.12+
- [npm](https://www.npmjs.com/)
- MongoDB (See Database Setup inside handbook)

---

## ⚙️ Environment Variables

Since this is a monorepo, you need to manage **multiple `.env`** files.

### Environment Variable Rules

- Root `.env`: Store shared, non-secret local configuration here.
- `server/node-api/.env`: Store backend-only secrets and backend-specific configuration here (these will override any duplicate variables found in the root .env).
- `client/web-app/.env`: Any configuration exposed to the frontend must begin with the `VITE_*` prefix.
- `**/.env.example`: Add any newly introduced variables to the corresponding `.env.example` file with an empty / placeholder value.

#### 1. Shared Environment Variables

Create a `.env` file in the root directory.
This file controls the shared variables (for both frontend and backend).
For now, it only contains which PORT the server should listen, and where the frontend should send the request to.
There's an `.env.example` file provided that you can copy.

```env
PORT=8080
VITE_API_URL="http://localhost:${PORT}/api"
```

#### 2. Frontend Environment Variables

Create a separate `.env` file in `client/web-app/.env`.
This file is dedicated exclusively to the frontend client and must use the `VITE_` prefix for any variables exposed to the application.
There's an `.env.example` file provided that you can copy.

```env
VITE_GOOGLE_MAPS_API_KEY=ABCD1234 (provided that key is separate from the one used at the backend)
VITE_GA_TRACKING_ID=XXX
```

> **Running with Docker?** `client/web-app/.env` only applies to `npm run dev:client`.
> Vite inlines these values at build time, and `docker compose build` passes them in as
> build args that Compose interpolates from the **root** `.env` (or your shell) — it never
> reads `client/web-app/.env`. Also add `VITE_GOOGLE_MAPS_API_KEY` and `VITE_GA_TRACKING_ID`
> to the root `.env` (see the root `.env.example`) before building, or the containerised
> app will ship without them.

#### 3. Backend Environment Variables

Create a separate .env file in `/server/node-api/.env`.
There's an `.env.example` file provided that you can follow.

```env
MONGODB_URI = mongodb://<<address>>:<<port>>/EVAT
JWT_SECRET = 'abc123'
GOOGLE_MAPS_API_KEY=ABCD1234
GOOGLE_AI_API_KEY=ABCD1234
GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"
EMAIL_USER = "sender@example.com"
EMAIL_PASS = "See Nodemailer section"
ADMIN_EMAIL = "receiver@example.com"
PYTHON_API_URL = "http://127.0.0.1:5000"
RELIABILITY_API_URL = "http://127.0.0.1:5000/reliability"
```

### IMPORTANT: Ensure .env and your .json credential files are never committed to version control!

---

## 🚀 Installation & Running Locally

Because we use NPM workspaces, you do not need to navigate into individual folders to install packages.

1. Install [uv](https://docs.astral.sh/uv/getting-started/installation/), the
   Python project manager used by EVAT. For example:

   ```sh
   # macOS with Homebrew
   brew install uv

   # macOS or Linux with the standalone installer
   curl -LsSf https://astral.sh/uv/install.sh | sh

   # Windows with WinGet
   winget install --id=astral-sh.uv -e
   ```

   Verify that it is available with `uv --version`.

2. Install all JavaScript and Python dependencies from the repository root:

   ```sh
   npm run install:all
   ```

   To prepare only the Python environment, run `npm run python:sync`. uv creates
   `server/python-services/.venv` and installs the versions recorded in
   `server/python-services/uv.lock`; manual activation is not required.

3. Start the dev stack:
   From the root of the repository, run:

   ```sh
   npm run dev
   ```

   or alternatively,
   - Start the Backend API:
     ```sh
     npm run dev:server
     ```
   - Start the Frontend Web App:
     ```sh
     npm run dev:client
     ```
   - Start the Python ML services:
     ```sh
     npm run dev:python
     ```
     Run the Python tests with `npm run test:python`.

---

## 🐳 Running the whole stack with Docker

The repo ships a Compose stack (`web` + `api` + `pythonsvc`) so the app can be
run without installing Node or Python locally. MongoDB is not included — the API
connects to the company instance via `MONGODB_URI`.

```sh
cp server/node-api/.env.example server/node-api/.env   # fill in secrets
cp .env.example .env                                    # optional: Maps key, custom ports
docker compose build                                    # first build: 5-15 min
docker compose up -d
```

| Service            | URL                            |
| ------------------ | ------------------------------ |
| Web app            | http://localhost:3000          |
| Node API (Swagger) | http://localhost:8080/api/docs |
| Python ML service  | http://localhost:5000/docs     |

The API publishes on **8080** by default. Override any host port from the
root `.env` with `WEB_HOST_PORT`, `API_HOST_PORT` or `PY_HOST_PORT` if it
clashes with something else on your machine.

### Pulling Docker images and building the frontend locally

This project can also be started by pulling the prebuilt Docker images from Docker Hub, then building the frontend image locally because Vite requires build-time environment variables. This is the flow currently used for the EVAT deployment workflow.

Log in to Docker Hub:

```bash
docker login -u evat26
```

This authenticates the local Docker client with the Docker Hub account used for the EVAT images.

Pull the published images:

```bash
docker pull evat26/monorepo:web-latest
docker pull evat26/monorepo:api-latest
docker pull evat26/monorepo:python-latest
```

These commands download the latest available images for:
- `web-latest` → frontend React app
- `api-latest` → Node.js backend API
- `python-latest` → Python ML / FastAPI service

Create the shared Docker network so the API and Python service can communicate:

```bash
docker network create evat 2>/dev/null || true
```

`evat` is a shared bridge network used so services can resolve each other by container name instead of localhost.

Start the API container:

```bash
docker run -d \
  --name evat-api \
  -p 8080:8080 \
  --env-file ./server/node-api/.env \
  evat26/monorepo:api-latest
```

- `-d` runs the container in detached mode
- `--name evat-api` gives the container a fixed name
- `-p 8080:8080` maps the API container port to the host port
- `--env-file ./server/node-api/.env` loads backend variables such as `MONGODB_URI`, `JWT_SECRET`, and Google credentials

Start the Python service container:

```bash
docker run -d \
  --name evat-pythonsvc \
  --network evat \
  -p 5000:5000 \
  --env-file ./server/node-api/.env \
  evat26/monorepo:python-latest
```

This connects the Python service to the same Docker network as the API so backend services can communicate internally over the Docker network, while keeping the public port exposed on host `5000`.

Load frontend environment variables for the Vite build:

```bash
set -a
. ./client/web-app/.env
set +a
```

This exports the variables from `client/web-app/.env` into the current shell so they can be passed to the Docker build command as build arguments.

Convert all `VITE_*` variables into Docker build args:

```bash
BUILD_ARGS=()
for key in $(env | cut -d= -f1 | grep '^VITE_'); do
  BUILD_ARGS+=("--build-arg" "$key=${!key}")
done
```

This ensures values such as `VITE_API_URL` and `VITE_GOOGLE_MAPS_API_KEY` are passed to the Docker build. These values must be injected during build time because Vite compiles them into the final frontend bundle.

Build the frontend image locally:

```bash
docker build "${BUILD_ARGS[@]}" -t evat26/monorepo:web-latest ./client/web-app
```

This builds the React app into a static production bundle and packages it into an Nginx-based image. The frontend is built locally because the web app depends on Vite env vars being embedded during compilation.

Run the web app container:

```bash
docker run -d --name evat-web -p 3000:80 evat26/monorepo:web-latest
```

This starts the frontend on host port `3000` and serves the compiled static site via Nginx.

This flow is useful when you want to pull the backend and Python services from a shared registry while keeping the frontend build local so that the correct Vite configuration is baked into the final web image.

---

## 🔑 Authentication & API Setup

### Google Maps & AI

1. Go to the Google Cloud Console and create a project with billing enabled.
2. Under 'API & Services', enable:
   - Places API (New),
   - Places API,
   - Distance Matrix API,
   - Directions API,
   - Maps Javascript API, and
   - Geocoding API.
3. Under 'Credentials', click Create Credentials -> API key. Copy this into GOOGLE_MAPS_API_KEY.
4. Click Create Credentials -> Service account. Name it, assign the Viewer role, and click 'Done'.
5. Click your new service account -> Keys -> Add key -> Create new key -> JSON.
6. Move the downloaded JSON file into server/node-api/ and rename it to google-credentials.json.
7. Ensure this path matches the GOOGLE_APPLICATION_CREDENTIALS variable in your backend .env.

### Nodemailer (Admin 2FA)

1. EVAT uses Nodemailer for sending admin email 2FA codes. Currently, it is set up for a fixed Gmail sender address (EMAIL_USER) to an admin (ADMIN_EMAIL).
2. To set up your Gmail account, follow Nodemailer's Gmail Instructions.
3. Generate an 'App Password' (a 16-character string like abcd efgh ijkl mnop) and paste it into EMAIL_PASS.

---

## 🧪 Testing

Backend testing is implemented using Jest. Python testing is implemented using pytest.

Location: Backend tests are located in server/node-api/test/. The folder structure mirrors the src/ directory (e.g., tests for controllers/user-controller.ts live in test/controllers/user-controller.test.ts).

Pattern: Tests must be written using the AAA pattern (Arrange, Act, Assert).

Structure: Use nested describe() blocks (outer for the file, inner for the function) and use test('Description of what should happen') for clarity.

Run the following commands from the root of the monorepo.

To run the backend tests:

```bash
npm run test:server
```

To run the Python tests:

```bash
npm run test:python
```

(Tip: We highly recommend using the Jest Test Explorer VSCode extension for debugging).

---

## 📚 Machine Learning Deployment

For local Python setup, model training support, service deployment, Docker usage, verification, and troubleshooting, see the [Machine Learning Deployment Guide](docs/MACHINE_LEARNING_DEPLOYMENT_GUIDE.md).

For new-student onboarding, repository and dataset orientation, model and endpoint ownership, testing, release procedures, and future priorities, see the [Machine Learning Handover Guide](docs/MACHINE_LEARNING_HANDOVER.md).

For the end-to-end data, training, evaluation, artifact, and prediction architecture, see the [Machine Learning Pipeline Architecture](docs/MACHINE_LEARNING_PIPELINE_ARCHITECTURE.md).

---

## 🚧 Known Issues / Fixes Required

Invalid Token Error: An invalid token error is currently occurring when performing GET /api/vehicle, even though the Bearer token appears correct when checked in the code. Needs investigation.
