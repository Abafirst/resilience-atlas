import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

const milestones = [
  {
    year: '2004',
    title: 'Practice begins',
    detail: 'Direct work with youth and families highlighted how resilience is lived, not theorized.',
  },
  {
    year: '2013',
    title: 'Doctoral research published',
    detail: 'A multidimensional model emerged from interviews with 18 resilience exemplars and six validated assessments.',
  },
  {
    year: 'Today',
    title: 'Atlas in motion',
    detail: 'Individuals, teams, and organizations use the Atlas to orient, reflect, and navigate growth with clarity.',
  },
];

const missionCards = [
  {
    icon: '🧭',
    title: 'Our mission',
    detail: 'Help people read their current map and move forward with confidence, context, and compassion.',
  },
  {
    icon: '🔬',
    title: 'Our promise',
    detail: 'Keep every insight grounded in research, lived experience, and practical application.',
  },
  {
    icon: '🤝',
    title: 'Our stance',
    detail: 'We are not here to fix you. You are not broken. We are here to help you navigate.',
  },
];

const teamMembers = [
  {
    name: 'Janeen Molchany',
    role: 'Founder & Chief Resilience Scientist',
    avatar: 'J',
    fact: 'Favorite metaphor: “Map first, then movement.”',
  },
  {
    name: 'Research & Insights Team',
    role: 'Psychometrics + Translational Research',
    avatar: 'R',
    fact: 'We turn dense data into clear compass points people can use right away.',
  },
  {
    name: 'Design & Experience Team',
    role: 'Product + Content Experience',
    avatar: 'D',
    fact: 'We test language for warmth and clarity so every screen feels human.',
  },
];

const values = [
  {
    icon: '/icons/cognitive-narrative.svg',
    title: 'Clarity over noise',
    detail: 'We simplify complexity without flattening what is human and nuanced.',
  },
  {
    icon: '/icons/relational-connective.svg',
    title: 'Connection matters',
    detail: 'Resilience grows in relationship—with self, community, and purpose.',
  },
  {
    icon: '/icons/somatic-regulative.svg',
    title: 'Whole-person lens',
    detail: 'Mind, body, story, and environment all shape how people navigate stress.',
  },
  {
    icon: '/icons/spiritual-reflective.svg',
    title: 'Purposeful growth',
    detail: 'We focus on emerging edges and development, never deficit labels.',
  },
];

