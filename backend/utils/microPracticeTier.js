'use strict';

const PAID_PLAN_TIERS = new Set([
  'atlas-navigator',
  'pro',
  'teams-pro',
]);

const FULL_PLAN_TIERS = new Set([
  'atlas-premium',
  'enterprise',
  'teams-enterprise',
]);

function mapPurchaseTierToPlanTier(purchaseTier) {
  if (FULL_PLAN_TIERS.has(purchaseTier)) return 'full';
  if (PAID_PLAN_TIERS.has(purchaseTier)) return 'paid';
  return 'starter';
}

function resolvePlanTierFromPurchases(purchases) {
  let resolved = 'starter';
  for (const purchase of purchases || []) {
    const tier = mapPurchaseTierToPlanTier(purchase && purchase.tier);
    if (tier === 'full') return 'full';
    if (tier === 'paid') resolved = 'paid';
  }
  return resolved;
}

module.exports = {
  mapPurchaseTierToPlanTier,
  resolvePlanTierFromPurchases,
  PAID_PLAN_TIERS,
  FULL_PLAN_TIERS,
};
