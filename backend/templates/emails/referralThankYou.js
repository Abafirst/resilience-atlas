'use strict';

/**
 * Email template: thank-you sent to the referrer when their friend signs up.
 *
 * Variables:
 *   name          – referrer's display name / username
 *   friendName    – the new user who joined
 *   creditAmount  – credits added to referrer's balance
 *   totalCredits  – referrer's new total credit balance
 *   dashboardUrl  – link to the referral dashboard
 *   badge         – optional milestone badge name (e.g. "Referral Master")
 */
function referralThankYou({
  name,
  friendName,
  creditAmount = 10,
  totalCredits = 0,
  dashboardUrl = 'https://resilience-atlas.app/referral.html',
  badge = null,
}) {
  const badgeLine = badge
    ? `<p>🏆 You just unlocked the <strong>${badge}</strong> badge! Keep it up!</p>`
    : '';

  const subject = `${friendName} just joined Resilience Atlas! You earned $${creditAmount} in credits 🎉`;

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
  .header { background: linear-gradient(135deg, #1d4e89, #2e86de); padding: 40px 32px; text-align: center; }
  .header h1 { color: #ffffff; margin: 0; font-size: 26px; }
  .header p  { color: #bde0fe; margin: 8px 0 0; font-size: 15px; }
  .body  { padding: 36px 32px; color: #2d3748; }
  .body h2   { font-size: 20px; margin-bottom: 12px; }
  .body p    { line-height: 1.7; margin-bottom: 16px; }
  .credit-box { background: #eff6ff; border-left: 4px solid #2e86de; border-radius: 6px; padding: 16px 20px; margin: 20px 0; }
  .credit-box .amount { font-size: 32px; font-weight: 700; color: #1d4e89; }
  .credit-box .label  { font-size: 14px; color: #3b82f6; margin-top: 4px; }
  .cta-btn { display: inline-block; background: #2e86de; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 16px; border-radius: 8px; padding: 14px 36px; margin-top: 24px; }
  .footer { background: #eff6ff; padding: 20px 32px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #bfdbfe; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🎉 Referral Success!</h1>
    <p>${friendName} just joined using your link</p>
  </div>
  <div class="body">
    <h2>Great news, ${name}!</h2>
    <p>
      Your friend <strong>${friendName}</strong> just signed up to Resilience Atlas using your referral link.
      We've added <strong>$${creditAmount}</strong> in credits to your account.
    </p>
    <div class="credit-box">
      <div class="amount">$${totalCredits}</div>
      <div class="label">Your current credit balance</div>
    </div>
    ${badgeLine}
    <p>
      Keep sharing your link to earn more credits. Credits can be redeemed for premium features
      and report upgrades.
    </p>
    <a href="${dashboardUrl}" class="cta-btn">View Your Referral Dashboard →</a>
  </div>
  <div class="footer">
    Resilience Atlas · <a href="https://resilience-atlas.app">resilience-atlas.app</a>
  </div>
</div>
</body>
</html>`;

  const text = `Hi ${name},\n\n${friendName} just joined Resilience Atlas using your link!\n\nYou earned $${creditAmount} in credits. New balance: $${totalCredits}.\n\nView your dashboard: ${dashboardUrl}\n\nResilience Atlas`;

  return { subject, html, text };
}

module.exports = { referralThankYou };
