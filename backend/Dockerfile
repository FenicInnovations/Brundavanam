# Production Dockerfile for Google Cloud Run
FROM node:20-alpine

# Working directory inside container
WORKDIR /app

# Production environment settings
ENV NODE_ENV=production
ENV PORT=8080

# Copy package manifests first for optimal layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production --ignore-scripts

# Copy entire backend source code
COPY . .

# Expose Cloud Run port
EXPOSE 8080

# Start Express server
CMD ["node", "server.js"]
