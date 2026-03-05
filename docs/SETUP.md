# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas cloud)
- Stripe account (test keys for development)
- Yahoo Mail account with an App Password (for email delivery)
- Telegram bot token (optional, for OpenClaw notifications)

---

## 1. Clone the Repository

```bash
git clone https://github.com/Abafirst/resilience-atlas.git
cd resilience-atlas
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 3000) |
| `NODE_ENV` | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Random secret for signing JWTs |
| `SESSION_SECRET` | Random secret for express-session |
| `YAHOO_EMAIL` | Yahoo email for sending reports |
| `YAHOO_APP_PASSWORD` | Yahoo App Password (not your login password) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (OpenClaw) |
| `TELEGRAM_CHAT_ID` | Telegram chat/channel ID (OpenClaw) |
| `APP_URL` | Public URL of the application |
| `CORS_ORIGIN` | Allowed CORS origin(s) |

## 4. Start the Server

```bash
# Development (with auto-restart via nodemon)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000`.

---

## Yahoo App Password

1. Go to [Yahoo Account Security](https://login.yahoo.com/account/security)
2. Enable two-step verification
3. Generate an App Password under "Manage app passwords"
4. Use this password as `YAHOO_APP_PASSWORD` — **not** your regular password

---

## MongoDB Atlas (Cloud)

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write access
3. Whitelist your IP address (or `0.0.0.0/0` for development)
4. Copy the connection string and set it as `MONGODB_URI`

### Password special characters

If your MongoDB password contains characters such as `@`, `/`, `?`, `#`, `[`, `]`, or `%`,
they **must** be percent-encoded in the connection string, otherwise the URI parser will
misinterpret them and the connection will fail.

| Character | Encoded form |
|-----------|-------------|
| `@`       | `%40`       |
| `/`       | `%2F`       |
| `?`       | `%3F`       |
| `#`       | `%23`       |
| `[`       | `%5B`       |
| `]`       | `%5D`       |
| `%`       | `%25`       |
| `:`       | `%3A`       |

**Example** — password `p@ss/w0rd` becomes `p%40ss%2Fw0rd` in the URI:

```
mongodb+srv://resilience_user:p%40ss%2Fw0rd@cluster0.example.mongodb.net/resilience
```

The server automatically re-encodes credentials at startup so that an already-encoded
URI is never double-encoded.  To URL-encode a password manually, run:

```bash
node -e "console.log(encodeURIComponent('your_password_here'))"
```

---

## Running Tests

### Automated tests (no live services required)

All external dependencies (MongoDB, Stripe, email) are mocked, so you can run the full suite locally without any `.env` values set:

```bash
npm test
```

You should see output similar to:

```
PASS  tests/server.test.js
PASS  tests/scoring.test.js
PASS  tests/auth.middleware.test.js

Tests: 35 passed, 35 total
```

### Manual health check (local server)

1. Copy and fill in your environment file:

   ```bash
   cp .env.example .env
   # edit .env — at minimum set MONGODB_URI and JWT_SECRET
   ```

2. Start the server:

   ```bash
   node backend/index.js
   ```

3. In a second terminal, poll the health endpoint:

   ```bash
   curl -i http://localhost:3000/health
   ```

   - **While the server is binding** you will receive `503`:

     ```json
     {"status":"starting","message":"Server is starting up"}
     ```

   - **Once the server is fully up** (the `app.listen` callback has fired) you will receive `200`:

     ```json
     {"status":"OK","message":"Resilience Atlas server is running","db":"connected"}
     ```

   `db` will be `"disconnected"` if `MONGODB_URI` is not set or MongoDB is unreachable; the server still starts and the health endpoint still returns `200`.

---

## OpenClaw Standalone Mode

To run the GitHub-to-Telegram webhook server independently:

```bash
node integrations/openclaw/webhook.js
```

See [OPENCLAW.md](OPENCLAW.md) for full setup.
