'use strict';

/**
 * teamPurchaseConfirmation.js — Purchase confirmation email for Teams packages.
 *
 * Sent to the purchaser immediately after a successful one-time payment for
 * Atlas Team Basic ($299) or Atlas Team Premium ($699).
 *
 * Variables:
 *   planName        {string}  e.g. "Atlas Team Basic"
 *   planPrice       {string}  e.g. "$299"
 *   email           {string}  Purchaser's email address
 *   dashboardUrl    {string}  Link to the team dashboard
 *   supportEmail    {string}  Support contact address
 *   unsubscribeUrl  {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

function buildTeamPurchaseConfirmationEmail(vars) {
  const {
    planName       = 'Atlas Team',
    planPrice      = '',
    email          = '',
    dashboardUrl   = `${APP_URL}/team-analytics.html`,
    supportEmail   = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@resilience-atlas.app',
    unsubscribeUrl,
  } = vars;

  const priceDisplay = planPrice ? `${planPrice} (one-time)` : 'one-time purchase';

  const body = `
    <!-- Confirmation hero -->
    <h2 style="margin: 0 0 8px; font-size: 24px; color: ${COLORS.text};">
      &#127881; Payment Confirmed!
    </h2>
    <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${COLORS.text};">
      Thank you for purchasing <strong>${planName}</strong>. Your payment of
      <strong>${priceDisplay}</strong> has been successfully processed.
    </p>

    <!-- Order summary -->
    <div style="background: ${COLORS.accentLight}; border-radius: 10px; padding: 20px 24px; margin-bottom: 28px;">
      <h3 style="margin: 0 0 12px; font-size: 15px; color: ${COLORS.primaryDark};">
        &#128203; Order Summary
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size: 14px; color: ${COLORS.text}; padding: 4px 0;"><strong>Plan</strong></td>
          <td style="font-size: 14px; color: ${COLORS.text}; text-align: right; padding: 4px 0;">${planName}</td>
        </tr>
        <tr>
          <td style="font-size: 14px; color: ${COLORS.text}; padding: 4px 0;"><strong>Amount</strong></td>
          <td style="font-size: 14px; color: ${COLORS.text}; text-align: right; padding: 4px 0;">${priceDisplay}</td>
        </tr>
        <tr>
          <td style="font-size: 14px; color: ${COLORS.text}; padding: 4px 0;"><strong>Email</strong></td>
          <td style="font-size: 14px; color: ${COLORS.text}; text-align: right; padding: 4px 0;">${email}</td>
        </tr>
        <tr>
          <td style="font-size: 14px; color: ${COLORS.success}; padding: 8px 0 0;"><strong>&#10003; Status</strong></td>
          <td style="font-size: 14px; color: ${COLORS.success}; text-align: right; padding: 8px 0 0;"><strong>Paid</strong></td>
        </tr>
      </table>
    </div>

    <!-- Next steps -->
    <h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">
      &#128640; Getting Started
    </h3>
    <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: ${COLORS.text};">
      Your team access is now active. Here's how to get started:
    </p>
    <ol style="margin: 0 0 24px; padding-left: 20px; font-size: 14px; color: ${COLORS.text}; line-height: 1.8;">
      <li>Access your <strong>Team Dashboard</strong> to manage members and view aggregate results.</li>
      <li>Invite your team members by email — they'll each complete the Six Dimensions assessment.</li>
      <li>Review your team's resilience profile once assessments are complete.</li>
    </ol>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 28px;">
      ${ctaButton(dashboardUrl, '&#127919; Open Team Dashboard', COLORS.primary)}
    </div>

    <!-- Support note -->
    <p style="margin: 0; font-size: 13px; color: ${COLORS.textMuted}; text-align: center; line-height: 1.6;">
      Questions? Contact us at
      <a href="mailto:${supportEmail}" style="color: ${COLORS.accent};">${supportEmail}</a>.
      We're here to help you get the most from your team resilience program.
    </p>`;

  const planLabel = planName || 'Your Team Plan';
  return {
    subject: `Payment Confirmed — ${planLabel}`,
    html: wrapEmail(body, 'Team Purchase Confirmation', unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const {
    planName     = 'Atlas Team',
    planPrice    = '',
    email        = '',
    dashboardUrl = `${APP_URL}/team-analytics.html`,
    supportEmail = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || 'support@resilience-atlas.app',
  } = vars;

  const priceDisplay = planPrice ? `${planPrice} (one-time)` : 'one-time purchase';

  return [
    'The Resilience Atlas™ — Payment Confirmed',
    '==========================================',
    '',
    `Thank you for purchasing ${planName}.`,
    `Your payment of ${priceDisplay} has been successfully processed.`,
    '',
    'Order Summary:',
    `  Plan:   ${planName}`,
    `  Amount: ${priceDisplay}`,
    `  Email:  ${email}`,
    `  Status: Paid`,
    '',
    'Getting Started:',
    '  1. Access your Team Dashboard to manage members and view aggregate results.',
    '  2. Invite your team members by email.',
    '  3. Review your team\'s resilience profile once assessments are complete.',
    '',
    `Team Dashboard: ${dashboardUrl}`,
    '',
    `Questions? Contact us: ${supportEmail}`,
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  ].join('\n');
}

module.exports = { buildTeamPurchaseConfirmationEmail };
