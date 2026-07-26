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

### 1. Frontend Environment Variables
Create a `.env` file in `client/web-app/.env`:

```env
VITE_API_URL=http://localhost:8080/api
```

### 2. Backend Environment Variables
Create a .env file in server/node-api/.env:

```env
Code snippet
PORT = 8080
MONGODB_URI = mongodb://<<address>>:<<port>>/EVAT
JWT_SECRET = 'abc123'
GOOGLE_MAPS_API_KEY=ABCD1234
GOOGLE_AI_API_KEY=ABCD1234
GOOGLE_APPLICATION_CREDENTIALS="./google-credentials.json"
EMAIL_USER = "sender@example.com"
EMAIL_PASS = "See Nodemailer section"
ADMIN_EMAIL = "receiver@example.com"
(Note: Ensure .env and your .json credential files are never committed to version control!)
```

---

## 🚀 Installation & Running Locally

Because we use NPM workspaces, you do not need to navigate into individual folders to install packages.

1. Install all dependencies (Frontend & Backend):
Navigate to the root of the repository and run:

Bash
npm install

2. Start the Backend API:
From the root directory (/server/node-api/), run:

Bash
npm run dev:server
The server will start on port 8080. Swagger UI is available at http://localhost:8080/api/docs.

3. Start the Frontend Web App:
Open a second terminal tab at the root directory (/client/web-app/), and run:

Bash
npm run dev:client
Vite will provide a local URL (usually http://localhost:5173) to view the app.

---

## 🔑 Authentication & API Setup

Google Maps & AI
Go to the Google Cloud Console and create a project with billing enabled.

Under 'API & Services', enable: Places API (New), Places API, Distance Matrix API, and Directions API.

Under 'Credentials', click Create Credentials -> API key. Copy this into Maps_API_KEY.

Click Create Credentials -> Service account. Name it, assign the Viewer role, and click 'Done'.

Click your new service account -> Keys -> Add key -> Create new key -> JSON.

Move the downloaded JSON file into server/node-api/ and rename it to google-credentials.json.

Ensure this path matches the GOOGLE_APPLICATION_CREDENTIALS variable in your backend .env.

Nodemailer (Admin 2FA)
EVAT uses Nodemailer for sending admin email 2FA codes. Currently, it is set up for a fixed Gmail sender address (EMAIL_USER) to an admin (ADMIN_EMAIL).

To set up your Gmail account, follow Nodemailer's Gmail Instructions.

Generate an 'App Password' (a 16-character string like abcd efgh ijkl mnop) and paste it into EMAIL_PASS.

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

