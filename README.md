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

For the end-to-end data, training, evaluation, artifact, and prediction architecture, see the [Machine Learning Pipeline Architecture](docs/MACHINE_LEARNING_PIPELINE_ARCHITECTURE.md).

---

## 🚧 Known Issues / Fixes Required

Invalid Token Error: An invalid token error is currently occurring when performing GET /api/vehicle, even though the Bearer token appears correct when checked in the code. Needs investigation.
