# ⚡ Project Setup Guide (EVAT Website Frontend)

This repository contains a **Vite + React** project. Follow the instructions below to set up your environment and run the app locally.

---

## 📦 Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

---

## ⚙️ Environment Variables

You need a `.env` file at the client/web-app/ AND at the server/node-api/ of the project to configure API endpoints and other secrets.

For the web-app (FE) location:
Create a `.env` file:
```env
VITE_API_URL=http://localhost:8080/api
```

For the node-api (BE) location:
Create a `.env` file:
```env
PORT = 8080
MONGODB_URI = mongodb://<<address>>:<<port>>/EVAT
JWT_SECRET = 'abc123'
GOOGLE_MAPS_API_KEY=ABCD1234
GOOGLE_AI_API_KEY=ABCD1234
GOOGLE_APPLICATION_CREDENTIALS="C:\Path\To\Auth.json"
EMAIL_USER = "sender@example.com"
EMAIL_PASS = "See Nodemailer section"
ADMIN_EMAIL = "reciever@example.com"
```


Also, make sure `.env` is listed in your `.gitignore` so secrets are not pushed to GitHub.

---

## ▶️ Running the App

### The app will not work without the backend running locally

To view the website for development:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

---

## 👨🏻‍💻 Development

1. Clone the [Backend](https://github.com/Chameleon-company/EVAT-App-BE) locally
2. Follow the readme to install dependencies and run the backend
3. Fork this repository
4. Clone the frontend fork locally
5. Install frontend dependencies and [environment variables](#️-environment-variables) described above and run the development app
   ```bash
   npm install
   npm run dev
   ```
6. Commit your changes
7. Submit a pull request
---