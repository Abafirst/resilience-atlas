'use strict';

/**
 * purchaseWelcome.js — Reward-style welcome email sent immediately after a user
 * purchases or unlocks Atlas Starter or Atlas Navigator.
 *
 * Variables:
 *   firstName       {string}  User's first name (or 'Friend')
 *   tier            {string}  'atlas-starter' | 'atlas-navigator'
 *   tierName        {string}  Human-readable tier label
 *   resultsLink     {string}  URL to the user's results page
 *   gamificationLink{string}  URL to the gamification / journey page
 *   unsubscribeUrl  {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

const TIER_CONFIG = {
  'atlas-starter': {
    emoji:    '🧭',
    label:    'Atlas Starter',
    color:    '#4f46e5',
    headline: 'Your Atlas Starter access is now unlocked!',
    tagline:  'You\'ve taken the first step on your resilience journey.',
    features: [
      { icon: '📄', text: 'Full PDF summary report — yours to keep forever' },
      { icon: '🏅', text: 'Resilience Badges — earn badges as you build skills' },
      { icon: '📍', text: 'Navigation Milestones — celebrate every step forward' },
      { icon: '🔬', text: 'Evidence-based micro-practices across all 6 dimensions' },
    ],
    nextStepLabel: 'View Your Resilience Report',
    nextStepUrl: (resultsLink) => resultsLink,
  },
  'atlas-navigator': {
    emoji:    '🗺️',
    label:    'Atlas Navigator',
    color:    '#7c3aed',
    headline: 'Welcome to Atlas Navigator — full access unlocked!',
    tagline:  'You now have the deepest level of resilience insight and tools.',
    features: [
      { icon: '📊', text: 'Deep dive across all 6 resilience dimensions' },
      { icon: '🛤️', text: 'Daily Compass Streaks and Navigation Pathways' },
      { icon: '🗺️', text: 'Resilience Map with community leaderboard' },
      { icon: '🏆', text: 'Explorer Achievements and advanced badges' },
      { icon: '📄', text: 'Unlimited downloadable PDF reports' },
    ],
    nextStepLabel: 'Start Your Resilience Journey',
    nextStepUrl: (_, gamificationLink) => gamificationLink,
  },
};

function buildPurchaseWelcomeEmail(vars) {
  const {
    firstName        = 'Friend',
    tier             = 'atlas-starter',
    resultsLink      = `${APP_URL}/results`,
    gamificationLink = `${APP_URL}/gamification`,
    unsubscribeUrl,
  } = vars;

  const cfg        = TIER_CONFIG[tier] || TIER_CONFIG['atlas-starter'];
  const tierName   = cfg.label;
  const ctaUrl     = cfg.nextStepUrl(resultsLink, gamificationLink);
  const ctaLabel   = cfg.nextStepLabel;

  const featuresHtml = cfg.features
    .map(({ icon, text }) => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="width: 34px; font-size: 20px; vertical-align: top;">${icon}</td>
              <td style="font-size: 14px; color: ${COLORS.text}; line-height: 1.5; vertical-align: top;">${text}</td>
            </tr>
          </table>
        </td>
      </tr>`)
    .join('');

  const body = `
    <!-- Reward hero -->
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 6px; font-size: 56px;">${cfg.emoji}</p>
      <h2 style="margin: 0 0 8px; font-size: 24px; color: ${COLORS.text};">
        ${cfg.headline.replace(/([^,!]+),?/, `$1, ${firstName}!`)}
      </h2>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.textMuted};">
        ${cfg.tagline}
      </p>
    </div>

    <!-- Tier badge -->
    <div style="text-align: center; margin-bottom: 28px;">
      <span style="display: inline-block; background: ${cfg.color}18; color: ${cfg.color};
                   border: 1px solid ${cfg.color}40; border-radius: 20px;
                   padding: 6px 18px; font-size: 13px; font-weight: 700; letter-spacing: 0.04em;">
        ✓ ${tierName} — Unlocked
      </span>
    </div>

    <!-- What you've unlocked -->
    <div style="background: ${COLORS.accentLight}; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
      <h3 style="margin: 0 0 14px; font-size: 16px; color: ${COLORS.primaryDark};">
        &#127381; Here's what you've unlocked:
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${featuresHtml}
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 28px;">
      ${ctaButton(ctaUrl, ctaLabel, cfg.color)}
    </div>

    <!-- Resilience reminder -->
    <div style="border-left: 4px solid ${cfg.color}; padding: 12px 16px;
                background: ${cfg.color}08; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.textMuted}; line-height: 1.6; font-style: italic;">
        "Resilience isn't about never struggling — it's about having the insight and tools
        to recover, adapt, and grow. You now have both."
      </p>
    </div>

    <!-- Support note -->
    <p style="margin: 0; font-size: 13px; color: ${COLORS.textMuted}; text-align: center;">
      Questions? Reply to this email — we're here to help you on your journey. 🌱
    </p>`;

  return {
    subject: `🎉 You're in! ${tierName} access is now unlocked — welcome, ${firstName}!`,
    html: wrapEmail(body, `${tierName} Unlocked`, unsubscribeUrl),
    text: buildPlainText({ firstName, tier, tierName, ctaUrl, ctaLabel, features: cfg.features }),
  };
}

function buildPlainText({ firstName, tierName, ctaUrl, ctaLabel, features }) {
  return [
    `The Resilience Atlas™ — ${tierName} Unlocked!`,
    '='.repeat(50),
    '',
    `Congratulations, ${firstName || 'Friend'}!`,
    '',
    `Your ${tierName} access is now unlocked.`,
    '',
    "What you've unlocked:",
    ...features.map(({ text }) => `  • ${text}`),
    '',
    `${ctaLabel}: ${ctaUrl}`,
    '',
    'Questions? Reply to this email — we\'re here to help.',
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  ].join('\n');
}

module.exports = { buildPurchaseWelcomeEmail };
