import React, { useState, useEffect } from 'react';

const styles = `
  .privacy-hero {
    background: linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%);
    color: #fff;
    padding: 5rem 1.5rem 4rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .privacy-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at 70% 30%, rgba(79,70,229,.25) 0%, transparent 60%);
    pointer-events: none;
  }
  .privacy-hero .hero-eyebrow {
    display: inline-block;
    background: rgba(79,70,229,.3);
    color: #a5b4fc;
    font-size: .8rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    padding: .35rem 1rem;
    border-radius: 999px;
    margin-bottom: 1.25rem;
  }
  .privacy-hero h1 { color: #fff; font-size: clamp(1.8rem,4vw,2.8rem); margin-bottom: .75rem; line-height: 1.2; }
  .privacy-hero .hero-sub { color: #cbd5e1; font-size: 1.05rem; max-width: 560px; margin: 0 auto; line-height: 1.7; }

  .privacy-content {
    max-width: 860px;
    margin: 0 auto;
    padding: 4rem 1.5rem 5rem;
  }

  .privacy-section {
    margin-bottom: 3.5rem;
    padding-bottom: 3.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  .privacy-section:last-child { border-bottom: none; }

  .privacy-section-eyebrow {
    font-size: .75rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #4F46E5;
    margin-bottom: .5rem;
  }
  .privacy-section h2 {
    font-size: 1.6rem;
    color: #0f172a;
    margin: 0 0 1rem;
    line-height: 1.25;
  }
  .privacy-section p {
    color: #475569;
    line-height: 1.8;
    margin-bottom: 1rem;
    font-size: .97rem;
  }

  .privacy-principles {
    display: grid;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .privacy-principle-card {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
  }
  .privacy-principle-icon {
    font-size: 1.6rem;
    flex-shrink: 0;
    line-height: 1;
    margin-top: .1rem;
  }
  .privacy-principle-card h3 {
    font-size: 1rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 .35rem;
  }
  .privacy-principle-card p {
    font-size: .9rem;
    color: #475569;
    margin: 0;
    line-height: 1.6;
  }

  .privacy-nodo-list {
    display: grid;
    gap: .75rem;
    margin-top: 1.5rem;
  }
  .privacy-nodo-item {
    display: flex;
    align-items: center;
    gap: .75rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    color: #166534;
    font-size: .95rem;
    font-weight: 500;
  }
  .privacy-nodo-item .nodo-check {
    width: 22px;
    height: 22px;
    background: #22c55e;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: .75rem;
    flex-shrink: 0;
  }

  .privacy-export-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .privacy-export-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    text-align: center;
    box-shadow: 0 2px 6px rgba(0,0,0,.04);
  }
  .privacy-export-card .export-icon { font-size: 2rem; margin-bottom: .5rem; }
  .privacy-export-card h4 { font-size: .9rem; font-weight: 700; color: #0f172a; margin: 0 0 .25rem; }
  .privacy-export-card p { font-size: .8rem; color: #64748b; margin: 0; }

  .privacy-contact-form {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 2rem;
    margin-top: 1.5rem;
  }
  .privacy-contact-form .form-row {
    margin-bottom: 1.25rem;
  }
  .privacy-contact-form label {
    display: block;
    font-size: .85rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: .35rem;
  }
  .privacy-contact-form input,
  .privacy-contact-form select,
  .privacy-contact-form textarea {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: .65rem .9rem;
    font-size: .95rem;
    color: #1e293b;
    background: #fff;
    font-family: inherit;
    outline: none;
    transition: border-color .15s, box-shadow .15s;
    box-sizing: border-box;
  }
  .privacy-contact-form input:focus,
  .privacy-contact-form select:focus,
  .privacy-contact-form textarea:focus {
    border-color: #4F46E5;
    box-shadow: 0 0 0 3px rgba(79,70,229,.12);
  }
  .privacy-contact-form textarea { resize: vertical; min-height: 100px; }

  .privacy-faq {
    margin-top: 1.5rem;
  }
  .privacy-faq-item {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: .75rem;
    overflow: hidden;
  }
  .privacy-faq-question {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.25rem;
    font-size: .95rem;
    font-weight: 600;
    color: #0f172a;
    cursor: pointer;
    background: #fff;
    border: none;
    width: 100%;
    text-align: left;
    font-family: inherit;
  }
  .privacy-faq-question:hover { background: #f8fafc; }
  .privacy-faq-answer {
    padding: 0 1.25rem 1.25rem;
    font-size: .92rem;
    color: #475569;
    line-height: 1.75;
    background: #fff;
  }
  .privacy-faq-chevron { transition: transform .2s; flex-shrink: 0; }
  .privacy-faq-chevron.open { transform: rotate(180deg); }

  .privacy-cta-btn {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    background: linear-gradient(135deg,#4F46E5,#7c3aed);
    color: #fff;
    border-radius: 10px;
    padding: .75rem 1.5rem;
    font-size: .95rem;
    font-weight: 700;
    text-decoration: none;
    transition: opacity .15s;
    margin-top: 1rem;
  }
  .privacy-cta-btn:hover { opacity: .88; }

  .privacy-submit-btn {
    background: linear-gradient(135deg,#4F46E5,#7c3aed);
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: .8rem 2rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: opacity .15s;
  }
  .privacy-submit-btn:hover { opacity: .88; }
  .privacy-submit-btn:disabled { opacity: .6; cursor: not-allowed; }

  .privacy-success-banner {
    background: #f0fdf4;
    border: 1px solid #86efac;
    color: #166534;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    font-size: .95rem;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: .5rem;
  }

  @media (max-width: 640px) {
    .privacy-export-grid { grid-template-columns: repeat(2, 1fr); }
  }
`;

