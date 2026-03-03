# OpenClaw — GitHub to Telegram Integration

OpenClaw is a lightweight webhook receiver that forwards GitHub repository events to a Telegram chat or channel.  
It is integrated into Resilience Atlas under `integrations/openclaw/`.

---

## How It Works

```
GitHub → POST /webhook → OpenClaw → Telegram Bot API → Your chat
```

When a GitHub event occurs (push, pull request, comment, etc.), GitHub sends a JSON payload to the `/webhook` endpoint. OpenClaw parses the event and sends a formatted HTML message to your Telegram chat.

---

## Supported Events

| GitHub Event | Telegram Message |
|---|---|
| Pull request opened | 🔔 PR details with link |
| Pull request merged | ✅ MERGED with PR title |
| Pull request closed (not merged) | ❌ CLOSED with PR title |
| Issue comment created | 💬 Comment author and text |
| Push / branch created | 📤 Pusher, repo, commit count |
| Any other event | 📬 Generic event notification |

---

## Setup

### 1. Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the **bot token** provided

### 2. Get Your Chat ID

1. Add the bot to the target chat / channel
2. Send a test message to the chat
3. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`
4. Find `"chat": {"id": <CHAT_ID>}` in the response

### 3. Configure Environment Variables

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
OPENCLAW_PORT=3001   # optional, default 3001
```

### 4. Add GitHub Webhook

1. Go to your GitHub repository → **Settings → Webhooks → Add webhook**
2. Set **Payload URL** to:
   ```
   https://your-app.up.railway.app/webhook
   ```
   (or `http://localhost:3001/webhook` for local testing)
3. Set **Content type** to `application/json`
4. Select the events to send (or "Send me everything")
5. Click **Add webhook**

---

## Running Standalone

```bash
node integrations/openclaw/webhook.js
```

---

## Running with ngrok (Local Testing)

```bash
# Terminal 1
node integrations/openclaw/webhook.js

# Terminal 2
ngrok http 3001
# Use the ngrok HTTPS URL as your GitHub webhook payload URL
```

---

## Origin

OpenClaw was originally developed in [Abafirst/OpenClaw](https://github.com/Abafirst/OpenClaw) and has been integrated here as part of the Resilience Atlas consolidation. The active project now lives in this repository.
