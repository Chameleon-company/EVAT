FROM node:18-alpine AS build

WORKDIR /app

# Copy package manifests and install build deps predictably
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080
ENV DOMAIN_URL=http://0.0.0.0

# Install only production deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled artifacts from build stage
COPY --from=build /app/server.js ./
COPY --from=build /app/src ./src

EXPOSE 8080
CMD ["node", "server.js"]