const FAQS = [
  {
    q: 'What data do you collect?',
    a: 'We collect only what is needed to provide the service — assessment responses, your email address for account creation, and team membership data. We do not collect or store sensitive personal data beyond what you submit in assessments.'
  },
  {
    q: 'Who owns the assessment and team data?',
    a: 'Your team owns your data. We provide the platform and tools; you manage, store, and export your results. The Resilience Atlas is a self-service platform — teams are responsible for their own data management and record-keeping.'
  },
  {
    q: 'Do you track individual usage or behavior?',
    a: 'No. We do not monitor individual usage patterns or retain behavioral analytics on your behalf. Our platform delivers the tools; what teams do with those tools is entirely their own business.'
  },
  {
    q: 'How can I export or download my data?',
    a: 'All Teams tiers include data export features. You can download assessment results as CSV, generate team reports as PDFs, and export member lists directly from your team dashboard. Your data belongs to you — you can download it at any time.'
  },
  {
    q: 'How do I delete my account or results?',
    a: 'You can request account deletion by emailing support@theresilienceatlas.com. Include your account email and the specific data you want removed. We will process deletion requests promptly.'
  },
  {
    q: 'What support is available?',
    a: 'The Resilience Atlas is a self-service platform. Enterprise customers may email us for access or setup issues. For all other tiers, the platform is designed to be fully self-managed with no ongoing support required.'
  },
];

