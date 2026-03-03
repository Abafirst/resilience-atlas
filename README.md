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
   ```
4. Start the application:
   ```bash
   npm start
   ```

### Testing in the browser

Once the server is running, open your browser and go to:

```
http://localhost:3000/index.html
```

This loads the **in-browser API Tester** — a simple page that lets you click buttons to call every endpoint and see the live JSON responses without needing any external tool.

![Browser API Tester](https://github.com/user-attachments/assets/b5b21286-c80d-4ada-a868-d4c575dee813)

### Running the automated test suite

```bash
npm test
```

No database or Stripe credentials are needed for the automated tests.

### API Endpoints
- **GET /health** — Server health check
- **GET /** — Welcome message
- **POST /create-payment** *(requires JWT)* — Create a Stripe Payment Intent
- **GET /payment/:id** *(requires JWT)* — Get the status of a payment

### Deployment Instructions
1. Build the application for production:
   ```bash
   npm run build
   ```
2. Deploy the build folder to your chosen hosting service (e.g., AWS, Heroku).

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