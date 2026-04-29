import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

const styles = `
    .founder-hero {
      background: linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%);
      color: #fff;
      padding: 5rem 1.5rem 4rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .founder-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 30% 70%, rgba(124,58,237,.2) 0%, transparent 60%);
      pointer-events: none;
    }
    .founder-hero .hero-eyebrow {
      display: inline-block;
      background: rgba(79,70,229,.3);
      color: #a5b4fc;
      font-size: .8rem;
      font-weight: 700;
      letter-spacing: .1em;
      text-transform: uppercase;
      padding: .35rem 1rem;
      border-radius: 999px;
      margin-bottom: 1.5rem;
    }
    .founder-hero-avatar {
      width: 120px; height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      color: #fff;
      margin: 0 auto 1.5rem;
      border: 3px solid rgba(165,180,252,.3);
    }
    .founder-hero h1 {
      color: #fff;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
      margin-bottom: .5rem;
      line-height: 1.15;
    }
    .founder-hero .founder-title-hero {
      color: #a5b4fc;
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
    }
    .founder-creds-hero {
      display: flex;
      flex-wrap: wrap;
      gap: .6rem;
      justify-content: center;
    }
    .founder-creds-hero .cred-badge {
      background: rgba(255,255,255,.1);
      color: #e2e8f0;
      font-size: .8rem;
      font-weight: 600;
      padding: .3rem .85rem;
      border-radius: 999px;
      border: 1px solid rgba(255,255,255,.15);
    }

    .founder-content {
      max-width: 820px;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }

    .founder-section {
      margin-bottom: 3.5rem;
    }
    .founder-section h2 {
      font-size: 1.5rem;
      color: var(--slate-900);
      margin-bottom: 1rem;
      padding-bottom: .5rem;
      border-bottom: 2px solid var(--slate-100);
    }
    .founder-section p {
      color: var(--slate-600);
      line-height: 1.8;
      margin-bottom: 1rem;
      font-size: .97rem;
    }

    .pullquote {
      background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%);
      border-left: 4px solid #4F46E5;
      border-radius: 0 12px 12px 0;
      padding: 1.75rem 2rem;
      margin: 2rem 0;
    }
    .pullquote p {
      font-size: 1.15rem;
      font-style: italic;
      font-weight: 500;
      color: #3730a3;
      line-height: 1.7;
      margin: 0;
    }

    .credentials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .credential-card {
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.5rem;
    }
    .credential-card .cred-icon {
      width: 40px;
      height: 40px;
      margin-bottom: .6rem;
    }
    .credential-card h4 {
      font-size: .95rem;
      font-weight: 700;
      color: var(--slate-800);
      margin-bottom: .35rem;
    }
    .credential-card p {
      font-size: .85rem;
      color: var(--slate-500);
      margin: 0;
      line-height: 1.6;
    }

    .population-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .population-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
    }
    .population-card .pop-icon { width: 40px; height: 40px; margin: 0 auto .5rem; }
    .population-card h4 {
      font-size: .9rem;
      font-weight: 700;
      color: #075985;
      margin-bottom: .3rem;
    }
    .population-card p {
      font-size: .82rem;
      color: #0369a1;
      margin: 0;
      line-height: 1.5;
    }

    .publication-card {
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.75rem;
      margin-top: 1.25rem;
    }
    .publication-card .pub-year {
      font-size: .75rem;
      font-weight: 700;
      color: #4F46E5;
      letter-spacing: .08em;
      text-transform: uppercase;
      margin-bottom: .4rem;
    }
    .publication-card h4 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--slate-800);
      margin-bottom: .5rem;
      line-height: 1.4;
    }
    .publication-card p {
      font-size: .88rem;
      color: var(--slate-500);
      margin: 0;
      line-height: 1.65;
    }
    .publication-card .pub-metrics {
      display: flex;
      flex-wrap: wrap;
      gap: .6rem;
      margin-top: 1rem;
    }
    .pub-metric {
      background: #ede9fe;
      color: #5b21b6;
      font-size: .78rem;
      font-weight: 600;
      padding: .25rem .65rem;
      border-radius: 999px;
    }

    .cta-band {
      background: #4F46E5;
      color: #fff;
      text-align: center;
      padding: 4rem 1.5rem;
    }
    .cta-band h2 { font-size: clamp(1.4rem, 3vw, 1.9rem); margin-bottom: 1rem; }
    .cta-band p { color: rgba(255,255,255,.8); max-width: 520px; margin: 0 auto 2rem; line-height: 1.7; }
    .cta-band .btn-white {
      background: #fff;
      color: #4F46E5;
      font-weight: 700;
      padding: .85rem 2rem;
      border-radius: 10px;
      text-decoration: none;
      display: inline-block;
      margin: .4rem;
    }
    .cta-band .btn-white:hover { background: #e8e7fe; }
    .cta-band .btn-outline {
      background: transparent;
      color: #fff;
      font-weight: 600;
      padding: .85rem 2rem;
      border-radius: 10px;
      text-decoration: none;
      display: inline-block;
      border: 2px solid rgba(255,255,255,.5);
      margin: .4rem;
    }
    .cta-band .btn-outline:hover { border-color: #fff; }

    .perspective-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-top: 1.25rem;
    }
    .perspective-card {
      background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
      border: 1px solid #fbbf24;
      border-radius: 12px;
      padding: 1.75rem;
      text-align: center;
    }
    .perspective-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 0.75rem;
    }
    .perspective-card h4 {
      font-size: 0.95rem;
      font-weight: 700;
      color: #92400e;
      margin: 0 0 0.6rem;
    }
    .perspective-card p {
      font-size: 0.88rem;
      color: #b45309;
      margin: 0;
      line-height: 1.65;
    }

    @media (max-width: 640px) {
      .founder-creds-hero { gap: .4rem; }
    }

    .dimensions-table {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-top: 1.25rem;
    }

    .dimension-row {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .dim-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
    }

    .dim-content {
      flex: 1;
    }

    .dim-content h4 {
      font-size: .95rem;
      font-weight: 700;
      color: var(--slate-800);
      margin: 0 0 .4rem;
    }

    .dim-desc {
      font-size: .88rem;
      color: var(--slate-600);
      margin: 0 0 .4rem;
      line-height: 1.6;
    }

    .dim-lens {
      font-size: .85rem;
      color: #4F46E5;
      margin: 0;
      font-style: italic;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-top: 1.25rem;
    }

    .product-card {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid #bae6fd;
      border-radius: 12px;
      padding: 1.75rem;
    }

    .product-icon {
      width: 56px;
      height: 56px;
      margin-bottom: .75rem;
    }

    .product-card h4 {
      font-size: 1rem;
      font-weight: 700;
      color: #075985;
      margin: 0 0 .6rem;
      line-height: 1.3;
    }

    .product-card p {
      font-size: .88rem;
      color: #0369a1;
      margin: 0;
      line-height: 1.65;
    }

    .integration-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.25rem;
      margin-top: 1.25rem;
    }

    .integration-card {
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.75rem;
    }

    .integration-card h4 {
      font-size: .95rem;
      font-weight: 700;
      color: var(--slate-800);
      margin: 0 0 .6rem;
    }

    .integration-card p {
      font-size: .88rem;
      color: var(--slate-600);
      margin: 0;
      line-height: 1.65;
    }

    .quote-card {
      background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%);
      border-left: 4px solid #4F46E5;
      border-radius: 0 12px 12px 0;
      padding: 1.25rem 1.75rem;
      margin-bottom: 1rem;
    }

    .quote-card p {
      font-size: .95rem;
      font-style: italic;
      color: #3730a3;
      line-height: 1.7;
      margin: 0;
    }

    /* ── Dark Mode ─────────────────────────────────────────── */
    [data-theme="dark"] .credential-card,
    [data-theme="dark"] .publication-card {
      background: #ffffff;
      border-color: #e2e8f0;
    }
    [data-theme="dark"] .credential-card h4 { color: #1e293b; }
    [data-theme="dark"] .credential-card p { color: #475569; }
    [data-theme="dark"] .founder-section h2 { color: var(--slate-900, #f1f5f9); border-bottom-color: var(--slate-200, #334155); }
    [data-theme="dark"] .founder-section p { color: var(--slate-600, #94a3b8); }
    [data-theme="dark"] .publication-card h4 { color: #1e293b; }
    [data-theme="dark"] .publication-card p { color: #475569; }
    [data-theme="dark"] .pullquote { background: rgba(79,70,229,.15); border-left-color: #818cf8; }
    [data-theme="dark"] .pullquote p { color: #a5b4fc; }
    [data-theme="dark"] .population-card { background: #ffffff; border-color: #e2e8f0; }
    [data-theme="dark"] .population-card h4 { color: #1e40af; }
    [data-theme="dark"] .population-card p { color: #1d4ed8; }
    [data-theme="dark"] .perspective-card { background: #ffffff; border-color: #fbbf24; }
    [data-theme="dark"] .perspective-card h4 { color: #92400e; }
    [data-theme="dark"] .perspective-card p { color: #b45309; }
    [data-theme="dark"] .dimension-row,
    [data-theme="dark"] .integration-card {
      background: #ffffff;
      border-color: #e2e8f0;
    }
    [data-theme="dark"] .dim-content h4,
    [data-theme="dark"] .integration-card h4 { color: #1e293b; }
    [data-theme="dark"] .dim-desc,
    [data-theme="dark"] .integration-card p { color: #475569; }
    [data-theme="dark"] .product-card {
      background: #ffffff;
      border-color: #e2e8f0;
    }
    [data-theme="dark"] .product-card h4 { color: #1e40af; }
    [data-theme="dark"] .product-card p { color: #1d4ed8; }
    [data-theme="dark"] .quote-card {
      background: rgba(79,70,229,.15);
      border-left-color: #818cf8;
    }
    [data-theme="dark"] .quote-card p { color: #a5b4fc; }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) .credential-card,
      :root:not([data-theme="light"]) .publication-card { background: #ffffff; border-color: #e2e8f0; }
      :root:not([data-theme="light"]) .credential-card h4 { color: #1e293b; }
      :root:not([data-theme="light"]) .credential-card p { color: #475569; }
      :root:not([data-theme="light"]) .founder-section h2 { color: #f1f5f9; border-bottom-color: #334155; }
      :root:not([data-theme="light"]) .founder-section p { color: #94a3b8; }
      :root:not([data-theme="light"]) .publication-card h4 { color: #1e293b; }
      :root:not([data-theme="light"]) .publication-card p { color: #475569; }
      :root:not([data-theme="light"]) .pullquote { background: rgba(79,70,229,.15); border-left-color: #818cf8; }
      :root:not([data-theme="light"]) .pullquote p { color: #a5b4fc; }
      :root:not([data-theme="light"]) .population-card { background: #ffffff; border-color: #e2e8f0; }
      :root:not([data-theme="light"]) .population-card h4 { color: #1e40af; }
      :root:not([data-theme="light"]) .population-card p { color: #1d4ed8; }
      :root:not([data-theme="light"]) .perspective-card { background: #ffffff; border-color: #fbbf24; }
      :root:not([data-theme="light"]) .perspective-card h4 { color: #92400e; }
      :root:not([data-theme="light"]) .perspective-card p { color: #b45309; }
      :root:not([data-theme="light"]) .dimension-row,
      :root:not([data-theme="light"]) .integration-card { background: #ffffff; border-color: #e2e8f0; }
      :root:not([data-theme="light"]) .dim-content h4,
      :root:not([data-theme="light"]) .integration-card h4 { color: #1e293b; }
      :root:not([data-theme="light"]) .dim-desc,
      :root:not([data-theme="light"]) .integration-card p { color: #475569; }
      :root:not([data-theme="light"]) .product-card { background: #ffffff; border-color: #e2e8f0; }
      :root:not([data-theme="light"]) .product-card h4 { color: #1e40af; }
      :root:not([data-theme="light"]) .product-card p { color: #1d4ed8; }
      :root:not([data-theme="light"]) .quote-card { background: rgba(79,70,229,.15); border-left-color: #818cf8; }
      :root:not([data-theme="light"]) .quote-card p { color: #a5b4fc; }
    }
`;

