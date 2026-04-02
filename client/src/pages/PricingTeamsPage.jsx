import React, { useEffect, useState, useCallback } from 'react';

const styles = `

    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f8fafc; color: #1e293b; }

    /* ── Header ─────────────────────────────────────────────────────────── */
    .pricing-header {
      background: #1a2e5a;
      color: #fff;
      text-align: center;
      padding: 4rem 1.5rem 3rem;
    }
    .pricing-header__eyebrow {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #93c5fd;
      margin-bottom: 0.75rem;
    }
    .pricing-header__title {
      font-size: clamp(1.8rem, 4vw, 2.75rem);
      font-weight: 800;
      margin: 0 0 0.75rem;
      line-height: 1.15;
    }
    .pricing-header__sub {
      font-size: 1.05rem;
      color: rgba(255,255,255,0.75);
      max-width: 540px;
      margin: 0 auto 2rem;
      line-height: 1.6;
    }

    /* ── Billing Toggle ─────────────────────────────────────────────────── */
    .billing-toggle {
      display: inline-flex;
      align-items: center;
      gap: 1rem;
      background: rgba(255,255,255,0.1);
      border-radius: 2rem;
      padding: 0.375rem 1.25rem;
      font-size: 0.875rem;
      color: rgba(255,255,255,0.8);
      cursor: pointer;
    }
    .billing-toggle input[type="checkbox"] { display: none; }
    .billing-toggle__knob {
      width: 2.5rem;
      height: 1.25rem;
      background: rgba(255,255,255,0.25);
      border-radius: 1rem;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }
    .billing-toggle__knob::after {
      content: '';
      position: absolute;
      top: 0.1875rem;
      left: 0.1875rem;
      width: 0.875rem;
      height: 0.875rem;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.2s;
    }
    .billing-toggle.annual .billing-toggle__knob { background: #3b82f6; }
    .billing-toggle.annual .billing-toggle__knob::after { transform: translateX(1.25rem); }
    .billing-save-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.125rem 0.5rem;
      background: #16a34a;
      color: #fff;
      border-radius: 1rem;
      font-size: 0.7rem;
      font-weight: 700;
      margin-left: 0.25rem;
    }

    /* ── Plans Grid ─────────────────────────────────────────────────────── */
    .plans-section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 3rem 1.5rem;
    }
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      align-items: start;
    }
    @media (max-width: 900px) { .plans-grid { grid-template-columns: 1fr; max-width: 460px; margin: 0 auto; } }

    .plan-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 1rem;
      padding: 2rem;
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
    }
    .plan-card--featured {
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px #3b82f6, 0 8px 24px rgba(59,130,246,0.15);
    }
    .plan-card--enterprise { border-color: #1a2e5a; }

    .plan-badge {
      position: absolute;
      top: -0.75rem;
      left: 50%;
      transform: translateX(-50%);
      background: #3b82f6;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.2rem 0.875rem;
      border-radius: 1rem;
      white-space: nowrap;
    }

    .plan-name {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #3b82f6;
      margin-bottom: 0.5rem;
    }
    .plan-card--enterprise .plan-name { color: #1a2e5a; }

    .plan-tagline {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 1.25rem;
    }

    .plan-price {
      margin-bottom: 1.5rem;
    }
    .plan-price__amount {
      font-size: 2.5rem;
      font-weight: 800;
      color: #1a2e5a;
      line-height: 1;
    }
    .plan-price__period {
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 400;
    }
    .plan-price__annual-note {
      font-size: 0.78rem;
      color: #16a34a;
      font-weight: 600;
      margin-top: 0.25rem;
    }
    .plan-price--custom .plan-price__amount {
      font-size: 1.5rem;
    }

    .plan-capacity {
      font-size: 0.825rem;
      color: #64748b;
      background: #f1f5f9;
      border-radius: 0.5rem;
      padding: 0.625rem 0.875rem;
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .plan-capacity strong { color: #1e293b; }

    .plan-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem;
      border-radius: 0.625rem;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      text-decoration: none;
      transition: all 0.15s;
      margin-bottom: 1.75rem;
    }
    .plan-cta--primary {
      background: #3b82f6;
      color: #fff;
    }
    .plan-cta--primary:hover { background: #2563eb; }
    .plan-cta--outline {
      background: transparent;
      color: #3b82f6;
      border: 1.5px solid #3b82f6;
    }
    .plan-cta--outline:hover { background: #eff6ff; }
    .plan-cta--dark {
      background: #1a2e5a;
      color: #fff;
    }
    .plan-cta--dark:hover { background: #0f1d3a; }

    .plan-features-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-bottom: 0.75rem;
    }
    .plan-features {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .plan-features li {
      font-size: 0.875rem;
      color: #374151;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      line-height: 1.4;
    }
    .plan-features li::before {
      content: '✓';
      color: #16a34a;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 0.05rem;
    }
    .plan-features li.plus-feature { color: #1a2e5a; font-weight: 500; }
    .plan-features li.plus-feature::before { content: '★'; color: #d97706; }

    .plan-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 1.25rem 0;
    }

    /* ── Feature Comparison Table ───────────────────────────────────────── */
    .comparison-section {
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem 4rem;
    }
    .comparison-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1a2e5a;
      text-align: center;
      margin-bottom: 2rem;
    }
    .comparison-table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .comparison-table th,
    .comparison-table td {
      text-align: center;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.875rem;
    }
    .comparison-table th { background: #1a2e5a; color: #fff; font-weight: 600; }
    .comparison-table th:first-child { text-align: left; }
    .comparison-table td:first-child { text-align: left; color: #374151; }
    .comparison-table tr:last-child td { border-bottom: none; }
    .comparison-table tbody tr:hover { background: #f8fafc; }
    .comparison-table .category-row td {
      background: #f1f5f9;
      font-weight: 700;
      color: #1a2e5a;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .check { color: #16a34a; font-size: 1rem; }
    .dash  { color: #cbd5e1; }

    /* ── FAQ ─────────────────────────────────────────────────────────────── */
    .faq-section {
      max-width: 700px;
      margin: 0 auto;
      padding: 0 1.5rem 5rem;
    }
    .faq-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1a2e5a;
      text-align: center;
      margin-bottom: 2rem;
    }
    .faq-item {
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 0;
    }
    .faq-item summary {
      font-size: 0.925rem;
      font-weight: 600;
      color: #1e293b;
      cursor: pointer;
      padding: 0.25rem 0;
      list-style: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .faq-item summary::after { content: '+'; font-size: 1.1rem; color: #3b82f6; }
    .faq-item[open] summary::after { content: '−'; }
    .faq-item p {
      font-size: 0.875rem;
      color: #374151;
      margin-top: 0.75rem;
      line-height: 1.65;
    }

    /* ── Migration Banner ───────────────────────────────────────────────── */
    .migration-banner {
      background: linear-gradient(135deg, #1a2e5a, #1e40af);
      color: #fff;
      text-align: center;
      padding: 3rem 1.5rem;
    }
    .migration-banner h2 { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; }
    .migration-banner p { font-size: 0.9rem; color: rgba(255,255,255,0.8); max-width: 480px; margin: 0 auto 1.5rem; line-height: 1.6; }
`;

