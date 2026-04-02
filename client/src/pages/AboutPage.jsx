import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';

const styles = `
    .about-hero {
      background: linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%);
      color: #fff;
      padding: 5rem 1.5rem 4rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .about-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 70% 30%, rgba(79,70,229,.25) 0%, transparent 60%);
      pointer-events: none;
    }
    .about-hero .hero-tagline {
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
    .about-hero h1 { color: #fff; font-size: clamp(1.8rem, 4vw, 2.8rem); margin-bottom: .75rem; line-height: 1.2; }
    .about-hero .hero-sub { color: #cbd5e1; font-size: 1.05rem; max-width: 580px; margin: 0 auto 1.5rem; line-height: 1.7; }
    .about-hero .hero-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: center;
      margin-top: 2rem;
    }
    .about-hero .stat-item {
      text-align: center;
    }
    .about-hero .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: #a5b4fc;
      line-height: 1;
    }
    .about-hero .stat-label {
      display: block;
      font-size: .8rem;
      color: #cbd5e1;
      margin-top: .3rem;
    }

    .about-content {
      max-width: 840px;
      margin: 0 auto;
      padding: 4rem 1.5rem;
    }

    .founder-block {
      display: flex;
      gap: 2.5rem;
      align-items: flex-start;
      margin-bottom: 4rem;
      padding: 2.5rem;
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 16px;
      box-shadow: var(--shadow-sm);
    }
    .founder-avatar {
      flex-shrink: 0;
      width: 110px; height: 110px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4F46E5 0%, #7c3aed 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.8rem;
      color: #fff;
    }
    .founder-info h2 { font-size: 1.5rem; margin-bottom: .25rem; }
    .founder-title { color: var(--slate-700); font-size: .9rem; margin-bottom: .75rem; }
    .founder-credentials {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      margin: .5rem 0 1rem;
    }
    .credential-tag {
      background: #ede9fe;
      color: #5b21b6;
      font-size: .78rem;
      font-weight: 600;
      padding: .25rem .65rem;
      border-radius: 999px;
    }
    .founder-info p { color: var(--slate-600); line-height: 1.75; font-size: .95rem; }
    .founder-link {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      color: #4F46E5;
      font-weight: 600;
      font-size: .9rem;
      text-decoration: none;
      margin-top: .75rem;
    }
    .founder-link:hover { text-decoration: underline; }

    .about-section {
      margin-bottom: 3.5rem;
    }
    .about-section h2 {
      font-size: 1.5rem;
      color: var(--slate-900);
      margin-bottom: 1rem;
      padding-bottom: .5rem;
      border-bottom: 2px solid var(--slate-100);
    }
    .about-section p {
      color: var(--slate-600);
      line-height: 1.75;
      margin-bottom: 1rem;
    }
    .about-section ul {
      color: var(--slate-600);
      line-height: 1.75;
      padding-left: 1.5rem;
      margin-bottom: 1rem;
    }
    .about-section ul li { margin-bottom: .5rem; }

    .mission-callout {
      background: linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%);
      border-radius: 12px;
      padding: 2rem 2.5rem;
      margin: 2rem 0;
      border-left: 4px solid #4F46E5;
    }
    .mission-callout p {
      font-size: 1.15rem;
      font-weight: 500;
      color: #3730a3;
      line-height: 1.75;
      margin: 0;
      font-style: italic;
    }

    .framework-pills {
      display: flex;
      flex-wrap: wrap;
      gap: .6rem;
      margin-top: 1rem;
    }
    .framework-pill {
      background: var(--slate-100);
      color: var(--slate-700);
      font-size: .85rem;
      font-weight: 500;
      padding: .35rem .85rem;
      border-radius: 999px;
    }

    .research-highlights {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1.25rem;
      margin: 1.5rem 0;
    }
    .highlight-card {
      background: #f8fafc;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.5rem 1.25rem;
      text-align: center;
    }
    .highlight-card .highlight-number {
      font-size: 2rem;
      font-weight: 800;
      color: #4F46E5;
      display: block;
    }
    .highlight-card .highlight-label {
      font-size: .85rem;
      color: var(--slate-700);
      margin-top: .25rem;
    }

    .assessments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .assessment-card {
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 10px;
      padding: 1.25rem;
    }
    .assessment-card h4 {
      font-size: .9rem;
      font-weight: 700;
      color: var(--slate-800);
      margin-bottom: .4rem;
    }
    .assessment-card p {
      font-size: .82rem;
      color: var(--slate-700);
      margin: 0;
      line-height: 1.55;
    }

    .timeline-list {
      position: relative;
      list-style: none;
      padding: 0;
      margin: 1.25rem 0;
    }
    .timeline-list::before {
      content: '';
      position: absolute;
      left: .85rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--slate-200);
    }
    .timeline-item {
      display: flex;
      gap: 1.25rem;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      padding-left: .25rem;
    }
    .timeline-dot {
      flex-shrink: 0;
      width: 1.75rem;
      height: 1.75rem;
      border-radius: 50%;
      background: #4F46E5;
      color: #fff;
      font-size: .7rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
    }
    .timeline-item-body h4 {
      font-size: .95rem;
      font-weight: 700;
      color: var(--slate-800);
      margin-bottom: .25rem;
    }
    .timeline-item-body p {
      font-size: .88rem;
      color: var(--slate-700);
      margin: 0;
      line-height: 1.6;
    }

    .how-it-works-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-top: 1.5rem;
    }
    .step-card {
      text-align: center;
      padding: 1.75rem 1.25rem;
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
    }
    .step-number {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: #4F46E5;
      color: #fff;
      font-weight: 800;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto .75rem;
    }
    .step-card h4 {
      font-size: .95rem;
      font-weight: 700;
      color: var(--slate-800);
      margin-bottom: .4rem;
    }
    .step-card p {
      font-size: .85rem;
      color: var(--slate-700);
      line-height: 1.6;
      margin: 0;
    }

    .impact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.25rem;
      margin-top: 1.25rem;
    }
    .impact-card {
      background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 1.5rem;
    }
    .impact-card .impact-icon { font-size: 1.5rem; margin-bottom: .5rem; }
    .impact-card h4 {
      font-size: .95rem;
      font-weight: 700;
      color: #065f46;
      margin-bottom: .35rem;
    }
    .impact-card p {
      font-size: .85rem;
      color: #047857;
      margin: 0;
      line-height: 1.6;
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

    @media (max-width: 640px) {
      .founder-block { flex-direction: column; align-items: center; text-align: center; }
      .founder-credentials { justify-content: center; }
      .about-hero .hero-stats { gap: 1rem; }
    }

    /* ── Dark Mode ─────────────────────────────────────────── */
    [data-theme="dark"] .founder-block,
    [data-theme="dark"] .assessment-card,
    [data-theme="dark"] .step-card {
      background: #ffffff;
      border-color: #e2e8f0;
    }
    [data-theme="dark"] .highlight-card {
      background: #ffffff;
      border-color: #e2e8f0;
    }
    [data-theme="dark"] .founder-info h2 { color: #0f172a; }
    [data-theme="dark"] .founder-title { color: #475569; }
    [data-theme="dark"] .founder-info p { color: #475569; }
    [data-theme="dark"] .about-section h2 { color: var(--slate-900, #f1f5f9); border-bottom-color: var(--slate-200, #334155); }
    [data-theme="dark"] .about-section p,
    [data-theme="dark"] .about-section ul { color: var(--slate-600, #94a3b8); }
    [data-theme="dark"] .assessment-card h4 { color: #1e293b; }
    [data-theme="dark"] .assessment-card p { color: #475569; }
    [data-theme="dark"] .timeline-item-body h4 { color: var(--slate-800, #e2e8f0); }
    [data-theme="dark"] .timeline-item-body p { color: var(--slate-600, #94a3b8); }
    [data-theme="dark"] .timeline-list::before { background: #334155; }
    [data-theme="dark"] .step-card h4 { color: #1e293b; }
    [data-theme="dark"] .step-card p { color: #475569; }
    [data-theme="dark"] .highlight-card .highlight-label { color: #475569; }
    [data-theme="dark"] .framework-pill { background: #f1f5f9; color: #334155; }
    [data-theme="dark"] .mission-callout { background: rgba(79,70,229,.15); border-left-color: #818cf8; }
    [data-theme="dark"] .mission-callout p { color: #a5b4fc; }

    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) .founder-block,
      :root:not([data-theme="light"]) .assessment-card,
      :root:not([data-theme="light"]) .step-card { background: #ffffff; border-color: #e2e8f0; }
      :root:not([data-theme="light"]) .highlight-card { background: #ffffff; border-color: #e2e8f0; }
      :root:not([data-theme="light"]) .founder-info h2 { color: #0f172a; }
      :root:not([data-theme="light"]) .founder-title { color: #475569; }
      :root:not([data-theme="light"]) .founder-info p { color: #475569; }
      :root:not([data-theme="light"]) .about-section h2 { color: #f1f5f9; border-bottom-color: #334155; }
      :root:not([data-theme="light"]) .about-section p,
      :root:not([data-theme="light"]) .about-section ul { color: #94a3b8; }
      :root:not([data-theme="light"]) .assessment-card h4 { color: #1e293b; }
      :root:not([data-theme="light"]) .assessment-card p { color: #475569; }
      :root:not([data-theme="light"]) .timeline-item-body h4 { color: #e2e8f0; }
      :root:not([data-theme="light"]) .timeline-item-body p { color: #94a3b8; }
      :root:not([data-theme="light"]) .timeline-list::before { background: #334155; }
      :root:not([data-theme="light"]) .step-card h4 { color: #1e293b; }
      :root:not([data-theme="light"]) .step-card p { color: #475569; }
      :root:not([data-theme="light"]) .highlight-card .highlight-label { color: #475569; }
      :root:not([data-theme="light"]) .framework-pill { background: #f1f5f9; color: #334155; }
      :root:not([data-theme="light"]) .mission-callout { background: rgba(79,70,229,.15); border-left-color: #818cf8; }
      :root:not([data-theme="light"]) .mission-callout p { color: #a5b4fc; }
    }
`;

