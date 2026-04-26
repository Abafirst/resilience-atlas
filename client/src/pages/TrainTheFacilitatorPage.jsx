/**
 * TrainTheFacilitatorPage.jsx
 * "Train the Facilitator" curriculum landing page — Coming Soon teaser.
 * Route: /iatlas/train-the-facilitator
 *
 * Philosophy: Facilitators, clinicians, caregivers, families, teachers, and
 * participants ALL build resilience through the same 6 IATLAS dimensions.
 * Everyone in the ecosystem grows together.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

const DIMENSIONS = [
  { key: 'agentic',   icon: '/icons/agentic-generative.svg',  label: 'Agentic-Generative',   color: '#4f46e5', bg: '#eef2ff',  desc: 'Lead with purpose & model goal-directed action for those you serve.' },
  { key: 'somatic',   icon: '/icons/somatic-regulative.svg',  label: 'Somatic-Regulative',   color: '#059669', bg: '#d1fae5',  desc: 'Regulate your own nervous system so you can co-regulate with others.' },
  { key: 'emotional', icon: '/icons/emotional-reflective.svg',label: 'Emotional-Reflective',  color: '#db2777', bg: '#fce7f3',  desc: 'Process your own emotions before facilitating emotional growth.' },
  { key: 'cognitive', icon: '/icons/cognitive-imaginative.svg',label: 'Cognitive-Imaginative', color: '#d97706', bg: '#fef3c7',  desc: 'Expand creative thinking and model cognitive flexibility.' },
  { key: 'relational',icon: '/icons/relational-connective.svg',label: 'Relational-Connective', color: '#0891b2', bg: '#e0f2fe',  desc: 'Build authentic connection — the foundation of effective facilitation.' },
  { key: 'spiritual', icon: '/icons/spiritual-purposive.svg',  label: 'Spiritual-Purposive',  color: '#7c3aed', bg: '#f5f3ff',  desc: 'Ground your practice in meaning and sustain long-term practitioner wellbeing.' },
];

const WHO_BENEFITS = [
  { icon: '🩺', role: 'Clinicians & Therapists',        desc: 'ABA therapists, psychologists, LCSWs — build your own resilience while equipping clients.' },
  { icon: '🗣️', role: 'Speech-Language Pathologists',   desc: 'Integrate resilience principles into communication-focused treatment.' },
  { icon: '🤸', role: 'Occupational Therapists',        desc: 'Use sensory and somatic dimensions to support both clients and yourself.' },
  { icon: '👨‍🏫', role: 'Teachers & Educators',           desc: 'Bring classroom-ready resilience tools to students of all ages.' },
  { icon: '👨‍👩‍👧', role: 'Caregivers & Families',          desc: 'Parents, guardians, and siblings who support resilience-building at home.' },
  { icon: '🏢', role: 'Practice Administrators',        desc: 'Lead a resilience-centered practice culture from the top down.' },
  { icon: '👥', role: 'Group Facilitators',             desc: 'Run workshops, support groups, and teams using IATLAS protocols.' },
  { icon: '🌱', role: 'Community Support Workers',      desc: 'Social workers, case managers, and community advocates.' },
];

const TTF_MODULES = [
  {
    num: '01',
    title: 'Foundations of IATLAS',
    color: '#4f46e5',
    bg: '#eef2ff',
    items: [
      'Six-dimensional resilience framework',
      'ABA + ACT integration principles',
      'Fidelity to evidence-based protocols',
      'Your own dimensional self-assessment',
    ],
  },
  {
    num: '02',
    title: 'Assessment & Planning',
    color: '#059669',
    bg: '#d1fae5',
    items: [
      'Conducting dimensional assessments',
      'Creating individualized intervention plans',
      'Progress monitoring systems',
      'Adapting protocols across populations',
    ],
  },
  {
    num: '03',
    title: 'Facilitation Skills',
    color: '#db2777',
    bg: '#fce7f3',
    items: [
      'Trauma-informed delivery',
      'Cultural responsiveness',
      'Group facilitation techniques',
      'Managing challenging behaviors',
    ],
  },
  {
    num: '04',
    title: 'Practitioner Resilience',
    color: '#d97706',
    bg: '#fef3c7',
    items: [
      'Your own 6-dimension growth plan',
      'Burnout prevention strategies',
      'Professional peer support',
      'Reflective practice habits',
    ],
  },
  {
    num: '05',
    title: 'Practicum & Supervision',
    color: '#0891b2',
    bg: '#e0f2fe',
    items: [
      'Supervised protocol delivery',
      'Peer review and feedback',
      'Competency demonstration',
      'Portfolio development',
    ],
  },
  {
    num: '06',
    title: 'Certification',
    color: '#7c3aed',
    bg: '#f5f3ff',
    items: [
      'Final competency assessment',
      'Ethics & professional standards',
      'IATLAS Certified Facilitator credential',
      'Ongoing professional development',
    ],
  },
];

export default function TrainTheFacilitatorPage() {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle');

  function handleWaitlist(e) {
    e.preventDefault();
    setWaitlistStatus('success');
    setWaitlistEmail('');
  }

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <style>{`
          .ttf-wrap {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 1.25rem 4rem;
          }

          /* Hero */
          .ttf-hero {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 0 0 32px 32px;
            padding: clamp(3rem, 8vw, 5rem) 1.5rem clamp(2.5rem, 6vw, 4rem);
            text-align: center;
            color: #f1f5f9;
            position: relative;
            overflow: hidden;
            margin-bottom: 3rem;
          }
          .ttf-hero::before {
            content: '';
            position: absolute;
            top: -80px; right: -80px;
            width: 300px; height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(99,102,241,.25) 0%, transparent 70%);
            pointer-events: none;
          }
          .ttf-hero::after {
            content: '';
            position: absolute;
            bottom: -60px; left: -60px;
            width: 240px; height: 240px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(217,119,6,.18) 0%, transparent 70%);
            pointer-events: none;
          }
          .ttf-hero-inner { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
          .ttf-coming-badge {
            display: inline-flex;
            align-items: center;
            gap: .4rem;
            background: rgba(245,158,11,.2);
            border: 1px solid rgba(245,158,11,.4);
            border-radius: 999px;
            padding: .3rem .9rem;
            font-size: .72rem;
            font-weight: 700;
            letter-spacing: .1em;
            text-transform: uppercase;
            color: #fbbf24;
            margin-bottom: 1rem;
          }
          .ttf-hero-title {
            font-size: clamp(2rem, 5vw, 3.25rem);
            font-weight: 900;
            margin: 0 0 1rem;
            line-height: 1.15;
            color: #f1f5f9;
          }
          .ttf-hero-sub {
            font-size: clamp(.95rem, 2vw, 1.1rem);
            color: #94a3b8;
            line-height: 1.7;
            max-width: 60ch;
            margin: 0 auto 2rem;
          }
          .ttf-hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: .75rem;
            justify-content: center;
          }

          /* Buttons */
          .ttf-btn-primary {
            display: inline-flex; align-items: center; gap: .4rem;
            background: #6366f1; color: #fff; border: none; border-radius: 10px;
            padding: .75rem 1.5rem; font-size: .95rem; font-weight: 700;
            text-decoration: none; cursor: pointer;
            transition: background .18s, transform .18s;
          }
          .ttf-btn-primary:hover { background: #4f46e5; transform: translateY(-2px); }
          .ttf-btn-secondary {
            display: inline-flex; align-items: center; gap: .4rem;
            background: rgba(255,255,255,.1); color: #e2e8f0;
            border: 1.5px solid rgba(255,255,255,.25); border-radius: 10px;
            padding: .72rem 1.4rem; font-size: .93rem; font-weight: 600;
            text-decoration: none; cursor: pointer;
            transition: background .18s, transform .18s;
          }
          .ttf-btn-secondary:hover { background: rgba(255,255,255,.18); transform: translateY(-2px); }

          /* Philosophy banner */
          .ttf-philosophy {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border-radius: 24px;
            padding: clamp(2rem, 5vw, 3rem);
            text-align: center;
            color: #fff;
            margin-bottom: 3rem;
          }
          .ttf-philosophy-kicker {
            font-size: .75rem; font-weight: 700; letter-spacing: .12em;
            text-transform: uppercase; color: #c4b5fd; margin-bottom: .6rem;
          }
          .ttf-philosophy-title {
            font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800;
            margin: 0 0 .8rem; color: #fff;
          }
          .ttf-philosophy-text {
            font-size: 1rem; color: rgba(255,255,255,.85);
            line-height: 1.7; max-width: 70ch; margin: 0 auto;
          }

          /* Section headers */
          .ttf-section-kicker {
            font-size: .72rem; font-weight: 700; letter-spacing: .12em;
            text-transform: uppercase; color: #6366f1;
            margin-bottom: .4rem; display: block;
          }
          .ttf-section-title {
            font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 800;
            color: #1e293b; margin: 0 0 .5rem;
          }
          .ttf-section-sub {
            font-size: .95rem; color: #64748b; line-height: 1.65;
            max-width: 65ch; margin: 0 0 2rem;
          }

          /* Dimensions grid */
          .ttf-dims-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
          }
          .ttf-dim-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: .6rem;
          }
          .ttf-dim-header {
            display: flex; align-items: center; gap: .75rem;
          }
          .ttf-dim-icon-wrap {
            width: 42px; height: 42px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .ttf-dim-label {
            font-size: .95rem; font-weight: 700; color: #1e293b;
          }
          .ttf-dim-desc {
            font-size: .85rem; color: #64748b; line-height: 1.55;
          }

          /* Who benefits */
          .ttf-who-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
          }
          .ttf-who-card {
            background: #fff; border: 1px solid #e2e8f0;
            border-radius: 16px; padding: 1.25rem;
          }
          .ttf-who-icon {
            font-size: 1.75rem; margin-bottom: .5rem; display: block;
          }
          .ttf-who-role {
            font-size: .93rem; font-weight: 700; color: #1e293b;
            margin-bottom: .35rem;
          }
          .ttf-who-desc {
            font-size: .82rem; color: #64748b; line-height: 1.55;
          }

          /* Modules */
          .ttf-modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
          }
          .ttf-module-card {
            background: #fff; border: 1px solid #e2e8f0;
            border-radius: 16px; padding: 1.35rem;
          }
          .ttf-module-num {
            font-size: .7rem; font-weight: 700; letter-spacing: .1em;
            text-transform: uppercase; margin-bottom: .4rem;
          }
          .ttf-module-title {
            font-size: 1rem; font-weight: 700; color: #1e293b;
            margin-bottom: .8rem;
          }
          .ttf-module-list {
            list-style: none; padding: 0; margin: 0;
            display: flex; flex-direction: column; gap: .35rem;
          }
          .ttf-module-item {
            font-size: .83rem; color: #64748b;
            display: flex; align-items: baseline; gap: .5rem;
          }
          .ttf-module-bullet { color: #94a3b8; flex-shrink: 0; }

          /* Waitlist */
          .ttf-waitlist {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 24px;
            padding: clamp(2rem, 5vw, 3rem);
            text-align: center;
            color: #f1f5f9;
            margin-bottom: 2rem;
          }
          .ttf-waitlist-title {
            font-size: clamp(1.3rem, 3vw, 1.8rem); font-weight: 800;
            margin: 0 0 .6rem; color: #f1f5f9;
          }
          .ttf-waitlist-sub {
            font-size: .95rem; color: #94a3b8; line-height: 1.65;
            max-width: 55ch; margin: 0 auto 1.5rem;
          }
          .ttf-waitlist-form {
            display: flex; flex-wrap: wrap; gap: .5rem;
            justify-content: center; max-width: 480px; margin: 0 auto;
          }
          .ttf-waitlist-input {
            flex: 1; min-width: 220px;
            background: rgba(255,255,255,.08);
            border: 1.5px solid rgba(255,255,255,.2);
            border-radius: 10px; padding: .72rem 1rem;
            font-size: .95rem; color: #f1f5f9;
            outline: none;
          }
          .ttf-waitlist-input::placeholder { color: #64748b; }
          .ttf-waitlist-input:focus { border-color: rgba(99,102,241,.7); }
          .ttf-waitlist-submit {
            background: #6366f1; color: #fff; border: none;
            border-radius: 10px; padding: .72rem 1.5rem;
            font-size: .95rem; font-weight: 700; cursor: pointer;
            transition: background .18s;
          }
          .ttf-waitlist-submit:hover { background: #4f46e5; }
          .ttf-waitlist-success {
            background: rgba(16,185,129,.15);
            border: 1px solid rgba(16,185,129,.3);
            border-radius: 12px; padding: 1rem 1.5rem;
            color: #6ee7b7; font-weight: 600;
            display: inline-flex; align-items: center; gap: .5rem;
          }

          @media (max-width: 640px) {
            .ttf-dims-grid,
            .ttf-who-grid,
            .ttf-modules-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="ttf-hero">
          <div className="ttf-hero-inner">
            <div className="ttf-coming-badge">🎓 Coming Soon — 2026</div>
            <h1 className="ttf-hero-title">Train the Facilitator</h1>
            <p className="ttf-hero-sub">
              A professional certification program for clinicians, caregivers, educators, and
              service providers who want to deliver IATLAS with fidelity — while building their
              own resilience along the way.
            </p>
            <div className="ttf-hero-actions">
              <a href="#ttf-waitlist" className="ttf-btn-primary">
                Join the Waitlist
              </a>
              <Link to="/iatlas" className="ttf-btn-secondary">
                ← Back to IATLAS
              </Link>
            </div>
          </div>
        </div>

        <div className="ttf-wrap">

          {/* ── Philosophy ───────────────────────────────────────────── */}
          <div className="ttf-philosophy">
            <p className="ttf-philosophy-kicker">Core Philosophy</p>
            <h2 className="ttf-philosophy-title">Everyone Builds Resilience — Together</h2>
            <p className="ttf-philosophy-text">
              IATLAS is a recursive, all-inclusive system. The same six dimensions of resilience
              that participants develop are also cultivated by facilitators, clinicians, caregivers,
              families, and teams. You can't pour from an empty cup — when practitioners grow their
              own resilience, they become more effective guides for everyone they serve.
            </p>
          </div>

          {/* ── 6 Dimensions for Facilitators ────────────────────────── */}
          <section aria-labelledby="ttf-dims-title">
            <span className="ttf-section-kicker">Dual Growth Model</span>
            <h2 className="ttf-section-title" id="ttf-dims-title">
              6 Dimensions — For Facilitators Too
            </h2>
            <p className="ttf-section-sub">
              TTF trains you to apply the same six IATLAS dimensions in your own professional and
              personal life — so you can facilitate growth from lived experience, not just theory.
            </p>
            <div className="ttf-dims-grid">
              {DIMENSIONS.map(dim => (
                <div key={dim.key} className="ttf-dim-card">
                  <div className="ttf-dim-header">
                    <div className="ttf-dim-icon-wrap" style={{ background: dim.bg }}>
                      <img src={dim.icon} alt="" width={22} height={22} aria-hidden="true" />
                    </div>
                    <span className="ttf-dim-label" style={{ color: dim.color }}>{dim.label}</span>
                  </div>
                  <p className="ttf-dim-desc">{dim.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Who Benefits ─────────────────────────────────────────── */}
          <section aria-labelledby="ttf-who-title">
            <span className="ttf-section-kicker">One Stop Shop</span>
            <h2 className="ttf-section-title" id="ttf-who-title">
              Built for Every Service Provider
            </h2>
            <p className="ttf-section-sub">
              IATLAS TTF is designed as a universal training system — one curriculum that equips all
              the people in a participant's ecosystem to facilitate resilience across every setting.
            </p>
            <div className="ttf-who-grid">
              {WHO_BENEFITS.map(w => (
                <div key={w.role} className="ttf-who-card">
                  <span className="ttf-who-icon" aria-hidden="true">{w.icon}</span>
                  <p className="ttf-who-role">{w.role}</p>
                  <p className="ttf-who-desc">{w.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Curriculum Modules ───────────────────────────────────── */}
          <section aria-labelledby="ttf-modules-title">
            <span className="ttf-section-kicker">Certification Pathway</span>
            <h2 className="ttf-section-title" id="ttf-modules-title">
              TTF Curriculum Overview
            </h2>
            <p className="ttf-section-sub">
              A six-module professional certification that blends personal resilience development
              with facilitation skill-building, practicum hours, and competency assessment.
            </p>
            <div className="ttf-modules-grid">
              {TTF_MODULES.map(mod => (
                <div key={mod.num} className="ttf-module-card">
                  <p className="ttf-module-num" style={{ color: mod.color }}>Module {mod.num}</p>
                  <h3 className="ttf-module-title" style={{ borderLeft: `3px solid ${mod.color}`, paddingLeft: '.6rem' }}>
                    {mod.title}
                  </h3>
                  <ul className="ttf-module-list">
                    {mod.items.map((item, i) => (
                      <li key={i} className="ttf-module-item">
                        <span className="ttf-module-bullet" aria-hidden="true">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Specialties Preview ──────────────────────────────────── */}
          <section aria-labelledby="ttf-specialties-title" style={{ marginBottom: '3rem' }}>
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 24,
              padding: 'clamp(1.75rem, 4vw, 2.5rem)',
            }}>
              <span className="ttf-section-kicker">Specialty Tracks</span>
              <h2 className="ttf-section-title" id="ttf-specialties-title">
                Field-Specific Advanced Modules
              </h2>
              <p className="ttf-section-sub">
                After core TTF certification, practitioners can pursue specialty tracks aligned with
                their professional field and the IATLAS specialties already in development.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
                {[
                  { label: '🏫 Teachers & Educators', color: '#eef2ff', text: '#4f46e5' },
                  { label: '🗣️ Speech-Language Pathologists', color: '#e0f2fe', text: '#0891b2' },
                  { label: '🤸 Occupational Therapists', color: '#d1fae5', text: '#059669' },
                  { label: '🧩 Daily Living Skills', color: '#fef3c7', text: '#d97706' },
                  { label: '🤝 Social Skills', color: '#fce7f3', text: '#db2777' },
                  { label: '👨‍👩‍👧 Caregivers & Families', color: '#f5f3ff', text: '#7c3aed' },
                  { label: '🩺 Clinicians', color: '#fff7ed', text: '#ea580c' },
                ].map(tag => (
                  <span key={tag.label} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                    background: tag.color, color: tag.text,
                    border: `1px solid ${tag.text}33`,
                    borderRadius: 999, padding: '.3rem .85rem',
                    fontSize: '.8rem', fontWeight: 600,
                  }}>
                    {tag.label}
                    <span style={{ fontSize: '.65rem', opacity: .8, fontStyle: 'italic' }}>Coming 2026</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── Waitlist ─────────────────────────────────────────────── */}
          <section id="ttf-waitlist" aria-labelledby="ttf-wl-title">
            <div className="ttf-waitlist">
              <h2 className="ttf-waitlist-title" id="ttf-wl-title">
                Be the First to Get Certified
              </h2>
              <p className="ttf-waitlist-sub">
                TTF launches in 2026. Join the waitlist to receive program updates, early-access
                pricing, and a free preview module when it drops.
              </p>
              {waitlistStatus === 'success' ? (
                <div className="ttf-waitlist-success" role="status" aria-live="polite">
                  ✓ You're on the list — we'll be in touch!
                </div>
              ) : (
                <form className="ttf-waitlist-form" onSubmit={handleWaitlist} aria-label="TTF waitlist form">
                  <label htmlFor="ttf-email" style={{ position: 'absolute', left: '-9999px' }}>
                    Your email address
                  </label>
                  <input
                    id="ttf-email"
                    type="email"
                    className="ttf-waitlist-input"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <button type="submit" className="ttf-waitlist-submit">
                    Join Waitlist
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* ── Bottom nav ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', justifyContent: 'center' }}>
            <Link
              to="/iatlas"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                background: '#6366f1', color: '#fff', borderRadius: 10,
                padding: '.7rem 1.4rem', fontWeight: 700, fontSize: '.93rem',
                textDecoration: 'none',
              }}
            >
              ← Back to IATLAS Curriculum
            </Link>
            <Link
              to="/iatlas/practice/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                background: '#fff', color: '#1e293b',
                border: '1.5px solid #e2e8f0',
                borderRadius: 10, padding: '.7rem 1.4rem',
                fontWeight: 600, fontSize: '.93rem',
                textDecoration: 'none',
              }}
            >
              Practice Dashboard →
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
