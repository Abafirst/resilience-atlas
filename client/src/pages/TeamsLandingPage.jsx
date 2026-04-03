import React, { useEffect, useState } from 'react';
import FacilitationGateModal from '../components/FacilitationGateModal';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import { getCurrentTeamsTier, canAccessFacilitationGuides } from '../utils/tierGating';

const styles = `

    .team-hero {
      background: linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%);
      color: #fff;
      padding: 5rem 1.5rem 4rem;
      text-align: center;
    }
    .team-hero h1 { color:#fff; font-size: clamp(1.8rem,4vw,2.8rem); margin-bottom:.75rem; }
    .team-hero p { color:#94a3b8; font-size:1.05rem; max-width:560px; margin:0 auto 0; line-height:1.65; }

    .lead-form-wrap {
      max-width: 560px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 2.5rem 2rem;
      box-shadow: 0 8px 28px rgba(0,0,0,.1);
    }
    .lead-form-wrap h2 { font-size:1.4rem; color:#0f172a; margin-bottom:.4rem; }
    .lead-form-wrap p { font-size:.93rem; color:#475569; margin-bottom:1.5rem; }
    .form-row { margin-bottom:1.1rem; }
    .form-row label { display:block; font-size:.88rem; font-weight:600; color:#334155; margin-bottom:.3rem; }
    .form-row input,
    .form-row select,
    .form-row textarea {
      width:100%;
      padding:.65rem 1rem;
      border:1px solid #cbd5e1;
      border-radius:8px;
      font-size:.95rem;
      background:#fff;
      color:#0f172a;
      outline:none;
      transition:border-color 150ms;
      font-family: inherit;
    }
    .form-row input:focus,
    .form-row select:focus,
    .form-row textarea:focus { border-color:#4F46E5; }
    .form-row textarea { resize:vertical; min-height:90px; }
    .btn-submit {
      width:100%;
      background:#4F46E5;
      color:#fff;
      font-size:1rem;
      font-weight:700;
      padding:.85rem;
      border-radius:10px;
      border:none;
      cursor:pointer;
      transition:background 200ms;
      margin-top:.5rem;
    }
    .btn-submit:hover { background:#4338CA; }
    .btn-submit:disabled { opacity:.6; cursor:not-allowed; }
    .form-success {
      text-align:center;
      padding:2rem 1rem;
      display:none;
    }
    .form-success .success-icon { font-size:3rem; margin-bottom:.75rem; }
    .form-success h3 { color:#0f172a; margin-bottom:.5rem; }
    .form-success p { color:#475569; }
    .form-error { color:#dc2626; font-size:.88rem; margin-top:.75rem; display:none; }

    .features-list {
      display:grid;
      grid-template-columns: repeat(auto-fill, minmax(240px,1fr));
      gap:1.25rem;
      max-width:1080px;
      margin:0 auto;
    }
    .feature-item {
      background:#fff;
      border:1px solid #e2e8f0;
      border-radius:12px;
      padding:1.5rem;
      box-shadow:0 2px 8px rgba(0,0,0,.04);
    }
    .feature-icon { font-size:1.5rem; margin-bottom:.6rem; }
    .feature-item h4 { font-size:1rem; font-weight:700; color:#0f172a; margin-bottom:.3rem; }
    .feature-item p { font-size:.9rem; color:#475569; line-height:1.55; }

    /* ── Team Pricing Grid ──────────────────────────────────── */
    .team-pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 1020px;
      margin: 0 auto;
    }

    .team-tier-card {
      background: #fff;
      border: 1.5px solid #e2e8f0;
      border-radius: 1rem;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      box-shadow: 0 2px 10px rgba(0,0,0,.05);
      transition: box-shadow 0.2s, border-color 0.2s;
    }

    .team-tier-card:hover {
      box-shadow: 0 6px 24px rgba(0,0,0,.10);
    }

    .team-tier-card--featured {
      border-color: #4F46E5;
      box-shadow: 0 4px 20px rgba(79,70,229,.14);
      position: relative;
    }

    .ttc-header { margin-bottom: 1.25rem; }

    .ttc-tier-icon {
      margin-bottom: 0.75rem;
    }

    .ttc-tier-icon img {
      display: block;
    }

    .ttc-badge {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.65rem;
    }

    .ttc-badge--blue  { background: #dbeafe; color: #1e40af; }
    .ttc-badge--gold  { background: #fef3c7; color: #92400e; }
    .ttc-badge--slate { background: #f1f5f9; color: #334155; }

    .ttc-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .ttc-price {
      display: flex;
      align-items: baseline;
      gap: 0.2rem;
      margin-bottom: 0.5rem;
    }

    .ttc-amount {
      font-size: 2rem;
      font-weight: 800;
      color: #4F46E5;
    }

    .ttc-period {
      font-size: 0.9rem;
      color: #64748b;
      font-weight: 500;
    }

    .ttc-desc {
      font-size: 0.88rem;
      color: #475569;
      line-height: 1.5;
      margin: 0;
    }

    .ttc-features {
      list-style: none;
      padding: 0;
      margin: 0 0 1.5rem 0;
      flex: 1;
    }

    .ttc-features li {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-size: 0.87rem;
      color: #374151;
      padding: 0.35rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    .ttc-features li:last-child { border-bottom: none; }

    .ttc-features li span[aria-hidden] {
      color: #22c55e;
      font-weight: 700;
      flex-shrink: 0;
      margin-top: 0.05rem;
    }

    .ttc-btn {
      display: block;
      width: 100%;
      padding: 0.8rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.97rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }

    .ttc-btn--primary {
      background: #4F46E5;
      color: #fff;
    }

    .ttc-btn--featured {
      background: linear-gradient(135deg, #4F46E5, #7c3aed);
      color: #fff;
    }

    .ttc-btn:hover { opacity: 0.9; }
    .ttc-btn:active { transform: scale(0.98); }

    @media (max-width: 860px) {
      .team-pricing-grid {
        grid-template-columns: 1fr;
        max-width: 440px;
      }
    }

    /* ── Team Activities ── */
    .team-activities-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      max-width: 1080px;
      margin: 0 auto;
    }

    .team-activity-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.04);
      display: flex;
      flex-direction: column;
      gap: .6rem;
    }

    .tac-header { display: flex; align-items: center; gap: .75rem; }
    .tac-icon { font-size: 1.5rem; flex-shrink: 0; }
    .tac-title { font-size: 1rem; font-weight: 700; color: #0f172a; }

    .tac-meta { display: flex; gap: .5rem; flex-wrap: wrap; }
    .tac-badge {
      display: inline-block;
      padding: .15rem .6rem;
      border-radius: 999px;
      font-size: .7rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #475569;
    }
    .tac-badge--time  { background: #dbeafe; color: #1e40af; }
    .tac-badge--group { background: #d1fae5; color: #065f46; }
    .tac-badge--dim   { background: #ede9fe; color: #5b21b6; }

    .tac-desc { font-size: .9rem; color: #475569; line-height: 1.6; flex: 1; }

    .tac-toggle {
      margin-top: .5rem;
      background: none;
      border: 1px solid #4F46E5;
      color: #4F46E5;
      font-size: .88rem;
      font-weight: 600;
      padding: .45rem .9rem;
      border-radius: 8px;
      cursor: pointer;
      align-self: flex-start;
      transition: background 150ms, color 150ms;
    }
    .tac-toggle:hover { background: #4F46E5; color: #fff; }

    .tac-panel {
      margin-top: .5rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 10px;
      font-size: .88rem;
      color: #374151;
      line-height: 1.65;
    }
    .tac-panel ol { margin: .5rem 0 0 1.25rem; padding: 0; }
    .tac-panel li { margin-bottom: .4rem; }
    .tac-panel strong { color: #0f172a; }

    /* ── Handouts / Resources ── */
    .handouts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1.25rem;
      max-width: 1080px;
      margin: 0 auto;
    }

    .handout-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 6px rgba(0,0,0,.04);
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .handout-icon { font-size: 1.75rem; flex-shrink: 0; margin-top: .1rem; }
    .handout-body { flex: 1; }
    .handout-title { font-size: .95rem; font-weight: 700; color: #0f172a; margin-bottom: .2rem; }
    .handout-desc { font-size: .86rem; color: #475569; line-height: 1.55; margin: 0; }
    .handout-tag {
      display: inline-block;
      margin-top: .4rem;
      padding: .1rem .55rem;
      border-radius: 999px;
      font-size: .7rem;
      font-weight: 600;
      background: #f0fdf4;
      color: #15803d;
    }

    /* ── Dimension Visual Guide ── */
    .dimension-guide-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      max-width: 1080px;
      margin: 0 auto;
    }

    .dim-guide-card {
      border-radius: 14px;
      padding: 1.5rem;
      border: 1px solid transparent;
    }

    .dim-guide-card--relational  { background: #f5f3ff; border-color: #ddd6fe; }
    .dim-guide-card--cognitive   { background: #eff6ff; border-color: #bfdbfe; }
    .dim-guide-card--somatic     { background: #f0fdf4; border-color: #bbf7d0; }
    .dim-guide-card--emotional   { background: #fff1f2; border-color: #fecdd3; }
    .dim-guide-card--spiritual   { background: #f0fdfa; border-color: #99f6e4; }
    .dim-guide-card--agentic     { background: #fefce8; border-color: #fde68a; }

    .dgc-header { display: flex; align-items: center; gap: .75rem; margin-bottom: .75rem; }
    .dgc-icon { width: 36px; height: 36px; }
    .dgc-name { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .dgc-archetype { font-size: .82rem; color: #64748b; }
    .dgc-desc { font-size: .88rem; color: #374151; line-height: 1.6; margin: 0 0 .75rem; }
    .dgc-signals { font-size: .82rem; font-weight: 600; color: #0f172a; margin-bottom: .3rem; }
    .dgc-signal-list { list-style: none; padding: 0; margin: 0; }
    .dgc-signal-list li {
      font-size: .83rem;
      color: #475569;
      padding: .2rem 0;
      padding-left: 1.1rem;
      position: relative;
    }
    .dgc-signal-list li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: #94a3b8;
      font-size: .75rem;
    }
`;

