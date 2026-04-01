import React, { useEffect } from 'react';

const styles = `
    .insights-hero {
      background: linear-gradient(135deg, #0f2942 0%, #1a3a5c 100%);
      color: #fff;
      padding: 4rem 1.5rem 3rem;
      text-align: center;
    }
    .insights-hero h1 { color: #fff; font-size: clamp(1.8rem,4vw,2.8rem); margin-bottom: .75rem; }
    .insights-hero p { color: #94a3b8; font-size: 1.05rem; max-width: 560px; margin: 0 auto 2rem; line-height: 1.65; }
    .article-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.75rem;
      max-width: 1080px;
      margin: 0 auto;
    }
    .article-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,.05);
      transition: box-shadow 200ms, transform 200ms;
      display: flex;
      flex-direction: column;
    }
    .article-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,.09); transform: translateY(-3px); }
    .article-card-header {
      background: linear-gradient(135deg, #4F46E5 0%, #059669 100%);
      padding: 1.5rem;
      color: #fff;
    }
    .article-card-header .article-tag {
      font-size: .72rem;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      background: rgba(255,255,255,.2);
      padding: .2rem .6rem;
      border-radius: 999px;
      margin-bottom: .75rem;
      display: inline-block;
    }
    .article-card-header h3 { color: #fff; font-size: 1.1rem; font-weight: 700; line-height: 1.35; }
    .article-card-body { padding: 1.25rem 1.5rem 1.5rem; flex: 1; display: flex; flex-direction: column; }
    .article-card-body p { font-size: .93rem; color: #475569; line-height: 1.6; flex: 1; }
    .article-cta {
      display: inline-flex;
      align-items: center;
      gap: .4rem;
      margin-top: 1.25rem;
      font-size: .9rem;
      font-weight: 600;
      color: #4F46E5;
      text-decoration: none;
    }
    .article-cta:hover { text-decoration: underline; }
    .insights-cta-banner {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 16px;
      padding: 2.5rem 2rem;
      text-align: center;
      max-width: 680px;
      margin: 0 auto;
    }
    .insights-cta-banner h2 { font-size: 1.5rem; color: #0f172a; margin-bottom: .5rem; }
    .insights-cta-banner p { color: #475569; margin-bottom: 1.5rem; }
`;

