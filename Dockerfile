# Stage 1: Build React client
FROM node:20-alpine AS builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Express backend + React static assets
FROM node:20-alpine
WORKDIR /usr/src/app

# Install Chromium and required libraries for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    python3 \
    make \
    g++

# Tell Puppeteer to skip downloading its own Chrome bundle and use system Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm ci
COPY . .
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000
CMD ["node", "backend/server.js"]
