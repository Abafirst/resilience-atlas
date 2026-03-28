# Resilience Atlas — React / Vite Client

This is the React + Vite frontend for Resilience Atlas. It includes Auth0 authentication via `@auth0/auth0-react`.

---

## Prerequisites

- **Node.js** 18 or later
- An **Auth0** account and application (Single Page Application type). Create one at <https://manage.auth0.com>.

---

## Setup

### 1. Copy the environment template

```bash
cp .env.example .env
```

### 2. Fill in your Auth0 values

Open `.env` and replace the placeholder values:

```env
VITE_AUTH0_DOMAIN=your-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
# Optional – set if your app calls a protected backend API
VITE_AUTH0_AUDIENCE=https://your-api-identifier
# Optional – defaults to http://localhost:5173 (Vite dev server)
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
```

> **Note:** All variables must start with `VITE_` so Vite exposes them in the browser via `import.meta.env`.

### 3. Configure Auth0 Allowed URLs

In your Auth0 application settings, add the following to both **Allowed Callback URLs** and **Allowed Logout URLs**:

```
http://localhost:5173
```

Adjust for your production domain as needed.

### 4. Install dependencies

```bash
npm install
```

### 5. Start the development server

```bash
npm run dev
```

The app will be available at <http://localhost:5173>.

---

## Auth0 Integration Overview

| File | Purpose |
|------|---------|
| `src/main.jsx` | Wraps the app in `<Auth0Provider>` using env vars |
| `src/components/Auth0LoginBar.jsx` | Login button, logout button, and user info display |
| `src/App.jsx` | Mounts `Auth0LoginBar` at the top of every page |
| `.env.example` | Template for required `VITE_AUTH0_*` env vars |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build for production (output in `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_AUTH0_DOMAIN` | **Yes** | Your Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | **Yes** | Your Auth0 application Client ID |
| `VITE_AUTH0_AUDIENCE` | No | API audience identifier (for access tokens) |
| `VITE_AUTH0_REDIRECT_URI` | No | Callback URL after login (default: `window.location.origin`) |

---

## Changelog

### Stripe dependency downgrade (temporary fix)

**`@stripe/stripe-js` pinned to `2.0.0`; `@stripe/react-stripe-js` pinned to `1.8.0`.**

A breaking error (`TypeError: Constructor ArrayBuffer requires 'new'`) was introduced in a recent Stripe CDN update to `m.stripe.network/out-4.5.45.js`. This error occurs during page load and causes the checkout/auth flows to fail with a redirect back to the landing page.

The app uses only standard Stripe Elements APIs (`loadStripe`, `Elements`, `CardElement`, `useStripe`, `useElements`, `confirmCardPayment`) that are fully supported by these pinned versions. No application code changes are required.

> **This is a temporary fix.** Revert to the latest `@stripe/stripe-js` and `@stripe/react-stripe-js` once Stripe resolves the upstream CDN `ArrayBuffer` bug.

> **Note:** `npm install --legacy-peer-deps` is required when installing, because `@stripe/react-stripe-js@1.8.0` declares a peer dependency on `@stripe/stripe-js@^1.26.0`, but this version combination works correctly at runtime with all APIs used in this app.
