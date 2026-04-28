'use strict';

/**
 * assessmentResults.js — Email sent when a user completes the quiz.
 *
 * Variables:
 *   firstName        {string}
 *   overallScore     {number}   0-100
 *   dominantDimension {string}
 *   scores           {Object}   { dim: number } or { dim: { percentage: number } } — both shapes are accepted
 *   topInsight       {string}   One key insight about the user's profile
 *   reportLink       {string}   URL to full online report
 *   retakeLink       {string}   URL to retake the assessment
 *   assessmentDate   {string}   Formatted date string
 *   unsubscribeUrl   {string}
 */

const { COLORS, DIMENSION_COLORS, progressBar, ctaButton, wrapEmail } = require('./base');
const { getSkillLevelLabel, getSkillLevelIcon, getSkillLevelColor } = require('../../utils/skillLevels');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

/**
 * Normalize a score value to a plain number.
 * Accepts either a plain number (legacy format) or an object with a
 * `.percentage` property (SPA format).  Returns 0 for anything else so
 * that templates never render NaN%.
 *
 * @param {number|{percentage: number}|*} val
 * @returns {number}
 */
function normalizeScore(val) {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (val && typeof val === 'object' && Number.isFinite(val.percentage)) return val.percentage;
  return 0;
}

/**
 * Skill badge color helper — uses skill level brand colors.
 * @param {number} score
 */
function skillBadgeColor(score) {
  return getSkillLevelColor(score);
}

/**
 * Top-3 dimension highlights (sorted by score, descending).
 * @param {Object} scores
 */
function topDimensions(scores) {
  return Object.entries(scores)
    .map(([dim, val]) => [dim, normalizeScore(val)])
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
    retakeLink      = `${APP_URL}/quiz`,
    assessmentDate  = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    unsubscribeUrl,
  } = vars;

  const overallSkillLabel = getSkillLevelLabel(overallScore);
  const overallSkillIcon = getSkillLevelIcon(overallScore);
  const badgeColor = skillBadgeColor(overallScore);
  const top3 = topDimensions(scores);

  const dimensionRows = Object.entries(scores)
    .map(([dim, val]) => {
      const score = normalizeScore(val);
      const color = getSkillLevelColor(score);
      const label = dim.charAt(0).toUpperCase() + dim.slice(1);
      const skillLabel = getSkillLevelLabel(score);
      const skillIcon = getSkillLevelIcon(score);
      // Build a skill-badge row instead of a progress bar with percentage
      return `
        <tr>
          <td style="padding: 6px 0; font-size: 13px; color: ${COLORS.text}; font-weight: 500;">
            ${label}
          </td>
          <td style="padding: 6px 0; text-align: right;">
            <span style="background: ${color}18; border: 1px solid ${color}50; border-radius: 12px;
                         padding: 3px 10px; font-size: 12px; font-weight: 600; color: ${color};">
              ${skillIcon} ${skillLabel}
            </span>
          </td>
        </tr>`;
    })
    .join('');

  const top3Cards = top3
    .map(([dim, score]) => {
      const color = getSkillLevelColor(score);
      const label = dim.charAt(0).toUpperCase() + dim.slice(1);
      const skillLabel = getSkillLevelLabel(score);
      const skillIcon = getSkillLevelIcon(score);
      return `
        <td style="width: 33%; padding: 0 6px; vertical-align: top;">
          <div style="background: ${color}15; border: 1px solid ${color}40; border-radius: 10px;
                      padding: 16px 12px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 22px; line-height: 1;">${skillIcon}</p>
            <p style="margin: 0 0 4px; font-size: 13px; font-weight: 800; color: ${color};">${skillLabel}</p>
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

    <!-- Resilience Landscape section -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: ${badgeColor}15; border: 2px solid ${badgeColor}; border-radius: 12px;
                    padding: 24px; text-align: center;">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: ${COLORS.textMuted}; text-transform: uppercase; letter-spacing: 1px;">
            Your Resilience Landscape
          </p>
          <p style="margin: 8px 0 4px; font-size: 48px; line-height: 1;">${overallSkillIcon}</p>
          <p style="margin: 4px 0; font-size: 22px; font-weight: 900; color: ${badgeColor}; line-height: 1.2;">
            ${overallSkillLabel}
          </p>
          <p style="margin: 8px 0 0; font-size: 13px; color: ${COLORS.text}; font-weight: 500;">
            Your resilience isn&apos;t a fixed number &mdash; it&apos;s a living pattern of capacities<br>
            you&apos;re actively building across all dimensions.
          </p>
          <p style="margin: 8px 0 0; font-size: 14px; color: ${COLORS.text}; font-weight: 600;">
            &#127775; Anchor Dimension: <span style="color: ${badgeColor};">${dominantDimension}</span>
          </p>
        </td>
      </tr>
    </table>

    <!-- Top 3 dimensions -->
    <h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">
      &#127775; Your Top 3 Developed Skills
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr style="margin: 0 -6px;">${top3Cards}</tr>
    </table>

    <!-- Key insight -->
    ${insightBlock}

    <!-- All dimension skill levels -->
    <h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">
      &#128200; Your Full Skills Landscape
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
    subject: `Your Resilience Assessment: ${overallSkillLabel} — ${dominantDimension} is Your Anchor`,
    html: wrapEmail(body, 'Your Assessment Results', unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const { firstName, overallScore, dominantDimension, scores, topInsight, reportLink, retakeLink } = vars;
  const overallSkillLabel = getSkillLevelLabel(overallScore || 0);
  const overallSkillIcon = getSkillLevelIcon(overallScore || 0);
  const lines = [
    'The Resilience Atlas™ — Assessment Results',
    '==========================================',
    '',
    `Hello, ${firstName || 'Friend'}!`,
    '',
    `Your Resilience Landscape: ${overallSkillIcon} ${overallSkillLabel}`,
    `Your Anchor Dimension: ${dominantDimension || 'Balanced'}`,
    '',
    `Your resilience isn't a fixed number — it's a living pattern of capacities`,
    `you're actively building across all dimensions.`,
    '',
    'Your Full Skills Landscape:',
  ];
  Object.entries(scores || {}).forEach(([dim, val]) => {
    const score = normalizeScore(val);
    const skillLabel = getSkillLevelLabel(score);
    const skillIcon = getSkillLevelIcon(score);
    lines.push(`  ${skillIcon} ${dim.charAt(0).toUpperCase() + dim.slice(1)}: ${skillLabel}`);
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
