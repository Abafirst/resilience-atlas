'use strict';

/**
 * growthMilestone.js — Sent when a user shows measurable improvement in a dimension.
 *
 * Variables:
 *   firstName          {string}
 *   dimension          {string}   e.g. "Emotional"
 *   previousScore      {number}   0-100
 *   currentScore       {number}   0-100
 *   growthPercentage   {number}   Absolute point increase
 *   whatHelped         {string}   Brief narrative of what contributed to growth
 *   nextOpportunity    {string}   Next growth dimension to focus on
 *   nextOpportunityScore {number}
 *   reportLink         {string}
 *   unsubscribeUrl     {string}
 */

const { COLORS, DIMENSION_COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

function buildGrowthMilestoneEmail(vars) {
  const {
    firstName             = 'Friend',
    dimension             = 'Resilience',
    previousScore         = 0,
    currentScore          = 0,
    growthPercentage      = 0,
    whatHelped            = '',
    nextOpportunity       = '',
    nextOpportunityScore  = 0,
    reportLink            = `${APP_URL}/results`,
    unsubscribeUrl,
  } = vars;

  const dimColor = DIMENSION_COLORS[dimension.toLowerCase()] || COLORS.primary;
  const growth   = Math.round(growthPercentage || (currentScore - previousScore));
  const growthPositive = growth >= 0;

  const whatHelpedBlock = whatHelped
    ? `<div style="background: ${dimColor}10; border-left: 4px solid ${dimColor};
                   border-radius: 0 8px 8px 0; padding: 14px 20px; margin: 0 0 24px;">
         <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: ${dimColor};
                    text-transform: uppercase; letter-spacing: 1px;">
           What Helped You Grow
         </p>
         <p style="margin: 0; font-size: 15px; color: ${COLORS.text}; line-height: 1.6;">
           ${whatHelped}
         </p>
       </div>`
    : '';

  const nextBlock = nextOpportunity
    ? `<div style="background: ${COLORS.bgPage}; border: 1px solid ${COLORS.border}; border-radius: 10px;
                   padding: 20px 24px; margin-bottom: 24px;">
         <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: ${COLORS.text};">
           &#127919; Next Growth Opportunity
         </p>
         <p style="margin: 0 0 4px; font-size: 18px; font-weight: 800; color: ${COLORS.primary};">
           ${nextOpportunity}
         </p>
         ${nextOpportunityScore
           ? `<p style="margin: 0; font-size: 13px; color: ${COLORS.textMuted};">
                Current score: ${Math.round(nextOpportunityScore)}% — great room to grow!
              </p>`
           : ''}
       </div>`
    : '';

  /* Score comparison bar */
  const maxScore = Math.max(previousScore, currentScore, 1);
  const prevWidth = Math.round((previousScore / 100) * 100);
  const currWidth = Math.round((currentScore / 100) * 100);

  const body = `
    <!-- Hero -->
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 6px; font-size: 52px;">&#127881;</p>
      <h2 style="margin: 0 0 8px; font-size: 26px; color: ${COLORS.text};">
        You've Grown in ${dimension}!
      </h2>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.textMuted};">
        Amazing work, ${firstName}. Your consistency is paying off.
      </p>
    </div>

    <!-- Score comparison -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="background: ${COLORS.bgPage}; border-radius: 12px; padding: 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <!-- Before -->
              <td style="width: 40%; text-align: center; vertical-align: middle;">
                <p style="margin: 0 0 4px; font-size: 11px; color: ${COLORS.textMuted};
                           text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Before</p>
                <p style="margin: 0; font-size: 40px; font-weight: 900; color: ${COLORS.textMuted};">
                  ${Math.round(previousScore)}%
                </p>
              </td>
              <!-- Arrow -->
              <td style="width: 20%; text-align: center; vertical-align: middle;">
                <p style="margin: 0; font-size: 28px; color: ${growthPositive ? COLORS.success : '#e74c3c'};">
                  ${growthPositive ? '&#8599;' : '&#8600;'}
                </p>
                <p style="margin: 0; font-size: 13px; font-weight: 800;
                           color: ${growthPositive ? COLORS.success : '#e74c3c'};">
                  ${growthPositive ? '+' : ''}${growth}pts
                </p>
              </td>
              <!-- After -->
              <td style="width: 40%; text-align: center; vertical-align: middle;">
                <p style="margin: 0 0 4px; font-size: 11px; color: ${dimColor};
                           text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Now</p>
                <p style="margin: 0; font-size: 40px; font-weight: 900; color: ${dimColor};">
                  ${Math.round(currentScore)}%
                </p>
              </td>
            </tr>
          </table>

          <!-- Progress bar comparison -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top: 16px;">
            <tr>
              <td style="padding-bottom: 6px;">
                <p style="margin: 0 0 3px; font-size: 11px; color: ${COLORS.textMuted};">Previous</p>
                <div style="background: ${COLORS.border}; border-radius: 6px; height: 8px;">
                  <div style="width: ${prevWidth}%; background: ${COLORS.textMuted}; height: 8px; border-radius: 6px;"></div>
                </div>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin: 0 0 3px; font-size: 11px; color: ${dimColor}; font-weight: 600;">Current</p>
                <div style="background: ${COLORS.border}; border-radius: 6px; height: 8px;">
                  <div style="width: ${currWidth}%; background: ${dimColor}; height: 8px; border-radius: 6px;"></div>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${whatHelpedBlock}
    ${nextBlock}

    <!-- CTA -->
    <div style="text-align: center;">
      ${ctaButton(reportLink, '&#128196; View Full Analysis', COLORS.primary)}
    </div>`;

  return {
    subject: `🌱 You've grown in ${dimension} Resilience, ${firstName}! See your progress`,
    html: wrapEmail(body, `Growth Milestone — ${dimension}`, unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const {
    firstName, dimension, previousScore, currentScore, growthPercentage,
    whatHelped, nextOpportunity, reportLink,
  } = vars;
  const growth = Math.round(growthPercentage || (currentScore - previousScore));
  const lines = [
    `The Resilience Atlas™ — You've Grown in ${dimension || 'Resilience'}!`,
    '=====================================================================',
    '',
    `Congratulations, ${firstName || 'Friend'}!`,
    '',
    `${dimension || 'Resilience'} Resilience Score:`,
    `  Before: ${Math.round(previousScore || 0)}%`,
    `  Now:    ${Math.round(currentScore || 0)}%`,
    `  Growth: ${growth >= 0 ? '+' : ''}${growth} points`,
  ];
  if (whatHelped) { lines.push('', `What helped: ${whatHelped}`); }
  if (nextOpportunity) { lines.push('', `Next growth opportunity: ${nextOpportunity}`); }
  lines.push(
    '',
    `View Full Analysis: ${reportLink || ''}`,
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  );
  return lines.join('\n');
}

module.exports = { buildGrowthMilestoneEmail };
