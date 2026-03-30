'use strict';

/**
 * assessmentResults.js — Email sent when a user completes the quiz.
 *
 * Variables:
 *   firstName        {string}
 *   overallScore     {number}   0-100
 *   dominantDimension {string}
 *   scores           {Object}   { emotional, mental, physical, social, spiritual, financial }
 *   topInsight       {string}   One key insight about the user's profile
 *   reportLink       {string}   URL to full online report
 *   retakeLink       {string}   URL to retake the assessment
 *   assessmentDate   {string}   Formatted date string
 *   unsubscribeUrl   {string}
 */

const { COLORS, DIMENSION_COLORS, progressBar, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

/**
 * Score badge colour helper.
 * @param {number} score
 */
function scoreBadgeColor(score) {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.primary;
  if (score >= 40) return COLORS.gold;
  return '#e74c3c';
}

/**
 * Top-3 dimension highlights (sorted by score, descending).
 * @param {Object} scores
 */
function topDimensions(scores) {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
}

/**
 * Build the Assessment Results email HTML.
 * @param {Object} vars
 */
function buildAssessmentResultsEmail(vars) {
  const {
    firstName       = 'Friend',
    overallScore    = 0,
    dominantDimension = 'Balanced',
    scores          = {},
    topInsight      = '',
    reportLink      = `${APP_URL}/results`,
    retakeLink      = `${APP_URL}/quiz.html`,
    assessmentDate  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    unsubscribeUrl,
  } = vars;

  const badgeColor = scoreBadgeColor(overallScore);
  const top3 = topDimensions(scores);

  const dimensionRows = Object.entries(scores)
    .map(([dim, score]) => {
      const color = DIMENSION_COLORS[dim] || COLORS.primary;
      const label = dim.charAt(0).toUpperCase() + dim.slice(1);
      return progressBar(label, score, color);
    })
    .join('');

  const top3Cards = top3
    .map(([dim, score]) => {
      const color = DIMENSION_COLORS[dim] || COLORS.primary;
      const label = dim.charAt(0).toUpperCase() + dim.slice(1);
      return `
        <td style="width: 33%; padding: 0 6px; vertical-align: top;">
          <div style="background: ${color}15; border: 1px solid ${color}40; border-radius: 10px;
                      padding: 16px 12px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 22px; font-weight: 800; color: ${color};">${Math.round(score)}%</p>
            <p style="margin: 0; font-size: 12px; font-weight: 600; color: ${COLORS.text};">${label}</p>
          </div>
        </td>`;
    })
    .join('');

  const insightBlock = topInsight
    ? `<div style="background: ${COLORS.accentLight}; border-left: 4px solid ${COLORS.accent};
                   border-radius: 0 8px 8px 0; padding: 16px 20px; margin: 24px 0;">
         <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${COLORS.text};">
           <strong>Key Insight:</strong> ${topInsight}
         </p>
       </div>`
    : '';

  const body = `
    <!-- Greeting -->
    <h2 style="margin: 0 0 4px; font-size: 24px; color: ${COLORS.text};">
      Hello, ${firstName}! &#127775;
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; color: ${COLORS.textMuted};">
      Completed on ${assessmentDate}
    </p>

    <!-- Overall score badge -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: ${badgeColor}15; border: 2px solid ${badgeColor}; border-radius: 12px;
                    padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 1px;">
            Overall Resilience Score
          </p>
          <p style="margin: 8px 0 4px; font-size: 56px; font-weight: 900; color: ${badgeColor}; line-height: 1;">
            ${Math.round(overallScore)}%
          </p>
          <p style="margin: 0; font-size: 14px; color: ${COLORS.text}; font-weight: 600;">
            Dominant Dimension: <span style="color: ${badgeColor};">${dominantDimension}</span>
          </p>
        </td>
      </tr>
    </table>

    <!-- Top 3 dimensions -->
    <h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">
      &#9733; Your Top 3 Dimensions
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr style="margin: 0 -6px;">${top3Cards}</tr>
    </table>

    <!-- Key insight -->
    ${insightBlock}

    <!-- All dimension scores -->
    <h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">
      &#128200; Full Dimension Breakdown
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      ${dimensionRows}
    </table>

    <!-- CTAs -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
      <tr>
        <td align="center" style="padding: 4px 8px;">
          ${ctaButton(reportLink, '&#128196; View Full Report', COLORS.primary)}
        </td>
        <td align="center" style="padding: 4px 8px;">
          ${ctaButton(retakeLink, '&#128260; Retake Assessment', COLORS.accent)}
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; font-size: 13px; color: ${COLORS.textMuted}; text-align: center;">
      Questions? Reply to this email — we'd love to hear from you.
    </p>`;

  return {
    subject: `Your Resilience Assessment Results — ${Math.round(overallScore)}% Overall`,
    html: wrapEmail(body, 'Your Assessment Results', unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const { firstName, overallScore, dominantDimension, scores, topInsight, reportLink, retakeLink } = vars;
  const lines = [
    'The Resilience Atlas™ — Assessment Results',
    '==========================================',
    '',
    `Hello, ${firstName || 'Friend'}!`,
    '',
    `Overall Resilience Score: ${Math.round(overallScore || 0)}%`,
    `Dominant Dimension: ${dominantDimension || 'Balanced'}`,
    '',
    'Dimension Breakdown:',
  ];
  Object.entries(scores || {}).forEach(([dim, score]) => {
    lines.push(`  ${dim.charAt(0).toUpperCase() + dim.slice(1)}: ${Math.round(score)}%`);
  });
  if (topInsight) { lines.push('', `Key Insight: ${topInsight}`); }
  lines.push(
    '',
    `View Full Report: ${reportLink || ''}`,
    `Retake Assessment: ${retakeLink || ''}`,
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  );
  return lines.join('\n');
}

module.exports = { buildAssessmentResultsEmail };
