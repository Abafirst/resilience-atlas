'use strict';

/**
 * Regression check: verifies that both Teams pages source their plan
 * definitions from the shared teamPlans.js module, and that the module
 * contains the three canonical plans with the expected keys, names, and prices.
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const DATA    = path.join(ROOT, 'client/src/data/teamPlans.js');
const LANDING = path.join(ROOT, 'client/src/pages/TeamsLandingPage.jsx');
const PRICING = path.join(ROOT, 'client/src/pages/PricingTeamsPage.jsx');

describe('teamPlans shared module', () => {
  let content;
  beforeAll(() => { content = fs.readFileSync(DATA, 'utf8'); });

  test('exports TEAM_PLANS', () => {
    expect(content).toContain('export const TEAM_PLANS');
  });

  test('contains starter plan with correct name and price', () => {
    expect(content).toContain("key: 'starter'");
    expect(content).toContain("'Atlas Team Basic'");
    expect(content).toContain("'$299'");
  });

  test('contains pro plan with correct name and price', () => {
    expect(content).toContain("key: 'pro'");
    expect(content).toContain("'Atlas Team Premium'");
    expect(content).toContain("'$699'");
  });

  test('contains enterprise plan with correct name', () => {
    expect(content).toContain("key: 'enterprise'");
    expect(content).toContain("'Atlas Enterprise'");
  });

  test('starter and pro have cta checkout; enterprise has cta contact', () => {
    // Quick structural check via regex
    const starterBlock  = content.match(/key: 'starter'[\s\S]+?key: 'pro'/)?.[0] || '';
    const enterpriseBlock = content.match(/key: 'enterprise'[\s\S]+?]/)?.[0] || '';
    expect(starterBlock).toContain("cta: 'checkout'");
    expect(enterpriseBlock).toContain("cta: 'contact'");
  });
});

describe('TeamsLandingPage sources plans from shared module', () => {
  let content;
  beforeAll(() => { content = fs.readFileSync(LANDING, 'utf8'); });

  test('imports TEAM_PLANS from teamPlans', () => {
    expect(content).toMatch(/from ['"]\.\.\/data\/teamPlans['"]/);
    expect(content).toContain('TEAM_PLANS');
  });

  test('does not hardcode Atlas Team Basic card', () => {
    // The name should only appear via plan.name (dynamic), not as a hardcoded JSX string
    expect(content).not.toMatch(/>Atlas Team Basic</);
    expect(content).not.toMatch(/className="ttc-name">Atlas Team Basic/);
  });
});

describe('PricingTeamsPage sources plans from shared module', () => {
  let content;
  beforeAll(() => { content = fs.readFileSync(PRICING, 'utf8'); });

  test('imports TEAM_PLANS from teamPlans', () => {
    expect(content).toMatch(/from ['"]\.\.\/data\/teamPlans['"]/);
    expect(content).toContain('TEAM_PLANS');
  });

  test('does not hardcode plan-card divs', () => {
    // The old hardcoded plan-card divs should no longer be present
    expect(content).not.toContain('<div className="plan-card">');
    expect(content).not.toContain('<div className="plan-card plan-card--featured">');
  });

  test('uses team-tier-card markup like TeamsLandingPage', () => {
    expect(content).toContain('team-tier-card');
    expect(content).toContain('ttc-features');
  });
});