export default function PrivacyPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [formState, setFormState] = useState({ name: '', email: '', company: '', issueType: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Privacy & Data Control — The Resilience Atlas™';
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  }, []);

  function handleFormChange(e) {
    setFormState(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formState, source: 'privacy-page' }),
      });
    } catch (_) {}
    setSubmitting(false);
    setSubmitted(true);
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <a href="#main-content" className="skip-link">Skip to main content</a>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          <a className="logo" href="/">
            <div className="logo-icon" aria-hidden="true">
              <img src="/assets/compass-icon.svg" alt="The Resilience Atlas™" width="36" height="36" />
            </div>
            The Resilience Atlas&#8482;
          </a>
          <nav className="header-nav" aria-label="Main navigation">
            <a href="/" className="nav-link">Home</a>
            <a href="/assessment" className="nav-link">Assessment</a>
            <a href="/teams" className="nav-link">Teams</a>
            <a href="/about" className="nav-link">About</a>
            <button className="theme-toggle" aria-label="Switch to dark mode" aria-pressed="false" title="Toggle dark mode"></button>
            <a className="btn btn-primary" href="/quiz">Take the Assessment</a>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="privacy-hero" aria-labelledby="privacy-hero-heading">
        <span className="hero-eyebrow">Privacy &amp; Data Control</span>
        <h1 id="privacy-hero-heading">You own your data.<br/>We keep it simple.</h1>
        <p className="hero-sub">
          The Resilience Atlas is a self-service platform. Teams manage their own data,
          exports, and results. We provide the tools — you stay in control.
        </p>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main id="main-content" className="privacy-content">

        {/* Section 1: Data Ownership */}
        <section className="privacy-section" aria-labelledby="data-ownership-heading">
          <p className="privacy-section-eyebrow">Data Ownership</p>
          <h2 id="data-ownership-heading">Teams Are Responsible for Their Data</h2>
          <p>
            Each team owns and manages their own assessment results, team data, and member
            information. The Resilience Atlas provides the platform and assessment tools —
            your team is responsible for managing, exporting, and storing your data.
          </p>
          <p>
            We encourage all teams to regularly download their results and keep records on
            their own systems. All data exports are self-service and available directly from
            your team dashboard.
          </p>

          <div className="privacy-principles">
            <div className="privacy-principle-card">
              <div className="privacy-principle-icon">🔐</div>
              <div>
                <h3>You own your team's results</h3>
                <p>Assessment data belongs to your team. Export it, store it, and manage it entirely on your end.</p>
              </div>
            </div>
            <div className="privacy-principle-card">
              <div className="privacy-principle-icon">📥</div>
              <div>
                <h3>All data exports are on the team</h3>
                <p>Download your results as CSV, PDFs, or bulk exports anytime from your dashboard. No waiting, no requests.</p>
              </div>
            </div>
            <div className="privacy-principle-card">
              <div className="privacy-principle-icon">⚙️</div>
              <div>
                <h3>Self-service management</h3>
                <p>Add members, manage your team, and configure settings — all without needing our involvement.</p>
              </div>
            </div>
          </div>

          <a className="privacy-cta-btn" href="/teams/resources" aria-label="Go to Teams Resource Center to download your data">
            ↓ Teams Resource Center
          </a>
        </section>

        {/* Section 2: What We Don't Do */}
        <section className="privacy-section" aria-labelledby="no-tracking-heading">
          <p className="privacy-section-eyebrow">Our Commitment</p>
          <h2 id="no-tracking-heading">We Don't Track or Retain Analytics on Your End</h2>
          <p>
            We collect only what's necessary to operate the platform. We don't build
            profiles, track individual behavior, or retain analytics data on your behalf.
          </p>

          <div className="privacy-nodo-list" role="list" aria-label="What we do not do">
            {[
              "We don't track or retain analytics on your end",
              "We don't monitor individual usage patterns",
              "We don't share your data with third parties",
              "We don't store sensitive data longer than necessary",
              "We don't require ongoing data management on your behalf",
            ].map(item => (
              <div className="privacy-nodo-item" role="listitem" key={item}>
                <span className="nodo-check" aria-hidden="true">✓</span>
                {item}
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Data Exports */}
        <section className="privacy-section" aria-labelledby="exports-heading">
          <p className="privacy-section-eyebrow">Data Exports &amp; Downloads</p>
          <h2 id="exports-heading">Download Everything, Anytime</h2>
          <p>
            All Teams tiers include full data export capabilities. Your team can download
            all assessment data, reports, and resources directly from the platform.
          </p>

          <div className="privacy-export-grid" role="list" aria-label="Available export formats">
            {[
              { icon: '📊', title: 'Assessment Results', desc: 'CSV / Excel' },
              { icon: '👥', title: 'Member List', desc: 'CSV / Excel' },
              { icon: '📄', title: 'Team Reports', desc: 'PDF' },
              { icon: '📦', title: 'Facilitation Resources', desc: 'ZIP bundle' },
            ].map(item => (
              <div className="privacy-export-card" role="listitem" key={item.title}>
                <div className="export-icon" aria-hidden="true">{item.icon}</div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>

          <a className="privacy-cta-btn" href="/team-analytics" aria-label="Open team dashboard to download your data">
            Open Team Dashboard →
          </a>
        </section>

        {/* Section 4: Enterprise Support */}
        <section className="privacy-section" aria-labelledby="enterprise-heading">
          <p className="privacy-section-eyebrow">Enterprise Support</p>
          <h2 id="enterprise-heading">Enterprise Users: Email Support for Access Issues</h2>
          <p>
            Enterprise customers may contact us by email for access or setup issues only.
            We are not able to provide ongoing data management, data recovery, or general
            support outside of enterprise access questions.
          </p>

          <div className="privacy-contact-form" role="form" aria-label="Enterprise support contact form">
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', color: '#0f172a' }}>Enterprise Access &amp; Setup Inquiry</h3>
            {submitted ? (
              <div className="privacy-success-banner" role="status" aria-live="polite">
                <span aria-hidden="true">✅</span>
                Thanks! We've received your message and will be in touch shortly regarding your enterprise access issue.
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} noValidate>
                <div className="form-row">
                  <label htmlFor="privacy-name">Your Name <span aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    id="privacy-name"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Jane Smith"
                    value={formState.name}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="privacy-email">Work Email <span aria-hidden="true">*</span></label>
                  <input
                    type="email"
                    id="privacy-email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="jane@yourcompany.com"
                    value={formState.email}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="privacy-company">Company / Organization <span aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    id="privacy-company"
                    name="company"
                    required
                    autoComplete="organization"
                    placeholder="Acme Corp"
                    value={formState.company}
                    onChange={handleFormChange}
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="privacy-issue">Issue Type <span aria-hidden="true">*</span></label>
                  <select
                    id="privacy-issue"
                    name="issueType"
                    required
                    value={formState.issueType}
                    onChange={handleFormChange}
                  >
                    <option value="">Select an issue type</option>
                    <option value="access">Account Access Issue</option>
                    <option value="setup">Initial Setup Help</option>
                    <option value="sso">SSO / SAML Configuration</option>
                    <option value="billing">Billing / License Question</option>
                    <option value="other">Other Enterprise Question</option>
                  </select>
                </div>
                <div className="form-row">
                  <label htmlFor="privacy-message">Brief Description</label>
                  <textarea
                    id="privacy-message"
                    name="message"
                    placeholder="Briefly describe your access or setup issue…"
                    value={formState.message}
                    onChange={handleFormChange}
                  />
                </div>
                <button
                  type="submit"
                  className="privacy-submit-btn"
                  disabled={submitting || !formState.name || !formState.email || !formState.company || !formState.issueType}
                >
                  {submitting ? 'Sending…' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Section 5: Account Deletion */}
        <section className="privacy-section" aria-labelledby="deletion-heading">
          <p className="privacy-section-eyebrow">Account &amp; Data Deletion</p>
          <h2 id="deletion-heading">Delete Your Account or Results</h2>
          <p>
            You can request deletion of your account or assessment results at any time.
            Send a deletion request to{' '}
            <a href="mailto:support@theresilienceatlas.com" style={{ color: '#4F46E5', fontWeight: 600 }}>
              support@theresilienceatlas.com
            </a>{' '}
            with your account email and the specific data you want removed.
          </p>
          <p>
            We will process deletion requests promptly. Once deleted, data cannot be
            recovered — we recommend downloading any results you want to keep before
            requesting deletion.
          </p>
        </section>

        {/* Section 6: FAQ */}
        <section aria-labelledby="faq-heading">
          <p className="privacy-section-eyebrow">Questions</p>
          <h2 id="faq-heading">Frequently Asked Questions</h2>
          <p>Common questions about data handling and privacy on the Resilience Atlas platform.</p>

          <div className="privacy-faq" role="list" aria-label="Privacy FAQ">
            {FAQS.map((faq, i) => (
              <div key={i} className="privacy-faq-item" role="listitem">
                <button
                  type="button"
                  className="privacy-faq-question"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  {faq.q}
                  <svg
                    className={`privacy-faq-chevron${openFaq === i ? ' open' : ''}`}
                    width="20" height="20" viewBox="0 0 20 20" fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path d="M5 7.5l5 5 5-5" stroke="#64748b" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="privacy-faq-answer" role="region" aria-label={faq.q}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="site-footer" role="contentinfo">
        <nav className="footer-nav" aria-label="Footer navigation">
          <div className="footer-nav-group">
            <strong className="footer-nav-heading">Assessment</strong>
            <a href="/assessment">About the Assessment</a>
            <a href="/results">My Results</a>
          </div>
          <div className="footer-nav-group">
            <strong className="footer-nav-heading">Programs</strong>
            <a href="/teams">For Teams</a>
            <a href="/kids">For Kids</a>
          </div>
          <div className="footer-nav-group">
            <strong className="footer-nav-heading">Company</strong>
            <a href="/about">About</a>
            <a href="/research">Research</a>
            <a href="/founder">Founder</a>
          </div>
          <div className="footer-nav-group">
            <strong className="footer-nav-heading">Legal</strong>
            <a href="/privacy" aria-current="page">Privacy &amp; Data Control</a>
          </div>
        </nav>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} The Resilience Atlas&#8482;</p>
          <p className="mt-2">The Resilience Atlas&#8482; is a trademark of <strong>Janeen Molchany Ph.D., BCBA</strong>.</p>
        </div>
      </footer>
    </>
  );
}
