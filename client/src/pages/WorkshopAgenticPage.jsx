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

export default function WorkshopAgenticPage() {
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
          <h1 className="guide-header__title">Agentic-Generative</h1>
          <p className="guide-header__sub">A facilitated team session to explore and strengthen Agentic-Generative resilience</p>
          <div className="guide-meta">
            <span>⏱ 60–90 minutes</span>
            <span>5–25 participants</span>
            <span>🎯 Team development</span>
          </div>
        </header>

        <section className="section">
          <h2 className="section-title" data-icon="📖">Overview</h2>
          <p>Agentic-Generative resilience is the capacity for proactive action, self-efficacy, and the belief that one can make a meaningful difference. Teams with high agentic resilience take initiative, mobilise resources effectively, and empower each other to act.</p>
          <p>This guide provides a structured facilitation framework including discussion prompts, activities, and reflection questions. Adapt the timing and sequence to suit your team's needs.</p>
          <div className="tip-box">
            <p><strong>Facilitator note:</strong> Create a psychologically safe space before starting. Remind participants that sharing is always voluntary and that there are no right or wrong answers.</p>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title" data-icon="💬">Discussion Prompts</h2>
          <p>Choose 3–5 prompts that feel most relevant to your team. Allow 5–8 minutes per prompt for open discussion.</p>
          <ol>
            <li>Where do you feel most empowered to take initiative — and where do you hold back?</li>
            <li>What would you do differently if you knew you couldn't fail?</li>
            <li>How do we support each other to step into leadership moments?</li>
            <li>What resources, permissions, or support do we need that we don't currently have?</li>
            <li>How do we celebrate effort and learning, not just outcomes?</li>
            <li>When did you last see a teammate demonstrate remarkable agency — and what made it powerful?</li>
            <li>What's one area where we could take more collective ownership and drive change?</li>
          </ol>
        </section>

        <section className="section">
          <h2 className="section-title" data-icon="🔧">Team Activities</h2>
          <p>Select one or two activities depending on your available time.</p>
          <ul>
            <li><strong>Initiative Inventory (15 min):</strong> Each person shares one initiative they've taken recently — big or small. Celebrate each one. Discuss: What made it possible?</li>
            <li><strong>Resource Mapping (20 min):</strong> Brainstorm: What skills, relationships, and resources does our team have? What do we need that we don't have? Who could help us get it?</li>
            <li><strong>Bold Move Brainstorm (20 min):</strong> If we had full permission and resources, what would we do? Generate 10 ideas without editing. Circle the ones that feel most alive.</li>
          </ul>
        </section>

        <section className="section">
          <h2 className="section-title" data-icon="🪞">Reflection Questions</h2>
          <p>Close the session with individual reflection (5 min silent writing) followed by brief sharing.</p>
          <ul>
            <li>Where in your work do you most want to exercise more agency and initiative?</li>
            <li>What support or permission do you need from the team to step up more boldly?</li>
            <li>What is one small action you will take this week to move something forward?</li>
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
