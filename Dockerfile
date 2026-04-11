# Stage 1: Build React client
FROM node:20-alpine AS builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm install
COPY client/ ./
COPY public/js/payment-gating.js ./public/js/payment-gating.js

ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_REDIRECT_URI
ARG VITE_STRIPE_PUBLISHABLE_KEY
ARG VITE_APP_VERSION

ENV VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN
ENV VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID
ENV VITE_AUTH0_REDIRECT_URI=$VITE_AUTH0_REDIRECT_URI
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY
ENV VITE_APP_VERSION=$VITE_APP_VERSION

ARG CACHE_BUST=1
RUN echo "CACHE_BUST=$CACHE_BUST"

RUN npm run build

# Stage 2: Express backend + React static assets
FROM node:20-bullseye
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    python3 \
    make \
    g++ \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxinerama1 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
  && update-ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# Tell Puppeteer to skip downloading its own Chromium bundle and use the
# system-installed one instead.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
RUN npm ci

# Install backend deps (includes archiver and other backend-only packages)
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY . .
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3000
CMD ["node", "backend/server.js"]
