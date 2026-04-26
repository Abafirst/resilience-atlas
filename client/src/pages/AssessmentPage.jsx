import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

const styles = `
    .assessment-story {
      position: relative;
      overflow: hidden;
      padding-bottom: 2rem;
    }

    .assessment-story::before {
      content: '';
      position: absolute;
      width: 540px;
      height: 540px;
      top: 120px;
      right: -220px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79, 70, 229, .16) 0%, rgba(79, 70, 229, 0) 70%);
      pointer-events: none;
    }

    .assessment-story::after {
      content: '';
      position: absolute;
      width: 460px;
      height: 460px;
      bottom: 50px;
      left: -180px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(16, 185, 129, .12) 0%, rgba(16, 185, 129, 0) 70%);
      pointer-events: none;
    }

    .assessment-wrap {
      max-width: 1080px;
      margin: 0 auto;
      padding: 0 1.25rem;
      position: relative;
      z-index: 1;
    }

    .assessment-hero {
      padding: 2.4rem 0 1rem;
      text-align: center;
    }
    .assessment-hero-card {
      border-radius: 26px;
      border: 1px solid rgba(79, 70, 229, .18);
      background: linear-gradient(140deg, #fff8f1 0%, #fdf2f8 45%, #eef2ff 100%);
      box-shadow: 0 16px 40px rgba(15, 23, 42, .08);
      padding: clamp(1.35rem, 3vw, 2.2rem);
      position: relative;
      overflow: hidden;
    }
    .assessment-hero-card::after {
      content: '';
      position: absolute;
      width: 300px;
      height: 300px;
      right: -110px;
      bottom: -170px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(79, 70, 229, .18) 0%, rgba(79, 70, 229, 0) 70%);
      pointer-events: none;
    }
    .assessment-hero h1 { color: #1f2937; font-size: clamp(1.8rem, 4vw, 2.8rem); margin-bottom: .75rem; }
    .assessment-hero p { color: #475569; font-size: 1.05rem; max-width: 620px; margin: 0 auto 2rem; line-height: 1.65; }

    .assessment-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: center;
      margin-bottom: 2.5rem;
    }
    .meta-chip {
      background: rgba(255,255,255,.82);
      border: 1px solid rgba(148,163,184,.4);
      color: #334155;
      padding: .5rem 1.25rem;
      border-radius: 999px;
      font-size: .9rem;
      font-weight: 600;
    }

    .assessment-how {
      margin: .85rem 0;
    }

    .assessment-story-card {
      border-radius: 22px;
      border: 1px solid rgba(148, 163, 184, .32);
      background: #ffffff;
      box-shadow: 0 12px 28px rgba(15, 23, 42, .06);
      padding: clamp(1.1rem, 2.8vw, 1.9rem);
    }
    .how-steps {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }
    .how-step {
      background: #fff;
      border: 1px solid rgba(148, 163, 184, .26);
      border-radius: 18px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 10px 24px rgba(15, 23, 42, .06);
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
      background: transparent;
      padding: .85rem 0;
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
      border: 1px solid rgba(148, 163, 184, .26);
      border-radius: 18px;
      padding: 1.5rem;
      box-shadow: 0 10px 24px rgba(15, 23, 42, .06);
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

    .assessment-link-band {
      margin: .85rem 0;
    }

    .assessment-link-card {
      text-align: center;
      border-radius: 22px;
      border: 1px solid rgba(148, 163, 184, .32);
      background: #ffffff;
      box-shadow: 0 12px 28px rgba(15, 23, 42, .06);
      padding: clamp(1.1rem, 2.8vw, 1.9rem);
    }

    .cta-band {
      background: transparent;
      text-align: center;
      padding: .85rem 0 0;
    }
    .cta-band-card {
      border-radius: 24px;
      background: linear-gradient(135deg, #312e81 0%, #4f46e5 48%, #7c3aed 100%);
      color: #fff;
      border: 1px solid rgba(129, 140, 248, .5);
      box-shadow: 0 18px 35px rgba(49, 46, 129, .28);
      padding: clamp(1.2rem, 3vw, 2rem);
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

    [data-theme="dark"] .assessment-story::before {
      background: radial-gradient(circle, rgba(168, 85, 247, .22) 0%, rgba(168, 85, 247, 0) 72%);
    }
    [data-theme="dark"] .assessment-story::after {
      background: radial-gradient(circle, rgba(59, 130, 246, .2) 0%, rgba(59, 130, 246, 0) 68%);
    }
    [data-theme="dark"] .assessment-hero-card,
    [data-theme="dark"] .cta-band-card {
      background: linear-gradient(140deg, rgba(30, 41, 59, .95) 0%, rgba(51, 65, 85, .92) 52%, rgba(30, 41, 59, .95) 100%);
      border-color: rgba(148, 163, 184, .25);
      box-shadow: 0 16px 40px rgba(2, 6, 23, .55);
    }
    [data-theme="dark"] .assessment-story-card,
    [data-theme="dark"] .assessment-link-card,
    [data-theme="dark"] .how-step,
    [data-theme="dark"] .dim-card {
      background: #111827;
      border-color: #334155;
      box-shadow: 0 12px 28px rgba(2, 6, 23, .45);
    }
    [data-theme="dark"] .assessment-hero h1,
    [data-theme="dark"] .dimensions-section .section-header h2,
    [data-theme="dark"] .how-step h3,
    [data-theme="dark"] .dim-card h3 { color: #f8fafc; }
    [data-theme="dark"] .assessment-hero p,
    [data-theme="dark"] .dimensions-section .section-header p,
    [data-theme="dark"] .how-step p,
    [data-theme="dark"] .dim-card p,
    [data-theme="dark"] .assessment-link-card p { color: #cbd5e1; }
    [data-theme="dark"] .meta-chip {
      background: rgba(15, 23, 42, .55);
      border-color: rgba(148, 163, 184, .45);
      color: #cbd5e1;
    }

    @media (max-width: 640px) {
      .header-nav .nav-link { display: none; }
      .assessment-wrap { padding: 0 1rem; }
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

      <SiteHeader activePage="assessment" />
      <DarkModeHint />

      <main className="storytelling-page assessment-story">
        {/* Hero */}
        <section className="assessment-hero" aria-labelledby="assessment-heading">
          <div className="assessment-wrap">
            <div className="assessment-hero-card soft-card">
              <span className="hero-eyebrow">The Resilience Atlas Assessment</span>
              <h1 id="assessment-heading">72 Questions. One Map.</h1>
              <p>
                In the next 15 minutes, you&rsquo;ll explore how you show up under pressure across six
                key dimensions of resilience. This isn&rsquo;t pass/fail. It&rsquo;s a snapshot of how you currently
                navigate challenges&mdash;a compass point on your resilience landscape.
              </p>
              <div className="assessment-meta">
                <span className="meta-chip">10–15 minutes</span>
                <span className="meta-chip">72 questions</span>
                <span className="meta-chip">Personalized map</span>
                <span className="meta-chip">No account required</span>
              </div>
              <a className="btn-hero-primary" href="/quiz" title="For adults 18+">
                <span aria-hidden="true">&#9654;</span> Begin My Assessment <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span>
              </a>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section className="assessment-how" aria-labelledby="how-heading">
          <div className="assessment-wrap">
            <div className="assessment-story-card soft-card">
              <div className="section-header" style={{textAlign:'center',marginBottom:'2rem'}}>
                <span className="section-label">How It Works</span>
                <h2 id="how-heading">Your Navigation Guide</h2>
                <p style={{color:'var(--slate-600)',maxWidth:'560px',margin:'.75rem auto 0'}}>
                  Three steps to establish your starting position on the resilience landscape.
                </p>
              </div>
              <div className="how-steps">
                <div className="how-step">
                  <div className="how-step-num">1</div>
                  <h3>Answer 72 Questions</h3>
                  <p>Rate each statement on a 1–5 scale. Questions span all six resilience dimensions. There are no right or wrong answers&mdash;only honest ones.</p>
                </div>
                <div className="how-step">
                  <div className="how-step-num">2</div>
                  <h3>See Your Map</h3>
                  <p>Your answers are scored across six dimensions. A compass reveals your unique resilience shape&mdash;your primary strengths and your emerging edges.</p>
                </div>
                <div className="how-step">
                  <div className="how-step-num">3</div>
                  <h3>Navigate from Here</h3>
                  <p>Receive a personalized report with interpretation, compass points for growth, and an evolution summary if you&rsquo;ve mapped your resilience before.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Six Dimensions */}
        <section className="dimensions-section" aria-labelledby="dim-heading" id="dimensions">
          <div className="assessment-wrap">
            <div className="assessment-story-card soft-card">
              <div className="section-header">
                <span className="section-label">What We Measure</span>
                <h2 id="dim-heading">The Six Dimensions of Your Map</h2>
                <p>Each dimension reflects a distinct capacity that shapes how you navigate adversity. Together, they form your complete resilience constellation.</p>
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
            </div>
          </div>
        </section>

        {/* Cross-link to Research */}
        <section className="assessment-link-band">
          <div className="assessment-wrap">
            <div className="assessment-link-card soft-card">
              <p style={{color:'var(--slate-600)',fontSize:'1rem',maxWidth:'540px',margin:'0 auto 1.5rem'}}>
                The six dimensions are grounded in doctoral research across positive psychology, resilience science, and behavioral analysis.
              </p>
              <a href="/research" className="btn btn-secondary">Learn More About the Research</a>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-band" aria-label="Start assessment">
          <div className="assessment-wrap">
            <div className="cta-band-card">
              <h2>Ready to Begin Your Assessment?</h2>
              <p>Takes 10–15 minutes. No account required. Your resilience map, immediately.</p>
              <a className="btn-cta" href="/quiz" title="For adults 18+">Begin My Assessment <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span> &rarr;</a>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