export default function FounderPage() {
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

      <a href="#main-content" className="skip-link">Skip to main content</a>

      <SiteHeader activePage="about" />
      <DarkModeHint />

      {/* Hero */}
      <section className="founder-hero" aria-labelledby="founder-heading">
        <span className="hero-eyebrow">Our Founder</span>
        <div className="founder-hero-avatar" aria-hidden="true">J</div>
        <h1 id="founder-heading">Janeen Molchany</h1>
        <p className="founder-title-hero">Owner, Developer, and Researcher &mdash; The Resilience Atlas&#8482;</p>
        <div className="founder-creds-hero" role="list" aria-label="Credentials">
          <span className="cred-badge" role="listitem">Ph.D.</span>
          <span className="cred-badge" role="listitem">BCBA</span>
          <span className="cred-badge" role="listitem">Foster Care Alumna</span>
          <span className="cred-badge" role="listitem">Neurodivergent Family</span>
          <span className="cred-badge" role="listitem">Autistic Teen Parent</span>
          <span className="cred-badge" role="listitem">Published Researcher</span>
          <span className="cred-badge" role="listitem">Author</span>
        </div>
      </section>

      <main id="main-content">
        <div className="founder-content">

          {/* Personal Journey */}
          <section className="founder-section" aria-labelledby="journey-heading">
            <h2 id="journey-heading">The Map Comes from Real Navigation</h2>
            <p>
              Janeen Molchany's journey to founding The Resilience Atlas&#8482; did not begin in an office
              or a laboratory. It began in the foster care system.
            </p>
            <p>
              As a foster care alumna, Janeen experienced firsthand the kind of adversity that many
              resilience researchers study from a distance. She lived the uncertainty, the disruption, the
              grief, and — equally — the extraordinary capacity that human beings have to adapt, recover,
              and grow through circumstances that would challenge anyone.
            </p>
            <p>
              That lived experience planted a question that would guide her entire career: <em>What makes
              resilience possible? And why are some people able to navigate hardship and emerge transformed,
              while others feel stuck?</em>
            </p>
            <div className="pullquote">
              <p>
                "I didn't just study resilience. I lived it. And I knew that if we could understand it —
                really understand it, across all its dimensions — we could help people cultivate it on purpose."
              </p>
            </div>
            <p>
              That question became a doctoral dissertation. The dissertation became a framework. And the
              framework — after more than a decade of refinement — became The Resilience Atlas&#8482;.
            </p>
          </section>

          {/* Professional Background */}
          <section className="founder-section" aria-labelledby="background-heading">
            <h2 id="background-heading">Professional Background &amp; Credentials</h2>
            <p>
              Janeen Molchany holds a doctorate (Ph.D.) and is a Board Certified Behavior Analyst (BCBA),
              one of the most rigorous professional certifications in behavioral science. The BCBA
              credential requires graduate-level coursework, supervised clinical experience, and a
              comprehensive examination demonstrating expertise in evidence-based behavioral principles.
            </p>
            <div className="credentials-grid" role="list" aria-label="Professional credentials">
              <div className="credential-card" role="listitem">
                <div className="cred-icon" aria-hidden="true"><img src="/icons/compass.svg" alt="" className="icon icon-md" /></div>
                <h4>Doctor of Philosophy (Ph.D.)</h4>
                <p>Doctoral research focused on multidimensional models of resilience. Published dissertation (2013) drawing on 18 resilience exemplars and 6 psychometric assessments.</p>
              </div>
              <div className="credential-card" role="listitem">
                <div className="cred-icon" aria-hidden="true"><img src="/icons/checkmark.svg" alt="" className="icon icon-md" /></div>
                <h4>Board Certified Behavior Analyst (BCBA)</h4>
                <p>Nationally recognized certification in evidence-based behavioral science. Expertise in assessment, intervention design, and data-driven practice.</p>
              </div>
              <div className="credential-card" role="listitem">
                <div className="cred-icon" aria-hidden="true"><img src="/icons/cognitive-narrative.svg" alt="" className="icon icon-md" /></div>
                <h4>Published Researcher</h4>
                <p>Author of a published doctoral dissertation (2013) establishing the six-dimension resilience model that underpins the entire Resilience Atlas framework.</p>
              </div>
              <div className="credential-card" role="listitem">
                <div className="cred-icon" aria-hidden="true"><img src="/icons/emotional-adaptive.svg" alt="" className="icon icon-md" /></div>
                <h4>Foster Care Alumna</h4>
                <p>Personal experience in the foster care system provides unique insight into adversity, resilience, and the human capacity for growth through hardship.</p>
              </div>
            </div>
          </section>

          {/* Clinical Experience */}
          <section className="founder-section" aria-labelledby="clinical-heading">
            <h2 id="clinical-heading">Working with Vulnerable Populations</h2>
            <p>
              Before founding The Resilience Atlas&#8482;, Janeen spent years working directly with vulnerable
              populations as a Board Certified Behavior Analyst. That clinical experience — with real people
              facing real challenges — is woven into every dimension of the Resilience Atlas framework.
            </p>
            <div className="population-cards" role="list" aria-label="Populations served">
              <div className="population-card" role="listitem">
                <div className="pop-icon" aria-hidden="true"><img src="/icons/somatic-regulative.svg" alt="" className="icon icon-md" /></div>
                <h4>Foster Youth</h4>
                <p>Direct experience supporting foster youth through adversity, transition, and trauma-informed care.</p>
              </div>
              <div className="population-card" role="listitem">
                <div className="pop-icon" aria-hidden="true"><img src="/icons/spiritual-reflective.svg" alt="" className="icon icon-md" /></div>
                <h4>Autistic Children &amp; Families</h4>
                <p>BCBA practice with autistic children and their families, applying evidence-based behavioral science to build capacity and resilience.</p>
              </div>
              <div className="population-card" role="listitem">
                <div className="pop-icon" aria-hidden="true"><img src="/icons/relational-connective.svg" alt="" className="icon icon-md" /></div>
                <h4>Vulnerable Communities</h4>
                <p>Broader work with underserved communities, where resilience is not a luxury but a survival skill that can be systematically cultivated.</p>
              </div>
            </div>
            <p style={{marginTop: '1.5rem'}}>
              This grounding in real-world practice means The Resilience Atlas is not a purely academic
              exercise. It is an instrument designed by someone who has sat across the table from people
              in genuine need — and who knows that effective tools must be evidence-based, accessible,
              and genuinely useful.
            </p>
          </section>

          {/* The Triple Perspective */}
          <section className="founder-section" aria-labelledby="triple-perspective-heading">
            <h2 id="triple-perspective-heading">The Triple Perspective: Professional, Family Member, Parent</h2>
            <p>
              Janeen's approach to Applied Behavior Analysis is shaped by a rare combination of perspectives
              that most practitioners don't have — and that most families wish their practitioners understood.
            </p>

            <div className="perspective-grid">
              <div className="perspective-card">
                <div className="perspective-icon">
                  <img src="/icons/clinical.svg" alt="" className="icon icon-lg" />
                </div>
                <h4>As a Professional</h4>
                <p>
                  Board Certified Behavior Analyst (BCBA) with 20+ years of clinical practice. She knows
                  the science, the assessment protocols, the intervention design, and the ethics that govern
                  evidence-based behavioral practice.
                </p>
              </div>

              <div className="perspective-card">
                <div className="perspective-icon">
                  <img src="/icons/relational-connective.svg" alt="" className="icon icon-lg" />
                </div>
                <h4>As a Family Member</h4>
                <p>
                  Janeen comes from a neurodivergent family. She didn't just study neurodivergence in a
                  clinical setting — she grew up with it, lived with it, and understands from the inside
                  what it means to navigate a world that wasn't designed for you.
                </p>
              </div>

              <div className="perspective-card">
                <div className="perspective-icon">
                  <img src="/icons/kids-spark.svg" alt="" className="icon icon-lg" />
                </div>
                <h4>As a Parent</h4>
                <p>
                  She is the parent of an autistic teen who receives ABA services. That means she knows what
                  it's like to sit on the other side of the table — the questions parents ask, the fears they
                  carry, the hope they hold, and the trust they place in practitioners.
                </p>
              </div>
            </div>

            <div className="pullquote" style={{marginTop: '1.75rem'}}>
              <p>
                "I've been the BCBA writing the treatment plan. I've been the family member navigating systems
                that don't always understand us. And I've been the parent sitting across from a clinician,
                hoping they really see my child. That triple perspective shapes everything I build — because
                I know what works, what doesn't, and what families actually need."
              </p>
            </div>

            <p style={{marginTop: '1.5rem'}}>
              This is why IATLAS integrates ABA with such care: it's not just clinically sound — it's designed
              by someone who understands the science <em>and</em> the lived reality of the families it serves.
            </p>
          </section>

          {/* Research & Dissertation */}
          <section className="founder-section" aria-labelledby="dissertation-heading">
            <h2 id="dissertation-heading">The 2013 Doctoral Dissertation</h2>
            <p>
              At the heart of The Resilience Atlas&#8482; is Janeen's published 2013 doctoral dissertation —
              a comprehensive investigation into the nature of resilience that combined multiple
              methodologies and drew on both established psychometric instruments and original qualitative data.
            </p>

            <div className="publication-card" aria-label="Doctoral dissertation details">
              <p className="pub-year">Published Research — 2013</p>
              <h4>THE VARIETIES OF RESILIENT EXPERIENCE: AN INTEGRAL INQUIRY INTO THE TYPOLOGY OF RESILIENCE</h4>
              <p>
                Doctoral dissertation by Janeen Molchany (published as Janeen Stalnaker), Ph.D., BCBA. This research identified and validated
                a six-dimension model of resilience through mixed-methods inquiry, including in-depth interviews
                with resilience exemplars and administration of validated psychometric instruments.
              </p>
              <div className="pub-metrics" role="list" aria-label="Research metrics">
                <span className="pub-metric" role="listitem">18 Resilience Exemplars Interviewed</span>
                <span className="pub-metric" role="listitem">6 Psychometric Assessments Used</span>
                <span className="pub-metric" role="listitem">6 Resilience Dimensions Identified</span>
                <span className="pub-metric" role="listitem">13+ Years of Subsequent Refinement</span>
              </div>
            </div>

            <p style={{marginTop: '1.5rem'}}>
              The dissertation's most significant contribution was the identification of resilience as
              fundamentally <strong>multidimensional</strong> — not a single trait or capacity, but a
              constellation of six interacting dimensions that each play a distinct role in how individuals
              adapt to and recover from adversity.
            </p>
          </section>

          {/* Exemplars Research */}
          <section className="founder-section" aria-labelledby="exemplars-heading">
            <h2 id="exemplars-heading">The 18 Resilience Exemplars</h2>
            <p>
              A defining feature of the original research was the study of <strong>18 resilience exemplars</strong>
              — individuals identified by their communities as demonstrating extraordinary resilience in
              the face of adversity. Through in-depth qualitative interviews, Janeen explored how these
              individuals had navigated hardship, what internal and external resources they drew upon, and
              how their resilience had developed and changed over time.
            </p>
            <p>
              The exemplars came from diverse backgrounds and had faced a wide range of adversities —
              including poverty, illness, loss, displacement, and systemic marginalization. Their stories
              revealed patterns of resilience that crossed cultures, contexts, and circumstances, providing
              the empirical foundation for the six-dimension framework.
            </p>
            <div className="pullquote">
              <p>
                "The exemplars taught me that resilience looks different in every person — but the
                underlying dimensions are remarkably consistent. Everyone I interviewed showed strength
                across some dimensions and vulnerability across others. That insight changed everything."
              </p>
            </div>
          </section>

          {/* Six Dimensions */}
          <section className="founder-section" aria-labelledby="dimensions-heading">
            <h2 id="dimensions-heading">The Six Dimensions of Resilience</h2>
            <p>
              The six dimensions weren't borrowed from existing frameworks — they emerged from
              Janeen's original 2013 doctoral research, validated through psychometric assessment
              and qualitative inquiry.
            </p>

            <div className="dimensions-table">
              <div className="dimension-row">
                <div className="dim-icon"><img src="/icons/relational-connective.svg" alt="Relational-Connective dimension icon" className="icon icon-md" /></div>
                <div className="dim-content">
                  <h4>🤝 Relational-Connective</h4>
                  <p className="dim-desc">Accessing social support and sustaining meaningful connections under stress</p>
                  <p className="dim-lens"><em>"Resilience is built in connection, not isolation."</em></p>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-icon"><img src="/icons/cognitive-narrative.svg" alt="Cognitive-Narrative dimension icon" className="icon icon-md" /></div>
                <div className="dim-content">
                  <h4>🧠 Cognitive-Narrative</h4>
                  <p className="dim-desc">Meaning-making, reframing, and maintaining adaptive thinking</p>
                  <p className="dim-lens"><em>"The stories we tell about adversity shape our capacity to grow from it."</em></p>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-icon"><img src="/icons/agentic-generative.svg" alt="Agentic-Generative dimension icon" className="icon icon-md" /></div>
                <div className="dim-content">
                  <h4>⚡ Agentic-Generative</h4>
                  <p className="dim-desc">Purposeful action, self-efficacy, and forward momentum</p>
                  <p className="dim-lens"><em>"Small, purposeful action creates momentum when everything feels stuck."</em></p>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-icon"><img src="/icons/emotional-adaptive.svg" alt="Emotional-Adaptive dimension icon" className="icon icon-md" /></div>
                <div className="dim-content">
                  <h4>💙 Emotional-Adaptive</h4>
                  <p className="dim-desc">Processing difficult emotions and adapting emotional responses</p>
                  <p className="dim-lens"><em>"Naming emotions without judgment is the first step to working with them."</em></p>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-icon"><img src="/icons/spiritual-reflective.svg" alt="Spiritual-Reflective dimension icon" className="icon icon-md" /></div>
                <div className="dim-content">
                  <h4>🙏 Spiritual-Reflective</h4>
                  <p className="dim-desc">Purpose, values, and existential grounding</p>
                  <p className="dim-lens"><em>"Purpose and meaning anchor us when everything else feels uncertain."</em></p>
                </div>
              </div>

              <div className="dimension-row">
                <div className="dim-icon"><img src="/icons/somatic-regulative.svg" alt="Somatic-Regulative dimension icon" className="icon icon-md" /></div>
                <div className="dim-content">
                  <h4>💚 Somatic-Regulative</h4>
                  <p className="dim-desc">Body awareness, physical regulation, and somatic resilience practices</p>
                  <p className="dim-lens"><em>"The body holds the stress response — and the capacity to regulate it."</em></p>
                </div>
              </div>
            </div>

            <p style={{marginTop: '1.5rem'}}>
              Each dimension has its own assessment, curriculum, intervention strategies, and measurement approaches.
            </p>
          </section>

          {/* What Janeen Created */}
          <section className="founder-section" aria-labelledby="created-heading">
            <h2 id="created-heading">What Janeen Created</h2>

            <div className="product-grid">
              <div className="product-card">
                <div className="product-icon"><img src="/icons/compass.svg" alt="Resilience Atlas compass icon" className="icon icon-lg" /></div>
                <h4>The Resilience Atlas&#8482; Assessment Platform</h4>
                <p>
                  A research-based, six-dimension resilience assessment that provides instant dimensional
                  scoring, interactive radar chart visualization, strength-first narrative reports,
                  longitudinal tracking, and shareable social cards.
                </p>
              </div>

              <div className="product-card">
                <div className="product-icon"><img src="/icons/cognitive-narrative.svg" alt="IATLAS cognitive icon" className="icon icon-lg" /></div>
                <h4>IATLAS (Integrated Applied Teaching and Learning Adaptive System)</h4>
                <p>
                  A comprehensive curriculum that bridges assessment and intervention with ABA-backed,
                  trauma-informed intervention protocols, ACT integration, age-appropriate curricula,
                  and a 4-phase cycle: Assess → Analyze → Intervene → Monitor.
                </p>
              </div>

              <div className="product-card">
                <div className="product-icon"><img src="/icons/kids-spark.svg" alt="IATLAS Kids spark icon" className="icon icon-lg" /></div>
                <h4>IATLAS Kids</h4>
                <p>
                  Age-appropriate resilience curriculum for children and families with 96 activities
                  across 4 age groups (5–7, 8–10, 11–14, 15–18), parent guides, family challenge activities,
                  gamified progress tracking, and trauma-informed design.
                </p>
              </div>

              <div className="product-card">
                <div className="product-icon"><img src="/icons/organization.svg" alt="Teams and Organizations icon" className="icon icon-lg" /></div>
                <h4>Teams &amp; Organizations</h4>
                <p>
                  Resilience tools for workplaces and groups including team resilience radar charts,
                  facilitation tools, workshop guides, role-based permissions, and 3-tier pricing
                  (Starter, Pro, Enterprise).
                </p>
              </div>
            </div>
          </section>

          {/* ABA + ACT Integration */}
          <section className="founder-section" aria-labelledby="aba-act-heading">
            <h2 id="aba-act-heading">How ABA + ACT are Integrated in IATLAS</h2>
            <p>
              The integration of Applied Behavior Analysis (ABA) and Acceptance &amp; Commitment Therapy (ACT)
              in IATLAS is deliberate — and it solves a problem that neither approach solves alone.
            </p>

            <div className="integration-grid">
              <div className="integration-card">
                <h4>Why ABA Alone Isn't Enough</h4>
                <p>
                  ABA is extraordinarily effective at <strong>teaching new behaviors</strong> — habit formation,
                  skill-building, behavioral activation. Its strengths are precision, measurement, and replicability.
                  But ABA alone doesn't address <strong>why</strong> someone would commit to a difficult behavior
                  change, especially when motivation is low or the behavior conflicts with their values.
                </p>
              </div>

              <div className="integration-card">
                <h4>Why ACT Alone Isn't Enough</h4>
                <p>
                  ACT is powerful for <strong>clarifying values</strong> and building <strong>psychological
                  flexibility</strong> — helping people move toward what matters even in the presence of discomfort.
                  But ACT alone doesn't provide the <strong>behavioral scaffolding</strong> to turn insight into
                  sustained action.
                </p>
              </div>
            </div>

            <div className="pullquote" style={{marginTop: '1.5rem'}}>
              <p>
                "IATLAS integrates both: ACT provides direction (values work clarifies why), ABA provides
                structure (shaping, reinforcement builds the skill), ACT removes cognitive barriers
                (defusion work), and ABA strengthens persistence (reinforcement schedules). The result
                is a resilience intervention that's behaviorally precise and personally meaningful.
                Neither framework alone gets you there. Together, they're extraordinarily powerful."
              </p>
            </div>
          </section>

          {/* Core Philosophy */}
          <section className="founder-section" aria-labelledby="philosophy-heading">
            <h2 id="philosophy-heading">Core Philosophy</h2>

            <div className="pullquote">
              <p style={{fontSize: '1.3rem', fontWeight: 700}}>
                "This is a map, not the territory."
              </p>
            </div>

            <p>
              The Resilience Atlas&#8482; doesn't tell you where you <em>should</em> be. It shows you where
              you <em>are</em> — across six interconnected dimensions of resilience. It's a starting
              point, not a judgment. A snapshot, not a diagnosis. A tool for navigation, not a label.
            </p>

            <p>
              That philosophy comes from Janeen's lived experience: resilience is not something you
              either have or don't. It's multidimensional, dynamic, and cultivated through deliberate
              practice — and everyone deserves an honest map of their own inner terrain.
            </p>

            <h3 style={{fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '.75rem'}}>Core Mission</h3>
            <div className="pullquote">
              <p>
                "To make the science of resilience <strong>legible, personal, and actionable</strong> —
                so that every person can understand, cultivate, and share their capacity to grow through adversity."
              </p>
            </div>

            <p>
              That mission is especially close to Janeen's heart for the populations she knows best:
              foster youth, families navigating disability, communities facing systemic adversity, and
              anyone who has ever wondered whether they have what it takes to navigate what life has
              thrown at them.
            </p>

            <p>
              <strong>The Resilience Atlas&#8482;</strong> is here to help you map your current resilience,
              identify your strengths, and build capacity in the dimensions that matter most to you.
            </p>
            <div className="pullquote" style={{marginTop: '1.5rem'}}>
              <p>
                "I've been the BCBA, the family member, and the parent. That triple perspective — across
                professional practice, lived neurodivergent experience, and raising an autistic teen — shapes
                everything I build. I know what works, what doesn't, and what families actually need."
              </p>
            </div>
          </section>

          {/* Quick Quotes */}
          <section className="founder-section" aria-labelledby="quotes-heading">
            <h2 id="quotes-heading">Quick Quotes for Media</h2>

            <div className="quote-card">
              <p>
                "I didn't just study resilience. I lived it. The Resilience Atlas&#8482; exists because every
                person deserves a map of their own inner strength — and the tools to cultivate it."
              </p>
            </div>

            <div className="quote-card">
              <p>
                "Resilience is not a single trait you either have or don't. It's a constellation of six
                distinct capacities — each one reflecting a different way the human mind, body, and
                spirit respond to adversity."
              </p>
            </div>

            <div className="quote-card">
              <p>
                "The six dimensions weren't borrowed from existing frameworks. They emerged from my 2013
                doctoral research — interviews with 18 resilience exemplars and administration of 6
                psychometric assessments. Thirteen years later, that research is now a platform used
                by thousands."
              </p>
            </div>

            <div className="quote-card">
              <p>
                "IATLAS integrates ABA and ACT because neither approach alone solves the problem. ABA
                teaches <em>how</em> to build the skill. ACT clarifies <em>why</em> it matters. Together,
                they're extraordinarily powerful."
              </p>
            </div>
          </section>

        </div>
      </main>

      {/* CTA */}
      <section className="cta-band" aria-label="Explore the Resilience Atlas">
        <h2>Navigate the Framework Janeen Built</h2>
        <p>Explore your resilience map, grounded in 13 years of doctoral research and lived experience.</p>
        <a className="btn-white" href="/quiz" title="For adults 18+">Explore Your Map <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span></a>
        <a className="btn-outline" href="/research">Navigate the Research</a>
        <a className="btn-outline" href="/about">About the Atlas</a>
      </section>
    </>
  );
}
