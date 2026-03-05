# Changelog

All notable changes to this project will be documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2026-03-03

### Added
- **Consolidated repository** — merged content from Aba-First/demo-repository, Aba-First/resilience_humanity, and Abafirst/OpenClaw into a single primary repository
- **`backend/server.js`** — Complete Express server with Helmet security headers, CORS, rate limiting, express-session, and MongoDB via Mongoose
- **`backend/middleware/auth.js`** — JWT authentication middleware (`authenticateJWT`, `optionalJWT`)
- **`backend/models/User.js`** — Mongoose User model with bcrypt password hashing, affiliate codes, and quiz result history
- **`backend/routes/auth.js`** — Signup, login, and profile endpoints
- **`backend/routes/quiz.js`** — Quiz submission with resilience scoring, email report delivery, and result history
- **`backend/routes/stripe.js`** — Create payment intent, retrieve payment status, and Stripe webhook handler
- **`backend/routes/affiliates.js`** — Affiliate dashboard and referral listing
- **`backend/scoring.js`** — Comprehensive 6-type resilience scoring algorithm (Emotional, Mental, Physical, Social, Spiritual, Financial) for 36-question assessment
- **`backend/utils/logger.js`** — Winston-based structured logger
- **`backend/services/emailService.js`** — Nodemailer + Yahoo Mail quiz report delivery
- **`frontend/login.html`** — Login / signup interface
- **`frontend/public/js/auth.js`** — Client-side JWT session management
- **`integrations/openclaw/webhook.js`** — GitHub webhook → Telegram notification integration (ported from Abafirst/OpenClaw, credentials moved to environment variables)
- **`questions.json`** — 36-question resilience assessment data (Emotional, Mental, Physical, General categories)
- **`docs/`** — README, SETUP, DEPLOYMENT, CONTRIBUTING, CHANGELOG, OPENCLAW documentation
- **`package.json`** — Merged dependencies from all source repositories

### Changed
- Moved Telegram bot credentials from hardcoded values to environment variables (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
- Updated `railway.toml` to reflect new project structure
- Updated `.env.example` with all required environment variables

### Security
- Removed hardcoded Telegram bot token from OpenClaw integration
- Added Helmet security headers to Express server
- Added rate limiting on all `/api/` routes
