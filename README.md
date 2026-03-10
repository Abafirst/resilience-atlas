# Resilience Atlas

> ⭐ **This is the official, canonical repository for Resilience Atlas.**
> All development, deployments, and issues should be managed here.
> Any other repositories with a similar name are outdated and should be **archived** — see the note at the bottom of this file for instructions.

## Project Documentation

### Features
- Comprehensive visualization of resilience data
- Interactive data exploration and analysis tools
- API integration for real-time data retrieval
- User-friendly interface

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/Abafirst/resilience-atlas.git
   cd resilience-atlas
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   # Edit .env — at minimum set JWT_SECRET, STRIPE_SECRET_KEY, and STRIPE_PUBLISHABLE_KEY
   ```
4. Build the React payment frontend:
   ```bash
   npm run build:client
   ```
5. Start the application:
   ```bash
   npm start
   ```

### Testing in the browser

Once the server is running, open the **React payment UI** at:

```
http://localhost:3000/app
```

This loads the full payment flow — create an account, sign in, enter card details, and complete a payment.

You can also open the **in-browser API Tester** at:

```
http://localhost:3000/index.html
```

This is a simple page that lets you click buttons to call every endpoint and see the live JSON responses without needing any external tool.

### Auth endpoints (no database required)

The signup/login endpoints use an in-memory user store when no database is configured, so you can test the auth flow immediately without MongoDB:

```bash
# Register a new user
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"mypassword"}'

# Log in and get a JWT
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"mypassword"}'
```

### Running the automated test suite

```bash
npm test
```

No database or Stripe credentials are needed for the automated tests — all 27 tests run with mocked/placeholder values.

### API Endpoints
- **GET /health** — Server health check
- **GET /config** — Returns the Stripe publishable key for the frontend
- **POST /auth/signup** — Register a new user (returns `201` on success)
- **POST /auth/login** — Sign in and get a JWT token
- **GET /api/quizzes** — Retrieve all 36 resilience quiz questions
- **POST /create-payment** *(requires JWT)* — Create a Stripe Payment Intent
- **GET /payment/:id** *(requires JWT)* — Get the status of a payment

## License
This project is licensed under the MIT License.

---

## Consolidating repositories — how to archive the old ones

If you have other GitHub repositories for this project that are no longer needed, **archiving** is the safest option instead of deleting:

- **Archived repos are read-only** — no one can accidentally push to them.
- **GitHub shows a clear "Archived" banner** on every page of the repo, so there is no confusion.
- **History and code are preserved** in case you ever need to reference something.
- **It is reversible** — you can unarchive at any time.

### Steps to archive a GitHub repository

1. Go to the repository on GitHub (e.g. `https://github.com/Abafirst/<repo-name>`)
2. Click **Settings** (top right of the repo page)
3. Scroll down to the **Danger Zone** section
4. Click **Archive this repository**
5. Confirm the action

Repeat for each of the other 3 repositories. After archiving, add a short notice to their `README.md` (you can still edit files while unarchived, before archiving):

```markdown
> ⚠️ **ARCHIVED** — This repository is no longer maintained.
> The active project has moved to: https://github.com/Abafirst/resilience-atlas
```

This makes it instantly clear to anyone who finds the old repo where they should go.
> **Consolidated repository** — single source of truth for the Resilience Atlas platform.

Resilience Atlas is a full-stack web application that helps users discover their resilience profile through a comprehensive 36-question assessment, delivering personalized insights across six resilience dimensions: **Emotional, Mental, Physical, Social, Spiritual, and Financial**.

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
