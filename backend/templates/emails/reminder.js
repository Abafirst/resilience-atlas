'use strict';

/**
 * reminder.js — 90-day reassessment reminder email.
 *
 * Variables:
 *   firstName         {string}
 *   previousScore     {number}   0-100
 *   previousDate      {string}   Formatted date of last assessment
 *   growthAreas       {string[]} Dimensions to highlight for growth
 *   retakeLink        {string}
 *   specialOffer      {string}   Optional promo text (e.g. "20% off Premium")
 *   offerLink         {string}
 *   daysSince         {number}   Days since last assessment
 *   unsubscribeUrl    {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

function buildReminderEmail(vars) {
  const {
    firstName    = 'Friend',
    previousScore = 0,
    previousDate  = '',
    growthAreas   = [],
    retakeLink    = `${APP_URL}/quiz`,
    specialOffer  = '',
    offerLink     = `${APP_URL}/upgrade.html`,
    daysSince     = 90,
    unsubscribeUrl,
  } = vars;

  const growthAreaItems = (growthAreas || []).slice(0, 3)
    .map(area => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid ${COLORS.border};">
          <span style="display: inline-block; background: ${COLORS.accentLight}; border-radius: 6px;
                       padding: 4px 12px; font-size: 13px; color: ${COLORS.primary}; font-weight: 600;">
            &#127919; ${area}
          </span>
        </td>
      </tr>`)
    .join('');

  const growthBlock = growthAreaItems
    ? `<h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">
         &#128200; Your Growth Opportunities
       </h3>
       <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
         ${growthAreaItems}
       </table>`
    : '';

  const offerBlock = specialOffer
    ? `<div style="background: linear-gradient(135deg, #e8f5e9, #f1f8e9); border: 1px solid ${COLORS.success};
                   border-radius: 10px; padding: 20px 24px; margin: 24px 0; text-align: center;">
         <p style="margin: 0 0 8px; font-size: 16px; font-weight: 800; color: ${COLORS.success};">
           &#127873; Special Offer: ${specialOffer}
         </p>
         <p style="margin: 0 0 14px; font-size: 14px; color: ${COLORS.text};">
           Celebrate your growth journey with an exclusive discount.
         </p>
         ${ctaButton(offerLink, 'Claim Your Offer', COLORS.success)}
       </div>`
    : '';

  const prevBlock = previousScore
    ? `<div style="background: ${COLORS.bgPage}; border: 1px solid ${COLORS.border}; border-radius: 10px;
                   padding: 16px 24px; margin: 0 0 24px; text-align: center;">
         <p style="margin: 0 0 4px; font-size: 13px; color: ${COLORS.textMuted};">
           Your last score ${previousDate ? `(${previousDate})` : ''}
         </p>
         <p style="margin: 0; font-size: 36px; font-weight: 900; color: ${COLORS.primary};">
           ${Math.round(previousScore)}%
         </p>
       </div>`
    : '';

  const body = `
    <!-- Hero -->
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 4px; font-size: 48px;">&#127775;</p>
      <h2 style="margin: 0 0 8px; font-size: 24px; color: ${COLORS.text};">
        Time to Measure Your Growth, ${firstName}!
      </h2>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.textMuted};">
        It's been <strong>${daysSince} days</strong> since your last assessment.
        A lot can change — let's find out how much you've grown!
      </p>
    </div>

    ${prevBlock}
    ${growthBlock}

    <!-- Why retake -->
    <div style="background: ${COLORS.accentLight}; border-radius: 10px; padding: 20px 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 10px; font-size: 15px; color: ${COLORS.primaryDark};">
        &#10067; Why Retake the Assessment?
      </h3>
      <ul style="margin: 0; padding-left: 18px;">
        <li style="font-size: 14px; color: ${COLORS.text}; margin-bottom: 6px; line-height: 1.5;">
          Track how life changes affect your resilience
        </li>
        <li style="font-size: 14px; color: ${COLORS.text}; margin-bottom: 6px; line-height: 1.5;">
          Celebrate the areas where you've grown
        </li>
        <li style="font-size: 14px; color: ${COLORS.text}; margin-bottom: 6px; line-height: 1.5;">
          Identify new focus areas for the next 90 days
        </li>
        <li style="font-size: 14px; color: ${COLORS.text}; margin-bottom: 0; line-height: 1.5;">
          Generate an updated report for comparison
        </li>
      </ul>
    </div>

    <div style="text-align: center; margin-bottom: 24px;">
      ${ctaButton(retakeLink, '&#128260; Retake Now — 12 Minutes', COLORS.primary)}
    </div>

    ${offerBlock}`;

  return {
    subject: `${firstName}, it's time to measure your resilience growth! ✨`,
    html: wrapEmail(body, 'Time to Grow', unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const { firstName, previousScore, previousDate, daysSince = 90, retakeLink, specialOffer } = vars;
  const lines = [
    'The Resilience Atlas™ — Time to Grow!',
    '======================================',
    '',
    `Hello, ${firstName || 'Friend'}!`,
    '',
    `It's been ${daysSince} days since your last assessment.`,
  ];
  if (previousScore) {
    lines.push(`Your last score${previousDate ? ` (${previousDate})` : ''}: ${Math.round(previousScore)}%`);
  }
  lines.push(
    '',
    'Ready to see how much you\'ve grown? Retake in just 12 minutes.',
    '',
    `Retake Now: ${retakeLink || ''}`,
  );
  if (specialOffer) { lines.push('', `Special Offer: ${specialOffer}`); }
  lines.push(
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  );
  return lines.join('\n');
}

module.exports = { buildReminderEmail };
