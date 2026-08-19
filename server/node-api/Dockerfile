# syntax=docker/dockerfile:1
# ---------------------------------------------------------------------------
# EVAT Node API (Express + TypeScript)
# Build context: server/node-api
# ---------------------------------------------------------------------------

# ------------------------------- build stage -------------------------------
FROM node:18-alpine AS build

WORKDIR /app

# Install ALL dependencies (including devDependencies).
# `tsc`, ts-node and the @types/* packages live in devDependencies, so
# `npm install --production` here would make `npm run build` fail.
COPY package*.json ./
RUN npm install

# Copy only what TypeScript needs to compile (see .dockerignore).
COPY tsconfig.json ./
COPY server.ts ./
COPY src ./src

# tsconfig.json has no "outDir", so tsc emits server.js next to server.ts
# (=> /app/server.js) and src/**/*.js next to their sources.
RUN npm run build && ls -la /app/server.js

# ------------------------------ runtime stage ------------------------------
FROM node:18-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Production dependencies only - no compiler, no @types in the final image.
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Compiled entrypoint + compiled sources.
# The .ts files under src/ are copied too because swagger-jsdoc reads
# "./src/routes/*.ts" at runtime to build the /api/docs spec.
COPY --from=build /app/server.js ./server.js
COPY --from=build /app/src ./src

EXPOSE 8080

USER node

# The image contains server.js (produced by `npm run build`), not a dev
# toolchain, so start it directly. `npm run server` would invoke
# ts-node-dev on server.ts, which is a devDependency and is not installed.
CMD ["node", "server.js"]
