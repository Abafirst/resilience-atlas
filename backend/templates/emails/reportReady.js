'use strict';

/**
 * reportReady.js — Email sent when a user's PDF report is ready for download.
 *
 * Variables:
 *   firstName        {string}
 *   downloadLink     {string}  Secure download URL
 *   reportLink       {string}  Online view URL
 *   expiryDays       {number}  Default 7
 *   keyFindings      {string[]} Up to 3 short bullet points
 *   isFreeTier       {boolean} Show upgrade prompt when true
 *   upgradeLink      {string}
 *   shareLink        {string}  Public share URL
 *   unsubscribeUrl   {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

function buildReportReadyEmail(vars) {
  const {
    firstName     = 'Friend',
    downloadLink  = `${APP_URL}/report`,
    reportLink    = `${APP_URL}/results`,
    expiryDays    = 7,
    keyFindings   = [],
    isFreeTier    = false,
    upgradeLink   = `${APP_URL}/upgrade.html`,
    shareLink     = reportLink,
    unsubscribeUrl,
  } = vars;

  const findingItems = keyFindings.slice(0, 3)
    .map(f => `<li style="margin: 0 0 8px; font-size: 15px; line-height: 1.5; color: ${COLORS.text};">${f}</li>`)
    .join('');

  const findingsBlock = findingItems
    ? `<h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">&#128203; Key Findings</h3>
       <ul style="margin: 0 0 24px; padding-left: 20px;">${findingItems}</ul>`
    : '';

  const upgradeBlock = isFreeTier
    ? `<div style="background: linear-gradient(135deg, #fff8e1, #fffde7);
                   border: 1px solid #f39c12; border-radius: 10px; padding: 20px 24px; margin: 24px 0;">
         <p style="margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #e67e22;">
           &#9889; Unlock Your Full Deep Report
         </p>
         <p style="margin: 0 0 14px; font-size: 14px; color: ${COLORS.text};">
           Upgrade to <strong>Atlas Premium</strong> for a comprehensive 16-page analysis,
           personalized action plans, and growth tracking.
         </p>
         ${ctaButton(upgradeLink, 'Upgrade to Premium', '#f39c12')}
       </div>`
    : '';

  const shareBlock = `
    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 20px; margin-top: 24px; text-align: center;">
      <p style="margin: 0 0 12px; font-size: 14px; color: ${COLORS.textMuted}; font-weight: 600;">
        &#128279; Share Your Results
      </p>
      <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
        <tr>
          <td style="padding: 0 6px;">
            <a href="https://twitter.com/intent/tweet?text=I%20just%20completed%20my%20Resilience%20Assessment!%20Check%20it%20out%3A%20${encodeURIComponent(shareLink)}"
               target="_blank"
               style="display: inline-block; background: #1da1f2; color: #fff; font-size: 13px; font-weight: 700;
                      padding: 8px 16px; border-radius: 6px; text-decoration: none;">
              &#120143; Share on X
            </a>
          </td>
          <td style="padding: 0 6px;">
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}"
               target="_blank"
               style="display: inline-block; background: #0077b5; color: #fff; font-size: 13px; font-weight: 700;
                      padding: 8px 16px; border-radius: 6px; text-decoration: none;">
              in LinkedIn
            </a>
          </td>
        </tr>
      </table>
    </div>`;

  const body = `
    <h2 style="margin: 0 0 8px; font-size: 24px; color: ${COLORS.text};">
      &#127881; Your Report is Ready, ${firstName}!
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.textMuted};">
      Your Personal Resilience Report has been generated and is ready for download.
    </p>

    <!-- Download hero -->
    <div style="background: ${COLORS.accentLight}; border-radius: 10px; padding: 28px; text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 6px; font-size: 36px;">&#128196;</p>
      <p style="margin: 0 0 4px; font-size: 18px; font-weight: 800; color: ${COLORS.primaryDark};">
        Personal Resilience Report
      </p>
      <p style="margin: 0 0 20px; font-size: 13px; color: ${COLORS.textMuted};">
        Download link expires in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}
      </p>
      ${ctaButton(downloadLink, '&#11015; Download PDF Report', COLORS.primary)}
      <p style="margin: 12px 0 0; font-size: 12px; color: ${COLORS.textMuted};">
        Or <a href="${reportLink}" style="color: ${COLORS.accent};">view your report online</a>
      </p>
    </div>

    ${findingsBlock}
    ${upgradeBlock}
    ${shareBlock}`;

  return {
    subject: `${firstName}, your Resilience Report is ready to download!`,
    html: wrapEmail(body, 'Report Ready for Download', unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const { firstName, downloadLink, reportLink, expiryDays = 7, keyFindings = [] } = vars;
  const lines = [
    'The Resilience Atlas™ — Your Report is Ready',
    '=============================================',
    '',
    `Hello, ${firstName || 'Friend'}!`,
    '',
    'Your Personal Resilience Report is ready.',
    '',
    `Download PDF: ${downloadLink || ''}`,
    `View Online:  ${reportLink || ''}`,
    '',
    `Note: Download link expires in ${expiryDays} days.`,
  ];
  if (keyFindings.length) {
    lines.push('', 'Key Findings:');
    keyFindings.slice(0, 3).forEach(f => lines.push(`  • ${f}`));
  }
  lines.push(
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  );
  return lines.join('\n');
}

module.exports = { buildReportReadyEmail };
