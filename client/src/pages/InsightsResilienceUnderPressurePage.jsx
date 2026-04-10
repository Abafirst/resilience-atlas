import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

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

export default function InsightsResilienceUnderPressurePage() {
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

      <article className="article-body" aria-labelledby="articleHeading">
        <p className="article-meta">Resilience Atlas Insights &mdash; Applied Research</p>
        <h1 id="articleHeading">How Resilience Works Under Pressure</h1>
        <p>When stress is acute &mdash; when a crisis lands suddenly and there is no time to think &mdash; which resilience dimensions activate first? Understanding the sequence of resilience response reveals important things about how to prepare and how to recover.</p>

        <h2>The First Moments: Somatic and Agentic</h2>
        <p>Research on acute stress response consistently shows that the body responds before the mind can fully process what is happening. In the first moments of adversity, Somatic resilience is the primary resource &mdash; your nervous system's capacity to regulate, your breath, your physical groundedness. People with high Somatic resilience move through initial shock more quickly.</p>
        <p>The Agentic dimension also activates early. The impulse to take action &mdash; to do <em>something</em> &mdash; is a primal resilience mechanism. But Agentic resilience without Cognitive or Relational support can lead to reactive, ineffective action.</p>

        <h2>The Recovery Phase: Emotional and Relational</h2>
        <p>Once the initial acute phase passes, Emotional and Relational dimensions become central. Processing what happened emotionally &mdash; naming feelings, making space for grief or anger &mdash; is the mechanism that prevents stress from calcifying into chronic strain. Relational resilience enables the co-regulation that our nervous systems need to fully recover.</p>

        <h2>The Integration Phase: Cognitive and Spiritual</h2>
        <p>In the longer arc of recovery, Cognitive and Spiritual dimensions do the deepest work. Making meaning of what happened, updating the narrative, and reconnecting with purpose are the processes that transform a difficult experience into genuine growth.</p>

        <h2>What This Means for Your Profile</h2>
        <p>If you have high Agentic but low Somatic scores, you may be prone to action-without-regulation under acute stress &mdash; pushing through physically at cost to yourself. If you have high Cognitive but low Emotional, you may intellectualize adversity without processing it fully. The six-dimension map helps you see these patterns before they become problems.</p>

        <div className="article-cta-box">
          <h3>Map Your Resilience Under Pressure</h3>
          <p>Discover your Six Dimensions of Resilience profile with the free Resilience Atlas assessment.</p>
          <a href="/quiz" className="btn btn-primary">Take the Free Assessment</a>
        </div>
      </article>
    </>
  );
}
