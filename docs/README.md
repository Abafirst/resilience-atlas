# Resilience Atlas

> **Single source of truth** — consolidated from Aba-First/demo-repository, Aba-First/resilience_humanity, and Abafirst/OpenClaw.

Resilience Atlas is a full-stack web application that helps users discover their resilience profile through a comprehensive 36-question assessment, delivering personalized insights across six resilience dimensions: **Emotional, Mental, Physical, Social, Spiritual, and Financial**.

---

## Features

- 🧠 **36-question Resilience Assessment** — six-category scoring algorithm
- 📧 **Email Report Delivery** — quiz results sent via Yahoo Mail
- 🔐 **JWT Authentication** — secure login, signup, and profile management
- 💳 **Stripe Payments** — one-time payments and webhook event handling
- 🤝 **Affiliate System** — referral tracking with unique codes
- 🔔 **OpenClaw Integration** — GitHub webhook → Telegram notifications
- 🚀 **Railway Deployment** — single-command deployment

---

## Project Structure

```
backend/            Express API server, routes, middleware, models, services
frontend/           HTML pages and client-side JavaScript
integrations/       Third-party integrations (OpenClaw / Telegram)
docs/               Project documentation
config/             Environment and deployment configuration
questions.json      36-question assessment data
package.json        Combined dependencies
```

---

## Quick Start

```bash
git clone https://github.com/Abafirst/resilience-atlas.git
cd resilience-atlas
npm install
cp .env.example .env   # fill in your values
npm start
```

See [docs/SETUP.md](docs/SETUP.md) for full installation instructions.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/signup | — | Register a new user |
| POST | /api/auth/login | — | Authenticate and receive JWT |
| GET | /api/auth/profile | ✅ | Get current user profile |
| PUT | /api/auth/profile | ✅ | Update profile |
| GET | /api/auth/profile-status | ✅ | Check whether the user's full name is stored |
| POST | /api/auth/complete-profile | ✅ | Save the user's full name (post-login flow) |
| GET | /api/quiz/questions | — | List all 36 questions |
| POST | /api/quiz/submit | ✅ | Submit answers, receive scores |
| GET | /api/quiz/results | ✅ | View quiz history |
| POST | /api/stripe/create-payment-intent | ✅ | Create Stripe payment |
| GET | /api/affiliates/dashboard | ✅ | View affiliate stats |
| GET | /health | — | Health check |

---

## Documentation

- [SETUP.md](docs/SETUP.md) — Installation and configuration
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment guide (Railway)
- [CONTRIBUTING.md](docs/CONTRIBUTING.md) — How to contribute
- [CHANGELOG.md](docs/CHANGELOG.md) — Version history
- [OPENCLAW.md](docs/OPENCLAW.md) — GitHub → Telegram integration

---

## Complete-profile flow

### Why it exists

Auth0 Universal Login previously showed a **"username"** field that disallows
spaces, causing sign-up friction.  The fix is to **disable "Requires Username"**
in the Auth0 Dashboard (`Authentication → Database → <connection> → Settings`)
so Auth0 uses **email + password** only.

Because reports and exports still need a display name, a
**post-login "Complete your profile"** step captures it inside the app:

1. After authentication, the `RequireProfileCompletion` wrapper in
   `client/src/App.jsx` calls `GET /api/auth/profile-status`.
2. If the user has no name stored (`hasName === false`), they are redirected
   to `/complete-profile`.
3. `CompleteProfilePage` (`client/src/pages/CompleteProfilePage.jsx`) shows a
   single "Full name" field (spaces allowed, 2–80 chars).
4. On submit it calls `POST /api/auth/complete-profile`, which upserts the name
   into the `Auth0Profile` MongoDB collection.
5. On success the user is sent to `/`.

Both endpoints require a valid Auth0 Bearer JWT and enforce that a user can
only read/write their own record (JWT email claim check).

---

## License

MIT License — see [LICENSE](LICENSE) for details.
