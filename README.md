# ⚡ EVAT (Electric Vehicle Adoption Tool)

**Company:** Chameleon  
**Project:** EV Adoption Tools  
**Team:** Web/App  

This repository is a **Monorepo** containing both the Vite + React frontend web application and the Express + Node.js backend API, managed via NPM Workspaces.

---

## 🛠️ Tech Stack

**Frontend (Client):** Vite, React, Chart.js, Leaflet  
**Backend (Server):** Node.js, TypeScript, Express.js, MongoDB, JWT, Nodemailer  
**Microservices:** Python (Flask/FastAPI)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
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
```
### IMPORTANT: Ensure .env and your .json credential files are never committed to version control!

---

## 🚀 Installation & Running Locally

Because we use NPM workspaces, you do not need to navigate into individual folders to install packages.

1. Install all dependencies (Frontend & Backend):
   Navigate to the root of the repository and run:
   ```sh
   npm install
   ```

2. Install necessary Python packages:
   There are two ways of doing this, creating a Python virtual environment or installing packages globally.
   **Virtual Environment Setup (Recommended)**
   If you *aren't* using VS Code instructions on how to create a Python virtual environment can be found [here](https://www.w3schools.com/python/python_virtualenv.asp).
   If you are using VS Code install the official Python extension, then access the Python Logo button on the left sidebar. Use any environment manager of your choice, for this walkthrough venv will be used. Create a new virtual environment by pressing the +.
   **Package installation for Global and Virtual Environment**
   Launch a new terminal in the root directory of the project and installing the packages by running:
   ```sh
   pip install -r server/python-services/requirements.txt
   ```


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

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| Node API (Swagger) | http://localhost:8081/api/docs |
| Python ML service | http://localhost:5000/docs |

The API publishes on **8081**, not 8080, because a local Jenkins commonly owns
8080. Override any host port from the root `.env` with `WEB_HOST_PORT`,
`API_HOST_PORT` or `PY_HOST_PORT`.

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

Testing is implemented using Jest.

Location: Backend tests are located in server/node-api/test/. The folder structure mirrors the src/ directory (e.g., tests for controllers/user-controller.ts live in test/controllers/user-controller.test.ts).

Pattern: Tests must be written using the AAA pattern (Arrange, Act, Assert).

Structure: Use nested describe() blocks (outer for the file, inner for the function) and use test('Description of what should happen') for clarity.

To run the backend tests:
Run the following from the root of the monorepo:

Bash
npm run test:server
(Tip: We highly recommend using the Jest Test Explorer VSCode extension for debugging).

---

## 📚 Machine Learning Deployment

For local Python setup, model training support, service deployment, Docker usage, verification, and troubleshooting, see the [Machine Learning Deployment Guide](docs/MACHINE_LEARNING_DEPLOYMENT_GUIDE.md).

---

## 🚧 Known Issues / Fixes Required

Invalid Token Error: An invalid token error is currently occurring when performing GET /api/vehicle, even though the Bearer token appears correct when checked in the code. Needs investigation.
