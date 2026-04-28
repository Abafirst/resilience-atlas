import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

const styles = `
  .article-body { max-width:720px; margin:0 auto; padding:3rem 1.25rem 4rem; }
  .article-body h1 { font-size:clamp(1.7rem,3.5vw,2.4rem); color:#0f172a; margin-bottom:1rem; }
  .article-body h2 { font-size:1.3rem; color:#0f172a; margin:2rem 0 .6rem; }
  .article-body p { font-size:1rem; color:#334155; line-height:1.75; margin-bottom:1.1rem; }
  .article-body ul { padding-left:1.4rem; margin-bottom:1.1rem; }
  .article-body ul li { font-size:1rem; color:#334155; line-height:1.7; margin-bottom:.4rem; }
  .article-meta { font-size:.82rem; color:#94a3b8; margin-bottom:2rem; }
  .article-cta-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:14px; padding:2rem; text-align:center; margin-top:3rem; }
  .article-cta-box h3 { color:#0f172a; margin-bottom:.5rem; }
  .article-cta-box p { color:#475569; margin-bottom:1.25rem; }
`;

export default function InsightsSixDimensionsPage() {
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
      <SiteHeader
        navItems={[
          { href: '/insights', label: 'Insights', key: 'insights' },
        ]}
      />
      <DarkModeHint />

      <DarkModeHint />

      <article className="article-body" aria-labelledby="articleHeading">
        <p className="article-meta">Resilience Atlas Insights &mdash; Framework</p>
        <h1 id="articleHeading">Understanding the Six Dimensions of Resilience</h1>
        <p>When most people think about resilience, they imagine a single quality &mdash; the ability to "bounce back." But decades of research across psychology, neuroscience, and clinical practice reveal something more complex and more useful: resilience is a constellation of six distinct dimensions, each reflecting a different way that human beings adapt, recover, and grow under pressure.</p>

        <h2>Why Six Dimensions?</h2>
        <p>A single resilience score tells you very little about <em>how</em> you are resilient or where your growth frontiers lie. The six-dimension model was developed to give individuals and teams a nuanced, actionable map of their adaptive capacity &mdash; one that goes far beyond generic advice like "be more positive" or "build a support network."</p>
        <p>Each dimension operates through a different mechanism. Some are cognitive, some relational, some rooted in the body. Together, they account for the full range of human response to adversity.</p>

        <h2>The Six Dimensions</h2>
        <ul>
          <li><strong>Relational</strong> &mdash; How you access and draw on support from others. High Relational resilience means you can ask for help, maintain connections under stress, and allow others to support you.</li>
          <li><strong>Cognitive</strong> &mdash; How you interpret and reframe challenges. This dimension captures your capacity to shift perspective, find meaning in difficulty, and construct a narrative of growth rather than victimhood.</li>
          <li><strong>Somatic</strong> &mdash; How your body regulates stress. Somatic resilience refers to your physiological capacity to move through tension, restore calm through breath and movement, and sustain physical energy under load.</li>
          <li><strong>Emotional</strong> &mdash; How you process difficult feelings. High Emotional resilience doesn't mean you don't feel &mdash; it means you can acknowledge, experience, and move through challenging emotional states without being overwhelmed or shutting down.</li>
          <li><strong>Spiritual</strong> &mdash; How meaning and purpose shape resilience. This dimension captures your connection to values, beliefs, or a larger sense of why that sustains you when circumstances are difficult.</li>
          <li><strong>Agentic</strong> &mdash; How you take action in adversity. Agentic resilience is your capacity to move forward, make decisions, and assert agency even in uncertainty and chaos.</li>
        </ul>

        <h2>How the Dimensions Interact</h2>
        <p>The six dimensions are not independent. A person with high Spiritual but low Somatic resilience may find deep meaning in adversity but struggle to sustain the physical energy required to act on that meaning. Someone high in Agentic resilience but low in Relational may take decisive action but exhaust themselves by refusing to accept support.</p>
        <p>The real power of the six-dimension model is in understanding the <em>pattern</em> &mdash; which dimensions are strong, which are underdeveloped, and how that specific configuration shapes your response to pressure.</p>

        <h2>Measuring Your Dimensions</h2>
        <p>The Resilience Atlas assessment consists of 36 questions &mdash; six per dimension &mdash; designed to surface your authentic profile rather than your aspirational self. The result is a radar map showing your relative strength across all six dimensions, a narrative profile of your dominant dimension, and evidence-based development practices tailored to your growth frontiers.</p>

        <div className="article-cta-box">
          <h3>Discover Your Six Dimensions</h3>
          <p>Take the free 10-minute assessment and receive your personalized resilience profile.</p>
          <a href="/quiz" className="btn btn-primary" title="For adults 18+">Take the Free Assessment <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span></a>
        </div>
      </article>
    </>
  );
}
