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

### Quick start — run it locally in 4 steps

> **You only need one terminal window.** Follow these steps top-to-bottom.

**Step 1 — Download the code**

Open a terminal, then paste:
```bash
git clone https://github.com/Abafirst/resilience-atlas.git
cd resilience-atlas
```

**Step 2 — Install dependencies** *(run this once, not every time)*

```bash
npm install
```

This downloads all the libraries the app needs into a `node_modules` folder.
It can take 30–60 seconds — just wait for the prompt to return.

**Step 3 — Create your `.env` file**

```bash
cp .env.example .env
```

Then open `.env` in any text editor and fill in your credentials
(MongoDB URI, Stripe keys, JWT secret). You can skip credentials you don't have yet —
the server will still start without them.

**Step 4 — Start the server**

```bash
npm start
```

You'll see:
```
🚀 Server running on port 3000
```

> ⚠️ **The terminal will stay busy** — that's normal. The server is running and waiting for requests.
> **Do not close the terminal** while you want the server to be available.

### Testing in the browser

While `npm start` is still running, open a **new browser tab** (you don't need a new terminal) and go to:

```
http://localhost:3000/index.html
```

This loads the **in-browser API Tester** — click any button to call an endpoint and see the live JSON response instantly. No curl or Postman needed.

![Browser API Tester](https://github.com/user-attachments/assets/b5b21286-c80d-4ada-a868-d4c575dee813)

To stop the server, go back to the terminal and press **Ctrl + C**.

### Running the automated test suite

Open a **new terminal** (while the server is *not* running), then:

```bash
npm test
```

No database or Stripe credentials are needed for the automated tests — they mock everything.

### API Endpoints
- **GET /health** — Server health check
- **GET /** — Welcome message
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