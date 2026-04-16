/**
 * Canonical Teams plan definitions.
 *
 * Single source of truth for plan names, prices, feature lists, and CTA
 * behaviour used by TeamsLandingPage.jsx and PricingTeamsPage.jsx.
 *
 * key        – backend tier sent to /api/payments/checkout
 * cta        – 'checkout' (starter/pro) | 'contact' (enterprise)
 * features   – HTML strings; render with dangerouslySetInnerHTML
 */

export const TEAM_PLANS = [
  {
    key: 'starter',
    name: 'Atlas Team Basic',
    price: '$299',
    priceLabel: 'one-time',
    priceIsStartingAt: false,
    description: 'Perfect for small teams starting their resilience journey.',
    badge: null,
    featured: false,
    icon: 'icons/games/tier-starter.svg',
    ctaLabel: 'Get Started — $299 one-time',
    cta: 'checkout',
    features: [
      'Up to 15 users | 1 team',
      '<strong>Gamifications:</strong> Personal &amp; team badges, streaks, milestones',
      '<strong>Team Tracking:</strong> Leaderboards, progress dashboards, member dashboards',
      'Team dashboard &amp; aggregated radar chart',
      'Self-service CSV &amp; PDF export',
      'Bulk email invitations',
      'Download all your data anytime',
    ],
  },
  {
    key: 'pro',
    name: 'Atlas Team Premium',
    price: '$699',
    priceLabel: 'one-time',
    priceIsStartingAt: false,
    description: 'For growing organizations with multiple teams and deeper analytics needs.',
    badge: { text: 'Most Popular', variant: 'blue' },
    featured: true,
    icon: 'icons/games/tier-team.svg',
    ctaLabel: 'Get Started — $699 one-time',
    cta: 'checkout',
    features: [
      'Up to 30 users | Multiple teams',
      '<strong>Enhanced Gamifications:</strong> Advanced team challenges, achievement tracking',
      '<strong>Advanced Leaderboards:</strong> Multi-team comparisons, dimension breakdowns',
      '<strong>Manager Dashboards:</strong> Detailed team member progress tracking',
      'Advanced analytics (downloadable)',
      'Auto-generated team reports (PDF)',
      'Facilitation tools &amp; resource library (30+ guides)',
      'Self-service team management',
    ],
  },
  {
    key: 'enterprise',
    name: 'Atlas Enterprise',
    price: 'Starting at $2,499',
    priceLabel: null,
    priceIsStartingAt: true,
    description:
      'Built for large organizations who want full control. Self-manage your team, branding, authentication, and data \u2014 no white-glove setup or support required.',
    badge: { text: 'Enterprise', variant: 'slate' },
    featured: false,
    icon: 'icons/games/tier-enterprise.svg',
    ctaLabel: 'Contact Sales',
    cta: 'contact',
    features: [
      'Unlimited users &amp; teams',
      '<strong>Full Gamification Suite:</strong> Custom badges, unlimited challenges, org-wide leaderboards',
      '<strong>Enterprise Tracking:</strong> Advanced manager/admin dashboards, up-to-date analytics dashboard',
      'Org-managed branding (logos, colors)',
      'SSO/SAML available \u2014 enabled on request',
      'Self-service data export \u2014 download your org\u2019s data anytime',
      'Self-custody: export and own all your org\u2019s assessment data and reports',
    ],
  },
];
