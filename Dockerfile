# Stage 1: Build React client
FROM node:20-alpine as builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Express backend + React static assets
FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
COPY --from=client-build /app/client/dist ./client/dist

EXPOSE 3000
CMD ["node", "backend/server.js"]
