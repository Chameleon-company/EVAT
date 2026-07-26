FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code and TypeScript config
COPY . .

# Build TypeScript code
RUN npm run build && ls -la

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["node", "server.js"]