const styles = `
  .about-page {
    background:
      radial-gradient(circle at 0% 0%, rgba(251, 191, 36, .15) 0%, transparent 38%),
      radial-gradient(circle at 100% 0%, rgba(244, 114, 182, .12) 0%, transparent 34%),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 42%, #f8fafc 100%);
  }

  .about-wrap {
    max-width: 1080px;
    margin: 0 auto;
    padding: 0 1.25rem;
  }

  .about-hero {
    padding: 3.25rem 0 2.25rem;
  }

  .hero-card {
    border-radius: 26px;
    border: 1px solid rgba(79, 70, 229, .16);
    background: linear-gradient(140deg, #fff8f1 0%, #fdf2f8 45%, #eef2ff 100%);
    box-shadow: 0 16px 40px rgba(15, 23, 42, .08);
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 1.5rem;
    padding: clamp(1.35rem, 3vw, 2.2rem);
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  .hero-card::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    right: -120px;
    bottom: -170px;
    background: radial-gradient(circle, rgba(79, 70, 229, .18) 0%, rgba(79, 70, 229, 0) 70%);
    pointer-events: none;
  }

  .hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, .82);
    border: 1px solid rgba(79, 70, 229, .18);
    padding: .36rem .82rem;
    font-size: .75rem;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #4338ca;
    margin-bottom: .9rem;
  }

  .hero-title {
    font-size: clamp(1.9rem, 4.6vw, 3rem);
    line-height: 1.15;
    margin: 0 0 .65rem;
    color: #1f2937;
  }

  .hero-sub {
    margin: 0;
    max-width: 56ch;
    font-size: 1.02rem;
    line-height: 1.72;
    color: #475569;
  }

  .hero-links {
    margin-top: 1.2rem;
    display: flex;
    flex-wrap: wrap;
    gap: .65rem;
  }

  .hero-logo-wrap {
    justify-self: center;
    width: min(260px, 100%);
    border-radius: 20px;
    border: 1px solid rgba(79, 70, 229, .18);
    background: rgba(255, 255, 255, .78);
    text-align: center;
    padding: 1.2rem;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, .92);
  }

  .hero-logo {
    width: 90px;
    height: 90px;
    border-radius: 22px;
    object-fit: contain;
    animation: avatar-pulse 3.2s ease-in-out infinite;
  }

  .hero-logo-copy {
    margin: .8rem 0 0;
    font-size: .86rem;
    color: #475569;
  }

  .story-section,
  .team-section,
  .values-section,
  .cta-section {
    margin-top: 1.75rem;
  }

  .section-title {
    margin: 0 0 .5rem;
    font-size: clamp(1.4rem, 3.2vw, 2rem);
    color: #0f172a;
    letter-spacing: -.01em;
  }

  .section-intro {
    margin: 0;
    color: #475569;
    line-height: 1.7;
    max-width: 70ch;
  }

  .story-grid {
    margin-top: 1.1rem;
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 1rem;
  }

  .soft-card {
    background: #ffffff;
    border: 1px solid var(--slate-200, #e2e8f0);
    border-radius: 18px;
    padding: 1.15rem;
    box-shadow: 0 10px 28px rgba(15, 23, 42, .06);
    transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
  }

  .soft-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 14px 30px rgba(15, 23, 42, .1);
    border-color: rgba(79, 70, 229, .3);
  }

  .timeline-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: .75rem;
  }

  .timeline-item {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: .75rem;
    align-items: start;
  }

  .timeline-year {
    font-weight: 700;
    color: #4338ca;
    font-size: .92rem;
    background: #eef2ff;
    border-radius: 999px;
    padding: .28rem .6rem;
    text-align: center;
  }

  .timeline-title {
    margin: 0;
    font-size: .98rem;
    color: #1e293b;
  }

  .timeline-detail {
    margin: .25rem 0 0;
    font-size: .9rem;
    color: #475569;
    line-height: 1.62;
  }

  .mission-cards {
    display: grid;
    gap: .75rem;
  }

  .mission-card-title {
    margin: 0;
    font-size: .96rem;
    color: #1e293b;
    display: flex;
    align-items: center;
    gap: .45rem;
  }

  .mission-card-title .icon {
    font-size: 1.1rem;
  }

  .mission-card p {
    margin: .4rem 0 0;
    color: #475569;
    line-height: 1.64;
    font-size: .9rem;
  }

  .team-grid {
    margin-top: 1rem;
    display: grid;
    gap: .9rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }

  .team-avatar {
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #ffffff;
    background: linear-gradient(135deg, #4f46e5 0%, #ec4899 100%);
    animation: avatar-pulse 3.4s ease-in-out infinite;
  }

  .team-name {
    margin: .65rem 0 .1rem;
    font-size: 1rem;
    color: #0f172a;
  }

  .team-role {
    margin: 0;
    font-size: .86rem;
    color: #64748b;
  }

  .team-fact {
    margin: .65rem 0 0;
    font-size: .9rem;
    line-height: 1.62;
    color: #334155;
  }

  .values-grid {
    margin-top: 1rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: .8rem;
  }

  .value-pill {
    border-radius: 999px;
    border: 1px solid rgba(79, 70, 229, .18);
    background: linear-gradient(125deg, #ffffff 0%, #f8fafc 100%);
    padding: .95rem 1rem;
    display: flex;
    align-items: flex-start;
    gap: .7rem;
    transition: transform .2s ease, border-color .2s ease;
  }

  .value-pill:hover {
    transform: translateY(-3px);
    border-color: rgba(79, 70, 229, .42);
  }

  .value-pill img {
    width: 1.2rem;
    height: 1.2rem;
    margin-top: .2rem;
    flex-shrink: 0;
  }

  .value-pill h3 {
    margin: 0;
    font-size: .93rem;
    color: #1e293b;
  }

  .value-pill p {
    margin: .2rem 0 0;
    font-size: .84rem;
    line-height: 1.52;
    color: #475569;
  }

  .cta-card {
    border-radius: 24px;
    background: linear-gradient(135deg, #312e81 0%, #4f46e5 48%, #7c3aed 100%);
    color: #ffffff;
    border: 1px solid rgba(129, 140, 248, .5);
    box-shadow: 0 18px 35px rgba(49, 46, 129, .28);
    padding: clamp(1.2rem, 3vw, 2rem);
    display: grid;
    gap: .6rem;
    margin: 2rem 0 2.8rem;
  }

  .cta-card h2 {
    margin: 0;
    font-size: clamp(1.35rem, 3.2vw, 1.9rem);
  }

  .cta-card p {
    margin: 0;
    color: rgba(255, 255, 255, .92);
    max-width: 62ch;
    line-height: 1.7;
  }

  .cta-actions {
    margin-top: .4rem;
    display: flex;
    flex-wrap: wrap;
    gap: .65rem;
  }

  .btn-soft,
  .btn-outline-soft {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    padding: .74rem 1rem;
    text-decoration: none;
    font-size: .9rem;
    font-weight: 600;
    transition: transform .2s ease, box-shadow .2s ease, background-color .2s ease, border-color .2s ease;
  }

  .btn-soft {
    background: #ffffff;
    color: #4338ca;
    box-shadow: 0 8px 18px rgba(15, 23, 42, .16);
  }

  .btn-soft:hover {
    transform: translateY(-2px);
    background: #f8fafc;
  }

  .btn-outline-soft {
    color: #ffffff;
    border: 1px solid rgba(255, 255, 255, .6);
    background: rgba(255, 255, 255, .06);
  }

  .btn-outline-soft:hover {
    transform: translateY(-2px);
    border-color: #ffffff;
    background: rgba(255, 255, 255, .16);
  }

  @keyframes avatar-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @media (max-width: 880px) {
    .hero-card,
    .story-grid {
      grid-template-columns: 1fr;
    }

    .hero-logo-wrap {
      justify-self: start;
      width: 100%;
      max-width: 260px;
    }
  }

  @media (max-width: 640px) {
    .about-wrap { padding: 0 1rem; }
    .timeline-item { grid-template-columns: 62px 1fr; }
    .value-pill { border-radius: 18px; }
    .cta-actions a { width: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .soft-card,
    .value-pill,
    .btn-soft,
    .btn-outline-soft,
    .team-avatar,
    .hero-logo {
      transition: none;
      animation: none;
    }
  }

  [data-theme="dark"] .about-page {
    background:
      radial-gradient(circle at 0% 0%, rgba(168, 85, 247, .16) 0%, transparent 38%),
      radial-gradient(circle at 100% 0%, rgba(59, 130, 246, .14) 0%, transparent 34%),
      linear-gradient(180deg, #020617 0%, #0b1120 44%, #020617 100%);
  }

  [data-theme="dark"] .hero-card {
    background: linear-gradient(140deg, rgba(30, 41, 59, .95) 0%, rgba(51, 65, 85, .92) 52%, rgba(30, 41, 59, .95) 100%);
    border-color: rgba(148, 163, 184, .25);
    box-shadow: 0 16px 40px rgba(2, 6, 23, .55);
  }

  [data-theme="dark"] .hero-kicker {
    background: rgba(15, 23, 42, .55);
    border-color: rgba(99, 102, 241, .5);
    color: #c7d2fe;
  }

  [data-theme="dark"] .hero-title,
  [data-theme="dark"] .section-title,
  [data-theme="dark"] .team-name,
  [data-theme="dark"] .timeline-title,
  [data-theme="dark"] .mission-card-title,
  [data-theme="dark"] .value-pill h3 {
    color: #f8fafc;
  }

  [data-theme="dark"] .hero-sub,
  [data-theme="dark"] .hero-logo-copy,
  [data-theme="dark"] .section-intro,
  [data-theme="dark"] .team-role,
  [data-theme="dark"] .team-fact,
  [data-theme="dark"] .timeline-detail,
  [data-theme="dark"] .mission-card p,
  [data-theme="dark"] .value-pill p {
    color: #cbd5e1;
  }

  [data-theme="dark"] .hero-logo-wrap,
  [data-theme="dark"] .soft-card,
  [data-theme="dark"] .value-pill {
    background: #111827;
    border-color: #334155;
    box-shadow: 0 12px 28px rgba(2, 6, 23, .45);
  }

  [data-theme="dark"] .timeline-year {
    background: rgba(99, 102, 241, .2);
    color: #c7d2fe;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .about-page {
      background:
        radial-gradient(circle at 0% 0%, rgba(168, 85, 247, .16) 0%, transparent 38%),
        radial-gradient(circle at 100% 0%, rgba(59, 130, 246, .14) 0%, transparent 34%),
        linear-gradient(180deg, #020617 0%, #0b1120 44%, #020617 100%);
    }

    :root:not([data-theme="light"]) .hero-card {
      background: linear-gradient(140deg, rgba(30, 41, 59, .95) 0%, rgba(51, 65, 85, .92) 52%, rgba(30, 41, 59, .95) 100%);
      border-color: rgba(148, 163, 184, .25);
      box-shadow: 0 16px 40px rgba(2, 6, 23, .55);
    }

    :root:not([data-theme="light"]) .hero-kicker {
      background: rgba(15, 23, 42, .55);
      border-color: rgba(99, 102, 241, .5);
      color: #c7d2fe;
    }

    :root:not([data-theme="light"]) .hero-title,
    :root:not([data-theme="light"]) .section-title,
    :root:not([data-theme="light"]) .team-name,
    :root:not([data-theme="light"]) .timeline-title,
    :root:not([data-theme="light"]) .mission-card-title,
    :root:not([data-theme="light"]) .value-pill h3 {
      color: #f8fafc;
    }

    :root:not([data-theme="light"]) .hero-sub,
    :root:not([data-theme="light"]) .hero-logo-copy,
    :root:not([data-theme="light"]) .section-intro,
    :root:not([data-theme="light"]) .team-role,
    :root:not([data-theme="light"]) .team-fact,
    :root:not([data-theme="light"]) .timeline-detail,
    :root:not([data-theme="light"]) .mission-card p,
    :root:not([data-theme="light"]) .value-pill p {
      color: #cbd5e1;
    }

    :root:not([data-theme="light"]) .hero-logo-wrap,
    :root:not([data-theme="light"]) .soft-card,
    :root:not([data-theme="light"]) .value-pill {
      background: #111827;
      border-color: #334155;
      box-shadow: 0 12px 28px rgba(2, 6, 23, .45);
    }

    :root:not([data-theme="light"]) .timeline-year {
      background: rgba(99, 102, 241, .2);
      color: #c7d2fe;
    }
  }
`;

