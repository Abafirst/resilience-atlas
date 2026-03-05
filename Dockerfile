# Stage 1: Build the React frontend
FROM node:18 AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Express backend + React static assets
FROM node:18
# Use the official Node.js LTS image
FROM node:18-alpine

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Copy the React build output from Stage 1
COPY --from=client-build /app/client/dist ./client/dist

# Expose the port the app runs on.
# Expose the port
EXPOSE 3000

# Start the server
CMD ["node", "backend/index.js"]