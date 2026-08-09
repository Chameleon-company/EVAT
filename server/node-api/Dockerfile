FROM node:18-alpine AS builder

WORKDIR /app

# Install all dependencies for build
COPY package*.json ./
RUN npm install

# Copy source and build output
COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app

# Install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled application artifacts from builder
COPY --from=builder /app/server.js ./
COPY --from=builder /app/src ./src

EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "server.js"]
