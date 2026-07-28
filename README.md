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

Because this is a monorepo, you must create **two separate `.env` files**—one for the frontend and one for the backend. 

### 1. Shared Environment Variable
Create a `.env` file in the root directory.
This file controls the shared variables (for both frontend and backend).
For now, it only contains which PORT the server should listen, and where the frontend should send the request to.
There's an `.env.example` file provided that you can copy.

```env
PORT=8080
VITE_API_URL="http://localhost:${PORT}$/api"
```

### 2. Backend Environment Variables
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
```
**IMPORTANT: Ensure .env and your .json credential files are never committed to version control!**

---

## 🚀 Installation & Running Locally

Because we use NPM workspaces, you do not need to navigate into individual folders to install packages.

1. Install all dependencies (Frontend & Backend):
   Navigate to the root of the repository and run:
   ```sh
   npm install
   ```

2. Start the dev stack:
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

---

## 🔑 Authentication & API Setup

### Google Maps & AI
1. Go to the Google Cloud Console and create a project with billing enabled.
2. Under 'API & Services', enable:
   - Places API (New),
   - Places API,
   - Distance Matrix API, and
   - Directions API.
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

## 🚧 Known Issues / Fixes Required

Invalid Token Error: An invalid token error is currently occurring when performing GET /api/vehicle, even though the Bearer token appears correct when checked in the code. Needs investigation.