export default function TeamsLandingPage() {
  const [showGateModal, setShowGateModal] = useState(false);
  const [userTier, setUserTier] = useState('none');
  const [checkoutLoading, setCheckoutLoading] = useState('');
  const [checkoutError, setCheckoutError] = useState('');

  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
    setUserTier(getCurrentTeamsTier());
  }, []);

  const startTeamCheckout = async (tier) => {
    setCheckoutError('');
    setCheckoutLoading(tier);
    // Collect email from localStorage or prompt if not available
    let email = localStorage.getItem('resilience_email') || '';
    if (!email) {
      const input = window.prompt('Please enter your email address to continue with checkout:');
      if (!input || !input.trim()) {
        setCheckoutError('An email address is required to start checkout.');
        setCheckoutLoading('');
        return;
      }
      email = input.trim();
      try { localStorage.setItem('resilience_email', email); } catch (_) { /* ignore */ }
    }
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, email }),
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
  };

  const handleFacilitationGuideClick = (e) => {
    if (canAccessFacilitationGuides()) {
      // User has access — toggle the panel normally
      const btn = e.currentTarget;
      const panel = btn.nextElementSibling;
      if (!panel) return;
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!isExpanded));
      if (!isExpanded) {
        panel.removeAttribute('hidden');
      } else {
        panel.setAttribute('hidden', '');
      }
    } else {
      // No access — show upgrade modal
      setShowGateModal(true);
    }
  };

  return (
    <>
      {showGateModal && (
        <FacilitationGateModal
          userTier={userTier}
          onClose={() => setShowGateModal(false)}
        />
      )}
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {/* BODY CONTENT */}


  <SiteHeader activePage="teams" />
  <DarkModeHint />

  <section className="team-hero" aria-label="Team page hero">
    <span className="hero-eyebrow">Business Tier</span>
    <h1>Navigate Team Resilience Together</h1>
    <p>When your team understands how each person navigates challenges&mdash;their strengths, patterns, and emerging edges&mdash;everything changes. The Resilience Atlas doesn&rsquo;t fix teams. It orients them.</p>
  </section>

  {/* Team Pricing Tiers */}
  <section id="pricing" className="landing-section" aria-labelledby="pricingHeading" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
    <div className="section-header" style={{ marginBottom: '2.5rem' }}>
      <span className="section-label">Pricing</span>
      <h2 id="pricingHeading">Plans for Every Team</h2>
      <p style={{ color: '#475569', margin: '0.5rem auto 0', maxWidth: '580px', fontSize: '1rem', lineHeight: 1.6 }}>
        Choose the plan that fits your organization. All plans are self-service — teams manage their own data, exports, and members.
        No ongoing data management required on our end.{' '}
        <a href="/privacy" style={{ color: '#4F46E5', fontWeight: 600 }}>Learn about our data model →</a>
      </p>
    </div>
    {checkoutError && (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.85rem 1.5rem', textAlign: 'center', fontSize: '0.9rem', marginBottom: '1rem', borderRadius: 8 }}>
        {checkoutError}
      </div>
    )}
    <div className="team-pricing-grid">

      {/* Starter */}
      <div className="team-tier-card">
        <div className="ttc-header">
          <div className="ttc-tier-icon" aria-hidden="true">
            <img src="/icons/games/tier-starter.svg" alt="" width="48" height="48" className="icon icon-lg" />
          </div>
          <h3 className="ttc-name">Atlas Team Basic</h3>
          <div className="ttc-price">
            <span className="ttc-amount">$299</span>
            <span className="ttc-period">one-time</span>
          </div>
          <p className="ttc-desc">Perfect for small teams starting their resilience journey.</p>
        </div>
        <ul className="ttc-features" aria-label="Atlas Team Basic features">
          <li><span aria-hidden="true">&#10003;</span> Up to 15 users | 1 team</li>
          <li><span aria-hidden="true">&#10003;</span> <strong>Gamifications:</strong> Personal &amp; team badges, streaks, milestones</li>
          <li><span aria-hidden="true">&#10003;</span> <strong>Team Tracking:</strong> Leaderboards, progress dashboards, parental views</li>
          <li><span aria-hidden="true">&#10003;</span> Team dashboard &amp; aggregated radar chart</li>
          <li><span aria-hidden="true">&#10003;</span> Self-service CSV &amp; PDF export</li>
          <li><span aria-hidden="true">&#10003;</span> Bulk email invitations</li>
          <li><span aria-hidden="true">&#10003;</span> Download all your data anytime</li>
        </ul>
        <button className="ttc-btn ttc-btn--primary" type="button" disabled={!!checkoutLoading} onClick={() => startTeamCheckout('starter')}>
          {checkoutLoading === 'starter' ? '⏳ Redirecting…' : 'Get Started — $299 one-time'}
        </button>
      </div>

      {/* Pro */}
      <div className="team-tier-card team-tier-card--featured">
        <div className="ttc-header">
          <span className="ttc-badge ttc-badge--blue">Most Popular</span>
          <div className="ttc-tier-icon" aria-hidden="true">
            <img src="/icons/games/tier-team.svg" alt="" width="48" height="48" className="icon icon-lg" />
          </div>
          <h3 className="ttc-name">Atlas Team Premium</h3>
          <div className="ttc-price">
            <span className="ttc-amount">$699</span>
            <span className="ttc-period">one-time</span>
          </div>
          <p className="ttc-desc">For growing organizations with multiple teams and deeper analytics needs.</p>
        </div>
        <ul className="ttc-features" aria-label="Atlas Team Premium features">
          <li><span aria-hidden="true">&#10003;</span> Up to 30 users | Multiple teams</li>
          <li><span aria-hidden="true">&#10003;</span> <strong>Enhanced Gamifications:</strong> Advanced team challenges, achievement tracking</li>
          <li><span aria-hidden="true">&#10003;</span> <strong>Advanced Leaderboards:</strong> Multi-team comparisons, dimension breakdowns</li>
          <li><span aria-hidden="true">&#10003;</span> <strong>Parental Controls:</strong> Detailed team member progress tracking</li>
          <li><span aria-hidden="true">&#10003;</span> Advanced analytics (downloadable)</li>
          <li><span aria-hidden="true">&#10003;</span> Auto-generated team reports (PDF)</li>
          <li><span aria-hidden="true">&#10003;</span> Facilitation tools &amp; resource library (30+ guides)</li>
          <li><span aria-hidden="true">&#10003;</span> Self-service team management</li>
        </ul>
        <button className="ttc-btn ttc-btn--featured" type="button" disabled={!!checkoutLoading} onClick={() => startTeamCheckout('pro')}>
          {checkoutLoading === 'pro' ? '⏳ Redirecting…' : 'Get Started — $699 one-time'}
        </button>
      </div>

      {/* Enterprise */}
      <div className="team-tier-card">
        <div className="ttc-header">
          <span className="ttc-badge ttc-badge--slate">Enterprise</span>
          <div className="ttc-tier-icon" aria-hidden="true">
            <img src="/icons/games/tier-enterprise.svg" alt="" width="48" height="48" className="icon icon-lg" />
          </div>
          <h3 className="ttc-name">Atlas Enterprise</h3>
          <div className="ttc-price">
            <span className="ttc-amount">Starting at $2,499</span>
          </div>
          <p className="ttc-desc">Built for large organizations who want full control. Self-manage your team, branding, authentication, and data — no white-glove setup or support required.</p>
        </div>
        <ul className="ttc-features" aria-label="Atlas Enterprise features">
          <li><span aria-hidden="true">&#10003;</span> Unlimited users &amp; teams</li>
          <li><span aria-hidden="true">&#10003;</span> <strong>Full Gamification Suite:</strong> Custom badges, unlimited challenges, org-wide leaderboards</li>
          <li><span aria-hidden="true">&#10003;</span> <strong>Enterprise Tracking:</strong> Advanced parental/manager dashboards, real-time analytics</li>
          <li><span aria-hidden="true">&#10003;</span> Org-managed branding (logos, colors, domain)</li>
          <li><span aria-hidden="true">&#10003;</span> SSO / SAML integration — configure yourself</li>
          <li><span aria-hidden="true">&#10003;</span> Self-service data export — download your org's data anytime</li>
          <li><span aria-hidden="true">&#10003;</span> Self-custody: you own and control all purchased materials</li>
        </ul>
        <a href="#teamLeadForm" className="ttc-btn ttc-btn--primary" onClick={(e) => { e.preventDefault(); document.getElementById('teamLeadForm').scrollIntoView({behavior:'smooth'}) }}>
          Contact Sales
        </a>
      </div>

    </div>
  </section>

  {/* Enterprise Contact Form (Enterprise plan only) */}
  <section className="landing-section alt-bg" aria-labelledby="formHeading" id="teamLeadForm">
    <div className="lead-form-wrap">
      <h2 id="formHeading">Atlas Enterprise Inquiry</h2>
      <p>Tell us about your organization and we will be in touch within one business day to discuss your custom Enterprise plan.</p>

      <form id="teamLeadFormEl" noValidate>
        <div className="form-row">
          <label htmlFor="contactName">Your Name <span aria-hidden="true">*</span></label>
          <input type="text" id="contactName" name="contact_name" required autoComplete="name" placeholder="Jane Smith" />
        </div>
        <div className="form-row">
          <label htmlFor="companyName">Company / Organization <span aria-hidden="true">*</span></label>
          <input type="text" id="companyName" name="company_name" required autoComplete="organization" placeholder="Acme Corp" />
        </div>
        <div className="form-row">
          <label htmlFor="workEmail">Work Email <span aria-hidden="true">*</span></label>
          <input type="email" id="workEmail" name="email" required autoComplete="email" placeholder="jane@acmecorp.com" />
        </div>
        <div className="form-row">
          <label htmlFor="teamSize">Team Size</label>
          <select id="teamSize" name="team_size">
            <option value="">Select team size</option>
            <option value="1-10">1 &ndash; 10</option>
            <option value="11-50">11 &ndash; 50</option>
            <option value="51-200">51 &ndash; 200</option>
            <option value="201-500">201 &ndash; 500</option>
            <option value="500+">500+</option>
          </select>
        </div>
        <div className="form-row">
          <label htmlFor="message">What are you hoping to achieve? (optional)</label>
          <textarea id="message" name="message" placeholder="e.g. Understand team resilience profiles ahead of an organizational change program..."></textarea>
        </div>
        <button type="submit" className="btn-submit" id="submitLeadBtn">Request Enterprise Access</button>
        <p className="form-error" id="formError" role="alert"></p>
      </form>

      <div className="form-success" id="formSuccess" aria-live="polite">
        <div className="success-icon" aria-hidden="true"><img src="/icons/checkmark.svg" alt="" className="icon icon-md" /></div>
        <h3>Thank you!</h3>
        <p>We have received your Enterprise inquiry and will be in touch within one business day.</p>
        <a href="/quiz" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-block' }}>
          Take the Individual Assessment
        </a>
      </div>
    </div>
  </section>

  {/* Features */}
  <section className="landing-section" aria-labelledby="featuresHeading">
    <div className="section-header">
      <span className="section-label">What You Get</span>
      <h2 id="featuresHeading">Your Team&rsquo;s Navigation Toolkit</h2>
    </div>
    <div className="features-list">
      <div className="feature-item">
        <div className="feature-icon" aria-hidden="true"><img src="/icons/cognitive-narrative.svg" alt="" className="icon icon-md" /></div>
        <h4>Team Dashboard</h4>
        <p>A shared map of your team&rsquo;s collective resilience&mdash;aggregated dimension profiles and completion tracking in one place.</p>
      </div>
      <div className="feature-item">
        <div className="feature-icon" aria-hidden="true"><img src="/icons/compass.svg" alt="" className="icon icon-md" /></div>
        <h4>Team Compass</h4>
        <p>Visualize your team&rsquo;s collective Six Dimensions profile on a single compass. See where strengths cluster and where edges exist.</p>
      </div>
      <div className="feature-item">
        <div className="feature-icon" aria-hidden="true"><img src="/icons/agentic-generative.svg" alt="" className="icon icon-md" /></div>
        <h4>Data Export</h4>
        <p>Download all member maps with dimension profiles for your own analysis or organizational reporting.</p>
      </div>
      <div className="feature-item">
        <div className="feature-icon" aria-hidden="true"><img src="/icons/relational-connective.svg" alt="" className="icon icon-md" /></div>
        <h4>Individual Navigation Guides</h4>
        <p>Each team member receives their personalized resilience map and dimension narrative&mdash;their own guide for growth.</p>
      </div>
      <div className="feature-item">
        <div className="feature-icon" aria-hidden="true"><img src="/icons/emotional-adaptive.svg" alt="" className="icon icon-md" /></div>
        <h4>Simple Onboarding</h4>
        <p>Invite your entire team via email with a single click. Minimal friction, maximum participation.</p>
      </div>
      <div className="feature-item">
        <div className="feature-icon" aria-hidden="true"><img src="/icons/lock.svg" alt="" className="icon icon-md" /></div>
        <h4>Secure &amp; Private</h4>
        <p>Individual maps are always private by default. Admins see only aggregated team insights unless individuals choose to share.</p>
      </div>
    </div>
  </section>

  {/* Team Building Activities */}
  <section className="landing-section alt-bg" aria-labelledby="teamActivitiesHeading" id="team-activities">
    <div className="section-header" style={{ marginBottom: '2.5rem' }}>
      <span className="section-label">Facilitation</span>
      <h2 id="teamActivitiesHeading">Team Building Activities</h2>
      <p style={{ color: '#475569', margin: '0.5rem auto 0', maxWidth: '560px', fontSize: '1rem', lineHeight: 1.6 }}>
        Structured activities you can run in team meetings, workshops, or off-sites to build resilience skills together.
      </p>
    </div>
    <div className="team-activities-grid">

      {/* Dimension Deep-Dive */}
      <div className="team-activity-card">
        <div className="tac-header">
          <span className="tac-icon" aria-hidden="true">&#127919;</span>
          <div className="tac-title">Dimension Deep-Dive</div>
        </div>
        <div className="tac-meta">
          <span className="tac-badge tac-badge--time">45–60 min</span>
          <span className="tac-badge tac-badge--group">4–20 people</span>
          <span className="tac-badge tac-badge--dim">All Dimensions</span>
        </div>
        <p className="tac-desc">Each team member shares which of the Six Dimensions feels strongest and which is a current growth edge. The group identifies patterns and creates a collective resilience profile together.</p>
        <button className="tac-toggle" onClick={handleFacilitationGuideClick} aria-expanded="false" aria-label="View Facilitation Guide (Premium feature)"><span aria-hidden="true">🔒</span> View Facilitation Guide</button>
        <div className="tac-panel" hidden>
          <strong>How to run it:</strong>
          <ol>
            <li>Each person picks their strongest and weakest dimension from the Six Dimensions wheel (5 min alone).</li>
            <li>In pairs, share your choices and the reason why (10 min).</li>
            <li>Pairs share back to the group — facilitator captures themes on a whiteboard (15 min).</li>
            <li>Discuss: What does our collective strength look like? Where are our shared growth edges? (15 min).</li>
            <li>Each person names one action they'll take to strengthen their growth dimension this month (10 min).</li>
          </ol>
          <p style={{ margin: '.75rem 0 0' }}><strong>Materials:</strong> Six Dimensions wheel diagram, sticky notes, whiteboard or shared doc.</p>
        </div>
      </div>

      {/* Resilience Story Circle */}
      <div className="team-activity-card">
        <div className="tac-header">
          <span className="tac-icon" aria-hidden="true">&#128172;</span>
          <div className="tac-title">Resilience Story Circle</div>
        </div>
        <div className="tac-meta">
          <span className="tac-badge tac-badge--time">30–45 min</span>
          <span className="tac-badge tac-badge--group">5–15 people</span>
          <span className="tac-badge tac-badge--dim">All Dimensions</span>
        </div>
        <p className="tac-desc">Team members share brief stories of navigating a professional challenge. The group identifies which resilience dimension was most active — building empathy, insight, and shared language.</p>
        <button className="tac-toggle" onClick={handleFacilitationGuideClick} aria-expanded="false" aria-label="View Facilitation Guide (Premium feature)"><span aria-hidden="true">🔒</span> View Facilitation Guide</button>
        <div className="tac-panel" hidden>
          <strong>How to run it:</strong>
          <ol>
            <li>Facilitator introduces the Six Dimensions briefly (5 min).</li>
            <li>Each person thinks of a time they navigated something hard at work and came through it (2 min alone).</li>
            <li>Volunteers share their story (2–3 min each). After each, the group calls out which dimension they heard most.</li>
            <li>Debrief: What patterns did we notice? What surprised us? (10 min).</li>
            <li>Close: Each person names one resilience strength they want to lean on this quarter.</li>
          </ol>
          <p style={{ margin: '.75rem 0 0' }}><strong>Tip:</strong> No story is too small. The point is recognition, not drama.</p>
        </div>
      </div>

      {/* Strengths Mapping */}
      <div className="team-activity-card">
        <div className="tac-header">
          <span className="tac-icon" aria-hidden="true">&#128200;</span>
          <div className="tac-title">Team Strengths Mapping</div>
        </div>
        <div className="tac-meta">
          <span className="tac-badge tac-badge--time">30 min</span>
          <span className="tac-badge tac-badge--group">3–12 people</span>
          <span className="tac-badge tac-badge--dim">All Dimensions</span>
        </div>
        <p className="tac-desc">Using individual assessment results, plot the team's collective dimension scores on a shared radar chart. Identify team strengths and coverage gaps — then assign roles accordingly.</p>
        <button className="tac-toggle" onClick={handleFacilitationGuideClick} aria-expanded="false" aria-label="View Facilitation Guide (Premium feature)"><span aria-hidden="true">🔒</span> View Facilitation Guide</button>
        <div className="tac-panel" hidden>
          <strong>How to run it:</strong>
          <ol>
            <li>Display the team's aggregated radar chart from the dashboard (5 min).</li>
            <li>Ask: Where is the team strong? Where is the lowest score? (5 min discussion).</li>
            <li>Explore: How does this map to how we actually work together? Are gaps causing friction? (10 min).</li>
            <li>Identify: Who on the team has natural strength in each dimension? How can we use that? (10 min).</li>
          </ol>
          <p style={{ margin: '.75rem 0 0' }}><strong>Requires:</strong> Atlas Team Premium or Enterprise tier for aggregated dashboard access.</p>
        </div>
      </div>

      {/* The Pressure Test */}
      <div className="team-activity-card">
        <div className="tac-header">
          <span className="tac-icon" aria-hidden="true">&#9729;</span>
          <div className="tac-title">The Pressure Test</div>
        </div>
        <div className="tac-meta">
          <span className="tac-badge tac-badge--time">45 min</span>
          <span className="tac-badge tac-badge--group">6–20 people</span>
          <span className="tac-badge tac-badge--dim">Emotional-Adaptive</span>
        </div>
        <p className="tac-desc">Teams explore how pressure affects performance and emotional regulation. They identify their collective early warning signs and build a shared "pressure protocol" for high-stakes moments.</p>
        <button className="tac-toggle" onClick={handleFacilitationGuideClick} aria-expanded="false" aria-label="View Facilitation Guide (Premium feature)"><span aria-hidden="true">🔒</span> View Facilitation Guide</button>
        <div className="tac-panel" hidden>
          <strong>How to run it:</strong>
          <ol>
            <li>Intro: Share research on how stress affects decision-making and communication (5 min).</li>
            <li>Individual reflection: "When I'm under pressure, I tend to..." — write silently (5 min).</li>
            <li>Small groups of 3–4 share their pressure signatures (10 min).</li>
            <li>Whole group: What pressure patterns did we identify across the team? (10 min).</li>
            <li>Co-create a "pressure protocol" — agreed-upon team norms for high-stress moments (15 min).</li>
          </ol>
          <p style={{ margin: '.75rem 0 0' }}><strong>Tip:</strong> Keep the tone non-judgmental. Pressure responses are normal — the goal is awareness, not change.</p>
        </div>
      </div>

      {/* Values Alignment */}
      <div className="team-activity-card">
        <div className="tac-header">
          <span className="tac-icon" aria-hidden="true">&#129517;</span>
          <div className="tac-title">Values Alignment Workshop</div>
        </div>
        <div className="tac-meta">
          <span className="tac-badge tac-badge--time">60 min</span>
          <span className="tac-badge tac-badge--group">4–15 people</span>
          <span className="tac-badge tac-badge--dim">Spiritual-Reflective</span>
        </div>
        <p className="tac-desc">Team members clarify their personal top values and compare with the team's stated values. The group identifies alignment, tensions, and opportunities — and commits to shared working principles.</p>
        <button className="tac-toggle" onClick={handleFacilitationGuideClick} aria-expanded="false" aria-label="View Facilitation Guide (Premium feature)"><span aria-hidden="true">🔒</span> View Facilitation Guide</button>
        <div className="tac-panel" hidden>
          <strong>How to run it:</strong>
          <ol>
            <li>Each person lists their top 5 personal values (from a provided list or free-form) — 5 min.</li>
            <li>In pairs: share your top 3 and why — 10 min.</li>
            <li>Facilitator compiles a collective "value word cloud" on the whiteboard — 5 min.</li>
            <li>Compare with team/company stated values: Where do we align? Where is there tension? — 15 min.</li>
            <li>Draft 3–5 team working principles that reflect shared values — 20 min.</li>
            <li>Commit: How will we hold each other to these? — 5 min.</li>
          </ol>
          <p style={{ margin: '.75rem 0 0' }}><strong>Output:</strong> A team values charter or working agreement to post and revisit quarterly.</p>
        </div>
      </div>

      {/* Connection Map */}
      <div className="team-activity-card">
        <div className="tac-header">
          <span className="tac-icon" aria-hidden="true">&#128101;</span>
          <div className="tac-title">Connection Map</div>
        </div>
        <div className="tac-meta">
          <span className="tac-badge tac-badge--time">30 min</span>
          <span className="tac-badge tac-badge--group">4–20 people</span>
          <span className="tac-badge tac-badge--dim">Relational-Connective</span>
        </div>
        <p className="tac-desc">Teams visually map their internal connections, support networks, and collaboration patterns. They identify who might feel isolated, who is over-relied upon, and what gaps need bridging.</p>
        <button className="tac-toggle" onClick={handleFacilitationGuideClick} aria-expanded="false" aria-label="View Facilitation Guide (Premium feature)"><span aria-hidden="true">🔒</span> View Facilitation Guide</button>
        <div className="tac-panel" hidden>
          <strong>How to run it:</strong>
          <ol>
            <li>Each person draws a simple map with their name in the center. They draw lines to team members they connect with regularly, with thicker lines = stronger connection (10 min).</li>
            <li>Share maps in small groups (3–4 people). What do you notice? (10 min).</li>
            <li>Debrief with the whole group: Who might need more connection? Who is a key connector? Are there silos? (10 min).</li>
          </ol>
          <p style={{ margin: '.75rem 0 0' }}><strong>Tip:</strong> This works especially well for remote or hybrid teams. Use a digital whiteboard like Miro or FigJam.</p>
        </div>
      </div>

    </div>
  </section>

  {/* Facilitation Handouts & Resources */}
  <section className="landing-section" aria-labelledby="handoutsHeading" id="facilitation-resources">
    <div className="section-header" style={{ marginBottom: '2.5rem' }}>
      <span className="section-label">Resources</span>
      <h2 id="handoutsHeading">Facilitation Handouts &amp; Resources</h2>
      <p style={{ color: '#475569', margin: '0.5rem auto 0', maxWidth: '560px', fontSize: '1rem', lineHeight: 1.6 }}>
        Ready-to-use materials to support team workshops, onboarding, and ongoing resilience development.
      </p>
    </div>
    <div className="handouts-grid">

      <div className="handout-card">
        <div className="handout-icon" aria-hidden="true">🧭</div>
        <div className="handout-body">
          <div className="handout-title">Six Dimensions Quick Reference</div>
          <p className="handout-desc">A one-page overview of all six resilience dimensions with definitions, archetypes, and key signals. Perfect for workshop prep or team onboarding.</p>
          <span className="handout-tag">PDF Handout</span>
        </div>
      </div>

      <div className="handout-card">
        <div className="handout-icon" aria-hidden="true">🗺️</div>
        <div className="handout-body">
          <div className="handout-title">Team Resilience Workshop Agenda</div>
          <p className="handout-desc">A 90-minute structured workshop agenda with timing, talking points, and debrief questions. Designed for HR facilitators and team leads.</p>
          <span className="handout-tag">Facilitator Guide</span>
        </div>
      </div>

      <div className="handout-card">
        <div className="handout-icon" aria-hidden="true">📡</div>
        <div className="handout-body">
          <div className="handout-title">Team Dashboard Interpretation Guide</div>
          <p className="handout-desc">How to read and discuss your team's aggregated radar chart. Includes facilitation questions and action-planning prompts for each dimension.</p>
          <span className="handout-tag">Facilitator Guide</span>
        </div>
      </div>

      <div className="handout-card">
        <div className="handout-icon" aria-hidden="true">🪞</div>
        <div className="handout-body">
          <div className="handout-title">Individual Reflection Worksheet</div>
          <p className="handout-desc">A fillable worksheet for participants to use before or after taking the assessment. Includes personal scoring, dimension reflections, and goal-setting prompts.</p>
          <span className="handout-tag">Participant Worksheet</span>
        </div>
      </div>

      <div className="handout-card">
        <div className="handout-icon" aria-hidden="true">🛡️</div>
        <div className="handout-body">
          <div className="handout-title">Resilience Under Pressure Card</div>
          <p className="handout-desc">A pocket-sized reference card with grounding techniques, reframing prompts, and regulation strategies for each dimension — for use in real-time high-stress moments.</p>
          <span className="handout-tag">Reference Card</span>
        </div>
      </div>

      <div className="handout-card">
        <div className="handout-icon" aria-hidden="true">⚓</div>
        <div className="handout-body">
          <div className="handout-title">Team Values Charter Template</div>
          <p className="handout-desc">A structured template for teams to document their shared values, working principles, and resilience commitments — for display, onboarding, and quarterly review.</p>
          <span className="handout-tag">Template</span>
        </div>
      </div>

      <div className="handout-card">
        <div className="handout-icon" aria-hidden="true">🔭</div>
        <div className="handout-body">
          <div className="handout-title">Dimension Signals Observer Sheet</div>
          <p className="handout-desc">A tool for managers and coaches to observe and recognize resilience dimension signals in team members' behavior — useful for coaching conversations and performance support.</p>
          <span className="handout-tag">Manager Tool</span>
        </div>
      </div>

      <div className="handout-card">
        <div className="handout-icon" aria-hidden="true">🏔️</div>
        <div className="handout-body">
          <div className="handout-title">90-Day Resilience Action Plan</div>
          <p className="handout-desc">A structured plan template for individuals and teams to set resilience development goals, identify support, and track progress across a quarter.</p>
          <span className="handout-tag">Planning Template</span>
        </div>
      </div>

    </div>
    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
      <p style={{ fontSize: '.93rem', color: '#64748b', marginBottom: '1rem' }}>
        All facilitation materials are included with every Teams plan.{' '}
        <a href="#pricing" style={{ color: '#4F46E5', fontWeight: 600 }}>View packages →</a>
      </p>
      <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <a href="/teams-resources" style={{ background: '#4F46E5', color: '#fff', borderRadius: '8px', padding: '.6rem 1.25rem', fontWeight: 700, textDecoration: 'none', fontSize: '.9rem' }}>Browse All Resources →</a>
        <a href="/teams-facilitation" style={{ background: '#fff', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '.6rem 1.25rem', fontWeight: 600, textDecoration: 'none', fontSize: '.9rem' }}>Full Facilitation Guide</a>
        <a href="/teams-activities" style={{ background: '#fff', color: '#1e293b', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '.6rem 1.25rem', fontWeight: 600, textDecoration: 'none', fontSize: '.9rem' }}>Activity Library</a>
      </div>
    </div>
  </section>

  {/* Six Dimensions Visual Guide */}
  <section className="landing-section alt-bg" aria-labelledby="dimensionGuideHeading" id="dimension-guide">
    <div className="section-header" style={{ marginBottom: '2.5rem' }}>
      <span className="section-label">Visual Guide</span>
      <h2 id="dimensionGuideHeading">The Six Dimensions of Resilience</h2>
      <p style={{ color: '#475569', margin: '0.5rem auto 0', maxWidth: '560px', fontSize: '1rem', lineHeight: 1.6 }}>
        A visual reference for teams: what each dimension looks like in action, and what to watch for.
      </p>
    </div>
    <div className="dimension-guide-grid">

      <div className="dim-guide-card dim-guide-card--relational">
        <div className="dgc-header">
          <img src="/icons/relational-connective.svg" alt="" className="dgc-icon" />
          <div>
            <div className="dgc-name">Relational-Connective</div>
            <div className="dgc-archetype">The Connector</div>
          </div>
        </div>
        <p className="dgc-desc">The ability to build and sustain meaningful connections, ask for help, and offer support. Connectors create the safety nets that hold teams together under stress.</p>
        <div className="dgc-signals">Signals of strength:</div>
        <ul className="dgc-signal-list">
          <li>Proactively checks in with colleagues</li>
          <li>Comfortable asking for and accepting help</li>
          <li>Creates psychological safety in meetings</li>
          <li>Builds bridges across silos</li>
        </ul>
      </div>

      <div className="dim-guide-card dim-guide-card--cognitive">
        <div className="dgc-header">
          <img src="/icons/cognitive-narrative.svg" alt="" className="dgc-icon" />
          <div>
            <div className="dgc-name">Cognitive-Narrative</div>
            <div className="dgc-archetype">The Thinker</div>
          </div>
        </div>
        <p className="dgc-desc">The ability to reframe challenges, shift perspective, and construct adaptive narratives. Thinkers help teams find meaning in setbacks and possibilities in constraints.</p>
        <div className="dgc-signals">Signals of strength:</div>
        <ul className="dgc-signal-list">
          <li>Reframes problems into opportunities</li>
          <li>Considers multiple perspectives</li>
          <li>Maintains nuanced thinking under pressure</li>
          <li>Challenges unhelpful team narratives</li>
        </ul>
      </div>

      <div className="dim-guide-card dim-guide-card--somatic">
        <div className="dgc-header">
          <img src="/icons/somatic-regulative.svg" alt="" className="dgc-icon" />
          <div>
            <div className="dgc-name">Somatic-Regulative</div>
            <div className="dgc-archetype">The Grounder</div>
          </div>
        </div>
        <p className="dgc-desc">The capacity to regulate the body's stress response and maintain physical equilibrium. Grounders model calm under pressure and help teams return to baseline quickly.</p>
        <div className="dgc-signals">Signals of strength:</div>
        <ul className="dgc-signal-list">
          <li>Physically calm in high-stakes moments</li>
          <li>Recovers quickly from stress peaks</li>
          <li>Aware of how physical state affects performance</li>
          <li>Practices intentional restoration</li>
        </ul>
      </div>

      <div className="dim-guide-card dim-guide-card--emotional">
        <div className="dgc-header">
          <img src="/icons/emotional-adaptive.svg" alt="" className="dgc-icon" />
          <div>
            <div className="dgc-name">Emotional-Adaptive</div>
            <div className="dgc-archetype">The Feeler</div>
          </div>
        </div>
        <p className="dgc-desc">The ability to name, understand, and work skillfully with emotions — one's own and others'. Feelers create emotional intelligence in team culture and prevent burnout.</p>
        <div className="dgc-signals">Signals of strength:</div>
        <ul className="dgc-signal-list">
          <li>Names emotions clearly and non-reactively</li>
          <li>Reads the emotional tone of meetings</li>
          <li>Responds thoughtfully rather than reactively</li>
          <li>Helps teams process and move forward</li>
        </ul>
      </div>

      <div className="dim-guide-card dim-guide-card--spiritual">
        <div className="dgc-header">
          <img src="/icons/spiritual-reflective.svg" alt="" className="dgc-icon" />
          <div>
            <div className="dgc-name">Spiritual-Reflective</div>
            <div className="dgc-archetype">The Guide</div>
          </div>
        </div>
        <p className="dgc-desc">The capacity to connect with meaning, purpose, and values — especially during difficulty. Guides help teams stay anchored to what matters most when everything feels uncertain.</p>
        <div className="dgc-signals">Signals of strength:</div>
        <ul className="dgc-signal-list">
          <li>Articulates the deeper "why" behind work</li>
          <li>Makes decisions aligned with core values</li>
          <li>Brings perspective during crises</li>
          <li>Helps teams find meaning in hard moments</li>
        </ul>
      </div>

      <div className="dim-guide-card dim-guide-card--agentic">
        <div className="dgc-header">
          <img src="/icons/agentic-generative.svg" alt="" className="dgc-icon" />
          <div>
            <div className="dgc-name">Agentic-Generative</div>
            <div className="dgc-archetype">The Builder</div>
          </div>
        </div>
        <p className="dgc-desc">The belief in one's capacity to act effectively and create change. Builders drive initiative, maintain momentum under uncertainty, and inspire action-orientation in others.</p>
        <div className="dgc-signals">Signals of strength:</div>
        <ul className="dgc-signal-list">
          <li>Takes initiative without waiting for permission</li>
          <li>Breaks challenges into actionable steps</li>
          <li>Maintains momentum through setbacks</li>
          <li>Energizes others toward possibility</li>
        </ul>
      </div>

    </div>
  </section>

  {/* Final CTA */}
  <section className="landing-section" style={{ background: '#fff' }}>
    <div className="final-cta">
      <h2>Start with an Individual Assessment</h2>
      <p>Not ready for a team rollout? Take the free individual assessment first and experience the Six Dimensions model yourself.</p>
      <a className="btn-hero-primary" href="/quiz" style={{ display: 'inline-flex', margin: '0 auto' }}>
        <span aria-hidden="true">&#9654;</span> Take the Free Assessment
      </a>
    </div>
  </section>

  <footer className="site-footer" role="contentinfo">
    <nav className="footer-nav" aria-label="Footer navigation">
      <div className="footer-nav-group">
        <strong className="footer-nav-heading">Assessment</strong>
        <a href="/assessment">About the Assessment</a>
        <a href="/quiz">Take the Quiz</a>
        <a href="/results">My Results</a>
      </div>
      <div className="footer-nav-group">
        <strong className="footer-nav-heading">Research</strong>
        <a href="/research">Foundations</a>
        <a href="/research#dimensions">Six Dimensions</a>
      </div>
      <div className="footer-nav-group">
        <strong className="footer-nav-heading">Programs</strong>
        <a href="/teams">For Teams</a>
        <a href="/teams-activities">Team Activities</a>
        <a href="/teams-resources">Team Resources</a>
        <a href="/teams-facilitation">Facilitation Guide</a>
        <a href="/kids">For Kids</a>
      </div>
      <div className="footer-nav-group">
        <strong className="footer-nav-heading">Company</strong>
        <a href="/about">About</a>
        <a href="/privacy">Privacy &amp; Data Control</a>
      </div>
    </nav>
    <div className="footer-bottom">
      <p>&copy; 2026 The Resilience Atlas&#8482;</p>
      <p>The Resilience Atlas&#8482; is a trademark of <strong>Janeen Molchany Ph.D., BCBA</strong>.</p>
      <p>For educational and self-reflection purposes only. Not a clinical assessment.</p>
    </div>
  </footer>

  
  

  

    </>
  );
}
