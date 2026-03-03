# Resilience Atlas

> **Consolidated repository** — single source of truth for the Resilience Atlas platform.

Resilience Atlas is a full-stack web application that helps users discover their resilience profile through a comprehensive 36-question assessment, delivering personalised insights across six resilience dimensions: **Emotional, Mental, Physical, Social, Spiritual, and Financial**.

## Features

- 🧠 36-question resilience assessment with 6-type scoring
- 📧 Email report delivery (Yahoo Mail / Nodemailer)
- 🔐 JWT authentication — login, signup, profile
- 💳 Stripe payments with webhook handling
- 🤝 Affiliate referral system
- 🔔 OpenClaw — GitHub webhook → Telegram notifications
- 🚀 Railway deployment ready

## Quick Start

```bash
git clone https://github.com/Abafirst/resilience-atlas.git
cd resilience-atlas
npm install
cp .env.example .env   # fill in your values
npm start
```

## Documentation

Full documentation lives in the [`docs/`](docs/) directory:

- [docs/README.md](docs/README.md) — Project overview and API reference
- [docs/SETUP.md](docs/SETUP.md) — Installation and configuration
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Deployment guide (Railway, Docker, Heroku)
- [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) — How to contribute
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — Version history
- [docs/OPENCLAW.md](docs/OPENCLAW.md) — GitHub → Telegram integration

## Project Structure

```
backend/            Express API server, routes, middleware, models, services, utils
frontend/           HTML pages and client-side JavaScript
integrations/       OpenClaw (GitHub → Telegram) and other third-party integrations
docs/               Project documentation
questions.json      36-question assessment data
package.json        Combined dependencies
.env.example        Environment variable template
Dockerfile          Docker container definition
railway.toml        Railway deployment configuration
```

## License

MIT License
