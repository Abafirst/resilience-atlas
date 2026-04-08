'use strict';

/**
 * welcome.js — First-time user welcome email.
 *
 * Variables:
 *   firstName       {string}
 *   startQuizLink   {string}
 *   resourcesLink   {string}
 *   unsubscribeUrl  {string}
 */

const { COLORS, ctaButton, wrapEmail } = require('./base');

const APP_URL = process.env.APP_URL || 'https://resilience-atlas.app';

function buildWelcomeEmail(vars) {
  const {
    firstName     = 'Friend',
    startQuizLink = `${APP_URL}/quiz`,
    resourcesLink = `${APP_URL}/resources`,
    unsubscribeUrl,
  } = vars;

  const faqItems = [
    {
      q: 'How long does the assessment take?',
      a: 'Most people complete it in 12–15 minutes.',
    },
    {
      q: 'What dimensions are measured?',
      a: 'Emotional, Mental, Physical, Social, Spiritual, and Financial resilience.',
    },
    {
      q: 'Will my data be kept private?',
      a: 'Absolutely. Your results are confidential and never shared without your consent.',
    },
    {
      q: 'Can I retake the assessment?',
      a: 'Yes! We recommend retaking it every 90 days to track your growth.',
    },
  ];

  const faqHtml = faqItems
    .map(({ q, a }) => `
      <div style="border-bottom: 1px solid ${COLORS.border}; padding: 14px 0;">
        <p style="margin: 0 0 6px; font-size: 14px; font-weight: 700; color: ${COLORS.primaryDark};">
          &#10067; ${q}
        </p>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.text}; line-height: 1.5;">${a}</p>
      </div>`)
    .join('');

  const stepItems = [
    { icon: '&#128196;', text: 'Answer 60 science-backed questions' },
    { icon: '&#128200;', text: 'Receive your personalized Resilience Score' },
    { icon: '&#128161;', text: 'Get dimension-by-dimension insights' },
    { icon: '&#127919;', text: 'Download your Full Resilience Report' },
  ];

  const stepsHtml = stepItems
    .map(({ icon, text }, i) => `
      <tr>
        <td style="padding: 10px 0; vertical-align: top;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="width: 40px; font-size: 22px; vertical-align: top;">${icon}</td>
              <td style="vertical-align: top;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: ${COLORS.text};">
                  <strong>Step ${i + 1}:</strong> ${text}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`)
    .join('');

  const body = `
    <!-- Welcome hero -->
    <h2 style="margin: 0 0 12px; font-size: 26px; color: ${COLORS.text};">
      Welcome, ${firstName}! &#127881;
    </h2>
    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: ${COLORS.text};">
      I'm <strong>Janeen Molchany</strong>, and I'm thrilled to have you here. The Resilience Atlas&#8482;
      was built to help you understand, measure, and grow your personal resilience across six key
      dimensions of life.
    </p>

    <!-- What to expect -->
    <div style="background: ${COLORS.accentLight}; border-radius: 10px; padding: 24px; margin-bottom: 28px;">
      <h3 style="margin: 0 0 14px; font-size: 16px; color: ${COLORS.primaryDark};">
        &#128336; What to Expect
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${stepsHtml}
      </table>
      <p style="margin: 14px 0 0; font-size: 13px; color: ${COLORS.textMuted};">
        &#8987; Estimated time: <strong>12–15 minutes</strong>
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align: center; margin-bottom: 32px;">
      ${ctaButton(startQuizLink, '&#9654;&#65039; Start Your Assessment', COLORS.primary)}
    </div>

    <!-- FAQ -->
    <h3 style="margin: 0 0 4px; font-size: 16px; color: ${COLORS.text};">
      &#10024; Frequently Asked Questions
    </h3>
    <div style="margin-bottom: 24px;">${faqHtml}</div>

    <!-- Resources -->
    <p style="margin: 0; font-size: 14px; color: ${COLORS.textMuted}; text-align: center;">
      Want to learn more before you start?
      <a href="${resourcesLink}" style="color: ${COLORS.accent}; font-weight: 600;">Browse our resources &#8594;</a>
    </p>`;

  return {
    subject: `Welcome to The Resilience Atlas™, ${firstName}!`,
    html: wrapEmail(body, 'Welcome to The Resilience Atlas™', unsubscribeUrl),
    text: buildPlainText(vars),
  };
}

function buildPlainText(vars) {
  const { firstName, startQuizLink, resourcesLink } = vars;
  return [
    'The Resilience Atlas™ — Welcome!',
    '=================================',
    '',
    `Hello, ${firstName || 'Friend'}!`,
    '',
    'I\'m Janeen Molchany, and I\'m thrilled to have you here.',
    'The Resilience Atlas™ helps you measure and grow your resilience across 6 dimensions.',
    '',
    'What to expect:',
    '  1. Answer 60 science-backed questions',
    '  2. Receive your personalized Resilience Score',
    '  3. Get dimension-by-dimension insights',
    '  4. Download your Full Resilience Report',
    '',
    'Estimated time: 12–15 minutes',
    '',
    `Start your assessment: ${startQuizLink || ''}`,
    `Browse resources: ${resourcesLink || ''}`,
    '',
    '──────────────────────────────────────────',
    '© The Resilience Atlas™',
  ].join('\n');
}

module.exports = { buildWelcomeEmail };
