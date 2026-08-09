FROM node:20-alpine AS build

WORKDIR /app

# Accept Vite API URL at build time and expose it as an env var
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies and build
COPY package*.json ./
# Use `npm ci` if a lockfile exists for reproducible installs, otherwise fall back to `npm install`
RUN sh -c 'if [ -f package-lock.json ]; then npm ci; else npm install; fi'

COPY . .
RUN npm run build

FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