export default function InsightsPage() {
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

      <header className="site-header">
        <div className="header-inner">
          <a className="logo" href="/">
            <div className="logo-icon" aria-hidden="true">
              <img src="/assets/compass-icon.svg" alt="The Resilience Atlas" width="36" height="36" />
            </div>
            The Resilience Atlas&#8482;
          </a>
          <nav aria-label="Main navigation" style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <a href="/insights" style={{fontSize:'.92rem',color:'#4F46E5',fontWeight:'600'}}>Insights</a>
            <a href="/teams" style={{fontSize:'.92rem',color:'var(--slate-600)',fontWeight:'500'}}>For Teams</a>
            <button className="theme-toggle" aria-label="Switch to dark mode" aria-pressed="false" title="Toggle dark mode"></button>
            <a className="btn btn-primary" href="/quiz">Take the Assessment</a>
          </nav>
        </div>
      </header>

      <section className="insights-hero" aria-label="Insights hub hero">
        <span className="hero-eyebrow">Knowledge Hub</span>
        <h1>Resilience Insights</h1>
        <p>Articles, research, and frameworks exploring the Six Dimensions of Resilience and how they shape your response to stress, adversity, and change.</p>
        <a className="btn-hero-primary" href="/quiz" style={{display:'inline-flex',margin:'0 auto'}}>
          <span aria-hidden="true">&#9654;</span> Take the Free Assessment
        </a>
      </section>

      <section className="landing-section" aria-labelledby="articlesHeading">
        <div className="section-header">
          <span className="section-label">Featured Articles</span>
          <h2 id="articlesHeading">Explore the Six Dimensions of Resilience</h2>
        </div>

        <div className="article-grid">

          <article className="article-card">
            <div className="article-card-header">
              <span className="article-tag">Framework</span>
              <h3>Understanding the Six Dimensions of Resilience</h3>
            </div>
            <div className="article-card-body">
              <p>Resilience is not a single quality you either have or don't. Research shows it is a constellation of six distinct capacities &mdash; each one reflecting a different way the human mind, body, and spirit respond to adversity.</p>
              <a className="article-cta" href="/insights/six-resilience-dimensions">
                Read article &#8594;
              </a>
            </div>
          </article>

          <article className="article-card">
            <div className="article-card-header" style={{background:'linear-gradient(135deg,#0f2942 0%,#1a3a5c 100%)'}}>
              <span className="article-tag">Applied Research</span>
              <h3>How Resilience Works Under Pressure</h3>
            </div>
            <div className="article-card-body">
              <p>When stress is acute, which resilience dimensions activate first? New research on stress response reveals that Somatic and Agentic dimensions play a disproportionate role in the first moments of adversity.</p>
              <a className="article-cta" href="/insights/resilience-under-pressure">
                Read article &#8594;
              </a>
            </div>
          </article>

          <article className="article-card">
            <div className="article-card-header" style={{background:'linear-gradient(135deg,#059669 0%,#0f2942 100%)'}}>
              <span className="article-tag">Team Development</span>
              <h3>Building Team Resilience Across All Six Dimensions</h3>
            </div>
            <div className="article-card-body">
              <p>Individual resilience profiles shape team dynamics in surprising ways. When a team is strong in Cognitive but weak in Relational, decision quality suffers under pressure. Here is how to use dimension mapping for team development.</p>
              <a className="article-cta" href="/insights/team-resilience">
                Read article &#8594;
              </a>
            </div>
          </article>

          <article className="article-card">
            <div className="article-card-header" style={{background:'linear-gradient(135deg,#7c3aed 0%,#4F46E5 100%)'}}>
              <span className="article-tag">Dimension Deep Dive</span>
              <h3>The Relational Dimension: Why Connection is Resilience</h3>
            </div>
            <div className="article-card-body">
              <p>Of all six dimensions, Relational resilience is the one most supported by decades of research. Human beings are wired for co-regulation. Understanding your Relational score can transform how you navigate hard times.</p>
              <a className="article-cta" href="/quiz">
                Discover your score &#8594;
              </a>
            </div>
          </article>

          <article className="article-card">
            <div className="article-card-header" style={{background:'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)'}}>
              <span className="article-tag">Dimension Deep Dive</span>
              <h3>Somatic Resilience: Your Body Knows Before Your Mind Does</h3>
            </div>
            <div className="article-card-body">
              <p>The Somatic dimension captures something that most resilience assessments miss entirely: how the body itself participates in recovery. Explore the science of physiological regulation and how to develop this crucial dimension.</p>
              <a className="article-cta" href="/quiz">
                Discover your score &#8594;
              </a>
            </div>
          </article>

          <article className="article-card">
            <div className="article-card-header" style={{background:'linear-gradient(135deg,#0891b2 0%,#0f2942 100%)'}}>
              <span className="article-tag">Dimension Deep Dive</span>
              <h3>Agentic Resilience: Taking Action in Adversity</h3>
            </div>
            <div className="article-card-body">
              <p>Agency &mdash; the belief that you can act and that your actions matter &mdash; is one of the most powerful predictors of resilient outcomes. Learn what drives high Agentic scores and how to cultivate this dimension.</p>
              <a className="article-cta" href="/quiz">
                Discover your score &#8594;
              </a>
            </div>
          </article>

        </div>
      </section>

      <section className="landing-section alt-bg">
        <div className="insights-cta-banner">
          <h2>Discover Your Resilience Profile</h2>
          <p>Take the free 10-minute assessment and receive your personalized Six Dimensions of Resilience map. No signup required to start.</p>
          <a className="btn-hero-primary" href="/quiz" style={{display:'inline-flex',margin:'0 auto'}}>
            <span aria-hidden="true">&#9654;</span> Take the Free Assessment
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <p>&copy; 2026 The Resilience Atlas&#8482;</p>
        <p className="mt-2">The Resilience Atlas&#8482; is a trademark of Janeen Molchany Ph.D., BCBA.</p>
        <p className="mt-2">For educational and self-reflection purposes only. Not a clinical diagnosis.</p>
        <nav aria-label="Footer navigation" style={{marginTop:'1rem',display:'flex',gap:'1.25rem',justifyContent:'center',flexWrap:'wrap'}}>
          <a href="/" style={{color:'var(--slate-400)',fontSize:'.88rem'}}>Home</a>
          <a href="/teams" style={{color:'var(--slate-400)',fontSize:'.88rem'}}>For Teams</a>
          <a href="/quiz" style={{color:'var(--slate-400)',fontSize:'.88rem'}}>Take Assessment</a>
        </nav>
      </footer>
    </>
  );
}