export default function AboutPage() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch (e) {}
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <SiteHeader activePage="about" />
      <DarkModeHint />

      <main id="main-content" className="about-page">
        <section className="about-hero" aria-labelledby="about-heading">
          <div className="about-wrap">
            <div className="hero-card">
              <div>
                <span className="hero-kicker">✨ About the Resilience Atlas</span>
                <h1 id="about-heading" className="hero-title">A warm, research-grounded map for real human resilience.</h1>
                <p className="hero-sub">
                  We combine doctoral research, lived experience, and clear language so you can see where you are,
                  what strengths already anchor you, and where your emerging edge is ready to grow.
                </p>
                <div className="hero-links">
                  <a className="btn-soft" href="/quiz">Explore Your Map</a>
                  <a className="btn-outline-soft" href="/research">See the Research</a>
                </div>
              </div>
              <aside className="hero-logo-wrap" aria-label="Resilience Atlas brand mark">
                <img src="/assets/logo-256x256.png" alt="Resilience Atlas logo" className="hero-logo" />
                <p className="hero-logo-copy">Maps, not formulas. Compass points, not labels.</p>
              </aside>
            </div>
          </div>
        </section>

        <section className="story-section" aria-labelledby="story-heading">
          <div className="about-wrap">
            <h2 id="story-heading" className="section-title">Our story and mission</h2>
            <p className="section-intro">
              The Atlas grew from years of direct practice and research. It is built to help people orient without
              judgment—professional enough for teams, personal enough for everyday life.
            </p>
            <div className="story-grid">
              <article className="soft-card" aria-label="Resilience Atlas milestones">
                <ul className="timeline-list">
                  {milestones.map((item) => (
                    <li key={item.year} className="timeline-item">
                      <span className="timeline-year">{item.year}</span>
                      <div>
                        <h3 className="timeline-title">{item.title}</h3>
                        <p className="timeline-detail">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>

              <div className="mission-cards" role="list" aria-label="Mission and values summary">
                {missionCards.map((item) => (
                  <article key={item.title} className="soft-card mission-card" role="listitem">
                    <h3 className="mission-card-title">
                      <span className="icon" aria-hidden="true">{item.icon}</span>
                      {item.title}
                    </h3>
                    <p>{item.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="team-section" aria-labelledby="team-heading">
          <div className="about-wrap">
            <h2 id="team-heading" className="section-title">Meet the team</h2>
            <p className="section-intro">
              Behind the Atlas is a cross-disciplinary team focused on one thing: helping people navigate with
              credibility, warmth, and practical next steps.
            </p>
            <div className="team-grid" role="list" aria-label="Resilience Atlas team members">
              {teamMembers.map((member) => (
                <article key={member.name} className="soft-card" role="listitem">
                  <span className="team-avatar" aria-hidden="true">{member.avatar}</span>
                  <h3 className="team-name">{member.name}</h3>
                  <p className="team-role">{member.role}</p>
                  <p className="team-fact">💬 {member.fact}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="values-section" aria-labelledby="values-heading">
          <div className="about-wrap">
            <h2 id="values-heading" className="section-title">What we value</h2>
            <p className="section-intro">
              These values shape how we design tools, write copy, and support people across individual and
              organizational settings.
            </p>
            <div className="values-grid" role="list" aria-label="Resilience Atlas values">
              {values.map((value) => (
                <article key={value.title} className="value-pill" role="listitem">
                  <img src={value.icon} alt="" aria-hidden="true" />
                  <div>
                    <h3>{value.title}</h3>
                    <p>{value.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="about-wrap">
            <div className="cta-card" aria-label="Join the Resilience Atlas community">
              <h2>Join us on the map</h2>
              <p>
                Whether you&rsquo;re exploring your own resilience or supporting a full team, we&rsquo;d love to help you
                navigate what comes next.
              </p>
              <div className="cta-actions">
                <a className="btn-soft" href="/quiz">Begin Navigation</a>
                <a className="btn-outline-soft" href="/contact">Contact Us</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
