/**
 * Shared pricing constants for the tiered assessment access control system.
 *
 * These mirror the values in backend/config/tiers.js and backend/routes/payments.js.
 * Update all three locations if prices change.
 */

export const UNLOCK_TIERS = [
  {
    tier:        'atlas-starter',
    name:        'Atlas Starter',
    price:       '$9.99',
    priceLabel:  'from $9.99',
    badge:       '1 Report',
    type:        'single-report',
    highlighted: false,
    description: 'Unlock this report only. Includes full PDF download + PDF email delivery for this assessment.',
    features: [
      'Full PDF report download for this assessment',
      'Email this full PDF report to your inbox',
      'Values-aligned micro-commitments',
      'Momentum tracking (flexible streaks)',
      'Barrier-buster planning',
      'Simple progress badges',
    ],
  },
  {
    tier:        'atlas-navigator',
    name:        'Atlas Navigator',
    price:       '$49.99',
    priceLabel:  'from $49.99',
    badge:       'Best Value',
    type:        'quota',
    highlighted: true,
    description: 'One-time $49.99 payment. Generate 1 full PDF report every 30 days with full PDF download + email delivery.',
    features: [
      'Full PDF report: 1 every 30 days (per user)',
      'Email each full PDF report to your inbox',
      'Skill paths across all 6 resilience dimensions',
      'Choice-based weekly quests',
      'Personalized reinforcement menu',
      'Return-to-practice plan',
      'Advanced progress dashboard',
    ],
  },
];

export const STARTER_PRICE_LABEL = '$9.99';
export const NAVIGATOR_PRICE_LABEL = '$49.99';
