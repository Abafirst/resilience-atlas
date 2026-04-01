import React, { useEffect } from 'react';

const styles = `
  .article-body { max-width:720px; margin:0 auto; padding:3rem 1.25rem 4rem; }
  .article-body h1 { font-size:clamp(1.7rem,3.5vw,2.4rem); color:#0f172a; margin-bottom:1rem; }
  .article-body h2 { font-size:1.3rem; color:#0f172a; margin:2rem 0 .6rem; }
  .article-body p { font-size:1rem; color:#334155; line-height:1.75; margin-bottom:1.1rem; }
  .article-meta { font-size:.82rem; color:#94a3b8; margin-bottom:2rem; }
  .article-cta-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:14px; padding:2rem; text-align:center; margin-top:3rem; }
  .article-cta-box h3 { color:#0f172a; margin-bottom:.5rem; }
  .article-cta-box p { color:#475569; margin-bottom:1.25rem; }
`;

export default function InsightsTeamResiliencePage() {
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
          <a className="logo" href="/">The Resilience Atlas&#8482;</a>
          <nav style={{display:'flex',alignItems:'center',gap:'1rem'}}>
            <a href="/insights" style={{fontSize:'.92rem',color:'#4F46E5',fontWeight:600}}>Insights</a>
            <a href="/teams" style={{fontSize:'.92rem',color:'var(--slate-600)',fontWeight:500}}>For Teams</a>
            <a className="btn btn-primary" href="/quiz">Take the Assessment</a>
          </nav>
        </div>
      </header>

      <article className="article-body" aria-labelledby="articleHeading">
        <p className="article-meta">Resilience Atlas Insights &mdash; Team Development</p>
        <h1 id="articleHeading">Building Team Resilience Across All Six Dimensions</h1>
        <p>Individual resilience profiles don't just describe the individual &mdash; they shape team dynamics in ways that become critical under pressure. A team's collective Six Dimensions profile reveals both its collective strengths and its structural vulnerabilities.</p>

        <h2>Team-Level Patterns</h2>
        <p>When a team is collectively strong in Cognitive but weak in Relational, you see a characteristic pattern: excellent analysis of problems, but fragmented support for individuals. Under pressure, team members intellectualize rather than connect. Decisions get made, but people feel unseen and unsupported.</p>
        <p>Conversely, a team high in Relational but low in Agentic may have tremendous warmth and mutual support, but struggle to take decisive action in a crisis. They process together beautifully, but the decision gets delayed or diffused.</p>

        <h2>Using Dimension Mapping for Development</h2>
        <p>The Resilience Atlas Business Tier allows team leaders to see the aggregated dimension radar chart for their entire team. This is not about exposing individual weaknesses &mdash; all individual data remains private unless individuals choose to share. The team-level radar shows collective patterns that can inform:</p>
        <ul>
          <li>Facilitated workshops targeting underdeveloped team dimensions</li>
          <li>Role design that accounts for dimension strengths</li>
          <li>Peer support structures that leverage relational resilience</li>
          <li>Leadership coaching focused on dimension gaps</li>
        </ul>

        <h2>The Most Common Team Profile Gaps</h2>
        <p>Across organizations, the most commonly underdeveloped team dimensions are Somatic and Spiritual. Many professional environments implicitly discourage attention to the body's stress signals (Somatic) and to questions of meaning and purpose (Spiritual). The result is teams that can act and analyze, but that slowly burn out because they are disconnected from the physical and existential resources that sustain resilience over time.</p>

        <h2>Getting Started</h2>
        <p>The simplest starting point is to have your team take the individual Resilience Atlas assessment. Once you have enough data, the Business Tier dashboard will show the aggregated team profile. From there, you can have an informed conversation about where to invest in collective resilience.</p>

        <div className="article-cta-box">
          <h3>Ready to Map Your Team's Resilience?</h3>
          <p>Learn more about Resilience Atlas for teams, or start with an individual assessment.</p>
          <a href="/teams" className="btn btn-primary" style={{marginRight:'.75rem'}}>Team Access</a>
          <a href="/quiz" className="btn btn-secondary">Individual Assessment</a>
        </div>
      </article>

      <footer className="site-footer">
        <p>&copy; 2026 The Resilience Atlas&#8482;</p>
        <p className="mt-2">For educational and self-reflection purposes only. Not a clinical diagnosis.</p>
      </footer>
    </>
  );
}
