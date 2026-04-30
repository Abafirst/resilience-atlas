'use strict';

/**
 * progressCircleInvitation.js — Sent when a stakeholder is invited to a
 * child's Progress Circle.
 *
 * Variables:
 *   inviteeName      {string}  Recipient's name
 *   inviterName      {string}  Name of the person who sent the invite
 *   childName        {string}  Child's first name
 *   circleName       {string}  Name of the Progress Circle
 *   role             {string}  Recipient's role (e.g. "Teacher", "SLP")
 *   invitationLink   {string}  Accept link
 *   expiryDays       {number}  Default 7
 *   unsubscribeUrl   {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

function buildProgressCircleInvitationEmail(vars) {
  const {
    inviteeName    = 'Friend',
    inviterName    = 'A parent',
    childName      = 'a child',
    circleName     = "Child's Support Circle",
    role           = 'team member',
    invitationLink = `${APP_URL}/iatlas/circles`,
    expiryDays     = 7,
    unsubscribeUrl,
  } = vars;

  const body = `
    <!-- Hero -->
    <div style="text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 6px; font-size: 40px;">🌱</p>
      <h2 style="margin: 0 0 8px; font-size: 24px; color: ${COLORS.text};">
        You're Invited, ${inviteeName}!
      </h2>
      <p style="margin: 0; font-size: 15px; color: ${COLORS.textMuted};">
        <strong>${inviterName}</strong> has invited you to join
        <strong>${childName}'s</strong> support circle as a
        <strong>${role}</strong>.
      </p>
    </div>

    <!-- Circle info -->
    <div style="background: ${COLORS.accentLight}; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: 700; color: ${COLORS.primaryDark};">
        🔵 Circle: ${circleName}
      </p>
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: ${COLORS.text};">
        As a <strong>${role}</strong>, you'll be able to view ${childName}'s resilience
        progress, log activities from your setting, and collaborate with the rest of
        the care team — all within a privacy-controlled shared workspace.
      </p>
    </div>

    <!-- Privacy note -->
    <div style="border-left: 3px solid ${COLORS.primary}; padding: 12px 16px; margin: 0 0 24px; background: #f8fafc;">
      <p style="margin: 0; font-size: 13px; color: ${COLORS.text}; line-height: 1.5;">
        🔒 <strong>Privacy protected:</strong> Data is only shared within
        this circle. The parent/guardian controls exactly what each team
        member can see.
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 28px;">
      ${ctaButton(invitationLink, '✓ Accept Invitation', COLORS.primary)}
      <p style="margin: 12px 0 0; font-size: 12px; color: ${COLORS.textMuted};">
        Or paste this link in your browser:<br/>
        <a href="${invitationLink}" style="color: ${COLORS.accent}; word-break: break-all;">
          ${invitationLink}
        </a>
      </p>
      <p style="margin: 8px 0 0; font-size: 12px; color: ${COLORS.textMuted};">
        This invitation expires in ${expiryDays} day${expiryDays !== 1 ? 's' : ''}.
      </p>
    </div>`;

  return {
    subject: `You're invited to join ${childName}'s Support Circle on The Resilience Atlas™`,
    html: wrapEmail(body, `Progress Circle Invitation — ${circleName}`, unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const {
    inviteeName  = 'Friend',
    inviterName  = 'A parent',
    childName    = 'a child',
    circleName,
    role         = 'team member',
    invitationLink = '',
    expiryDays   = 7,
  } = vars;
  return [
    `The Resilience Atlas™ — Progress Circle Invitation`,
    '====================================================',
    '',
    `Hello, ${inviteeName}!`,
    '',
    `${inviterName} has invited you to join ${childName}'s support circle as a ${role}.`,
    circleName ? `Circle: ${circleName}` : '',
    '',
    `Accept Invitation: ${invitationLink}`,
    '',
    `This invitation expires in ${expiryDays} days.`,
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  ].filter((line) => line !== undefined).join('\n');
}

module.exports = { buildProgressCircleInvitationEmail };
