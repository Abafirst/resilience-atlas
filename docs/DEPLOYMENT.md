# Deployment Guide

## Railway (Recommended)

Resilience Atlas is pre-configured for [Railway](https://railway.app).

### 1. Connect your repository

1. Log in to [railway.app](https://railway.app)
2. Create a new project → **Deploy from GitHub repo**
3. Select `Abafirst/resilience-atlas`

### 2. Add environment variables

In the Railway dashboard go to **Variables** and add all variables from `.env.example`:

```
PORT
NODE_ENV=production
MONGODB_URI
JWT_SECRET
SESSION_SECRET
YAHOO_EMAIL
YAHOO_APP_PASSWORD
STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
APP_URL
CORS_ORIGIN
```

### 3. Add a MongoDB service

In your Railway project click **+ New Service → Database → MongoDB**.  
Railway will automatically inject `MONGODB_URI` into your app environment.

### 4. Deploy

Railway auto-deploys on every push to `main`. You can also trigger a manual deploy from the dashboard.

---

## Docker

A `Dockerfile` is included at the repository root.

```bash
# Build
docker build -t resilience-atlas .

# Run
docker run -p 3000:3000 --env-file .env resilience-atlas
```

---

## Heroku

```bash
heroku create resilience-atlas
heroku addons:create mongolab:sandbox
heroku config:set JWT_SECRET=... SESSION_SECRET=... # (all required vars)
git push heroku main
```

---

## Stripe Webhook Setup

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Forward events to your local server during development:
   ```bash
   stripe listen --forward-to localhost:3000/webhook
   ```
3. In production, add your Railway URL as a webhook endpoint in the [Stripe Dashboard](https://dashboard.stripe.com/webhooks):
   ```
   https://your-app.up.railway.app/webhook
   ```
4. Select at minimum: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
5. Copy the signing secret and set it as `STRIPE_WEBHOOK_SECRET`

---

## Health Check

After deployment, verify the server is running:

```bash
curl https://your-app.up.railway.app/health
# {"status":"OK","message":"Resilience Atlas server is running"}
```
