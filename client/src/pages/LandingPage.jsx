import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';

const DIMENSIONS = [
  { key: 'relational', icon: '/icons/relational-connective.svg', name: 'Relational-Connective', desc: 'Building and sustaining meaningful connections that buffer stress and foster belonging.' },
  { key: 'cognitive', icon: '/icons/cognitive-narrative.svg', name: 'Cognitive-Narrative', desc: 'Reframing adversity through story, growth mindset, and adaptive thinking patterns.' },
  { key: 'somatic', icon: '/icons/somatic-regulative.svg', name: 'Somatic-Regulative', desc: 'Using body awareness, breath, and movement to regulate the nervous system.' },
  { key: 'emotional', icon: '/icons/emotional-adaptive.svg', name: 'Emotional-Adaptive', desc: 'Recognizing, processing, and channeling emotions as a source of resilience.' },
  { key: 'spiritual', icon: '/icons/spiritual-reflective.svg', name: 'Spiritual-Reflective', desc: 'Drawing on meaning, values, and transcendent perspective during difficulty.' },
  { key: 'agentic', icon: '/icons/agentic-generative.svg', name: 'Agentic-Generative', desc: 'Harnessing purpose, initiative, and creative agency to author your own path.' },
];

export default function LandingPage() {
  const { loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  return (
    <main className="storytelling-page landing-story">
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner story-wrap">
          {/* Logo */}
          <div className="hero-logo">
            <img
              src="/new-logo/resilience-atlas-logo-v5.svg"
              alt="Resilience Atlas compass logo"
              className="hero-logo-image"
            />
          </div>

          <span className="hero-eyebrow">Over 20 years of professional experience and a lifetime of application</span>
          <h1>Map Your Resilience. Master Your Response.</h1>
          <p className="hero-subheadline">
            Discover your personalized profile across six dimensions of resilience.
          </p>
          <p className="hero-subheadline">
            To support your growth, you&rsquo;ll find actionable, research-based strategies from Applied Behavior Analysis (ABA) and Acceptance and Commitment Therapy (ACT)&mdash;empowering you to actively strengthen your resilience every day.
          </p>
          <div className="hero-ctas">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => navigate('/quiz')}
            >
              <span aria-hidden="true">&#9654;</span> Start Your Resilience Map
            </button>
            <button
              type="button"
              className="btn-hero-secondary"
              onClick={() => loginWithRedirect({ appState: { returnTo: '/' } })}
            >
              Log in
            </button>
          </div>
        </div>
      </section>

      {/* Six Dimensions */}
      <section className="landing-section">
        <div className="section-header story-wrap">
          <span className="section-label">The Six Dimensions</span>
          <h2>Your Resilience: Connected, Evolving, Mapped</h2>
          <p>
            Resilience is made of six dynamic strengths, all working together. Your profile reveals your brightest capacities and highlights new areas ready for growth.
          </p>
        </div>
        <div className="dimensions-grid story-wrap">
          {DIMENSIONS.map(({ key, icon, name, desc }) => (
            <div key={key} className="dimension-card soft-card">
              <div className={`dimension-icon dimension-icon--${key}`}>
                <img src={icon} alt="" aria-hidden="true" className="icon icon-md" />
              </div>
              <span className={`dimension-pill dimension-pill--${key}`}>Strength</span>
              <h3>{name}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Section */}
      <section className="landing-section alt-bg">
        <div className="section-header story-wrap">
          <span className="section-label">Why It Works</span>
          <h2>Grounded in Research and Lived Experience</h2>
        </div>
        <div className="why-grid story-wrap">
          <div className="why-card soft-card">
            <h4>A Map, Not a Formula</h4>
            <p>Built on 20+ years of professional experience and doctoral research combined with direct clinical practice. This isn&rsquo;t a generic quiz&mdash;it&rsquo;s a genuine portrait of how you navigate adversity.</p>
          </div>
          <div className="why-card soft-card">
            <h4>Your Unique Profile</h4>
            <p>Your results show the specific shape of your resilience&mdash;not a single number that flattens nuance. A real map of where you stand.</p>
          </div>
          <div className="why-card soft-card">
            <h4>Compass Points for Growth</h4>
            <p>Each dimension comes with practical next steps you can start today. Targeted guidance matched to your specific terrain.</p>
          </div>
          <div className="why-card soft-card">
            <h4>Watch Your Journey Unfold</h4>
            <p>Reassess as you grow. Watch your constellation shift as you cultivate new capacities and deepen existing ones.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-section">
        <div className="story-wrap">
          <div className="final-cta soft-card">
            <h2>Ready to Map Your Resilience?</h2>
            <p>
              This is your starting position&mdash;honest, multidimensional, and genuinely useful.
              Understand where you stand. Discover where you&rsquo;re growing.
            </p>
            <div className="hero-ctas">
              <button
                type="button"
                className="btn-hero-primary"
                onClick={() => navigate('/quiz')}
              >
                Discover Your Dimensions
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
