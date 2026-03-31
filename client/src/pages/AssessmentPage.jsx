import React, { useEffect } from 'react';

const styles = `
    .assessment-hero {
      background: linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%);
      color: #fff;
      padding: 5rem 1.5rem 4rem;
      text-align: center;
    }
    .assessment-hero h1 { color: #fff; font-size: clamp(1.8rem, 4vw, 2.8rem); margin-bottom: .75rem; }
    .assessment-hero p { color: #94a3b8; font-size: 1.05rem; max-width: 620px; margin: 0 auto 2rem; line-height: 1.65; }

    .assessment-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: center;
      margin-bottom: 2.5rem;
    }
    .meta-chip {
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.2);
      color: #e2e8f0;
      padding: .5rem 1.25rem;
      border-radius: 999px;
      font-size: .9rem;
      font-weight: 500;
    }

    .assessment-how {
      max-width: 860px;
      margin: 4rem auto;
      padding: 0 1.5rem;
    }
    .how-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .how-step {
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: var(--shadow-sm);
    }
    .how-step-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: #4F46E5;
      color: #fff;
      font-weight: 700;
      font-size: 1.1rem;
      margin-bottom: 1rem;
    }
    .how-step h3 { font-size: 1rem; margin-bottom: .5rem; }
    .how-step p { color: var(--slate-600); font-size: .9rem; line-height: 1.55; }

    .dimensions-section {
      background: var(--slate-50, #f8fafc);
      padding: 4rem 1.5rem;
    }
    .dimensions-section .section-header { text-align: center; margin-bottom: 2.5rem; }
    .dimensions-section .section-header h2 { font-size: clamp(1.5rem, 3vw, 2rem); }
    .dimensions-section .section-header p { color: var(--slate-600); max-width: 600px; margin: .75rem auto 0; }

    .dim-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      max-width: 1040px;
      margin: 0 auto;
    }
    .dim-card {
      background: #fff;
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .dim-card-header { display: flex; align-items: center; gap: .75rem; margin-bottom: .75rem; }
    .dim-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .dim-icon--relational  { background: #EDE9FE; }
    .dim-icon--cognitive   { background: #DBEAFE; }
    .dim-icon--somatic     { background: #D1FAE5; }
    .dim-icon--emotional   { background: #FEE2E2; }
    .dim-icon--spiritual   { background: #FEF3C7; }
    .dim-icon--agentic     { background: #FCE7F3; }
    .dim-card h3 { font-size: 1rem; font-weight: 700; color: var(--slate-900); }
    .dim-card p { color: var(--slate-600); font-size: .9rem; line-height: 1.55; }

    .cta-band {
      background: #4F46E5;
      color: #fff;
      text-align: center;
      padding: 4rem 1.5rem;
    }
    .cta-band h2 { font-size: clamp(1.5rem, 3vw, 2rem); margin-bottom: 1rem; }
    .cta-band p { font-size: 1rem; color: rgba(255,255,255,.8); margin-bottom: 2rem; max-width: 500px; margin-left: auto; margin-right: auto; }
    .cta-band .btn-cta {
      background: #fff;
      color: #4F46E5;
      font-weight: 700;
      padding: .9rem 2.25rem;
      border-radius: 10px;
      text-decoration: none;
      display: inline-block;
      font-size: 1.05rem;
    }
    .cta-band .btn-cta:hover { background: #e8e7fe; }

    @media (max-width: 640px) {
      .header-nav .nav-link { display: none; }
    }
`;