export default function PricingTeamsPage() {
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  const startCheckout = useCallback(async (tier) => {
    setCheckoutError('');
    setCheckoutLoading(tier);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Checkout failed');
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (err) {
      setCheckoutError(err.message || 'Could not start checkout. Please try again.');
      setCheckoutLoading('');
    }
  }, []);

  const scrollToPlans = () => {
    document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {/* BODY CONTENT */}


  {/* ── Navigation ─────────────────────────────────────────────────────────── */}
  <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0.875rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
    <a href="/" style={{ fontWeight: 700, color: '#1a2e5a', textDecoration: 'none', fontSize: '0.95rem' }}>The Resilience Atlas™</a>
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <a href="/quiz" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none' }}>Take Assessment</a>
      <a href="/dashboard-advanced" style={{ fontSize: '0.875rem', color: '#64748b', textDecoration: 'none' }}>Dashboard</a>
      <button className="btn btn--primary btn--sm" type="button" onClick={() => scrollToPlans()}>View Plans</button>
    </div>
  </nav>

  {/* ── Header ─────────────────────────────────────────────────────────────── */}
  <header className="pricing-header">
    <div className="pricing-header__eyebrow">Simple One-Time Pricing for Every Organization</div>
    <h1 className="pricing-header__title">Transform Your Team's<br/>Resilience — Together</h1>
    <p className="pricing-header__sub">From emerging startups to global enterprises, we have a plan that grows with you. No subscriptions — pay once and keep access.</p>
  </header>

  {/* ── Checkout error ─────────────────────────────────────────────────────── */}
  {checkoutError && (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.85rem 1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>
      {checkoutError}
    </div>
  )}

  {/* ── Plans ──────────────────────────────────────────────────────────────── */}
  <section className="plans-section" id="plans">
    <div className="plans-grid">

      {/* Atlas Team Basic */}
      <div className="plan-card">
        <div className="plan-name">Atlas Team Basic</div>
        <div className="plan-tagline">For small teams getting started with resilience</div>

        <div className="plan-price">
          <div>
            <span className="plan-price__amount">$299</span>
            <span className="plan-price__period">one-time</span>
          </div>
        </div>

        <div className="plan-capacity">
          <span><strong>Up to 15 people</strong></span>
          <span>1 team</span>
          <span>Data retention: 1 year</span>
        </div>

        <button className="plan-cta plan-cta--outline" type="button"
          disabled={!!checkoutLoading}
          onClick={() => startCheckout('starter')}>
          {checkoutLoading === 'starter' ? '⏳ Redirecting…' : 'Get Started — $299'}
        </button>

        <p className="plan-features-label">What's included</p>
        <ul className="plan-features">
          <li>Team assessment dashboard</li>
          <li>Aggregated radar chart</li>
          <li>Member results table</li>
          <li>CSV export</li>
          <li>Basic KPI cards (members, avg score)</li>
          <li>Discussion prompts (basic)</li>
          <li>Admin access</li>
          <li>Email support</li>
        </ul>
      </div>

      {/* Atlas Team Premium (Featured) */}
      <div className="plan-card plan-card--featured">
        <div className="plan-badge">Most Popular</div>
        <div className="plan-name">Atlas Team Premium</div>
        <div className="plan-tagline">For growing organizations serious about outcomes</div>

        <div className="plan-price">
          <div>
            <span className="plan-price__amount">$699</span>
            <span className="plan-price__period">one-time</span>
          </div>
        </div>

        <div className="plan-capacity">
          <span><strong>Up to 30 people</strong></span>
          <span>Unlimited teams / departments</span>
          <span>Data retention: 3 years</span>
        </div>

        <button className="plan-cta plan-cta--primary" type="button"
          disabled={!!checkoutLoading}
          onClick={() => startCheckout('pro')}>
          {checkoutLoading === 'pro' ? '⏳ Redirecting…' : 'Get Started — $699'}
        </button>

        <p className="plan-features-label">Everything in Basic, plus</p>
        <ul className="plan-features">
          <li className="plus-feature">Advanced analytics (distribution, heatmap)</li>
          <li className="plus-feature">Trend analysis (cycle-over-cycle)</li>
          <li className="plus-feature">Industry benchmark comparisons</li>
          <li className="plus-feature">Risk flagging &amp; wellbeing alerts</li>
          <li className="plus-feature">Auto-generated narrative team reports</li>
          <li className="plus-feature">6 pre-built workshop guides</li>
          <li className="plus-feature">Dynamic discussion prompts</li>
          <li className="plus-feature">Team action plan builder</li>
          <li className="plus-feature">Multi-team / department support</li>
          <li className="plus-feature">Role-based permissions (Viewer / Contributor / Admin)</li>
          <li className="plus-feature">Bulk CSV member invitations</li>
          <li className="plus-feature">Automated invitation reminders</li>
          <li className="plus-feature">Dimension resource library</li>
          <li className="plus-feature">PDF &amp; CSV exports</li>
          <li className="plus-feature">Scheduled auto-exports (weekly/monthly)</li>
          <li>Priority email support</li>
        </ul>
      </div>

      {/* Enterprise */}
      <div className="plan-card plan-card--enterprise">
        <div className="plan-name">Enterprise</div>
        <div className="plan-tagline">Self-service control for large organizations</div>

        <div className="plan-price plan-price--custom">
          <div>
            <span className="plan-price__amount">Starting at $2,499</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>One-time · self-service setup</div>
        </div>

        <div className="plan-capacity">
          <span><strong>Unlimited people</strong></span>
          <span>Unlimited teams</span>
          <span>Self-managed data</span>
        </div>

        <a className="plan-cta plan-cta--dark" href="/teams#teamLeadForm">
          Contact Sales
        </a>

        <p className="plan-features-label">Everything in Premium, plus</p>
        <ul className="plan-features">
          <li className="plus-feature">Org-managed branding (logo, colors, domain)</li>
          <li className="plus-feature">Branded PDF reports with org logo</li>
          <li className="plus-feature">Custom assessment intro message</li>
          <li className="plus-feature">SSO / SAML authentication — self-service setup</li>
          <li className="plus-feature">Self-service data export (assessments, reports &amp; activity)</li>
          <li className="plus-feature">Self-custody: download and own all your org's data</li>
        </ul>
      </div>

    </div>
  </section>

  {/* ── Feature Comparison ─────────────────────────────────────────────────── */}
  <section className="comparison-section">
    <h2 className="comparison-title">Full Feature Comparison</h2>
    <table className="comparison-table" aria-label="Feature comparison across plans">
      <thead>
        <tr>
          <th style={{ width: '45%' }}>Feature</th>
          <th>Basic ($299)</th>
          <th>Premium ($699)</th>
          <th>Enterprise</th>
        </tr>
      </thead>
      <tbody>
        <tr className="category-row"><td colSpan="4">Capacity &amp; Access</td></tr>
        <tr><td>Team members</td><td>Up to 15</td><td>Up to 30</td><td>Unlimited</td></tr>
        <tr><td>Teams / departments</td><td>1</td><td>Unlimited</td><td>Unlimited</td></tr>
        <tr><td>Data retention</td><td>1 year</td><td>3 years</td><td>Self-managed (export anytime)</td></tr>
        <tr><td>Admin access</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Role-based permissions</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>

        <tr className="category-row"><td colSpan="4">Analytics</td></tr>
        <tr><td>Team dashboard &amp; radar chart</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>KPI cards (members, avg score)</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Distribution chart (high/med/low)</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Dimension heatmap</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Trend analysis (cycle-over-cycle)</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Industry benchmark comparisons</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Risk flagging</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>

        <tr className="category-row"><td colSpan="4">Reporting</td></tr>
        <tr><td>CSV export</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>PDF export</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Auto-generated narrative report</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Actionable recommendations</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Scheduled auto-exports</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Branded PDF (logo + colors)</td><td><span className="dash">—</span></td><td><span className="dash">—</span></td><td><span className="check">✓</span></td></tr>

        <tr className="category-row"><td colSpan="4">Facilitation</td></tr>
        <tr><td>Basic discussion prompts</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Dynamic prompts (based on team pattern)</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>6 pre-built workshop guides</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Dimension resource library</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Team action plan builder</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Reassessment scheduling</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>

        <tr className="category-row"><td colSpan="4">Team Management</td></tr>
        <tr><td>Member results table</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Manual invitations</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Bulk CSV invitations</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Automated invitation reminders</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Multi-team / department views</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>

        <tr className="category-row"><td colSpan="4">Customization &amp; Integration</td></tr>
        <tr><td>Custom logo &amp; colors</td><td><span className="dash">—</span></td><td><span className="dash">—</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Custom assessment intro</td><td><span className="dash">—</span></td><td><span className="dash">—</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>SSO / SAML</td><td><span className="dash">—</span></td><td><span className="dash">—</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Self-service data export</td><td><span className="dash">—</span></td><td><span className="dash">—</span></td><td><span className="check">✓</span></td></tr>

        <tr className="category-row"><td colSpan="4">Support</td></tr>
        <tr><td>Email support</td><td><span className="check">✓</span></td><td><span className="check">✓</span></td><td><span className="check">✓</span></td></tr>
        <tr><td>Priority support</td><td><span className="dash">—</span></td><td><span className="check">✓</span></td><td><span className="dash">—</span></td></tr>
        <tr><td>Self-service admin resources</td><td><span className="dash">—</span></td><td><span className="dash">—</span></td><td><span className="check">✓</span></td></tr>
      </tbody>
    </table>
  </section>

  {/* ── Migration Banner ───────────────────────────────────────────────────── */}
  <section className="migration-banner">
    <h2>Already on a Business tier plan?</h2>
    <p>Existing Business tier customers are automatically grandfathered into <strong>Atlas Team Premium</strong> — no action required. You keep all your existing features plus all new Premium features.</p>
    <a href="mailto:support@resilienceatlas.io?subject=Business%20Tier%20Migration%20Question"
       style={{ display: 'inline-flex', alignItems: 'center', padding: '0.625rem 1.25rem', background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}>
      Questions? Contact Support →
    </a>
  </section>

  {/* ── FAQ ────────────────────────────────────────────────────────────────── */}
  <section className="faq-section">
    <h2 className="faq-title">Frequently Asked Questions</h2>

    <details className="faq-item">
      <summary>Are these one-time payments?</summary>
      <p>Yes. Atlas Team Basic ($299) and Atlas Team Premium ($699) are one-time purchases — no subscriptions or recurring billing. You pay once and keep access. Enterprise pricing is custom and arranged with our sales team.</p>
    </details>

    <details className="faq-item">
      <summary>Can I upgrade from Basic to Premium?</summary>
      <p>Yes. You can upgrade from Atlas Team Basic to Atlas Team Premium at any time. Contact support to discuss upgrade pricing. Your data and team settings are carried over automatically.</p>
    </details>

    <details className="faq-item">
      <summary>Will I receive a confirmation email after purchase?</summary>
      <p>Yes. A purchase confirmation email is sent to your email address immediately after successful payment. If you don't see it within a few minutes, check your spam folder or contact support.</p>
    </details>

    <details className="faq-item">
      <summary>How do you count "team members"?</summary>
      <p>A team member is any person who has completed an assessment linked to your organization. Invited members who haven't yet completed the assessment don't count toward your limit.</p>
    </details>

    <details className="faq-item">
      <summary>What payment methods do you accept?</summary>
      <p>We accept all major credit and debit cards via Stripe. Enterprise customers can also pay by invoice (bank transfer).</p>
    </details>

    <details className="faq-item">
      <summary>Is our assessment data private and secure?</summary>
      <p>Yes. All data is encrypted in transit and at rest. Individual member scores are never shared with other organizations. Aggregated team reports anonymise individual responses. We are GDPR-compliant.</p>
    </details>

    <details className="faq-item">
      <summary>Can we migrate from the Business tier?</summary>
      <p>Existing Business tier customers are automatically migrated to Atlas Team Premium with no disruption. You'll gain access to all new Premium features automatically. Contact support if you have questions.</p>
    </details>
  </section>

  {/* ── Scripts ────────────────────────────────────────────────────────────── */}
  
  



    </>
  );
}
