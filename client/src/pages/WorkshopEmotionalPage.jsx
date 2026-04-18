import React, { useEffect } from 'react';

const styles = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; background: #f8fafc; line-height: 1.6; }
  .guide { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem; }
  .guide-header { background: #1a2e5a; color: #fff; border-radius: 0.75rem; padding: 2rem; margin-bottom: 2rem; }
  .guide-header__badge { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #93c5fd; margin-bottom: 0.5rem; }
  .guide-header__title { font-size: 1.75rem; font-weight: 800; margin-bottom: 0.5rem; }
  .guide-header__sub { font-size: 0.9rem; color: rgba(255,255,255,0.75); }
  .guide-meta { display: flex; gap: 1.5rem; margin-top: 1rem; font-size: 0.8rem; color: rgba(255,255,255,0.65); }
  .section { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1.75rem; margin-bottom: 1.25rem; }
  .section-title { font-size: 1rem; font-weight: 700; color: #1a2e5a; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  .section-title img { width: 1.1rem; height: 1.1rem; flex-shrink: 0; }
  p { font-size: 0.9rem; color: #374151; margin-bottom: 0.75rem; }
  ol, ul { padding-left: 1.5rem; }
  li { font-size: 0.9rem; color: #374151; margin-bottom: 0.625rem; line-height: 1.6; }
  .tip-box { background: #eff6ff; border-left: 3px solid #3b82f6; border-radius: 0 0.5rem 0.5rem 0; padding: 1rem 1.25rem; margin-top: 1rem; }
  .tip-box p { margin: 0; font-size: 0.85rem; color: #1e40af; }
  .print-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: #3b82f6; color: #fff; border: none; border-radius: 0.5rem; font-size: 0.875rem; cursor: pointer; text-decoration: none; margin-bottom: 1.5rem; }
  .print-btn:hover { background: #2563eb; }
  .back-link { font-size: 0.85rem; color: #3b82f6; text-decoration: none; display: inline-flex; align-items: center; gap: 0.375rem; margin-bottom: 1rem; }
  .back-link:hover { text-decoration: underline; }
  @media print {
    .print-btn, .back-link { display: none; }
    body { background: #fff; }
    .guide-header { background: #1a2e5a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export default function WorkshopEmotionalPage() {
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
      <div className="guide">
        <a href="/dashboard-advanced" className="back-link">← Back to Dashboard</a>
        <button className="print-btn" onClick={() => window.print()} type="button"><img src="/icons/print.svg" alt="" aria-hidden="true" width={16} height={16} style={{ verticalAlign: "middle" }} /> Print / Save as PDF</button>

        <header className="guide-header">
          <div className="guide-header__badge">Workshop Guide</div>
          <h1 className="guide-header__title">Emotional-Adaptive</h1>
          <p className="guide-header__sub">A facilitated team session to explore and strengthen Emotional-Adaptive resilience</p>
          <div className="guide-meta">
            <span>⏱ 60–90 minutes</span>
            <span>5–25 participants</span>
            <span><img src="/icons/goal.svg" alt="" aria-hidden="true" width={13} height={13} style={{ verticalAlign: "text-bottom", marginRight: 4 }} />Team development</span>
          </div>
        </header>

        <section className="section">
          <h2 className="section-title"><img src="/icons/story.svg" alt="" aria-hidden="true" width={18} height={18} />Overview</h2>
          <p>Emotional-Adaptive resilience is the capacity to recognize, express, and regulate emotions with flexibility and self-compassion. Teams with strong emotional resilience create psychologically safe environments where members can show up authentically.</p>
          <p>This guide provides a structured facilitation framework including discussion prompts, activities, and reflection questions. Adapt the timing and sequence to suit your team's needs.</p>
          <div className="tip-box">
            <p><strong>Facilitator note:</strong> Create a psychologically safe space before starting. Remind participants that sharing is always voluntary and that there are no right or wrong answers.</p>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title"><img src="/icons/dialogue.svg" alt="" aria-hidden="true" width={18} height={18} />Discussion Prompts</h2>
          <p>Choose 3–5 prompts that feel most relevant to your team. Allow 5–8 minutes per prompt for open discussion.</p>
          <ol>
            <li>What emotions are "acceptable" in our team culture — and which ones do we tend to suppress?</li>
            <li>How do we support each other when someone is going through a difficult time?</li>
            <li>What does psychological safety look and feel like in our team?</li>
            <li>How do we express appreciation, care, and recognition for one another?</li>
            <li>What would change if we had more honest conversations about how we're really feeling?</li>
            <li>When was the last time someone showed vulnerability in our team — and how was it received?</li>
            <li>How do we handle conflict or tension in emotionally healthy ways?</li>
          </ol>
        </section>

        <section className="section">
          <h2 className="section-title"><img src="/icons/challenges.svg" alt="" aria-hidden="true" width={18} height={18} />Team Activities</h2>
          <p>Select one or two activities depending on your available time.</p>
          <ul>
            <li><strong>Emotions Vocabulary (15 min):</strong> Using a feelings wheel, each person identifies 3 emotions they've felt recently at work. Share one without judgment.</li>
            <li><strong>Safety Audit (20 min):</strong> Rate psychological safety on 5 dimensions (e.g., can you take risks, admit mistakes, ask for help). Discuss gaps and one action to improve.</li>
            <li><strong>Appreciation Letters (20 min):</strong> Write a short, genuine note of appreciation to a teammate. Read aloud or share privately.</li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title"><img src="/icons/reframe.svg" alt="" aria-hidden="true" width={18} height={18} />Reflection Questions</h2>
          <p>Close the session with individual reflection (5 min silent writing) followed by brief sharing.</p>
          <ul>
            <li>What emotion have you been avoiding expressing at work — and what would it mean to share it safely?</li>
            <li>What would psychological safety look like if we increased it by just 10%?</li>
            <li>What's one way you'll show up with more emotional openness this week?</li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title"><img src="/icons/compass.svg" alt="" aria-hidden="true" width={18} height={18} />Next Steps</h2>
          <p>After the workshop, capture commitments and schedule a follow-up check-in:</p>
          <ul>
            <li>Each person identifies one concrete action they'll take before the next check-in.</li>
            <li>The team agrees on one shared practice to implement together.</li>
            <li>Schedule a 15-minute check-in in 2–4 weeks to review progress.</li>
            <li>Consider reassessing your team's resilience profile in 30 days to track growth.</li>
          </ul>
          <div className="tip-box">
            <p><strong>Track progress:</strong> Return to your <a href="/dashboard-advanced" style={{ color: '#1e40af' }}>Team Dashboard</a> after your next assessment cycle to see how your scores have shifted.</p>
          </div>
        </section>

      </div>
    </>
  );
}
