# Resilience Atlas

> **Single source of truth** — consolidated from Aba-First/demo-repository, Aba-First/resilience_humanity, and Abafirst/OpenClaw.

Resilience Atlas is a full-stack web application that helps users discover their resilience profile through a comprehensive 36-question assessment, delivering personalised insights across six resilience dimensions: **Emotional, Mental, Physical, Social, Spiritual, and Financial**.

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

## License

MIT License — see [LICENSE](LICENSE) for details.