export default function AboutPage() {
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

      {/* Hero */}
      <section className="about-hero" aria-labelledby="about-heading">
        <span className="about-hero hero-tagline">About the Resilience Atlas</span>
        <h1 id="about-heading">The Resilience Atlas&#8482;<br />Understand. Strengthen. Transform.</h1>
        <p className="hero-sub">
          A research-based resilience assessment platform founded on published doctoral research —
          mapping six dimensions of resilience for individuals, teams, and organizations.
          Grounded in science. Designed for impact.
        </p>
        <div className="hero-stats" role="list" aria-label="Key research credentials">
          <div className="stat-item" role="listitem">
            <span className="stat-number">2013</span>
            <span className="stat-label">Published Dissertation</span>
          </div>
          <div className="stat-item" role="listitem">
            <span className="stat-number">6</span>
            <span className="stat-label">Psychometric Assessments</span>
          </div>
          <div className="stat-item" role="listitem">
            <span className="stat-number">18</span>
            <span className="stat-label">Resilience Exemplars</span>
          </div>
          <div className="stat-item" role="listitem">
            <span className="stat-number">13+</span>
            <span className="stat-label">Years of Refinement</span>
          </div>
        </div>
      </section>

      <main id="main-content">

        {/* Content */}
        <div className="about-content">

          {/* Founder */}
          <div className="founder-block" aria-label="About the founder">
            <div className="founder-avatar" aria-hidden="true">J</div>
            <div className="founder-info">
              <h2>Janeen Molchany</h2>
              <p className="founder-title">Founder &amp; Chief Resilience Scientist</p>
              <div className="founder-credentials">
                <span className="credential-tag">Ph.D.</span>
                <span className="credential-tag">BCBA</span>
                <span className="credential-tag">Foster Care Alumna</span>
                <span className="credential-tag">Published Researcher</span>
                <span className="credential-tag">Author</span>
              </div>
              <p>
                Janeen Molchany is a doctoral-level researcher, Board Certified Behavior Analyst (BCBA),
                and the creator of the Resilience Atlas framework. Her career began in 2004 at a children's
                shelter and group home, where she witnessed firsthand how young people in crisis develop—or
                lose—the capacity to adapt and recover.
              </p>
              <p>
                She then worked in Wraparound services for five years with at-risk youth, learning how
                relationship, meaning-making, and agency transform outcomes. Since 2013, she has continued
                her work with children in autism communities while publishing her doctoral dissertation that
                same year — research that would become the foundation for the Resilience Atlas framework.
              </p>
              <p>
                Her 20+ years of direct clinical experience, combined with rigorous behavioral science and
                resilience research, enables her to create practical tools for understanding and building
                human resilience.
              </p>
              <a href="/founder" className="founder-link">Read full biography &rarr;</a>
            </div>
          </div>

          {/* Personal Story & Lived Experience */}
          <section className="about-section" aria-labelledby="story-heading">
            <h2 id="story-heading">A Mission Born from Lived Experience</h2>
            <p>
              The Resilience Atlas did not begin in a laboratory. It began in life. Janeen Molchany's
              journey through the foster care system gave her an intimate, firsthand understanding of
              adversity — and of the extraordinary capacity human beings have to adapt, recover, and grow
              through even the most challenging circumstances.
            </p>
            <p>
              That personal experience became the foundation of a lifelong professional mission: to understand
              what makes resilience possible, and to make that understanding accessible to everyone.
              As a BCBA working with foster youth and families of autistic children, Janeen saw daily how
              resilience — or its absence — shaped lives and outcomes. She also saw how rarely people had
              real, science-based tools to understand their own resilience.
            </p>
            <p>
              Janeen observed that most resilience tools treated resilience as a single trait, or focused
              on only one domain — psychology, spirituality, or physical wellness. Her 2013 doctoral
              dissertation revealed that resilience is fundamentally <em>multidimensional</em>: a constellation
              of capacities that interact in complex, personal, and deeply human ways.
            </p>
            <p>
              The Resilience Atlas was created to reflect that complexity — giving people a map, not just
              a number, for understanding how they adapt under pressure.
            </p>
          </section>

          {/* Mission */}
          <section className="about-section" aria-labelledby="mission-heading">
            <h2 id="mission-heading">Our Mission</h2>
            <div className="mission-callout">
              <p>
                "To make the science of resilience legible, personal, and actionable — so that every person
                can understand, cultivate, and share their capacity to grow through adversity."
              </p>
            </div>
            <p>
              We believe resilience is not something you either have or don't have. It is a set of
              learnable, developable capacities — and the first step is understanding where you already
              are and where you have room to grow. The Resilience Atlas exists to make that understanding
              possible for individuals, teams, and organizations.
            </p>
          </section>

          {/* Research Foundation */}
          <section className="about-section" aria-labelledby="research-heading">
            <h2 id="research-heading">The Research Foundation</h2>
            <p>
              The Resilience Atlas framework was built on rigorous academic research, including Janeen's
              2013 published doctoral dissertation — a comprehensive study of resilience that drew on
              multiple theoretical traditions and original empirical data.
            </p>
            <div className="research-highlights" role="list" aria-label="Key research metrics">
              <div className="highlight-card" role="listitem">
                <span className="highlight-number">2013</span>
                <span className="highlight-label">Year of Published Dissertation</span>
              </div>
              <div className="highlight-card" role="listitem">
                <span className="highlight-number">6</span>
                <span className="highlight-label">Psychometric Assessments Used</span>
              </div>
              <div className="highlight-card" role="listitem">
                <span className="highlight-number">18</span>
                <span className="highlight-label">Resilience Exemplars Studied</span>
              </div>
              <div className="highlight-card" role="listitem">
                <span className="highlight-number">13+</span>
                <span className="highlight-label">Years of Framework Refinement</span>
              </div>
            </div>
            <p>
              The dissertation identified and validated a multidimensional model of resilience through
              in-depth interviews with <strong>18 resilience exemplars</strong> — individuals who had
              demonstrated extraordinary resilience in the face of adversity — and through the
              administration of <strong>6 validated psychometric assessments</strong> spanning emotional
              regulation, social support, purpose, coping, cognitive flexibility, and somatic awareness.
            </p>
            <a href="/research" className="btn btn-secondary" style={{marginTop:'.5rem'}}>Explore the Research Foundations &rarr;</a>
          </section>

          {/* Psychometric Assessments */}
          <section className="about-section" aria-labelledby="assessments-heading">
            <h2 id="assessments-heading">Six Psychometric Assessments</h2>
            <p>
              The Resilience Atlas platform is grounded in Janeen Molchany's 2013 doctoral dissertation,
              which administered six validated psychometric instruments to 18 resilience exemplars. These
              assessments provided the scientific foundation for identifying and measuring the dimensions
              of resilience integrated throughout this platform:
            </p>
            <div className="assessments-grid" role="list" aria-label="Psychometric assessments used in dissertation research">
              <article className="assessment-card" role="listitem">
                <h4>Myers-Briggs Type Indicator (MBTI)</h4>
                <p>A widely used instrument for understanding psychological personality types and preferences, providing insight into how individuals perceive the world and make decisions.</p>
              </article>
              <article className="assessment-card" role="listitem">
                <h4>Resilience Scale (RS)</h4>
                <p>Measures the degree of individual resilience — the capacity to adapt to, withstand, and recover from adversity, hardship, and significant sources of stress.</p>
              </article>
              <article className="assessment-card" role="listitem">
                <h4>VIA Character Strengths Survey (VIA)</h4>
                <p>Assesses positive character strengths and core virtues that contribute to personal fulfillment, well-being, and flourishing in the face of life's challenges.</p>
              </article>
              <article className="assessment-card" role="listitem">
                <h4>MPS (Mental, Physical &amp; Spiritual Scale)</h4>
                <p>Evaluates holistic well-being and balance across mental, physical, and spiritual domains — capturing the full-spectrum dimensions of human health and resilience.</p>
              </article>
              <article className="assessment-card" role="listitem">
                <h4>Multiple Intelligence Inventory (MII)</h4>
                <p>Examines the various dimensions of human intelligence beyond traditional cognitive measures, reflecting Howard Gardner's theory of multiple intelligences.</p>
              </article>
              <article className="assessment-card" role="listitem">
                <h4>Self Transcendence Scale (STS)</h4>
                <p>Captures an individual's capacity for self transcendence — the ability to find meaning, connection, and perspective that extends beyond one's immediate self and circumstances.</p>
              </article>
            </div>
          </section>

          {/* How It Works */}
          <section className="about-section" aria-labelledby="how-heading">
            <h2 id="how-heading">How It Works</h2>
            <p>
              The Resilience Atlas translates doctoral-level research into an accessible, actionable
              experience anyone can complete in under 15 minutes:
            </p>
            <div className="how-it-works-steps" role="list" aria-label="Steps to use the Resilience Atlas">
              <div className="step-card" role="listitem">
                <div className="step-number" aria-hidden="true">1</div>
                <h4>Take the Assessment</h4>
                <p>Complete the 72-question resilience assessment, spanning all six dimensions.</p>
              </div>
              <div className="step-card" role="listitem">
                <div className="step-number" aria-hidden="true">2</div>
                <h4>Map Your Profile</h4>
                <p>Receive a personalized radar chart showing your unique resilience profile across six dimensions.</p>
              </div>
              <div className="step-card" role="listitem">
                <div className="step-number" aria-hidden="true">3</div>
                <h4>Read Your Report</h4>
                <p>Get a detailed, evidence-based narrative report interpreting your strengths and growth areas.</p>
              </div>
              <div className="step-card" role="listitem">
                <div className="step-number" aria-hidden="true">4</div>
                <h4>Track Your Growth</h4>
                <p>Retake over time to see how your resilience evolves using the longitudinal Atlas tracker.</p>
              </div>
            </div>
          </section>

          {/* Impact */}
          <section className="about-section" aria-labelledby="impact-heading">
            <h2 id="impact-heading">Impact &amp; Outcomes</h2>
            <p>
              The Resilience Atlas is designed to create meaningful, lasting change — for individuals
              navigating personal challenges, teams building collective strength, and organizations
              cultivating resilient cultures:
            </p>
            <div className="impact-grid" role="list" aria-label="Impact outcomes">
              <div className="impact-card" role="listitem">
                <div className="impact-icon" aria-hidden="true"><img src="/icons/compass.svg" alt="" className="icon icon-md" /></div>
                <h4>Self-Understanding</h4>
                <p>Individuals gain a clear, nuanced picture of their resilience — not a single score, but a full map.</p>
              </div>
              <div className="impact-card" role="listitem">
                <div className="impact-icon" aria-hidden="true"><img src="/icons/agentic-generative.svg" alt="" className="icon icon-md" /></div>
                <h4>Targeted Growth</h4>
                <p>Dimension-specific insights help people focus their development efforts where they matter most.</p>
              </div>
              <div className="impact-card" role="listitem">
                <div className="impact-icon" aria-hidden="true"><img src="/icons/relational-connective.svg" alt="" className="icon icon-md" /></div>
                <h4>Team Resilience</h4>
                <p>Teams see aggregated profiles, identify collective gaps, and build shared resilience strategies.</p>
              </div>
              <div className="impact-card" role="listitem">
                <div className="impact-icon" aria-hidden="true"><img src="/icons/spiritual-reflective.svg" alt="" className="icon icon-md" /></div>
                <h4>Organizational Culture</h4>
                <p>Organizations embed resilience as a cultural value, not just an individual wellness initiative.</p>
              </div>
            </div>
          </section>

          {/* Framework */}
          <section className="about-section" aria-labelledby="framework-heading">
            <h2 id="framework-heading">The Six Dimensions</h2>
            <p>
              The Six Dimensions of Resilience framework integrates findings from multiple scientific
              traditions. Each dimension reflects a distinct way that humans adapt to and recover from
              adversity:
            </p>
            <div className="framework-pills">
              <span className="framework-pill"><img src="/icons/relational-connective.svg" alt="" aria-hidden="true" className="icon icon-xs" /> Relational-Connective — social support and connection</span>
              <span className="framework-pill"><img src="/icons/cognitive-narrative.svg" alt="" aria-hidden="true" className="icon icon-xs" /> Cognitive-Narrative — reframing and perspective-taking</span>
              <span className="framework-pill"><img src="/icons/somatic-regulative.svg" alt="" aria-hidden="true" className="icon icon-xs" /> Somatic-Regulative — physical regulation and body awareness</span>
              <span className="framework-pill"><img src="/icons/emotional-adaptive.svg" alt="" aria-hidden="true" className="icon icon-xs" /> Emotional-Adaptive — processing and moving through feelings</span>
              <span className="framework-pill"><img src="/icons/spiritual-reflective.svg" alt="" aria-hidden="true" className="icon icon-xs" /> Spiritual-Reflective — meaning, purpose, and values</span>
              <span className="framework-pill"><img src="/icons/agentic-generative.svg" alt="" aria-hidden="true" className="icon icon-xs" /> Agentic-Generative — action, agency, and forward movement</span>
            </div>
            <p style={{marginTop:'1.5rem'}}>
              The atlas metaphor is intentional: a map doesn't tell you where to go — it helps you understand
              where you are and what paths are available. The Resilience Atlas does the same for your inner life.
            </p>
          </section>

          {/* Research Origins */}
          <section className="about-section" aria-labelledby="foundations-heading">
            <h2 id="foundations-heading">Theoretical Foundations</h2>
            <p>
              The Resilience Atlas framework is grounded in peer-reviewed research across six disciplines:
            </p>
            <div className="framework-pills">
              <span className="framework-pill">Positive Psychology</span>
              <span className="framework-pill">Resilience Science</span>
              <span className="framework-pill">Applied Behavior Analysis (ABA)</span>
              <span className="framework-pill">Acceptance &amp; Commitment Therapy (ACT)</span>
              <span className="framework-pill">Cross-Cultural Research</span>
              <span className="framework-pill">Trauma-Informed Practice</span>
            </div>
            <p style={{marginTop:'1.5rem'}}>
              The assessment instrument was developed through doctoral research and refined through
              iterative testing across clinical populations to ensure it reflects the full complexity
              of real human resilience.
            </p>
            <a href="/research" className="btn btn-secondary" style={{marginTop:'.5rem'}}>Explore the Research Foundations &rarr;</a>
          </section>

        </div>

      </main>

      {/* CTA */}
      <section className="cta-band" aria-label="Get started with the Resilience Atlas">
        <h2>Understand. Strengthen. Transform.</h2>
        <p>Take the assessment, explore the research, or bring the Resilience Atlas to your team.</p>
        <a className="btn-white" href="/quiz">Take the Assessment</a>
        <a className="btn-outline" href="/founder">Meet the Founder</a>
        <a className="btn-outline" href="/research">Read the Research</a>
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
            <a href="/kids">For Kids</a>
          </div>
          <div className="footer-nav-group">
            <strong className="footer-nav-heading">Company</strong>
            <a href="/about">About</a>
            <a href="/founder">Our Founder</a>
            <a href="/research">Research</a>
          </div>
        </nav>
        <div className="footer-bottom">
          <p><strong>The Resilience Atlas&#8482; — Understand. Strengthen. Transform.</strong></p>
          <p>A research-based resilience assessment platform founded on published 2013 doctoral research.</p>
          <p>&copy; 2026 The Resilience Atlas&#8482; &mdash; a trademark of <strong>Janeen Molchany Ph.D., BCBA</strong>.</p>
          <p>For educational and self-reflection purposes only. Not a clinical assessment.</p>
        </div>
      </footer>
    </>
  );
}
