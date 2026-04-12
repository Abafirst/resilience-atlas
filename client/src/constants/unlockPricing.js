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
    description: 'Unlock this report only. Pay $9.99 each time you want to download a new report.',
    features: [
      'Full PDF report for this assessment',
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
    description: 'One-time $49.99 payment. Generate 1 full PDF report every 30 days, plus full gamification access.',
    features: [
      'PDF report: 1 every 30 days (per user)',
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
