# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas cloud)
- Stripe account (test keys for development)
- SendGrid account with an API key (for email delivery)
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
| `SMTP_HOST` | SMTP server hostname (e.g. `smtp.sendgrid.net`) |
| `SMTP_PORT` | SMTP server port (e.g. `587`) |
| `SMTP_USER` | SMTP username (for SendGrid use the literal string `apikey`) |
| `SMTP_PASS` | SMTP password / API key (for SendGrid, your API key starting with `SG.`) |
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

## SendGrid SMTP

The application sends all transactional emails through SendGrid's SMTP relay using Nodemailer. To configure it:

1. Create a free account at [sendgrid.com](https://sendgrid.com)
2. Go to **Settings → API Keys** and create an API key with **Mail Send** permissions
3. Add the following variables to your `.env` file:

   | Variable | Value |
   |----------|-------|
   | `SMTP_HOST` | `smtp.sendgrid.net` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | `apikey` (literal string) |
   | `SMTP_PASS` | Your SendGrid API key (starts with `SG.`) |

> **Note:** `SMTP_USER` must be the literal string `apikey` — this is required by SendGrid's SMTP relay regardless of which API key you use.

---

## Disabling User Emails (Staging / Testing)

Set `DISABLE_USER_EMAILS=true` to suppress all user-facing transactional emails without touching your SendGrid or SMTP configuration. This is useful for staging environments where you want to run the full application flow without accidentally emailing real users.

**Emails suppressed when `DISABLE_USER_EMAILS=true`:**
- Welcome emails
- Assessment results
- Report-ready notifications
- 90-day reassessment reminders
- Streak milestone emails
- Team invitation emails
- Purchase/welcome confirmation emails
- Daily micro-practice emails
- Growth milestone emails

**Emails that are always sent (admin bypass):**
- Enterprise inquiry notifications sent to the admin address (POST `/api/growth/team-lead`)

When an email is suppressed, the service logs a warning and returns `{ skipped: true, reason: 'DISABLE_USER_EMAILS' }` instead of calling SendGrid or Nodemailer.

```env
# In your staging .env or Railway staging Variables:
DISABLE_USER_EMAILS=true
```

Leave this variable unset (or set to any value other than `"true"`) in production.

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
> **⚠️ Special characters in passwords** – If your database-user password contains
> characters such as `@`, `!`, `#`, `$`, `%`, or `&`, you must URL-encode the
> password before embedding it in the connection string.  
> Run `node backend/utils/encodeMongoPassword.js 'your-raw-password'` to get the
> encoded value, then build the URI using the encoded form.  
> See [docs/MONGODB_URL_ENCODING.md](MONGODB_URL_ENCODING.md) for the full guide.

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

---

## IATLAS Stripe Subscription Setup

IATLAS is a separate subscription product with its own Stripe Price IDs.

See [IATLAS_STRIPE_SETUP.md](IATLAS_STRIPE_SETUP.md) for the full guide, including:

- Creating products in the Stripe Dashboard
- Adding Price IDs to Railway environment variables
- Configuring webhook events
- Testing with Stripe CLI
