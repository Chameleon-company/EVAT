# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# EVAT web app (Vite + React) served by Nginx
# Build context: client/web-app
# ---------------------------------------------------------------------------

# ------------------------------- build stage -------------------------------
# Vite 7 requires Node >= 20.19; node:18 fails at `vite build`.
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite inlines env vars at BUILD time, so these are build args, not runtime
# env. vite.config.js only reads keys it finds in .env files (it iterates
# dotenv's parsed output, not process.env), so the args are written to .env
# before building.
ARG VITE_API_URL=/api
ARG VITE_GOOGLE_MAPS_API_KEY=
ARG VITE_GA_TRACKING_ID=

RUN printf 'VITE_API_URL=%s\nVITE_GOOGLE_MAPS_API_KEY=%s\nVITE_GA_TRACKING_ID=%s\n' \
      "$VITE_API_URL" "$VITE_GOOGLE_MAPS_API_KEY" "$VITE_GA_TRACKING_ID" > .env \
 && npm run build

# ------------------------------ runtime stage ------------------------------
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
