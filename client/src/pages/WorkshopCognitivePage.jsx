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
  .section-title::before { content: attr(data-icon); font-size: 1.1rem; }
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

export default function WorkshopCognitivePage() {
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
        <button className="print-btn" onClick={() => window.print()} type="button">🖨️ Print / Save as PDF</button>

        <header className="guide-header">
          <div className="guide-header__badge">Workshop Guide</div>
          <h1 className="guide-header__title">Cognitive-Narrative</h1>
          <p className="guide-header__sub">A facilitated team session to explore and strengthen Cognitive-Narrative resilience</p>
          <div className="guide-meta">
            <span>⏱ 60–90 minutes</span>
            <span>👥 5–25 participants</span>
            <span>🎯 Team development</span>
          </div>
        </header>

        <section className="section">
          <h2 className="section-title" data-icon="📖">Overview</h2>
          <p>Cognitive-Narrative resilience is the ability to construct empowering stories about challenges and opportunities. Teams with strong cognitive resilience reframe setbacks constructively, maintain growth-oriented narratives, and think flexibly in the face of uncertainty.</p>
          <p>This guide provides a structured facilitation framework including discussion prompts, activities, and reflection questions. Adapt the timing and sequence to suit your team's needs.</p>
          <div className="tip-box">
            <p><strong>Facilitator note:</strong> Create a psychologically safe space before starting. Remind participants that sharing is always voluntary and that there are no right or wrong answers.</p>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title" data-icon="💬">Discussion Prompts</h2>
          <p>Choose 3–5 prompts that feel most relevant to your team. Allow 5–8 minutes per prompt for open discussion.</p>
          <ol>
            <li>What stories do we tell ourselves about our challenges — are they empowering or limiting?</li>
            <li>When we face a setback, how do we typically make sense of what happened?</li>
            <li>What assumptions do we hold that might be limiting our potential as a team?</li>
            <li>How do we share knowledge and learning so the whole team benefits?</li>
            <li>What would change if we adopted a "not yet" mindset toward our struggles?</li>
            <li>Can you think of a time our team turned a failure into a valuable lesson?</li>
            <li>What narratives do we want to tell about who we are as a team?</li>
          </ol>
        </section>

        <section className="section">
          <h2 className="section-title" data-icon="🔧">Team Activities</h2>
          <p>Select one or two activities depending on your available time.</p>
          <ul>
            <li><strong>Reframe Challenge (20 min):</strong> Each person shares a current challenge. The team offers 3 alternative ways to frame or interpret it. Discuss which framings feel most resourceful.</li>
            <li><strong>Learning Harvest (15 min):</strong> Reflect on a recent team setback. Identify: What did we learn? What would we do differently? What unexpected strength did we discover?</li>
            <li><strong>Assumptions Audit (20 min):</strong> Brainstorm assumptions you hold about your team, your work, or your capabilities. Circle any that might be limiting.</li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title" data-icon="🪞">Reflection Questions</h2>
          <p>Close the session with individual reflection (5 min silent writing) followed by brief sharing.</p>
          <ul>
            <li>What story about your team's capability do you want to strengthen?</li>
            <li>What's one limiting belief or assumption you're willing to let go of?</li>
            <li>How will you bring a "reframe" mindset into your next challenge?</li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title" data-icon="📅">Next Steps</h2>
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
