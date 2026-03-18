'use strict';

/**
 * teamInvitation.js — Sent when a user is invited to a team assessment.
 *
 * Variables:
 *   inviteeName        {string}
 *   organizationName   {string}
 *   inviterName        {string}
 *   invitationLink     {string}
 *   teamContext        {string}  A sentence about what this team is doing
 *   expiryDays         {number}  Default 7
 *   unsubscribeUrl     {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

function buildTeamInvitationEmail(vars) {
  const {
    inviteeName      = 'Friend',
    organizationName = 'Your Organization',
    inviterName      = '',
    invitationLink   = `${APP_URL}/join.html`,
    teamContext      = '',
    expiryDays       = 7,
    unsubscribeUrl,
  } = vars;

  const contextBlock = teamContext
    ? `<div style="background: ${COLORS.accentLight}; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
         <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.text};">
           &#128172; ${teamContext}
         </p>
       </div>`
    : '';

  const faqItems = [
    {
      q: 'How long does the assessment take?',
      a: 'About 12–15 minutes.',
    },
    {
      q: 'Will my individual results be shared?',
      a: 'Only aggregated team scores are shared with team leaders — your personal results remain private.',
    },
    {
      q: 'What do the results show?',
      a: 'You\'ll see your own scores across 6 resilience dimensions plus a team benchmark.',
    },
  ];

  const faqHtml = faqItems
    .map(({ q, a }) => `
      <div style="padding: 12px 0; border-bottom: 1px solid ${COLORS.border};">
        <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: ${COLORS.primaryDark};">
          &#10067; ${q}
        </p>
        <p style="margin: 0; font-size: 13px; color: ${COLORS.text}; line-height: 1.5;">${a}</p>
      </div>`)
    .join('');

  const whyBlock = `
    <h3 style="margin: 0 0 12px; font-size: 16px; color: ${COLORS.text};">
      &#128161; Why Resilience Matters for Teams
    </h3>
    <ul style="margin: 0 0 24px; padding-left: 18px;">
      <li style="font-size: 14px; color: ${COLORS.text}; margin-bottom: 6px; line-height: 1.5;">
        Teams with high resilience handle change <strong>40% more effectively</strong>
      </li>
      <li style="font-size: 14px; color: ${COLORS.text}; margin-bottom: 6px; line-height: 1.5;">
        Resilient team members report <strong>lower burnout</strong> and higher job satisfaction
      </li>
      <li style="font-size: 14px; color: ${COLORS.text}; margin-bottom: 6px; line-height: 1.5;">
        Understanding each other's resilience profiles <strong>builds empathy</strong>
      </li>
      <li style="font-size: 14px; color: ${COLORS.text}; margin-bottom: 0; line-height: 1.5;">
        Collective resilience data drives better leadership decisions
      </li>
    </ul>`;

  const body = `
    <!-- Hero -->
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 6px; font-size: 40px;">&#129309;</p>
      <h2 style="margin: 0 0 8px; font-size: 24px; color: ${COLORS.text};">
        You're Invited, ${inviteeName}!
      </h2>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.textMuted};">
        ${inviterName ? `<strong>${inviterName}</strong> from ` : ''}
        <strong>${organizationName}</strong> has invited you to their
        Resilience Journey on The Resilience Atlas&#8482;.
      </p>
    </div>

    ${contextBlock}
    ${whyBlock}

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 28px;">
      ${ctaButton(invitationLink, '&#10003; Accept Invitation', COLORS.primary)}
      <p style="margin: 12px 0 0; font-size: 12px; color: ${COLORS.textMuted};">
        Or paste this link in your browser:<br/>
        <a href="${invitationLink}" style="color: ${COLORS.accent}; word-break: break-all;">
          ${invitationLink}
        </a>
      </p>
      <p style="margin: 8px 0 0; font-size: 12px; color: ${COLORS.textMuted};">
        This invitation expires in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}.
      </p>
    </div>

    <!-- FAQ -->
    <h3 style="margin: 0 0 4px; font-size: 16px; color: ${COLORS.text};">
      &#10024; FAQ About Team Assessments
    </h3>
    <div>${faqHtml}</div>`;

  return {
    subject: `You're invited to ${organizationName}'s Resilience Journey on The Resilience Atlas™`,
    html: wrapEmail(body, `Team Invitation — ${organizationName}`, unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const { inviteeName, organizationName, inviterName, invitationLink, expiryDays = 7 } = vars;
  return [
    `The Resilience Atlas™ — Team Invitation`,
    '========================================',
    '',
    `Hello, ${inviteeName || 'Friend'}!`,
    '',
    `${inviterName ? `${inviterName} from ` : ''}${organizationName || 'Your Organization'} has invited you`,
    'to join their Resilience Journey on The Resilience Atlas™.',
    '',
    `Accept Invitation: ${invitationLink || ''}`,
    '',
    `Note: This invitation expires in ${expiryDays} days.`,
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  ].join('\n');
}

module.exports = { buildTeamInvitationEmail };
