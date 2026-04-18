'use strict';

const {
  mapPurchaseTierToPlanTier,
  resolvePlanTierFromPurchases,
} = require('../backend/utils/microPracticeTier');

describe('microPracticeTier utils', () => {
  test('maps starter/free-style tiers to starter plan tier', () => {
    expect(mapPurchaseTierToPlanTier('atlas-starter')).toBe('starter');
    expect(mapPurchaseTierToPlanTier('starter')).toBe('starter');
    expect(mapPurchaseTierToPlanTier('unknown-tier')).toBe('starter');
  });

  test('maps navigator/pro tiers to paid plan tier', () => {
    expect(mapPurchaseTierToPlanTier('atlas-navigator')).toBe('paid');
    expect(mapPurchaseTierToPlanTier('pro')).toBe('paid');
    expect(mapPurchaseTierToPlanTier('teams-pro')).toBe('paid');
  });

  test('maps premium/enterprise tiers to full plan tier', () => {
    expect(mapPurchaseTierToPlanTier('atlas-premium')).toBe('full');
    expect(mapPurchaseTierToPlanTier('enterprise')).toBe('full');
    expect(mapPurchaseTierToPlanTier('teams-enterprise')).toBe('full');
  });

  test('resolves purchases to highest matching plan tier', () => {
    expect(resolvePlanTierFromPurchases([])).toBe('starter');
    expect(resolvePlanTierFromPurchases([{ tier: 'atlas-starter' }])).toBe('starter');
    expect(resolvePlanTierFromPurchases([{ tier: 'atlas-starter' }, { tier: 'atlas-navigator' }])).toBe('paid');
    expect(resolvePlanTierFromPurchases([{ tier: 'pro' }, { tier: 'atlas-premium' }])).toBe('full');
  });
});
