/**
 * integrations/openclaw/webhook.js
 *
 * OpenClaw — GitHub webhook receiver that forwards events to Telegram.
 * Ported from Abafirst/OpenClaw and integrated into Resilience Atlas.
 *
 * Environment variables required:
 *   TELEGRAM_BOT_TOKEN  — Telegram bot token
 *   TELEGRAM_CHAT_ID    — Telegram chat / channel ID
 *   OPENCLAW_PORT       — Port for the standalone webhook server (default: 3001)
 */

const express = require('express');
const axios   = require('axios');

const app  = express();
const PORT = process.env.OPENCLAW_PORT || 3001;

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

app.use(express.json());

/**
 * POST /webhook
 * Receives GitHub webhook payloads and forwards a summary to Telegram.
 */
app.post('/webhook', (req, res) => {
    const event = req.body;

    console.log('📨 GitHub Webhook Event Received:');
    console.log(JSON.stringify(event, null, 2));

    let message = buildMessage(req.headers['x-github-event'], event);

    if (message) {
        sendTelegramMessage(message).catch(err =>
            console.error('❌ Telegram send error:', err.message)
        );
    }

    res.status(200).json({ success: true, message: 'Webhook received' });
});

/**
 * Build a human-readable Telegram message from a GitHub event payload.
 * @param {string} eventType - Value of the X-GitHub-Event header
 * @param {Object} event     - Parsed JSON body from GitHub
 * @returns {string}
 */
function buildMessage(eventType, event) {
    if (event.action === 'opened' && event.pull_request) {
        const pr = event.pull_request;
        return (
            `🔔 <b>Pull Request Opened!</b>\n\n` +
            `<b>Title:</b> ${pr.title}\n` +
            `<b>Author:</b> ${pr.user.login}\n` +
            `<b>Branch:</b> ${pr.head.ref} → ${pr.base.ref}\n` +
            `<b>URL:</b> <a href="${pr.html_url}">View PR</a>`
        );
    }

    if (event.action === 'closed' && event.pull_request) {
        const pr     = event.pull_request;
        const status = pr.merged ? '✅ MERGED' : '❌ CLOSED';
        return (
            `${status}\n\n` +
            `<b>Title:</b> ${pr.title}\n` +
            `<b>Author:</b> ${pr.user.login}\n` +
            `<b>URL:</b> <a href="${pr.html_url}">View PR</a>`
        );
    }

    if (event.action === 'created' && event.comment && event.issue) {
        return (
            `💬 <b>New Comment</b>\n\n` +
            `<b>Author:</b> ${event.comment.user.login}\n` +
            `<b>Comment:</b> ${event.comment.body}\n` +
            `<b>URL:</b> <a href="${event.comment.html_url}">View Comment</a>`
        );
    }

    if (event.ref && event.created) {
        return (
            `📤 <b>Push to ${event.ref.split('/').pop()}</b>\n\n` +
            `<b>Repository:</b> ${event.repository.name}\n` +
            `<b>Commits:</b> ${event.size}\n` +
            `<b>Pusher:</b> ${event.pusher.name}`
        );
    }

    // Generic fallback
    return (
        `📬 <b>GitHub Event Received</b>\n\n` +
        `<b>Event Type:</b> ${eventType || 'unknown'}\n` +
        `<b>Repository:</b> ${event.repository ? event.repository.name : 'Unknown'}`
    );
}

/**
 * Send a message to the configured Telegram chat.
 * @param {string} text - HTML-formatted message text
 */
async function sendTelegramMessage(text) {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
        console.warn('⚠️  TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set — skipping send.');
        return;
    }

    const response = await axios.post(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        { chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }
    );

    console.log('✅ Telegram message sent successfully!');
    console.log(`Message ID: ${response.data.result.message_id}`);
}

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OpenClaw webhook server is running!' });
});

// Start standalone server only when run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🚀 OpenClaw webhook receiver running on http://localhost:${PORT}`);
        console.log(`📨 Listening for GitHub webhooks at http://localhost:${PORT}/webhook`);
        console.log(`✅ Telegram notifications ${TELEGRAM_BOT_TOKEN ? 'enabled' : 'DISABLED (env vars missing)'}`);
    });
}

module.exports = { app, buildMessage, sendTelegramMessage };