export default function AssessmentPage() {
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

      <header className="site-header" role="banner">
        <div className="header-inner">
          <a className="logo" href="/">
            <div className="logo-icon" aria-hidden="true">
              <img src="/assets/compass-icon.svg" alt="The Resilience Atlas" width="36" height="36" />
            </div>
            The Resilience Atlas&#8482;
          </a>
          <nav className="header-nav" aria-label="Main navigation">
            <a href="/" className="nav-link">Home</a>
            <a href="/assessment" className="nav-link active">Assessment</a>
            <a href="/research" className="nav-link">Research</a>
            <a href="/team" className="nav-link">Teams</a>
            <a href="/kids.html" className="nav-link">Kids</a>
            <a href="/about" className="nav-link">About</a>
            <button className="theme-toggle" aria-label="Switch to dark mode" aria-pressed="false" title="Toggle dark mode"></button>
            <a className="btn btn-primary" href="/quiz">Take the Assessment</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="assessment-hero" aria-labelledby="assessment-heading">
        <span className="hero-eyebrow">The Resilience Atlas Assessment</span>
        <h1 id="assessment-heading">Map Your Six Dimensions of Resilience</h1>
        <p>
          The Resilience Atlas Assessment is a 72-question resilience assessment grounded in doctoral research.
          It maps your resilience across six dimensions, revealing how you adapt, recover, and
          grow under pressure.
        </p>
        <div className="assessment-meta">
          <span className="meta-chip">10–15 minutes</span>
          <span className="meta-chip">72 questions</span>
          <span className="meta-chip">Personalized results</span>
          <span className="meta-chip">No account required</span>
        </div>
        <a className="btn-hero-primary" href="/quiz">
          <span aria-hidden="true">&#9654;</span> Start the Assessment
        </a>
      </section>

      {/* How it Works */}
      <section className="assessment-how" aria-labelledby="how-heading">
        <div className="section-header" style={{textAlign:'center',marginBottom:'2rem'}}>
          <span className="section-label">How It Works</span>
          <h2 id="how-heading">Simple, Structured, Insightful</h2>
          <p style={{color:'var(--slate-600)',maxWidth:'560px',margin:'.75rem auto 0'}}>
            Three straightforward steps from start to personalized resilience profile.
          </p>
        </div>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-num">1</div>
            <h3>Answer 72 Questions</h3>
            <p>Rate each statement on a 1–5 scale. Questions span all six resilience dimensions. Take your time — there are no right or wrong answers.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">2</div>
            <h3>See Your Profile</h3>
            <p>Your answers are scored instantly across six dimensions. A radar chart reveals your unique resilience shape — your strengths and growth edges.</p>
          </div>
          <div className="how-step">
            <div className="how-step-num">3</div>
            <h3>Get Your Narrative Report</h3>
            <p>Receive a personalized report with interpretation, growth suggestions, and an evolution summary if you've taken the assessment before.</p>
          </div>
        </div>
      </section>

      {/* Six Dimensions */}
      <section className="dimensions-section" aria-labelledby="dim-heading" id="dimensions">
        <div className="section-header">
          <span className="section-label">What We Measure</span>
          <h2 id="dim-heading">The Six Dimensions of Resilience</h2>
          <p>Each dimension reflects a distinct capacity that contributes to how you navigate adversity. The assessment measures all six.</p>
        </div>
        <div className="dim-cards">
          <div className="dim-card">
            <div className="dim-card-header">
              <div className="dim-icon dim-icon--relational" aria-hidden="true">
                <img src="/icons/relational-connective.svg" alt="" className="icon icon-md" />
              </div>
              <h3>Relational-Connective</h3>
            </div>
            <p>Your capacity to access and draw on support from others, maintain connections, and seek help when facing adversity.</p>
          </div>
          <div className="dim-card">
            <div className="dim-card-header">
              <div className="dim-icon dim-icon--cognitive" aria-hidden="true">
                <img src="/icons/cognitive-narrative.svg" alt="" className="icon icon-md" />
              </div>
              <h3>Cognitive-Narrative</h3>
            </div>
            <p>How you interpret and reframe challenges. Your ability to shift perspective, find meaning, and construct narratives of growth.</p>
          </div>
          <div className="dim-card">
            <div className="dim-card-header">
              <div className="dim-icon dim-icon--somatic" aria-hidden="true">
                <img src="/icons/somatic-regulative.svg" alt="" className="icon icon-md" />
              </div>
              <h3>Somatic-Regulative</h3>
            </div>
            <p>How your body regulates stress. Your physiological capacity to move through tension, restore calm, and sustain energy.</p>
          </div>
          <div className="dim-card">
            <div className="dim-card-header">
              <div className="dim-icon dim-icon--emotional" aria-hidden="true">
                <img src="/icons/emotional-adaptive.svg" alt="" className="icon icon-md" />
              </div>
              <h3>Emotional-Adaptive</h3>
            </div>
            <p>Your capacity to acknowledge, experience, and move through challenging emotional states without becoming overwhelmed.</p>
          </div>
          <div className="dim-card">
            <div className="dim-card-header">
              <div className="dim-icon dim-icon--spiritual" aria-hidden="true">
                <img src="/icons/spiritual-reflective.svg" alt="" className="icon icon-md" />
              </div>
              <h3>Spiritual-Reflective</h3>
            </div>
            <p>How meaning and purpose shape your resilience. Your connection to values and beliefs that sustain you through difficulty.</p>
          </div>
          <div className="dim-card">
            <div className="dim-card-header">
              <div className="dim-icon dim-icon--agentic" aria-hidden="true">
                <img src="/icons/agentic-generative.svg" alt="" className="icon icon-md" />
              </div>
              <h3>Agentic-Generative</h3>
            </div>
            <p>Your capacity to take action in adversity, make decisions, and assert agency even in uncertainty.</p>
          </div>
        </div>
      </section>

      {/* Cross-link to Research */}
      <section style={{background:'#fff',padding:'3rem 1.5rem',textAlign:'center'}}>
        <p style={{color:'var(--slate-600)',fontSize:'1rem',maxWidth:'540px',margin:'0 auto 1.5rem'}}>
          The six dimensions are grounded in doctoral research across positive psychology, resilience science, and behavioral analysis.
        </p>
        <a href="/research" className="btn btn-secondary">Learn More About the Research</a>
      </section>

      {/* CTA */}
      <section className="cta-band" aria-label="Start assessment">
        <h2>Ready to Map Your Resilience?</h2>
        <p>Takes 10–15 minutes. No account required. Personalized results immediately.</p>
        <a className="btn-cta" href="/quiz">Take the Assessment &rarr;</a>
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
            <a href="/team">For Teams</a>
            <a href="/kids.html">For Kids</a>
          </div>
          <div className="footer-nav-group">
            <strong className="footer-nav-heading">Company</strong>
            <a href="/about">About</a>
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
