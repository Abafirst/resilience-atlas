'use strict';

/**
 * streakMilestone.js — Sent when a user hits a 7, 30, or 100-day streak.
 *
 * Variables:
 *   firstName          {string}
 *   streakDays         {number}   e.g. 7, 30, 100
 *   practicesCompleted {number}
 *   impactStatement    {string}   "You've strengthened your Emotional resilience by 12%"
 *   nextPractice       {string}   Suggested next practice title
 *   nextPracticeLink   {string}
 *   dashboardLink      {string}
 *   unsubscribeUrl     {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

/* Badge config per milestone */
const BADGE_CONFIG = {
  7:   { emoji: '&#127942;', label: '7-Day Streak',   color: '#27ae60', title: 'One Week Strong!' },
  30:  { emoji: '&#128293;', label: '30-Day Streak',  color: '#e67e22', title: 'One Month of Momentum!' },
  100: { emoji: '&#127775;', label: '100-Day Streak', color: '#9b59b6', title: 'Century Achiever!' },
};

function getBadge(days) {
  return BADGE_CONFIG[days] || {
    emoji: '&#127941;',
    label: `${days}-Day Streak`,
    color: COLORS.primary,
    title: `${days}-Day Milestone!`,
  };
}

function buildStreakMilestoneEmail(vars) {
  const {
    firstName          = 'Friend',
    streakDays         = 7,
    practicesCompleted = 0,
    impactStatement    = '',
    nextPractice       = '',
    nextPracticeLink   = `${APP_URL}/resources`,
    dashboardLink      = `${APP_URL}/dashboard`,
    unsubscribeUrl,
  } = vars;

  const badge = getBadge(streakDays);

  const nextPracticeBlock = nextPractice
    ? `<div style="background: ${COLORS.accentLight}; border-radius: 10px; padding: 20px 24px; margin: 24px 0;">
         <p style="margin: 0 0 6px; font-size: 13px; color: ${COLORS.textMuted}; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
           Suggested Next Practice
         </p>
         <p style="margin: 0 0 14px; font-size: 16px; font-weight: 700; color: ${COLORS.text};">
           &#127919; ${nextPractice}
         </p>
         ${ctaButton(nextPracticeLink, '&#9654;&#65039; Start Practice', COLORS.accent)}
       </div>`
    : '';

  const impactBlock = impactStatement
    ? `<div style="background: ${badge.color}15; border-left: 4px solid ${badge.color};
                   border-radius: 0 8px 8px 0; padding: 14px 20px; margin: 20px 0;">
         <p style="margin: 0; font-size: 15px; color: ${COLORS.text}; line-height: 1.5;">
           &#128200; ${impactStatement}
         </p>
       </div>`
    : '';

  const body = `
    <!-- Badge hero -->
    <div style="text-align: center; background: linear-gradient(135deg, ${badge.color}20, ${badge.color}08);
                border: 2px solid ${badge.color}; border-radius: 16px; padding: 36px 24px; margin-bottom: 28px;">
      <p style="margin: 0 0 8px; font-size: 64px; line-height: 1;">${badge.emoji}</p>
      <p style="margin: 0 0 4px; font-size: 11px; letter-spacing: 2px; font-weight: 700;
                color: ${badge.color}; text-transform: uppercase;">
        Achievement Unlocked
      </p>
      <h2 style="margin: 0 0 4px; font-size: 28px; font-weight: 900; color: ${COLORS.text};">
        ${badge.title}
      </h2>
      <p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted};">
        <strong>${badge.label}</strong> — Keep it going, ${firstName}!
      </p>
    </div>

    <!-- Stats row -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="width: 50%; padding: 0 6px 0 0; vertical-align: top;">
          <div style="background: ${COLORS.bgPage}; border-radius: 10px; padding: 20px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 36px; font-weight: 900; color: ${badge.color};">
              ${streakDays}
            </p>
            <p style="margin: 0; font-size: 12px; color: ${COLORS.textMuted}; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Day Streak
            </p>
          </div>
        </td>
        <td style="width: 50%; padding: 0 0 0 6px; vertical-align: top;">
          <div style="background: ${COLORS.bgPage}; border-radius: 10px; padding: 20px; text-align: center;">
            <p style="margin: 0 0 4px; font-size: 36px; font-weight: 900; color: ${COLORS.primary};">
              ${practicesCompleted}
            </p>
            <p style="margin: 0; font-size: 12px; color: ${COLORS.textMuted}; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
              Practices Done
            </p>
          </div>
        </td>
      </tr>
    </table>

    ${impactBlock}
    ${nextPracticeBlock}

    <div style="text-align: center;">
      ${ctaButton(dashboardLink, '&#128196; View Your Dashboard', COLORS.primary)}
    </div>`;

  return {
    subject: `🎉 You've hit a ${streakDays}-day streak, ${firstName}! Keep it up!`,
    html: wrapEmail(body, `${streakDays}-Day Streak Milestone`, unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const { firstName, streakDays, practicesCompleted, impactStatement, nextPractice, dashboardLink } = vars;
  const badge = getBadge(streakDays || 7);
  const lines = [
    'The Resilience Atlas™ — Streak Milestone!',
    '==========================================',
    '',
    `Congratulations, ${firstName || 'Friend'}!`,
    '',
    `Achievement Unlocked: ${badge.label}`,
    badge.title,
    '',
    `Current streak: ${streakDays || 0} days`,
    `Practices completed: ${practicesCompleted || 0}`,
  ];
  if (impactStatement) { lines.push('', impactStatement); }
  if (nextPractice) { lines.push('', `Suggested next practice: ${nextPractice}`); }
  lines.push(
    '',
    `View your dashboard: ${dashboardLink || ''}`,
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  );
  return lines.join('\n');
}

module.exports = { buildStreakMilestoneEmail };
