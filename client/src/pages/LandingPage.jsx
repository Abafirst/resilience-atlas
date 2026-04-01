import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const DIMENSIONS = [
  { key: 'relational',  icon: '🤝', name: 'Relational-Connective',  desc: 'Building and sustaining meaningful connections that buffer stress and foster belonging.' },
  { key: 'cognitive',   icon: '📖', name: 'Cognitive-Narrative',     desc: 'Reframing adversity through story, growth mindset, and adaptive thinking patterns.' },
  { key: 'somatic',     icon: '🧘', name: 'Somatic-Regulative',      desc: 'Using body awareness, breath, and movement to regulate the nervous system.' },
  { key: 'emotional',   icon: '💙', name: 'Emotional-Adaptive',      desc: 'Recognising, processing, and channelling emotions as a source of resilience.' },
  { key: 'spiritual',   icon: '🌟', name: 'Spiritual-Reflective',    desc: 'Drawing on meaning, values, and transcendent perspective during difficulty.' },
  { key: 'agentic',     icon: '🧭', name: 'Agentic-Generative',      desc: 'Harnessing purpose, initiative, and creative agency to author your own path.' },
];

export default function LandingPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">Research-Based • Clinically Validated</span>
          <h1>Build the Resilience You Already Have</h1>
          <p className="hero-subheadline">
            In 10 minutes, discover your personalized map across six dimensions of resilience
            and get a clear path forward. Start where you are. Grow from here.
          </p>
          <div className="hero-ctas">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => loginWithRedirect()}
            >
              <span aria-hidden="true">&#9654;</span> Start Free Assessment
            </button>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => loginWithRedirect()}
            >
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* Six Dimensions */}
      <section className="landing-section">
        <div className="section-header">
          <span className="section-label">The Six Dimensions</span>
          <h2>A Complete Map of Human Resilience</h2>
          <p>
            Resilience isn't one thing — it's six interconnected capacities. Understanding
            yours gives you a clear, actionable roadmap for growth.
          </p>
        </div>
        <div className="dimensions-grid">
          {DIMENSIONS.map(({ key, icon, name, desc }) => (
            <div key={key} className="dimension-card">
              <div className={`dimension-icon dimension-icon--${key}`}>
                <span role="img" aria-label={name}>{icon}</span>
              </div>
              <h3>{name}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Section */}
      <section className="landing-section alt-bg">
        <div className="section-header">
          <span className="section-label">Why It Works</span>
          <h2>Grounded in Research, Built for Real Life</h2>
        </div>
        <div className="why-grid">
          <div className="why-card">
            <h4>Validated Framework</h4>
            <p>Built on decades of resilience research across clinical, positive psychology, and neuroscience fields.</p>
          </div>
          <div className="why-card">
            <h4>Personalized Insights</h4>
            <p>Your results reflect your unique profile — not a generic score that flattens nuance.</p>
          </div>
          <div className="why-card">
            <h4>Actionable Roadmap</h4>
            <p>Each dimension comes with targeted practices you can start today, matched to your level.</p>
          </div>
          <div className="why-card">
            <h4>Track Progress Over Time</h4>
            <p>Reassess as you grow. Watch your resilience profile shift as you build new capacities.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-section">
        <div className="final-cta">
          <h2>Ready to Discover Your Resilience Profile?</h2>
          <p>
            Join thousands of people who have mapped their strengths, identified their gaps,
            and started building lasting resilience.
          </p>
          <div className="hero-ctas">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => loginWithRedirect()}
            >
              Start Free Assessment
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
