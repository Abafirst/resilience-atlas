'use strict';

/**
 * base.js — Shared layout helpers for Resilience Atlas HTML email templates.
 *
 * All templates use the same branded header / footer so visual changes only
 * need to be made in one place.
 */

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

/* ── Brand colours ─────────────────────────────────────────────────────────── */
const COLORS = {
  primary:     '#2c5f8a',
  primaryDark: '#1a3a5c',
  accent:      '#4a9fd4',
  accentLight: '#e8f4fd',
  success:     '#27ae60',
  gold:        '#f39c12',
  text:        '#1a1a2e',
  textMuted:   '#64748b',
  border:      '#e2e8f0',
  bgPage:      '#f1f5f9',
  bgCard:      '#ffffff',
};

/* ── Dimension colours ─────────────────────────────────────────────────────── */
const DIMENSION_COLORS = {
  emotional:  '#e74c3c',
  mental:     '#3498db',
  physical:   '#27ae60',
  social:     '#9b59b6',
  spiritual:  '#f39c12',
  financial:  '#1abc9c',
};

/* ── Helpers ───────────────────────────────────────────────────────────────── */

/**
 * Build a score progress-bar row.
 * @param {string} label
 * @param {number} score  0-100
 * @param {string} color  hex colour
 */
function progressBar(label, score, color) {
  const pct = Math.min(100, Math.max(0, Math.round(score)));
  return `
    <tr>
      <td style="padding: 6px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="width: 110px; font-size: 13px; color: ${COLORS.text}; font-weight: 600; padding-right: 10px; vertical-align: middle;">${label}</td>
            <td style="vertical-align: middle;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background: ${COLORS.border}; border-radius: 6px; height: 10px;">
                    <div style="width: ${pct}%; background: ${color}; height: 10px; border-radius: 6px; max-width: 100%;"></div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="width: 42px; text-align: right; font-size: 13px; font-weight: 700; color: ${color}; padding-left: 8px; vertical-align: middle;">${pct}%</td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/**
 * Build a CTA button.
 * @param {string} href
 * @param {string} label
 * @param {string} [bgColor]
 */
function ctaButton(href, label, bgColor = COLORS.primary) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="margin: 8px auto;">
      <tr>
        <td style="background: ${bgColor}; border-radius: 8px; text-align: center;">
          <a href="${href}" target="_blank"
             style="display: inline-block; padding: 14px 32px; color: #ffffff; font-family: Helvetica, Arial, sans-serif;
                    font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; line-height: 1.2;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

/**
 * Shared email header (logo + gradient band).
 * @param {string} [subtitle]
 */
function header(subtitle = '') {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background: linear-gradient(135deg, ${COLORS.primaryDark} 0%, ${COLORS.primary} 60%, ${COLORS.accent} 100%);
                  border-radius: 12px 12px 0 0;">
      <tr>
        <td style="padding: 32px 40px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 22px;
                           font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                  &#9679; The Resilience Atlas&#8482;
                </p>
                ${subtitle ? `<p style="margin: 4px 0 0; font-size: 13px; color: rgba(255,255,255,0.75); font-family: Helvetica, Arial, sans-serif;">${subtitle}</p>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

/**
 * Shared email footer.
 * @param {string} [unsubscribeUrl]
 */
function footer(unsubscribeUrl = `${APP_URL}/unsubscribe`) {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background: ${COLORS.bgPage}; border-top: 1px solid ${COLORS.border}; border-radius: 0 0 12px 12px;">
      <tr>
        <td style="padding: 24px 40px; text-align: center;">
          <p style="margin: 0 0 8px; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: ${COLORS.textMuted};">
            <a href="${APP_URL}/resources.html" style="color: ${COLORS.primary}; text-decoration: none;">Resources</a>
            &nbsp;&middot;&nbsp;
            <a href="${APP_URL}/quiz.html" style="color: ${COLORS.primary}; text-decoration: none;">Take Assessment</a>
            &nbsp;&middot;&nbsp;
            <a href="${APP_URL}/dashboard.html" style="color: ${COLORS.primary}; text-decoration: none;">Dashboard</a>
          </p>
          <p style="margin: 0 0 6px; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: ${COLORS.textMuted};">
            &copy; ${new Date().getFullYear()} The Resilience Atlas&#8482; &mdash; All rights reserved.
          </p>
          <p style="margin: 0; font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: ${COLORS.textMuted};">
            You are receiving this email because you have an account with The Resilience Atlas&#8482;.
            &nbsp;
            <a href="${unsubscribeUrl}" style="color: ${COLORS.textMuted}; text-decoration: underline;">Unsubscribe</a>
          </p>
        </td>
      </tr>
    </table>`;
}

/**
 * Wrap content sections in the outer email shell.
 * @param {string} bodyContent  Inner HTML (between header and footer)
 * @param {string} [subtitle]   Shown in the header band
 * @param {string} [unsubscribeUrl]
 */
function wrapEmail(bodyContent, subtitle = '', unsubscribeUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>The Resilience Atlas&#8482;</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bgPage}; font-family: Helvetica, Arial, sans-serif;">
  <!-- Tracking pixel placeholder: {{TRACKING_PIXEL}} -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: ${COLORS.bgPage};">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width: 600px; width: 100%; background: ${COLORS.bgCard};
                      border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr><td>${header(subtitle)}</td></tr>
          <tr><td style="padding: 32px 40px;">${bodyContent}</td></tr>
          <tr><td>${footer(unsubscribeUrl)}</td></tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  COLORS,
  DIMENSION_COLORS,
  progressBar,
  ctaButton,
  header,
  footer,
  wrapEmail,
};
