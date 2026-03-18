'use strict';

/**
 * Email template: welcome email sent to a newly referred user.
 *
 * Variables:
 *   name          – referred user's display name / username
 *   referrerName  – the person who sent the invite
 *   discountPct   – discount percentage on first purchase
 *   ctaUrl        – link to start the assessment
 */
function referralWelcome({ name, referrerName, discountPct = 15, ctaUrl = 'https://resilience-atlas.app' }) {
  const subject = `${referrerName} invited you – enjoy ${discountPct}% off your first assessment!`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f4f7f6; margin: 0; padding: 0; }
  .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
  .header { background: linear-gradient(135deg, #2d6a4f, #40916c); padding: 40px 32px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 26px; letter-spacing: -0.5px; }
  .header p  { color: #b7e4c7; margin: 8px 0 0; font-size: 15px; }
  .body  { padding: 36px 32px; color: #2d3748; }
  .body h2   { font-size: 20px; margin-bottom: 12px; }
  .body p    { line-height: 1.7; margin-bottom: 16px; }
  .badge { display: inline-block; background: #d8f3dc; color: #1b4332; font-weight: 700; font-size: 22px; border-radius: 8px; padding: 12px 28px; margin: 20px 0; }
  .cta-btn { display: inline-block; background: #40916c; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px; padding: 14px 36px; margin-top: 24px; }
  .footer { background: #f0fdf4; padding: 20px 32px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #d1fae5; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🌱 Welcome to Resilience Atlas</h1>
    <p>You were invited by ${referrerName}</p>
  </div>
  <div class="body">
    <h2>Hi ${name},</h2>
    <p>
      Your friend <strong>${referrerName}</strong> thought you'd love Resilience Atlas – a science-backed
      platform to measure and build your personal resilience across 6 key dimensions.
    </p>
    <p>As a welcome gift, you get:</p>
    <div class="badge">🎁 ${discountPct}% off your first assessment</div>
    <p>
      Your discount is automatically applied at checkout. Take the free quiz first to see your resilience
      profile, then unlock the deep-dive report at a special price.
    </p>
    <a href="${ctaUrl}" class="cta-btn">Start Your Free Assessment →</a>
    <p style="margin-top:32px; font-size:14px; color:#6b7280;">
      Your friend ${referrerName} also earns credits when you complete your purchase –
      it's a win-win! 🎉
    </p>
  </div>
  <div class="footer">
    Resilience Atlas · <a href="https://resilience-atlas.app">resilience-atlas.app</a><br/>
    Questions? Reply to this email – we're here to help.
  </div>
</div>
</body>
</html>`;

  const text = `Hi ${name},\n\n${referrerName} invited you to Resilience Atlas!\n\nYou get ${discountPct}% off your first assessment. Start here: ${ctaUrl}\n\nResilience Atlas`;

  return { subject, html, text };
}

module.exports = { referralWelcome };
