# Stage 1: Build React client
from node:20-alpine as builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Express backend + React static assets
FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache python3 make g++ chromium

# Tell Puppeteer to skip downloading its own Chromium bundle and use the
# system-installed one instead.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci
COPY . .
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000
CMD ["node", "backend/server.js"]
