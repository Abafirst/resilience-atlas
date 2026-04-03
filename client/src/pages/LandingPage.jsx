import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';

const DIMENSIONS = [
  { key: 'relational',  icon: '/icons/relational-connective.svg',  name: 'Relational-Connective',  desc: 'Building and sustaining meaningful connections that buffer stress and foster belonging.' },
  { key: 'cognitive',   icon: '/icons/cognitive-narrative.svg',    name: 'Cognitive-Narrative',     desc: 'Reframing adversity through story, growth mindset, and adaptive thinking patterns.' },
  { key: 'somatic',     icon: '/icons/somatic-regulative.svg',     name: 'Somatic-Regulative',      desc: 'Using body awareness, breath, and movement to regulate the nervous system.' },
  { key: 'emotional',   icon: '/icons/emotional-adaptive.svg',     name: 'Emotional-Adaptive',      desc: 'Recognising, processing, and channelling emotions as a source of resilience.' },
  { key: 'spiritual',   icon: '/icons/spiritual-reflective.svg',   name: 'Spiritual-Reflective',    desc: 'Drawing on meaning, values, and transcendent perspective during difficulty.' },
  { key: 'agentic',     icon: '/icons/agentic-generative.svg',     name: 'Agentic-Generative',      desc: 'Harnessing purpose, initiative, and creative agency to author your own path.' },
];

export default function LandingPage() {
  const { loginWithRedirect } = useAuth0();

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <span className="hero-eyebrow">13 Years of Research &amp; Lived Experience</span>
          <h1>Map Your Resilience</h1>
          <p className="hero-subheadline">
            Your resilience isn&rsquo;t one thing&mdash;it&rsquo;s a constellation of six interconnected capacities.
            Discover how you navigate challenges, where you&rsquo;re strongest, and where you&rsquo;re emerging.
            Not a score. A map.
          </p>
          <div className="hero-ctas">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => loginWithRedirect()}
            >
              <span aria-hidden="true">&#9654;</span> Explore Your Map
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
          <h2>Your Resilience Is a Constellation, Not a Score</h2>
          <p>
            Resilience isn&rsquo;t one thing&mdash;it&rsquo;s six interconnected capacities. Your profile
            shows where your strengths live, and where new capacity is waiting to emerge.
          </p>
        </div>
        <div className="dimensions-grid">
          {DIMENSIONS.map(({ key, icon, name, desc }) => (
            <div key={key} className="dimension-card">
              <div className={`dimension-icon dimension-icon--${key}`}>
                <img src={icon} alt="" aria-hidden="true" className="icon icon-md" />
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
          <h2>Grounded in Research and Lived Experience</h2>
        </div>
        <div className="why-grid">
          <div className="why-card">
            <h4>A Map, Not a Formula</h4>
            <p>Built on 13 years of doctoral research and clinical practice. This isn&rsquo;t a generic quiz&mdash;it&rsquo;s a genuine portrait of how you navigate adversity.</p>
          </div>
          <div className="why-card">
            <h4>Your Unique Profile</h4>
            <p>Your results show the specific shape of your resilience&mdash;not a single number that flattens nuance. A real map of where you stand.</p>
          </div>
          <div className="why-card">
            <h4>Compass Points for Growth</h4>
            <p>Each dimension comes with practical next steps you can start today. Targeted guidance matched to your specific terrain.</p>
          </div>
          <div className="why-card">
            <h4>Watch Your Journey Unfold</h4>
            <p>Reassess as you grow. Watch your constellation shift as you cultivate new capacities and deepen existing ones.</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-section">
        <div className="final-cta">
          <h2>Ready to Map Your Resilience?</h2>
          <p>
            This is your starting position&mdash;honest, multidimensional, and genuinely useful.
            Understand where you stand. Discover where you&rsquo;re growing.
          </p>
          <div className="hero-ctas">
            <button
              type="button"
              className="btn-hero-primary"
              onClick={() => loginWithRedirect()}
            >
              Discover Your Dimensions
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
