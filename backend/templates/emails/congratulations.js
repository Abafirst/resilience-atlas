'use strict';

/**
 * congratulations.js — Personalised congratulations after completing the assessment.
 *
 * Variables:
 *   firstName          {string}
 *   overallScore       {number}  0-100
 *   dominantDimension  {string}
 *   primaryStrength    {string}  Short description of top strength
 *   reportLink         {string}
 *   upgradeLink        {string}
 *   nextSteps          {string[]}  Array of "what's next" suggestions
 *   shareLink          {string}
 *   unsubscribeUrl     {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

const DEFAULT_NEXT_STEPS = [
  'Review your full dimension breakdown in the report.',
  'Try a 5-minute micro-practice for your lowest-scoring dimension.',
  'Share your results with a trusted colleague or coach.',
  'Set a reminder to retake the assessment in 90 days.',
];

function buildCongratulationsEmail(vars) {
  const {
    firstName         = 'Friend',
    overallScore      = 0,
    dominantDimension = 'Balanced',
    primaryStrength   = '',
    reportLink        = `${APP_URL}/results.html`,
    upgradeLink       = `${APP_URL}/upgrade.html`,
    nextSteps         = DEFAULT_NEXT_STEPS,
    shareLink         = reportLink,
    unsubscribeUrl,
  } = vars;

  const nextStepsHtml = (nextSteps || DEFAULT_NEXT_STEPS).slice(0, 4)
    .map((step, i) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid ${COLORS.border};">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width: 32px; vertical-align: top;">
                <span style="display: inline-block; width: 24px; height: 24px; border-radius: 50%;
                             background: ${COLORS.primary}; color: #fff; font-size: 12px; font-weight: 700;
                             text-align: center; line-height: 24px;">${i + 1}</span>
              </td>
              <td style="font-size: 14px; line-height: 1.5; color: ${COLORS.text}; padding-left: 8px; vertical-align: top;">
                ${step}
              </td>
            </tr>
          </table>
        </td>
      </tr>`)
    .join('');

  const strengthBlock = primaryStrength
    ? `<div style="background: ${COLORS.accentLight}; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
         <p style="margin: 0; font-size: 15px; color: ${COLORS.text}; line-height: 1.5;">
           &#127775; <strong>Your Primary Strength:</strong> ${primaryStrength}
         </p>
       </div>`
    : '';

  const body = `
    <!-- Hero -->
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 4px; font-size: 52px;">&#127881;</p>
      <h2 style="margin: 0 0 8px; font-size: 26px; color: ${COLORS.text};">
        Congratulations, ${firstName}!
      </h2>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.textMuted};">
        You've completed The Resilience Atlas&#8482; Assessment.
      </p>
    </div>

    <!-- Score summary -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="background: ${COLORS.primary}15; border: 2px solid ${COLORS.primary}; border-radius: 10px;
                    padding: 20px; text-align: center;">
          <p style="margin: 0 0 4px; font-size: 48px; font-weight: 900; color: ${COLORS.primary};">
            ${Math.round(overallScore)}%
          </p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.text}; font-weight: 600;">
            Overall Resilience &bull; Dominant: <em>${dominantDimension}</em>
          </p>
        </td>
      </tr>
    </table>

    ${strengthBlock}

    <!-- What's next -->
    <h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">
      &#127919; What&#39;s Next?
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      ${nextStepsHtml}
    </table>

    <!-- CTAs -->
    <div style="text-align: center; margin-bottom: 24px;">
      ${ctaButton(reportLink, '&#128196; View Your Full Report', COLORS.primary)}
    </div>

    <!-- Upgrade nudge -->
    <div style="background: linear-gradient(135deg, #fff8e1, #fffde7);
                border: 1px solid #f5c842; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: #b7830a;">
        &#9889; Want deeper insights?
      </p>
      <p style="margin: 0 0 14px; font-size: 14px; color: ${COLORS.text};">
        Upgrade to <strong>Atlas Premium</strong> and unlock a 16-page Deep Report, 
        personalized action plans, and team benchmarking.
      </p>
      ${ctaButton(upgradeLink, 'Upgrade Now', '#f39c12')}
    </div>

    <!-- Share -->
    <div style="text-align: center;">
      <p style="margin: 0 0 10px; font-size: 13px; color: ${COLORS.textMuted}; font-weight: 600;">
        Share your achievement &#128279;
      </p>
      <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareLink)}"
         target="_blank"
         style="display: inline-block; background: #0077b5; color: #fff; font-size: 12px; font-weight: 700;
                padding: 8px 16px; border-radius: 6px; text-decoration: none; margin: 0 4px;">
        Share on LinkedIn
      </a>
    </div>`;

  return {
    subject: `Congratulations, ${firstName}! Your Resilience Journey Begins 🎉`,
    html: wrapEmail(body, 'Assessment Complete!', unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const { firstName, overallScore, dominantDimension, reportLink, nextSteps = DEFAULT_NEXT_STEPS } = vars;
  const lines = [
    'The Resilience Atlas™ — Congratulations!',
    '=========================================',
    '',
    `Congratulations, ${firstName || 'Friend'}!`,
    '',
    `Your Overall Resilience Score: ${Math.round(overallScore || 0)}%`,
    `Dominant Dimension: ${dominantDimension || 'Balanced'}`,
    '',
    "What's Next:",
  ];
  (nextSteps || DEFAULT_NEXT_STEPS).slice(0, 4).forEach((s, i) => {
    lines.push(`  ${i + 1}. ${s}`);
  });
  lines.push(
    '',
    `View Full Report: ${reportLink || ''}`,
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  );
  return lines.join('\n');
}

module.exports = { buildCongratulationsEmail };
