import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import { getIATLASSubscriptionStatus } from '../api/iatlas.js';
import { IATLAS_TIER_KEY, hasProfessionalAccess, hasCaregiverAccess } from '../utils/iatlasGating.js';
import { getAuth0CachedToken } from '../lib/apiFetch.js';
import SpecialtyCard from '../components/IATLAS/SpecialtyCard.jsx';
import SpecialtyComingSoonModal from '../components/IATLAS/SpecialtyComingSoonModal.jsx';
import { IATLAS_SPECIALTIES } from '../data/iatlas/specialties.js';

// ── Dimension data ─────────────────────────────────────────────────────────────
const DIMENSIONS = [
  {
    key: 'agentic-generative',
    icon: '/icons/agentic-generative.svg',
    title: 'Agentic-Generative',
    tagline: 'Master your goals and take purposeful action',
    color: '#4f46e5',
    colorLight: '#eef2ff',
    colorBorder: 'rgba(79,70,229,.22)',
    description:
      'The Agentic-Generative dimension addresses your capacity to initiate purposeful action, pursue meaningful goals, and sustain behavioral momentum in the direction of your values. "Agentic" means self-directed and intentional; "Generative" means producing, creating, and contributing — generating outcomes and meaning rather than merely surviving.',
    competencies: [
      'Values Identification & Alignment',
      'Goal Setting & Action Planning',
      'Problem-Solving & Barrier Navigation',
      'Self-Efficacy & Positive Self-Direction',
      'Persistence & Behavioral Activation',
    ],
    sampleSkills: [
      'Translate core values into specific, actionable goals',
      'Build multi-step plans and adapt when obstacles arise',
      'Use ACT committed action techniques to maintain momentum',
    ],
    comingSoon: [
      'Full skills inventory across 3 levels (Foundational → Advanced)',
      'ABA protocol library (shaping, reinforcement, self-monitoring)',
      'Values Excavation and Compass micropractices',
      'Behavioral activation worksheets',
      'Progress tracking & XP rewards',
    ],
  },
  {
    key: 'somatic-regulative',
    icon: '/icons/somatic-regulative.svg',
    title: 'Somatic-Regulative',
    tagline: 'Harness your body as a resilience resource',
    color: '#059669',
    colorLight: '#d1fae5',
    colorBorder: 'rgba(5,150,105,.22)',
    description:
      'The Somatic-Regulative dimension focuses on the body as a primary resource for resilience. It encompasses your capacity for physical self-regulation — using breath, movement, interoception, and somatic awareness to navigate stress, restore calm, and sustain physical energy under load.',
    competencies: [
      'Breath-Based Regulation Techniques',
      'Body Scan & Interoceptive Awareness',
      'Movement & Physical Activation',
      'Somatic Grounding in Crisis',
      'Physical Recovery & Restoration',
    ],
    sampleSkills: [
      'Practice 4-7-8 and box breathing for rapid nervous system regulation',
      'Develop a daily somatic check-in routine',
      'Use progressive muscle relaxation and movement to release held tension',
    ],
    comingSoon: [
      'Guided breathwork audio practices (5–20 min)',
      'Daily somatic micropractice library',
      'Body scan scripts and grounding exercises',
      '7-day and 30-day somatic streak challenges',
      'Integration with Resilience Atlas assessment data',
    ],
  },
  {
    key: 'cognitive-narrative',
    icon: '/icons/cognitive-narrative.svg',
    title: 'Cognitive-Interpretive',
    tagline: 'Reshape how you interpret challenge and adversity',
    color: '#7c3aed',
    colorLight: '#ede9fe',
    colorBorder: 'rgba(124,58,237,.22)',
    description:
      'The Cognitive-Interpretive dimension (also called Cognitive-Narrative) captures your capacity to interpret and reframe challenges, construct meaning from adversity, and shift perspective under pressure. This dimension addresses how your internal narrative shapes your response to difficult circumstances.',
    competencies: [
      'Cognitive Reframing & Perspective-Shifting',
      'Meaning-Making in Adversity',
      'Defusion from Unhelpful Thought Patterns',
      'Adaptive Narrative Construction',
      'Present-Moment Cognitive Flexibility',
    ],
    sampleSkills: [
      'Apply ACT defusion techniques to unhook from unhelpful stories',
      'Develop a growth-oriented explanatory style',
      'Use journaling prompts to reframe setbacks as information',
    ],
    comingSoon: [
      'Cognitive flexibility skill modules',
      'ACT defusion technique library with guided scripts',
      '14-day reframing journal challenge',
      'Adaptive narrative worksheets',
      'Evidence-based cognitive resilience exercises',
    ],
  },
  {
    key: 'relational-connective',
    icon: '/icons/relational-connective.svg',
    title: 'Relational-Connective',
    tagline: 'Build and sustain meaningful connections under stress',
    color: '#0891b2',
    colorLight: '#e0f2fe',
    colorBorder: 'rgba(8,145,178,.22)',
    description:
      'The Relational-Connective dimension addresses how you access, build, and sustain meaningful connections under conditions of stress and adversity. High relational resilience means you can ask for help, maintain connections when things are hard, and allow others to support you — recognizing that resilience grows in relationship.',
    competencies: [
      'Help-Seeking & Receiving Support',
      'Boundary Setting in Relationships',
      'Connection Maintenance Under Stress',
      'Community & Interdependence',
      'Prosocial Behavior & Generosity',
    ],
    sampleSkills: [
      'Identify and strengthen your core support network',
      'Practice vulnerability and help-seeking as resilience strengths',
      'Develop rituals of connection that sustain relationships during difficulty',
    ],
    comingSoon: [
      'Relationship mapping and support network tools',
      '30-day relational activation challenge',
      'Communication skills modules for stress contexts',
      'Guided practices for deepening connection',
      'Team and group resilience activities',
    ],
  },
  {
    key: 'emotional-adaptive',
    icon: '/icons/emotional-adaptive.svg',
    title: 'Emotional-Adaptive',
    tagline: 'Process emotions with flexibility and compassion',
    color: '#db2777',
    colorLight: '#fce7f3',
    colorBorder: 'rgba(219,39,119,.22)',
    description:
      'The Emotional-Adaptive dimension captures your capacity to experience, process, and navigate difficult emotional states without being overwhelmed or shutting down. High emotional resilience does not mean the absence of difficult feelings — it means you can acknowledge, stay with, and move through emotional experience adaptively.',
    competencies: [
      'Emotion Identification & Labeling',
      'Emotional Tolerance & Willingness',
      'Adaptive Emotional Expression',
      'Self-Compassion in Difficulty',
      'Emotional Recovery & Regulation',
    ],
    sampleSkills: [
      'Build an emotion vocabulary that supports processing rather than suppression',
      'Use ACT acceptance techniques to increase emotional tolerance',
      'Practice self-compassion as an evidence-based resilience tool',
    ],
    comingSoon: [
      'Emotion tracking and pattern recognition tools',
      'ACT acceptance and willingness practice library',
      'Self-compassion guided practices (Neff-based)',
      '21-day emotional awareness challenge',
      'Worksheets for processing difficult emotions',
    ],
  },
  {
    key: 'spiritual-existential',
    icon: '/icons/spiritual-reflective.svg',
    title: 'Spiritual-Existential',
    tagline: 'Ground resilience in values, meaning, and purpose',
    color: '#d97706',
    colorLight: '#fef3c7',
    colorBorder: 'rgba(217,119,6,.22)',
    description:
      'The Spiritual-Existential dimension (also called Spiritual-Reflective) captures how values, meaning, and a sense of larger purpose shape your capacity for resilience. This dimension is not defined by religious belief — it encompasses any framework of meaning, values-based living, or existential grounding that sustains you when circumstances are difficult.',
    competencies: [
      'Values Clarification & Alignment',
      'Meaning-Making & Purpose Discovery',
      'Existential Grounding Under Pressure',
      'Gratitude & Appreciative Attention',
      'Transcendence & Perspective-Taking',
    ],
    sampleSkills: [
      'Clarify your core values and use them as a resilience compass',
      'Develop a personal meaning-making practice for times of adversity',
      'Use gratitude and appreciative attention to sustain perspective',
    ],
    comingSoon: [
      'Values clarification deep-dive curriculum',
      'Meaning-making practice library',
      'Guided reflection and contemplative exercises',
      'Values-aligned goal setting integration',
      'Philosophical frameworks for existential resilience',
    ],
  },
];

// ── Gated content overlay component ──────────────────────────────────────────
function GatedContent({ items, label = 'IATLAS Access Required' }) {
  return (
    <div className="iatlas-gated-block" aria-label={`${label} — IATLAS subscription required`}>
      <div className="iatlas-gated-header">
        <span className="iatlas-lock-icon" aria-hidden="true">
          <img src="/icons/lock.svg" alt="" width={18} height={18} />
        </span>
        <span className="iatlas-coming-soon-badge">{label}</span>
      </div>
      <ul className="iatlas-gated-list" aria-label="Features included with IATLAS">
        {items.map((item, i) => (
          <li key={i} className="iatlas-gated-item">
            <span className="iatlas-check" aria-hidden="true">✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Dimension card component ──────────────────────────────────────────────────
function DimensionCard({ dim, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article
      className="iatlas-dim-card"
      style={{ '--dim-color': dim.color, '--dim-color-light': dim.colorLight, '--dim-color-border': dim.colorBorder }}
      aria-labelledby={`dim-title-${dim.key}`}
    >
      {/* Card header */}
      <div className="iatlas-dim-header">
        <div className="iatlas-dim-icon-wrap" aria-hidden="true">
          <img src={dim.icon} alt="" width={40} height={40} className="iatlas-dim-icon" />
        </div>
        <div className="iatlas-dim-meta">
          <span className="iatlas-dim-number" aria-hidden="true">Dimension {index + 1}</span>
          <h3 className="iatlas-dim-title" id={`dim-title-${dim.key}`}>
            {dim.title}
          </h3>
          <p className="iatlas-dim-tagline">{dim.tagline}</p>
        </div>
      </div>

      {/* Description */}
      <p className="iatlas-dim-desc">{dim.description}</p>

      {/* Key Competencies (free) */}
      <div className="iatlas-dim-section">
        <h4 className="iatlas-dim-section-title">Key Competencies</h4>
        <ul className="iatlas-dim-competency-list">
          {dim.competencies.map((c, i) => (
            <li key={i} className="iatlas-dim-competency-item">
              <span className="iatlas-bullet" aria-hidden="true" style={{ color: dim.color }}>●</span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* Sample Skills (free preview) */}
      <div className="iatlas-dim-section">
        <h4 className="iatlas-dim-section-title">Sample Skills You'll Learn</h4>
        <ul className="iatlas-dim-skill-list">
          {dim.sampleSkills.map((s, i) => (
            <li key={i} className="iatlas-dim-skill-item">
              <span className="iatlas-check-green" aria-hidden="true">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Toggle to see gated content preview */}
      <button
        className="iatlas-expand-btn"
        aria-expanded={expanded}
        aria-controls={`gated-${dim.key}`}
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? 'Hide details' : "What's included when available"}
        <span aria-hidden="true" className={`iatlas-chevron${expanded ? ' iatlas-chevron--up' : ''}`}>›</span>
      </button>

      {expanded && (
        <div id={`gated-${dim.key}`}>
          <GatedContent items={dim.comingSoon} />
        </div>
      )}

      {/* Link to curriculum page */}
      <Link
        to={`/iatlas/curriculum/${dim.key}`}
        className="iatlas-dim-curriculum-link"
        aria-label={`Explore ${dim.title} curriculum`}
      >
        Explore Curriculum →
      </Link>
    </article>
  );
}

// ── Page styles ────────────────────────────────────────────────────────────────
const STYLES = `
  /* ── Page shell ─────────────────────────────────────────────────────────── */
  .iatlas-page {
    background:
      radial-gradient(circle at 5% 0%, rgba(79,70,229,.1) 0%, transparent 36%),
      radial-gradient(circle at 95% 5%, rgba(217,119,6,.08) 0%, transparent 32%),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%);
    min-height: 100vh;
  }

  .iatlas-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem;
  }

  /* ── Skip link ───────────────────────────────────────────────────────────── */
  .iatlas-skip {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  .iatlas-skip:focus {
    position: fixed;
    left: 1rem;
    top: 1rem;
    width: auto;
    height: auto;
    padding: .6rem 1.2rem;
    background: #4f46e5;
    color: #fff;
    border-radius: 8px;
    z-index: 9999;
    font-weight: 700;
    text-decoration: none;
  }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .iatlas-hero {
    padding: 3.5rem 0 2.5rem;
  }

  .iatlas-hero-card {
    background: linear-gradient(135deg, #eef2ff 0%, #fdf4ff 50%, #fff7ed 100%);
    border: 1px solid rgba(79,70,229,.18);
    border-radius: 28px;
    box-shadow: 0 16px 48px rgba(15,23,42,.09);
    padding: clamp(1.5rem, 4vw, 2.5rem);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2rem;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  .iatlas-hero-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 85% 50%, rgba(79,70,229,.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .iatlas-kicker {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: rgba(255,255,255,.85);
    border: 1px solid rgba(79,70,229,.2);
    border-radius: 999px;
    padding: .3rem .8rem;
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: #4338ca;
    margin-bottom: .8rem;
  }

  .iatlas-hero-title {
    font-size: clamp(1.9rem, 4.5vw, 3.1rem);
    line-height: 1.12;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 .75rem;
    letter-spacing: -.02em;
  }

  .iatlas-hero-sub {
    font-size: 1.05rem;
    line-height: 1.7;
    color: #475569;
    max-width: 55ch;
    margin: 0 0 1.4rem;
  }

  .iatlas-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .7rem;
    align-items: center;
  }

  .iatlas-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: .72rem 1.4rem;
    font-size: .95rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: background .18s ease, transform .18s ease, box-shadow .18s ease;
    box-shadow: 0 4px 14px rgba(79,70,229,.3);
  }
  .iatlas-btn-primary:hover, .iatlas-btn-primary:focus-visible {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(79,70,229,.38);
    outline: none;
  }
  .iatlas-btn-primary:focus-visible {
    outline: 3px solid #4f46e5;
    outline-offset: 3px;
  }

  .iatlas-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: rgba(255,255,255,.9);
    color: #334155;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    padding: .68rem 1.3rem;
    font-size: .93rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: border-color .18s ease, transform .18s ease;
  }
  .iatlas-btn-secondary:hover, .iatlas-btn-secondary:focus-visible {
    border-color: #4f46e5;
    color: #4338ca;
    transform: translateY(-1px);
    outline: none;
  }
  .iatlas-btn-secondary:focus-visible {
    outline: 3px solid #4f46e5;
    outline-offset: 3px;
  }

  .iatlas-hero-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .6rem;
    min-width: 140px;
  }

  .iatlas-hero-badge {
    background: rgba(255,255,255,.9);
    border: 1.5px solid rgba(79,70,229,.2);
    border-radius: 16px;
    padding: .9rem 1.1rem;
    text-align: center;
    box-shadow: 0 4px 18px rgba(79,70,229,.1);
  }

  .iatlas-hero-badge-num {
    display: block;
    font-size: 2.4rem;
    font-weight: 800;
    color: #4338ca;
    line-height: 1;
  }

  .iatlas-hero-badge-label {
    display: block;
    font-size: .7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #64748b;
    margin-top: .25rem;
  }

  /* ── Overview section ────────────────────────────────────────────────────── */
  .iatlas-overview {
    margin-top: 3rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1rem;
  }

  .iatlas-overview-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 1.3rem 1.25rem;
    box-shadow: 0 4px 16px rgba(15,23,42,.05);
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .iatlas-overview-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(15,23,42,.09);
  }

  .iatlas-ov-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: .75rem;
    font-size: 1.4rem;
  }

  .iatlas-ov-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 .35rem;
  }

  .iatlas-ov-desc {
    font-size: .88rem;
    color: #475569;
    line-height: 1.6;
    margin: 0;
  }

  /* ── Section headings ────────────────────────────────────────────────────── */
  .iatlas-section-header {
    text-align: center;
    padding: 3.5rem 0 1.75rem;
  }

  .iatlas-section-kicker {
    display: inline-block;
    font-size: .72rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #4338ca;
    background: #eef2ff;
    border-radius: 999px;
    padding: .3rem .9rem;
    margin-bottom: .75rem;
  }

  .iatlas-section-title {
    font-size: clamp(1.6rem, 3.5vw, 2.3rem);
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 .65rem;
    letter-spacing: -.015em;
  }

  .iatlas-section-sub {
    font-size: 1rem;
    color: #475569;
    max-width: 58ch;
    margin: 0 auto;
    line-height: 1.7;
  }

  /* ── Dimension grid ──────────────────────────────────────────────────────── */
  .iatlas-dim-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 1.25rem;
    padding-bottom: 1rem;
  }

  /* ── Dimension card ──────────────────────────────────────────────────────── */
  .iatlas-dim-card {
    background: #fff;
    border: 1.5px solid var(--dim-color-border);
    border-radius: 22px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(15,23,42,.06);
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: transform .22s ease, box-shadow .22s ease;
  }
  .iatlas-dim-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(15,23,42,.1);
  }

  .iatlas-dim-header {
    display: flex;
    align-items: flex-start;
    gap: .9rem;
  }

  .iatlas-dim-icon-wrap {
    width: 54px;
    height: 54px;
    border-radius: 14px;
    background: var(--dim-color-light);
    border: 1.5px solid var(--dim-color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .iatlas-dim-icon {
    opacity: .9;
  }

  .iatlas-dim-meta {
    flex: 1;
    min-width: 0;
  }

  .iatlas-dim-number {
    font-size: .7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--dim-color);
    opacity: .85;
  }

  .iatlas-dim-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: #1e293b;
    margin: .2rem 0 .25rem;
    line-height: 1.25;
  }

  .iatlas-dim-tagline {
    font-size: .84rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  .iatlas-dim-desc {
    font-size: .88rem;
    color: #475569;
    line-height: 1.65;
    margin: 0;
  }

  .iatlas-dim-section {
    border-top: 1px solid #f1f5f9;
    padding-top: .85rem;
  }

  .iatlas-dim-section-title {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #64748b;
    margin: 0 0 .55rem;
  }

  .iatlas-dim-competency-list,
  .iatlas-dim-skill-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .32rem;
  }

  .iatlas-dim-competency-item,
  .iatlas-dim-skill-item {
    font-size: .87rem;
    color: #334155;
    display: flex;
    align-items: baseline;
    gap: .5rem;
    line-height: 1.5;
  }

  .iatlas-bullet {
    font-size: .5rem;
    flex-shrink: 0;
    position: relative;
    top: -.05em;
  }

  .iatlas-check-green {
    color: #16a34a;
    font-size: .85rem;
    flex-shrink: 0;
    font-weight: 700;
  }

  /* ── Expand button ───────────────────────────────────────────────────────── */
  .iatlas-expand-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    background: var(--dim-color-light);
    border: 1.5px solid var(--dim-color-border);
    border-radius: 10px;
    padding: .65rem 1rem;
    font-size: .87rem;
    font-weight: 600;
    color: var(--dim-color);
    cursor: pointer;
    text-align: left;
    transition: background .18s ease, transform .15s ease;
    margin-top: auto;
  }
  .iatlas-expand-btn:hover, .iatlas-expand-btn:focus-visible {
    background: rgba(0,0,0,.04);
    outline: none;
  }
  .iatlas-expand-btn:focus-visible {
    outline: 2px solid var(--dim-color);
    outline-offset: 2px;
  }

  /* ── Curriculum link ─────────────────────────────────────────────────────── */
  .iatlas-dim-curriculum-link {
    display: block;
    text-align: center;
    background: var(--dim-color);
    color: #ffffff;
    border-radius: 10px;
    padding: .6rem 1rem;
    font-size: .875rem;
    font-weight: 700;
    text-decoration: none;
    margin-top: .75rem;
    transition: opacity .15s;
  }

  .iatlas-dim-curriculum-link:hover {
    opacity: .88;
  }

  .iatlas-chevron {
    font-size: 1.2rem;
    line-height: 1;
    transform: rotate(90deg);
    display: inline-block;
    transition: transform .2s ease;
  }
  .iatlas-chevron--up {
    transform: rotate(-90deg);
  }

  /* ── Gated content block ─────────────────────────────────────────────────── */
  .iatlas-gated-block {
    background: repeating-linear-gradient(
      135deg,
      rgba(100,116,139,.03) 0px,
      rgba(100,116,139,.03) 2px,
      transparent 2px,
      transparent 10px
    );
    border: 1.5px dashed #cbd5e1;
    border-radius: 12px;
    padding: 1rem 1.1rem;
    margin-top: .5rem;
  }

  .iatlas-gated-header {
    display: flex;
    align-items: center;
    gap: .5rem;
    margin-bottom: .65rem;
  }

  .iatlas-lock-icon {
    opacity: .65;
  }

  .iatlas-coming-soon-badge {
    background: #1e293b;
    color: #f1f5f9;
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    border-radius: 999px;
    padding: .2rem .65rem;
  }

  .iatlas-gated-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .28rem;
  }

  .iatlas-gated-item {
    font-size: .83rem;
    color: #64748b;
    display: flex;
    align-items: baseline;
    gap: .45rem;
    line-height: 1.5;
  }

  .iatlas-check {
    color: #94a3b8;
    font-size: .8rem;
    flex-shrink: 0;
    font-weight: 700;
  }

  /* ── Coming Soon features section ───────────────────────────────────────── */
  .iatlas-coming-features {
    margin: 3rem 0;
    background: linear-gradient(135deg, #eef2ff 0%, #fdf4ff 100%);
    border: 1.5px solid rgba(79,70,229,.2);
    border-radius: 28px;
    padding: clamp(1.75rem, 4vw, 2.75rem);
    color: #1e293b;
    position: relative;
    overflow: hidden;
  }

  .iatlas-coming-features::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(79,70,229,.1) 0%, transparent 70%);
    pointer-events: none;
  }

  .iatlas-coming-features::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: -40px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(217,119,6,.08) 0%, transparent 70%);
    pointer-events: none;
  }

  [data-theme="dark"] .iatlas-coming-features {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-color: rgba(165,180,252,.2);
    color: #f1f5f9;
  }

  .iatlas-cf-kicker {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: rgba(79,70,229,.1);
    border: 1px solid rgba(79,70,229,.25);
    border-radius: 999px;
    padding: .28rem .8rem;
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #4338ca;
    margin-bottom: .8rem;
  }

  [data-theme="dark"] .iatlas-cf-kicker {
    background: rgba(255,255,255,.12);
    border-color: rgba(255,255,255,.2);
    color: #a5b4fc;
  }

  .iatlas-cf-title {
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 800;
    margin: 0 0 .5rem;
    color: #1e293b;
  }

  [data-theme="dark"] .iatlas-cf-title { color: #f1f5f9; }

  .iatlas-cf-sub {
    font-size: .95rem;
    color: #475569;
    max-width: 55ch;
    line-height: 1.65;
    margin: 0 0 1.75rem;
  }

  [data-theme="dark"] .iatlas-cf-sub { color: #94a3b8; }

  .iatlas-cf-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 1rem;
    margin-bottom: 1.75rem;
  }

  .iatlas-cf-card {
    background: rgba(255,255,255,.7);
    border: 1px solid rgba(79,70,229,.15);
    border-radius: 16px;
    padding: 1.1rem;
  }

  [data-theme="dark"] .iatlas-cf-card {
    background: rgba(255,255,255,.07);
    border-color: rgba(255,255,255,.12);
  }

  .iatlas-cf-card-icon {
    width: 40px;
    height: 40px;
    margin-bottom: .5rem;
    display: block;
    flex-shrink: 0;
  }

  .iatlas-cf-card-title {
    font-size: .95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 .35rem;
  }

  [data-theme="dark"] .iatlas-cf-card-title { color: #f1f5f9; }

  .iatlas-cf-card-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .25rem;
  }

  .iatlas-cf-card-item {
    font-size: .82rem;
    color: #475569;
    display: flex;
    align-items: baseline;
    gap: .4rem;
    line-height: 1.45;
  }

  [data-theme="dark"] .iatlas-cf-card-item { color: #94a3b8; }

  .iatlas-cf-card-link {
    display: inline-block;
    margin-top: .6rem;
    font-size: .8rem;
    font-weight: 700;
    color: #4338ca;
    text-decoration: none;
  }

  [data-theme="dark"] .iatlas-cf-card-link { color: #6ee7b7; }

  .iatlas-cf-card-link:hover {
    text-decoration: underline;
  }

  .iatlas-cf-cta {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .iatlas-btn-white {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: #fff;
    color: #1e293b;
    border: none;
    border-radius: 10px;
    padding: .72rem 1.4rem;
    font-size: .93rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: background .18s ease, transform .18s ease;
    box-shadow: 0 4px 14px rgba(0,0,0,.18);
  }
  .iatlas-btn-white:hover, .iatlas-btn-white:focus-visible {
    background: #f1f5f9;
    transform: translateY(-2px);
    outline: none;
  }
  .iatlas-btn-white:focus-visible {
    outline: 3px solid #fff;
    outline-offset: 3px;
  }

  .iatlas-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: transparent;
    color: #a5b4fc;
    border: 1.5px solid rgba(165,180,252,.35);
    border-radius: 10px;
    padding: .68rem 1.3rem;
    font-size: .92rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: border-color .18s ease, color .18s ease, transform .18s ease;
  }
  .iatlas-btn-ghost:hover, .iatlas-btn-ghost:focus-visible {
    border-color: #a5b4fc;
    color: #c7d2fe;
    transform: translateY(-1px);
    outline: none;
  }
  .iatlas-btn-ghost:focus-visible {
    outline: 3px solid #a5b4fc;
    outline-offset: 3px;
  }

  /* ── Waitlist form ───────────────────────────────────────────────────────── */
  .iatlas-waitlist {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 22px;
    padding: clamp(1.5rem, 3vw, 2.25rem);
    margin: 2.5rem 0 3rem;
    box-shadow: 0 4px 20px rgba(15,23,42,.06);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2rem;
    align-items: center;
  }

  .iatlas-waitlist-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 .3rem;
  }

  .iatlas-waitlist-sub {
    font-size: .9rem;
    color: #475569;
    margin: 0;
    line-height: 1.6;
  }

  .iatlas-waitlist-form {
    display: flex;
    gap: .6rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .iatlas-waitlist-input {
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    padding: .62rem .95rem;
    font-size: .93rem;
    color: #1e293b;
    background: #f8fafc;
    min-width: 220px;
    transition: border-color .18s ease;
  }
  .iatlas-waitlist-input:focus {
    border-color: #4f46e5;
    outline: none;
    background: #fff;
  }
  .iatlas-waitlist-input::placeholder {
    color: #94a3b8;
  }

  .iatlas-waitlist-submit {
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: .65rem 1.2rem;
    font-size: .93rem;
    font-weight: 700;
    cursor: pointer;
    transition: background .18s ease;
    white-space: nowrap;
  }
  .iatlas-waitlist-submit:hover {
    background: #4338ca;
  }
  .iatlas-waitlist-submit:focus-visible {
    outline: 3px solid #4f46e5;
    outline-offset: 3px;
  }

  .iatlas-waitlist-success {
    display: flex;
    align-items: center;
    gap: .5rem;
    color: #16a34a;
    font-weight: 600;
    font-size: .92rem;
  }

  /* ── Methodology section ─────────────────────────────────────────────────── */
  .iatlas-method {
    margin: 2.5rem 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  .iatlas-method-card {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.1rem 1.2rem;
    background: #fff;
    box-shadow: 0 2px 12px rgba(15,23,42,.04);
    position: relative;
  }

  .iatlas-method-step {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: #eef2ff;
    color: #4338ca;
    font-size: .75rem;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .iatlas-method-icon {
    width: 32px;
    height: 32px;
    margin-bottom: .5rem;
    display: block;
    flex-shrink: 0;
  }

  .iatlas-method-title {
    font-size: .95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 .3rem;
  }

  .iatlas-method-desc {
    font-size: .84rem;
    color: #475569;
    line-height: 1.6;
    margin: 0;
  }

  /* ── CTA banner ──────────────────────────────────────────────────────────── */
  .iatlas-cta-banner {
    background: linear-gradient(135deg, #eef2ff 0%, #fdf4ff 100%);
    border: 1.5px solid rgba(79,70,229,.2);
    border-radius: 22px;
    padding: clamp(1.5rem, 3vw, 2.25rem);
    text-align: center;
    margin: 2.5rem 0 4rem;
    box-shadow: 0 4px 20px rgba(79,70,229,.08);
  }

  .iatlas-cta-title {
    font-size: clamp(1.2rem, 2.5vw, 1.65rem);
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 .4rem;
  }

  .iatlas-cta-sub {
    color: #475569;
    font-size: .96rem;
    max-width: 50ch;
    margin: 0 auto .9rem;
    line-height: 1.65;
  }

  .iatlas-cta-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .7rem;
    justify-content: center;
  }

  /* ── Motion preferences ──────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .iatlas-dim-card,
    .iatlas-overview-card,
    .iatlas-btn-primary,
    .iatlas-btn-secondary,
    .iatlas-btn-white,
    .iatlas-btn-ghost,
    .iatlas-chevron {
      transition: none !important;
      animation: none !important;
    }
    .iatlas-dim-card:hover,
    .iatlas-overview-card:hover {
      transform: none;
    }
  }

  /* ── Responsive ─────────────────────────────────────────────────────────── */
  @media (max-width: 720px) {
    .iatlas-hero-card {
      grid-template-columns: 1fr;
    }
    .iatlas-hero-visual {
      display: none;
    }
    .iatlas-waitlist {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .iatlas-dim-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Dark mode ───────────────────────────────────────────────────────────── */
  [data-theme="dark"] .iatlas-page,
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .iatlas-page {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    }
  }

  [data-theme="dark"] .iatlas-hero-card {
    background: linear-gradient(135deg, #1e293b 0%, #2d1f4a 50%, #1c1a0e 100%);
    border-color: rgba(165,180,252,.18);
  }
  [data-theme="dark"] .iatlas-hero-title { color: #f1f5f9; }
  [data-theme="dark"] .iatlas-hero-sub { color: #94a3b8; }
  [data-theme="dark"] .iatlas-hero-badge { background: rgba(255,255,255,.1); border-color: rgba(165,180,252,.2); }
  [data-theme="dark"] .iatlas-hero-badge-num { color: #a5b4fc; }
  [data-theme="dark"] .iatlas-hero-badge-label { color: #64748b; }
  [data-theme="dark"] .iatlas-kicker { background: rgba(255,255,255,.1); color: #a5b4fc; }
  [data-theme="dark"] .iatlas-overview-card { background: #1e293b; border-color: #334155; }
  [data-theme="dark"] .iatlas-ov-title { color: #f1f5f9; }
  [data-theme="dark"] .iatlas-ov-desc { color: #94a3b8; }
  [data-theme="dark"] .iatlas-section-title { color: #f1f5f9; }
  [data-theme="dark"] .iatlas-section-sub { color: #94a3b8; }
  [data-theme="dark"] .iatlas-section-kicker { background: rgba(165,180,252,.15); color: #a5b4fc; }
  [data-theme="dark"] .iatlas-dim-card { background: #1e293b; border-color: rgba(165,180,252,.15); }
  [data-theme="dark"] .iatlas-dim-title { color: #f1f5f9; }
  [data-theme="dark"] .iatlas-dim-desc { color: #94a3b8; }
  [data-theme="dark"] .iatlas-dim-tagline { color: #64748b; }
  [data-theme="dark"] .iatlas-dim-section { border-color: #334155; }
  [data-theme="dark"] .iatlas-dim-section-title { color: #64748b; }
  [data-theme="dark"] .iatlas-dim-competency-item,
  [data-theme="dark"] .iatlas-dim-skill-item { color: #cbd5e1; }
  [data-theme="dark"] .iatlas-gated-block { border-color: #475569; background: repeating-linear-gradient(135deg, rgba(255,255,255,.02) 0px, rgba(255,255,255,.02) 2px, transparent 2px, transparent 10px); }
  [data-theme="dark"] .iatlas-coming-soon-badge { background: #f1f5f9; color: #1e293b; }
  [data-theme="dark"] .iatlas-gated-item { color: #94a3b8; }
  [data-theme="dark"] .iatlas-waitlist { background: #1e293b; border-color: #334155; }
  [data-theme="dark"] .iatlas-waitlist-title { color: #f1f5f9; }
  [data-theme="dark"] .iatlas-waitlist-sub { color: #94a3b8; }
  [data-theme="dark"] .iatlas-waitlist-input { background: #0f172a; border-color: #475569; color: #f1f5f9; }
  [data-theme="dark"] .iatlas-waitlist-input:focus { border-color: #818cf8; background: #1e293b; }
  [data-theme="dark"] .iatlas-method-card { background: #1e293b; border-color: #334155; }
  [data-theme="dark"] .iatlas-method-title { color: #f1f5f9; }
  [data-theme="dark"] .iatlas-method-desc { color: #94a3b8; }
  [data-theme="dark"] .iatlas-method-step { background: rgba(165,180,252,.15); color: #a5b4fc; }
  [data-theme="dark"] .iatlas-cta-banner { background: linear-gradient(135deg, #1e293b 0%, #2d1f4a 100%); border-color: rgba(165,180,252,.2); }
  [data-theme="dark"] .iatlas-cta-title { color: #f1f5f9; }
  [data-theme="dark"] .iatlas-cta-sub { color: #94a3b8; }
  [data-theme="dark"] .iatlas-btn-secondary { background: rgba(255,255,255,.08); color: #cbd5e1; border-color: #475569; }
  [data-theme="dark"] .iatlas-btn-secondary:hover { border-color: #818cf8; color: #a5b4fc; }
  [data-theme="dark"] .iatlas-expand-btn { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.12); }

  /* ── Kids banner ──────────────────────────────────────────────────────────── */
  .iatlas-kids-banner {
    background: linear-gradient(135deg, #fef3c7 0%, #ede9fe 100%);
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 2rem;
    display: flex;
    align-items: flex-start;
    gap: 2rem;
    flex-wrap: wrap;
  }

  [data-theme="dark"] .iatlas-kids-banner {
    background: linear-gradient(135deg, #1e2a1a 0%, #1a1a2e 100%);
    border-color: #334155;
  }

  .iatlas-kids-banner-left {
    flex: 1;
    min-width: 260px;
  }

  .iatlas-kids-banner-right {
    flex-shrink: 0;
  }

  .iatlas-kids-banner-kicker {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    background: #f59e0b;
    color: #ffffff;
    border-radius: 20px;
    padding: .2rem .7rem;
    font-size: .72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .05em;
    margin-bottom: .65rem;
  }

  .iatlas-kids-banner-title {
    font-size: 1.5rem;
    font-weight: 900;
    color: #0f172a;
    margin: 0 0 .5rem;
    line-height: 1.2;
  }

  [data-theme="dark"] .iatlas-kids-banner-title { color: #f1f5f9; }

  .iatlas-kids-banner-sub {
    font-size: .9rem;
    color: #475569;
    line-height: 1.65;
    margin: 0 0 1rem;
    max-width: 460px;
  }

  [data-theme="dark"] .iatlas-kids-banner-sub { color: #94a3b8; }

  .iatlas-kids-banner-stats {
    display: flex;
    flex-wrap: wrap;
    gap: .6rem;
    margin-bottom: 1.25rem;
  }

  .iatlas-kids-stat {
    display: inline-flex;
    align-items: center;
    gap: .35rem;
    background: rgba(255,255,255,.65);
    border-radius: 20px;
    padding: .25rem .7rem;
    font-size: .78rem;
    font-weight: 600;
    color: #374151;
  }

  [data-theme="dark"] .iatlas-kids-stat {
    background: rgba(255,255,255,.08);
    color: #cbd5e1;
  }

  .iatlas-kids-banner-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    align-items: center;
  }

  .iatlas-kids-age-pills {
    display: flex;
    flex-direction: column;
    gap: .5rem;
  }

  .iatlas-kids-age-pill {
    background: rgba(255,255,255,.7);
    border-left: 3px solid;
    border-radius: 0 8px 8px 0;
    padding: .4rem .8rem;
    min-width: 140px;
  }

  [data-theme="dark"] .iatlas-kids-age-pill {
    background: rgba(255,255,255,.06);
  }

  .iatlas-kids-age-pill-label {
    display: block;
    font-size: .8rem;
    font-weight: 800;
    color: #0f172a;
  }

  [data-theme="dark"] .iatlas-kids-age-pill-label { color: #f1f5f9; }

  .iatlas-kids-age-pill-sub {
    display: block;
    font-size: .72rem;
    color: #64748b;
  }

  [data-theme="dark"] .iatlas-kids-age-pill-sub { color: #94a3b8; }

  @media (max-width: 600px) {
    .iatlas-kids-banner-right { display: none; }
  }

  /* ── Specialty Navigation ────────────────────────────────────────────────── */
  .iatlas-specialty-nav {
    margin-top: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    border: 1px solid #e2e8f0;
    border-radius: 16px;
  }

  .iatlas-specialty-nav-header {
    text-align: center;
    margin-bottom: 1rem;
  }

  .iatlas-specialty-nav-header h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 0.3rem;
  }

  .iatlas-specialty-nav-header p {
    font-size: 0.85rem;
    color: #64748b;
    margin: 0;
  }

  .iatlas-specialty-nav-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: center;
  }

  .iatlas-specialty-nav-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1rem;
    background: #ffffff;
    border: 1.5px solid #cbd5e1;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #334155;
    text-decoration: none;
    transition: all 0.15s ease;
    cursor: pointer;
  }

  .iatlas-specialty-nav-btn:hover {
    border-color: #4f46e5;
    color: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(79,70,229,0.15);
  }

  .iatlas-specialty-nav-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    opacity: 0.85;
  }

  .iatlas-specialty-nav-btn:hover .iatlas-specialty-nav-icon {
    opacity: 1;
  }

  .iatlas-specialty-nav-label {
    white-space: nowrap;
  }

  [data-theme="dark"] .iatlas-specialty-nav {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-color: #334155;
  }

  [data-theme="dark"] .iatlas-specialty-nav-header h2 { color: #f1f5f9; }
  [data-theme="dark"] .iatlas-specialty-nav-header p { color: #94a3b8; }
  [data-theme="dark"] .iatlas-specialty-nav-btn { background: #1e293b; color: #cbd5e1; border-color: #475569; }
  [data-theme="dark"] .iatlas-specialty-nav-btn:hover { border-color: #818cf8; color: #a5b4fc; }

  @media (max-width: 640px) {
    .iatlas-specialty-nav-buttons {
      flex-direction: column;
    }
    .iatlas-specialty-nav-btn {
      width: 100%;
      justify-content: center;
    }
  }

  /* ── Specialties Coming Soon ─────────────────────────────────────────────── */
  .iatlas-specialties-coming-soon {
    background: #ffffff;
    padding: 4rem 2rem;
    margin-top: 4rem;
    border-top: 1px solid #e2e8f0;
    border-radius: 16px;
  }

  [data-theme="dark"] .iatlas-specialties-coming-soon {
    background: #0f172a;
    border-top-color: #334155;
  }

  .iatlas-specialties-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 2rem auto 0;
  }

  .iatlas-specialty-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 2px 8px rgba(0,0,0,.08);
    transition: transform 0.2s, box-shadow 0.2s;
    border: 2px solid transparent;
    display: flex;
    flex-direction: column;
    gap: .75rem;
  }

  [data-theme="dark"] .iatlas-specialty-card {
    background: #1e293b;
    box-shadow: 0 2px 8px rgba(0,0,0,.3);
  }

  .iatlas-specialty-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,.12);
    border-color: #4f46e5;
  }

  .iatlas-specialty-icon {
    flex-shrink: 0;
  }

  .iatlas-specialty-icon img {
    width: 40px;
    height: 40px;
    display: block;
  }

  .iatlas-specialty-title {
    font-size: 1.05rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
  }

  [data-theme="dark"] .iatlas-specialty-title { color: #f1f5f9; }

  .iatlas-specialty-desc {
    font-size: .85rem;
    color: #475569;
    line-height: 1.55;
    margin: 0;
    flex: 1;
  }

  [data-theme="dark"] .iatlas-specialty-desc { color: #94a3b8; }

  .iatlas-specialty-features {
    display: flex;
    flex-wrap: wrap;
    gap: .4rem;
  }

  .iatlas-specialty-tag {
    background: #eef2ff;
    color: #4338ca;
    font-size: .72rem;
    font-weight: 700;
    border-radius: 999px;
    padding: .2rem .6rem;
  }

  [data-theme="dark"] .iatlas-specialty-tag {
    background: #312e81;
    color: #a5b4fc;
  }

  .iatlas-specialty-pricing {
    font-size: .78rem;
    color: #94a3b8;
    font-weight: 600;
    margin: 0;
  }

  .iatlas-btn-specialty {
    width: 100%;
    padding: .75rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-size: .9rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
    margin-top: auto;
  }

  .iatlas-btn-specialty:hover { opacity: .9; }

  /* ── Specialty Modal ─────────────────────────────────────────────────────── */
  .specialty-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15,23,42,.72);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 1rem;
  }

  .specialty-modal-card {
    background: #ffffff;
    border-radius: 20px;
    padding: 2rem 1.75rem 1.75rem;
    max-width: 480px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 50px rgba(0,0,0,.22);
    position: relative;
  }

  [data-theme="dark"] .specialty-modal-card {
    background: #1e293b;
  }

  .specialty-modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background: transparent;
    border: none;
    font-size: 1.4rem;
    color: #94a3b8;
    cursor: pointer;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background 0.15s;
  }

  .specialty-modal-close:hover { background: #f1f5f9; color: #1e293b; }
  [data-theme="dark"] .specialty-modal-close:hover { background: #334155; color: #f1f5f9; }

  .specialty-modal-icon {
    text-align: center;
    margin-bottom: .75rem;
  }

  .specialty-modal-icon img {
    width: 48px;
    height: 48px;
  }

  .specialty-modal-badge {
    display: block;
    text-align: center;
    font-size: .7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    background: #1e293b;
    color: #f1f5f9;
    border-radius: 999px;
    padding: .25rem .75rem;
    width: fit-content;
    margin: 0 auto .75rem;
  }

  [data-theme="dark"] .specialty-modal-badge { background: #334155; }

  .specialty-modal-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #0f172a;
    text-align: center;
    margin: 0 0 .5rem;
  }

  [data-theme="dark"] .specialty-modal-title { color: #f1f5f9; }

  .specialty-modal-desc {
    font-size: .88rem;
    color: #475569;
    text-align: center;
    line-height: 1.6;
    margin: 0 0 1.25rem;
  }

  [data-theme="dark"] .specialty-modal-desc { color: #94a3b8; }

  .specialty-modal-features {
    background: #f8fafc;
    border-radius: 10px;
    padding: 1rem 1.25rem;
    margin-bottom: 1.25rem;
  }

  [data-theme="dark"] .specialty-modal-features { background: #0f172a; }

  .specialty-modal-features-label {
    font-size: .8rem;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin: 0 0 .5rem;
  }

  [data-theme="dark"] .specialty-modal-features-label { color: #94a3b8; }

  .specialty-modal-features-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .3rem;
  }

  .specialty-modal-feature-item {
    font-size: .85rem;
    color: #334155;
    display: flex;
    gap: .5rem;
  }

  [data-theme="dark"] .specialty-modal-feature-item { color: #cbd5e1; }

  .specialty-modal-form {
    display: flex;
    flex-direction: column;
    gap: .9rem;
  }

  .specialty-modal-field {
    display: flex;
    flex-direction: column;
    gap: .3rem;
  }

  .specialty-modal-field label {
    font-size: .82rem;
    font-weight: 700;
    color: #374151;
  }

  [data-theme="dark"] .specialty-modal-field label { color: #cbd5e1; }

  .specialty-modal-field input[type="text"],
  .specialty-modal-field input[type="email"] {
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: .55rem .75rem;
    font-size: .9rem;
    color: #0f172a;
    background: #ffffff;
    transition: border-color 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  [data-theme="dark"] .specialty-modal-field input[type="text"],
  [data-theme="dark"] .specialty-modal-field input[type="email"] {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }

  .specialty-modal-field input:focus {
    outline: none;
    border-color: #4f46e5;
  }

  .specialty-modal-interest-label {
    font-size: .82rem;
    font-weight: 700;
    color: #374151;
    margin: 0 0 .4rem;
  }

  [data-theme="dark"] .specialty-modal-interest-label { color: #cbd5e1; }

  .specialty-modal-interest-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: .4rem;
  }

  .specialty-modal-interest-item {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .85rem;
    color: #374151;
    cursor: pointer;
  }

  [data-theme="dark"] .specialty-modal-interest-item { color: #cbd5e1; }

  .specialty-modal-msg-duplicate {
    font-size: .85rem;
    color: #854d0e;
    background: #fef9c3;
    border-radius: 8px;
    padding: .6rem .9rem;
    margin: 0;
  }

  .specialty-modal-msg-error {
    font-size: .85rem;
    color: #991b1b;
    background: #fee2e2;
    border-radius: 8px;
    padding: .6rem .9rem;
    margin: 0;
  }

  .specialty-modal-btn-submit {
    width: 100%;
    padding: .8rem 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #ffffff;
    border: none;
    border-radius: 10px;
    font-size: .95rem;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .specialty-modal-btn-submit:disabled { opacity: .65; cursor: not-allowed; }
  .specialty-modal-btn-submit:not(:disabled):hover { opacity: .9; }

  .specialty-modal-success {
    text-align: center;
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .75rem;
  }

  .specialty-modal-success-icon { font-size: 2.5rem; }

  .specialty-modal-success-text {
    font-size: .95rem;
    color: #374151;
    line-height: 1.6;
    margin: 0;
  }

  [data-theme="dark"] .specialty-modal-success-text { color: #cbd5e1; }

  .specialty-modal-btn-close {
    padding: .65rem 1.75rem;
    background: #4f46e5;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    font-size: .9rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.15s;
  }

  .specialty-modal-btn-close:hover { background: #4338ca; }

  @media (max-width: 600px) {
    .iatlas-specialties-grid { grid-template-columns: 1fr; }
    .specialty-modal-interest-grid { grid-template-columns: 1fr; }
  }

  /* ── Train the Facilitator Section ──────────────────────────────────────── */
  .iatlas-ttf-banner {
    background: linear-gradient(135deg, #eef2ff 0%, #fdf4ff 50%, #fff7ed 100%);
    border: 1px solid rgba(79,70,229,.18);
    border-radius: 28px;
    padding: 3rem 2.5rem;
    color: #1e293b;
    position: relative;
    overflow: hidden;
    margin: 2rem 0;
  }
  .iatlas-ttf-banner::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 85% 50%, rgba(79,70,229,.07) 0%, transparent 70%);
    pointer-events: none;
  }

  [data-theme="dark"] .iatlas-ttf-banner {
    background: linear-gradient(135deg, #1e293b 0%, #2d1f4a 50%, #1c1a0e 100%);
    border-color: rgba(165,180,252,.18);
    color: #f1f5f9;
  }

  .iatlas-ttf-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(79,70,229,.12);
    border: 1px solid rgba(79,70,229,.3);
    border-radius: 20px;
    padding: .4rem 1rem;
    font-size: .85rem;
    font-weight: 700;
    color: #4338ca;
    margin-bottom: 1.5rem;
    position: relative;
  }

  [data-theme="dark"] .iatlas-ttf-badge {
    background: rgba(165,180,252,.15);
    border-color: rgba(165,180,252,.3);
    color: #a5b4fc;
  }

  .iatlas-ttf-title {
    font-size: 2.25rem;
    font-weight: 900;
    margin: 0 0 .75rem;
    line-height: 1.2;
    position: relative;
    color: #1e293b;
  }

  [data-theme="dark"] .iatlas-ttf-title { color: #f1f5f9; }

  .iatlas-ttf-subtitle {
    font-size: 1.15rem;
    margin: 0 0 1.5rem;
    font-weight: 600;
    color: #059669;
    position: relative;
  }

  [data-theme="dark"] .iatlas-ttf-subtitle { color: #6ee7b7; }

  .iatlas-ttf-description {
    font-size: 1rem;
    line-height: 1.7;
    color: #475569;
    max-width: 720px;
    margin-bottom: 2rem;
    position: relative;
  }

  [data-theme="dark"] .iatlas-ttf-description { color: #94a3b8; }
  .iatlas-ttf-philosophy {
    background: rgba(79,70,229,.06);
    border-left: 4px solid #059669;
    border-radius: 12px;
    padding: 1.5rem;
    margin: 2rem 0;
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
    position: relative;
  }
  [data-theme="dark"] .iatlas-ttf-philosophy {
    background: rgba(255,255,255,.07);
    border-left-color: #6ee7b7;
  }
  .iatlas-ttf-philosophy-icon { flex-shrink: 0; }
  .iatlas-ttf-philosophy-title {
    font-size: 1.1rem;
    font-weight: 800;
    margin: 0 0 .5rem;
    color: #1e293b;
  }
  [data-theme="dark"] .iatlas-ttf-philosophy-title { color: #f1f5f9; }
  .iatlas-ttf-philosophy-text {
    font-size: .95rem;
    line-height: 1.65;
    margin: 0;
    color: #475569;
  }
  [data-theme="dark"] .iatlas-ttf-philosophy-text { color: #94a3b8; }
  .iatlas-ttf-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.25rem;
    margin: 2.5rem 0;
    position: relative;
  }
  .iatlas-ttf-card {
    background: rgba(255,255,255,.7);
    border: 1px solid rgba(79,70,229,.15);
    border-radius: 16px;
    padding: 1.5rem;
    transition: all 0.2s ease;
  }
  [data-theme="dark"] .iatlas-ttf-card {
    background: rgba(255,255,255,.08);
    border-color: rgba(255,255,255,.15);
  }
  .iatlas-ttf-card:hover {
    background: rgba(255,255,255,.9);
    border-color: rgba(79,70,229,.3);
    transform: translateY(-2px);
  }
  [data-theme="dark"] .iatlas-ttf-card:hover {
    background: rgba(255,255,255,.13);
    border-color: rgba(255,255,255,.3);
  }
  .iatlas-ttf-card-icon {
    margin-bottom: 1rem;
  }
  [data-theme="dark"] .iatlas-ttf-card-icon {
    filter: brightness(0) invert(1);
  }
  .iatlas-ttf-card-title {
    font-size: 1rem;
    font-weight: 800;
    margin: 0 0 .5rem;
    color: #1e293b;
  }
  [data-theme="dark"] .iatlas-ttf-card-title { color: #f1f5f9; }
  .iatlas-ttf-card-desc {
    font-size: .875rem;
    color: #475569;
    line-height: 1.6;
    margin: 0;
  }
  [data-theme="dark"] .iatlas-ttf-card-desc { color: #94a3b8; }
  .iatlas-ttf-roles {
    margin: 2.5rem 0;
    position: relative;
  }
  .iatlas-ttf-roles-title {
    font-size: 1.3rem;
    font-weight: 800;
    margin: 0 0 1.25rem;
    text-align: center;
    color: #1e293b;
  }
  [data-theme="dark"] .iatlas-ttf-roles-title { color: #f1f5f9; }
  .iatlas-ttf-roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  .iatlas-ttf-role-card {
    background: rgba(255,255,255,.7);
    border: 1px solid rgba(79,70,229,.12);
    border-radius: 12px;
    padding: 1rem;
    display: flex;
    gap: .75rem;
    align-items: center;
  }
  [data-theme="dark"] .iatlas-ttf-role-card {
    background: rgba(255,255,255,.08);
    border-color: rgba(255,255,255,.1);
  }
  .iatlas-ttf-role-icon { width: 2rem; height: 2rem; flex-shrink: 0; }
  [data-theme="dark"] .iatlas-ttf-role-icon { filter: brightness(0) invert(1); }
  .iatlas-ttf-role-name { font-size: .9rem; font-weight: 700; margin: 0 0 .25rem; color: #1e293b; }
  [data-theme="dark"] .iatlas-ttf-role-name { color: #f1f5f9; }
  .iatlas-ttf-role-benefit { font-size: .8rem; color: #64748b; margin: 0; line-height: 1.4; }
  [data-theme="dark"] .iatlas-ttf-role-benefit { color: #94a3b8; }
  .iatlas-ttf-cta {
    background: rgba(79,70,229,.06);
    border: 1px solid rgba(79,70,229,.15);
    border-radius: 16px;
    padding: 2rem;
    text-align: center;
    margin-top: 2.5rem;
    position: relative;
  }
  [data-theme="dark"] .iatlas-ttf-cta {
    background: rgba(255,255,255,.08);
    border-color: rgba(255,255,255,.12);
  }
  .iatlas-ttf-cta-text {
    font-size: 1rem;
    margin: 0 0 1.25rem;
    line-height: 1.6;
    color: #1e293b;
  }
  [data-theme="dark"] .iatlas-ttf-cta-text { color: #f1f5f9; }
  @media (max-width: 700px) {
    .iatlas-ttf-banner { padding: 2rem 1.25rem; }
    .iatlas-ttf-title { font-size: 1.6rem; }
    .iatlas-ttf-philosophy { flex-direction: column; gap: .75rem; }
    .iatlas-ttf-grid { grid-template-columns: 1fr; }
    .iatlas-ttf-roles-grid { grid-template-columns: 1fr; }
  }
`;

// ── Main page component ────────────────────────────────────────────────────────
export default function IATLASCurriculumPage() {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle'); // idle | success | error
  const [upgradeSuccess, setUpgradeSuccess] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState(null);
  const [isProfessional, setIsProfessional] = useState(false);

  // Sync dark-mode preference on mount
  useEffect(() => {
    document.title = 'IATLAS Curriculum — The Resilience Atlas™';
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
    setIsProfessional(hasProfessionalAccess());
  }, []);

  // Handle post-Stripe upgrade redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade_success') !== 'true') return;

    const token = getAuth0CachedToken();
    if (!token) {
      setUpgradeSuccess('Subscription activated! Refresh the page to see your new access.');
      return;
    }

    getIATLASSubscriptionStatus(token)
      .then(({ tier, status }) => {
        if ((status === 'active' || status === 'trialing') && tier && tier !== 'free') {
          try { localStorage.setItem(IATLAS_TIER_KEY, tier); } catch (_) {}
          setUpgradeSuccess(`Welcome! Your IATLAS ${tier.charAt(0).toUpperCase() + tier.slice(1)} subscription is now active.`);
        } else {
          setUpgradeSuccess('Subscription activated! Your access will be updated shortly.');
        }
      })
      .catch(() => {
        setUpgradeSuccess('Subscription activated! Refresh the page to see your new access.');
      });

    // Remove query params from the URL without reloading the page
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  }, []);

  function handleWaitlist(e) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    // For now, just show success — integration with backend can be added later
    setWaitlistStatus('success');
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <a href="#iatlas-dimensions" className="iatlas-skip">Skip to curriculum dimensions</a>

      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="iatlas-page" id="main-content">
        <div className="iatlas-wrap">

          {/* ── Upgrade success banner ───────────────────────────────────── */}
          {upgradeSuccess && (
            <div
              role="status"
              aria-live="polite"
              style={{
                background: '#dcfce7',
                border: '1px solid #86efac',
                borderRadius: 12,
                padding: '14px 18px',
                marginBottom: 16,
                color: '#166534',
                fontWeight: 600,
                fontSize: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span>{upgradeSuccess}</span>
              <button
                onClick={() => setUpgradeSuccess('')}
                aria-label="Dismiss"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#166534',
                  fontWeight: 700,
                  fontSize: 16,
                  lineHeight: 1,
                  padding: '2px 6px',
                  borderRadius: 6,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className="iatlas-hero" aria-labelledby="iatlas-hero-title">
            <div className="iatlas-hero-card">
              <div>
                <span className="iatlas-kicker">
                  <img src="/icons/compass.svg" alt="" width={13} height={13} aria-hidden="true" />
                  <span title="Integrated Applied Teaching and Learning Analysis System">IATLAS™</span> Clinical Curriculum
                </span>
                <h1 className="iatlas-hero-title" id="iatlas-hero-title">
                  A System for Skills, Not Scores
                </h1>
                <p className="iatlas-hero-sub">
                  <strong>IATLAS</strong> (Integrated Applied Teaching and Learning Analysis System) gives you the skills to strengthen your resilience profile.
                  Evidence-based protocols integrating Applied Behavior Analysis (ABA) and Acceptance &amp; Commitment Therapy (ACT)
                  across all six dimensions of resilience — not just what to measure, but how to grow.
                </p>
                <div className="iatlas-hero-actions">
                  <a href="/quiz" className="iatlas-btn-primary" title="For adults 18+">
                    <img src="/icons/compass.svg" alt="" width={16} height={16} aria-hidden="true" />
                    Take the Free Assessment <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span>
                  </a>
                  <a href="#iatlas-overview" className="iatlas-btn-secondary">
                    Learn more about IATLAS
                  </a>
                  <a href="/iatlas/dashboard" className="iatlas-btn-secondary">
                    <img src="/icons/planning.svg" alt="" width={16} height={16} aria-hidden="true" />
                    View My Progress
                  </a>
                  <Link to="/iatlas/practice/dashboard" className="iatlas-btn-secondary">
                    <img src="/icons/organization.svg" alt="" width={16} height={16} aria-hidden="true" />
                    Practice Dashboard
                  </Link>
                  <Link to="/iatlas/train-the-facilitator" className="iatlas-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245,158,11,.12)', borderColor: 'rgba(245,158,11,.35)', color: '#fbbf24' }}>
                    <img src="/icons/certification.svg" alt="" width={16} height={16} aria-hidden="true" />
                    Train the Facilitator
                    <span style={{ fontSize: '.72em', opacity: .85, fontStyle: 'italic' }}>Coming Soon</span>
                  </Link>
                  {isProfessional && (
                    <Link to="/iatlas/clinical/session-plans" className="iatlas-btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <img src="/icons/clinical.svg" alt="" width={16} height={16} aria-hidden="true" />
                      Session Plans
                    </Link>
                  )}
                  {Object.values(IATLAS_SPECIALTIES).map((specialty) => (
                    <button
                      key={specialty.id}
                      className="iatlas-btn-secondary"
                      onClick={() => {
                        document.querySelector('.iatlas-specialties-coming-soon')?.scrollIntoView({ behavior: 'smooth' });
                        setTimeout(() => setActiveSpecialty(specialty), 400);
                      }}
                    >
                      <img src={specialty.icon} alt="" width={16} height={16} aria-hidden="true" />
                      {specialty.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="iatlas-hero-visual" aria-hidden="true">
                <div className="iatlas-hero-badge">
                  <span className="iatlas-hero-badge-num">6</span>
                  <span className="iatlas-hero-badge-label">Dimensions</span>
                </div>
                <div className="iatlas-hero-badge">
                  <span className="iatlas-hero-badge-num">ABA</span>
                  <span className="iatlas-hero-badge-label">+ ACT</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── IATLAS Kids ──────────────────────────────────────────────── */}
          <section aria-labelledby="iatlas-kids-title" style={{ marginTop: '2.5rem' }}>
            <div className="iatlas-kids-banner">
              <div className="iatlas-kids-banner-left">
                <span className="iatlas-kids-banner-kicker">
                  <img src="/icons/kids-spark.svg" alt="" width={14} height={14} aria-hidden="true" />
                  New
                </span>
                <h2 className="iatlas-kids-banner-title" id="iatlas-kids-title">
                  IATLAS Kids Curriculum
                </h2>
                <p className="iatlas-kids-banner-sub">
                  Play-based resilience activities for children ages 5–18, spanning all 6 dimensions.
                  Designed for parents, teachers, and kids who want to build resilience through
                  exploration, games, and real-world challenges.
                </p>
                <div className="iatlas-kids-banner-stats" aria-label="Kids curriculum statistics">
                  <span className="iatlas-kids-stat">
                    <img src="/icons/movement.svg" alt="" width={13} height={13} aria-hidden="true" />
                    96+ activities
                  </span>
                  <span className="iatlas-kids-stat">
                    <img src="/icons/strength.svg" alt="" width={13} height={13} aria-hidden="true" />
                    4 age groups
                  </span>
                  <span className="iatlas-kids-stat">
                    <img src="/icons/compass.svg" alt="" width={13} height={13} aria-hidden="true" />
                    6 dimensions
                  </span>
                </div>
                <div className="iatlas-kids-banner-actions">
                  <Link to="/iatlas/kids" className="iatlas-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}>
                    <img src="/icons/kids-spark.svg" alt="" width={15} height={15} aria-hidden="true" style={{ filter: 'brightness(0) invert(1)' }} />
                    Explore Kids Curriculum
                  </Link>
                  <Link to="/iatlas/developmental-roadmap" className="iatlas-btn-secondary"><img src="/icons/game-map.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Developmental Roadmap →
                  </Link>
                  <Link to="/iatlas/roadmap" className="iatlas-btn-secondary">
                    View Content Roadmap →
                  </Link>
                  {hasCaregiverAccess() && (
                    <Link
                      to="/iatlas/parent-dashboard"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                        background: '#0891b2', color: '#fff',
                        borderRadius: 10, padding: '.7rem 1.4rem',
                        fontWeight: 600, textDecoration: 'none', fontSize: '.875rem',
                      }}
                    ><img src="/icons/network.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Parent Dashboard
                    </Link>
                  )}
                </div>
              </div>
              <div className="iatlas-kids-banner-right" aria-hidden="true">
                <div className="iatlas-kids-age-pills">
                  {[
                    { label: 'Ages 5–7', sub: 'Little Explorers', color: '#f59e0b' },
                    { label: 'Ages 8–10', sub: 'Young Adventurers', color: '#10b981' },
                    { label: 'Ages 11–14', sub: 'Resilience Builders', color: '#6366f1' },
                    { label: 'Ages 15–18', sub: 'Resilience Leaders', color: '#8b5cf6' },
                  ].map(ag => (
                    <div key={ag.label} className="iatlas-kids-age-pill" style={{ borderLeftColor: ag.color }}>
                      <span className="iatlas-kids-age-pill-label">{ag.label}</span>
                      <span className="iatlas-kids-age-pill-sub">{ag.sub}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Train the Facilitator Teaser ─────────────────────────── */}
          <section aria-labelledby="iatlas-ttf-title" style={{ margin: '2rem 0' }}>
            <div style={{
              background: 'linear-gradient(135deg, #eef2ff 0%, #fdf4ff 50%, #fff7ed 100%)',
              border: '1px solid rgba(79,70,229,.18)',
              borderRadius: 28,
              padding: 'clamp(1.75rem, 4vw, 2.5rem)',
              color: '#1e293b',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Decorative bg radial */}
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 85% 50%, rgba(79,70,229,.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Coming Soon badge */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  background: 'rgba(79,70,229,.12)', border: '1px solid rgba(79,70,229,.3)',
                  borderRadius: 999, padding: '.28rem .8rem',
                  fontSize: '.68rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: '#4338ca', marginBottom: '.8rem',
                }}>
                  <img src="/icons/certification.svg" alt="" width={14} height={14} aria-hidden="true" />
                  Coming Soon — 2026
                </span>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 340px' }}>
                    <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, margin: '0 0 .6rem', color: '#1e293b' }} id="iatlas-ttf-title">
                      Train the Facilitator
                    </h2>
                    <p style={{ fontSize: '.95rem', color: '#475569', lineHeight: 1.65, margin: '0 0 1.25rem', maxWidth: '55ch' }}>
                      A professional certification program that trains clinicians, caregivers, educators,
                      Speech-Language Pathologists, Occupational Therapists, ABA therapists, teachers, and
                      families to deliver IATLAS with fidelity — while building their own six-dimensional
                      resilience along the way.
                    </p>
                    <p style={{ fontSize: '.88rem', color: '#4338ca', lineHeight: 1.6, margin: '0 0 1.5rem', fontStyle: 'italic' }}>
                      "You can't pour from an empty cup. IATLAS is a recursive, all-inclusive system — everyone
                      in the ecosystem grows together."
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.6rem' }}>
                      <Link
                        to="/iatlas/train-the-facilitator"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                          background: '#4f46e5', color: '#fff', borderRadius: 10,
                          padding: '.65rem 1.4rem', fontWeight: 700, fontSize: '.9rem',
                          textDecoration: 'none', transition: 'background .15s',
                          boxShadow: '0 4px 14px rgba(79,70,229,.3)',
                        }}
                      >
                        Learn More &amp; Join Waitlist →
                      </Link>
                    </div>
                  </div>

                  {/* "Who it's for" quick tags */}
                  <div style={{ flex: '0 1 260px' }}>
                    <p style={{ fontSize: '.72rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: '.75rem' }}>
                      One Stop Shop For
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
                      {[
                        { icon: '/icons/clinical.svg', label: 'Clinicians & Therapists' },
                        { icon: '/icons/speech.svg', label: 'Speech-Language Pathologists' },
                        { icon: '/icons/movement.svg', label: 'Occupational Therapists' },
                        { icon: '/icons/teacher.svg', label: 'Teachers & Educators' },
                        { icon: '/icons/relational-connective.svg', label: 'Caregivers & Families' },
                        { icon: '/icons/agentic-generative.svg', label: 'ABA Therapists' },
                        { icon: '/icons/connection.svg', label: 'Social Skills Practitioners' },
                      ].map(w => (
                        <span key={w.label} style={{
                          display: 'flex', alignItems: 'center', gap: '.5rem',
                          fontSize: '.83rem', color: '#475569',
                        }}>
                          <img src={w.icon} alt="" width={18} height={18} aria-hidden="true" />
                          {w.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <section id="iatlas-overview" aria-labelledby="iatlas-ov-title">
            <div className="iatlas-section-header" style={{ paddingBottom: '1rem' }}>
              <span className="iatlas-section-kicker">What is IATLAS?</span>
              <h2 className="iatlas-section-title" id="iatlas-ov-title">Integrated Applied Teaching and Learning Analysis System</h2>
              <p className="iatlas-section-sub">
                <strong>IATLAS</strong> — <em>Integrated Applied Teaching and Learning Analysis System</em> — is the practice-facing complement to the Resilience Atlas™. Where the Atlas
                measures and maps resilience, IATLAS provides the structured methodology for building it
                through integrated teaching and learning.
              </p>
            </div>

            <div className="iatlas-overview" role="list">
              {[
                { icon: '/icons/planning.svg', bg: '#eef2ff', title: 'Evidence-Based', desc: 'Grounded in Applied Behavior Analysis (ABA) and Acceptance & Commitment Therapy (ACT) — two of the most rigorously validated approaches in behavioral science.' },
                { icon: '/icons/compass.svg', bg: '#fef3c7', title: 'Assessment-Driven', desc: 'Built directly on your Resilience Atlas™ dimensional profile. Every skill module targets your real growth frontiers, not generic advice.' },
                { icon: '/icons/reframe.svg', bg: '#d1fae5', title: 'Four-Phase Cycle', desc: 'Assess → Analyze → Intervene → Monitor. A structured, data-informed process that ensures measurable, lasting resilience growth.' },
                { icon: '/icons/agentic-generative.svg', bg: '#fce7f3', title: 'Values-Aligned', desc: 'Every practice and skill is anchored to what matters most to you. Resilience built on intrinsic motivation, not external pressure.' },
              ].map((c) => (
                <div key={c.title} className="iatlas-overview-card" role="listitem">
                  <div className="iatlas-ov-icon" style={{ background: c.bg }} aria-hidden="true">
                    <img src={c.icon} alt="" width={28} height={28} className="icon" />
                  </div>
                  <h3 className="iatlas-ov-title">{c.title}</h3>
                  <p className="iatlas-ov-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Methodology ──────────────────────────────────────────────── */}
          <section aria-labelledby="iatlas-method-title" style={{ marginTop: '2.5rem' }}>
            <div className="iatlas-section-header" style={{ paddingBottom: '1rem' }}>
              <span className="iatlas-section-kicker">The IATLAS Methodology</span>
              <h2 className="iatlas-section-title" id="iatlas-method-title">How It Works</h2>
            </div>
            <div className="iatlas-method" role="list">
              {[
                { step: 1, icon: '/icons/compass.svg', title: 'Assess', desc: 'Start with a comprehensive Resilience Atlas™ assessment across all six dimensions to establish your baseline profile.' },
                { step: 2, icon: '/icons/planning.svg', title: 'Analyze', desc: 'ABA-informed analysis of your dimensional strengths, growth frontiers, and the barriers and patterns shaping your resilience.' },
                { step: 3, icon: '/icons/agentic-generative.svg', title: 'Intervene', desc: 'Engage targeted, individualized skill modules and micropractices across each dimension, integrating ABA and ACT strategies.' },
                { step: 4, icon: '/icons/game-target.svg', title: 'Monitor', desc: 'Continuous progress tracking and data collection to measure growth, guide decisions, and celebrate meaningful milestones.' },
              ].map((m) => (
                <div key={m.step} className="iatlas-method-card" role="listitem">
                  <span className="iatlas-method-step" aria-label={`Step ${m.step}`}>{m.step}</span>
                  <img src={m.icon} alt="" width={32} height={32} className="icon iatlas-method-icon" aria-hidden="true" />
                  <h3 className="iatlas-method-title">{m.title}</h3>
                  <p className="iatlas-method-desc">{m.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Dimension Cards ───────────────────────────────────────────── */}
          <section id="iatlas-dimensions" aria-labelledby="iatlas-dim-title">
            <div className="iatlas-section-header">
              <span className="iatlas-section-kicker">The Six Dimensions</span>
              <h2 className="iatlas-section-title" id="iatlas-dim-title">Explore the IATLAS Curriculum</h2>
              <p className="iatlas-section-sub">
                Each dimension has its own curriculum, skill progression, and micropractices.
                Descriptions and competency previews are free — full skill modules and interactive
                activities are available with any IATLAS plan.
              </p>
            </div>

            <div className="iatlas-dim-grid" role="list">
              {DIMENSIONS.map((dim, i) => (
                <div key={dim.key} role="listitem">
                  <DimensionCard dim={dim} index={i} />
                </div>
              ))}
            </div>
          </section>

          {/* ── Train the Facilitator Section ───────────────────────────────────── */}
          <section aria-labelledby="iatlas-ttf-title" style={{ marginTop: '3.5rem' }}>
            <div className="iatlas-ttf-banner" role="region" aria-label="Train the Facilitator program">
              <div className="iatlas-ttf-badge">
                <img src="/icons/certification.svg" alt="" width={18} height={18} className="iatlas-ttf-badge-icon" aria-hidden="true" />
                <span className="iatlas-ttf-badge-text">Coming Soon</span>
              </div>

              <h2 className="iatlas-ttf-title" id="iatlas-ttf-title">
                Train the Facilitator Certification
              </h2>

              <p className="iatlas-ttf-subtitle">
                Build your own resilience while learning to facilitate resilience in others
              </p>

              <p className="iatlas-ttf-description">
                The IATLAS Train the Facilitator (TTF) program is a dual-track professional development
                certification that equips clinicians, educators, therapists, coaches, and group leaders
                to deliver evidence-based resilience protocols —{' '}
                <strong>while strengthening their own dimensional resilience in the process</strong>.
              </p>

              <div className="iatlas-ttf-philosophy">
                <div className="iatlas-ttf-philosophy-icon" aria-hidden="true">
                  <img src="/icons/relational-connective.svg" alt="" width={40} height={40} />
                </div>
                <div>
                  <h3 className="iatlas-ttf-philosophy-title">
                    An All-Inclusive System for Everyone
                  </h3>
                  <p className="iatlas-ttf-philosophy-text">
                    IATLAS is designed for <strong>universal resilience building</strong>. Whether you're
                    a facilitator, clinician, teacher, parent, team member, or individual — you're using
                    the same 6-dimensional framework to grow your own resilience. Facilitators don't just
                    teach resilience; they <em>embody</em> it through continuous self-assessment,
                    micropractices, and professional growth.
                  </p>
                </div>
              </div>

              <div className="iatlas-ttf-grid" role="list" aria-label="TTF program tracks">
                {[
                  {
                    icon: '/icons/compass.svg',
                    title: 'Personal Growth Track',
                    desc: 'Complete your own dimensional assessment, engage in micropractices, and track your resilience journey across all 6 dimensions.',
                  },
                  {
                    icon: '/icons/planning.svg',
                    title: 'Professional Skills Track',
                    desc: 'Master facilitation techniques, group dynamics, trauma-informed delivery, cultural responsiveness, and ABA/ACT protocol fidelity.',
                  },
                  {
                    icon: '/icons/agentic-generative.svg',
                    title: 'Supervised Practicum',
                    desc: 'Deliver IATLAS protocols with live supervision, peer feedback, and competency-based assessments to ensure effective facilitation.',
                  },
                  {
                    icon: '/icons/badges.svg',
                    title: 'Ongoing Certification',
                    desc: 'Earn your TTF credential and maintain it through continuing education, community of practice engagement, and annual re-assessment.',
                  },
                ].map((item, idx) => (
                  <div key={idx} className="iatlas-ttf-card" role="listitem">
                    <img src={item.icon} alt="" width={32} height={32} className="iatlas-ttf-card-icon" aria-hidden="true" />
                    <h4 className="iatlas-ttf-card-title">{item.title}</h4>
                    <p className="iatlas-ttf-card-desc">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="iatlas-ttf-roles">
                <h3 className="iatlas-ttf-roles-title">Who Benefits from TTF?</h3>
                <div className="iatlas-ttf-roles-grid">
                  {[
                    { icon: '/icons/clinical.svg', role: 'Clinicians & Therapists', benefit: 'Self-care + client intervention skills' },
                    { icon: '/icons/teacher.svg', role: 'Teachers & Educators', benefit: 'Personal wellness + classroom resilience' },
                    { icon: '/icons/relational-connective.svg', role: 'Parents & Caregivers', benefit: 'Self-regulation + parenting skills' },
                    { icon: '/icons/organization.svg', role: 'Team Leaders & Coaches', benefit: 'Leadership resilience + team development' },
                    { icon: '/icons/certification.svg', role: 'Trainers & Facilitators', benefit: 'Professional growth + training excellence' },
                    { icon: '/icons/professional.svg', role: 'HR & Wellbeing Professionals', benefit: 'Organizational resilience + employee support' },
                  ].map((item, idx) => (
                    <div key={idx} className="iatlas-ttf-role-card">
                      <img src={item.icon} alt="" width={32} height={32} className="iatlas-ttf-role-icon" aria-hidden="true" />
                      <div>
                        <p className="iatlas-ttf-role-name">{item.role}</p>
                        <p className="iatlas-ttf-role-benefit">{item.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="iatlas-ttf-cta">
                <p className="iatlas-ttf-cta-text">
                  <strong>Interested in becoming a certified IATLAS facilitator?</strong><br />
                  Join the waitlist to be notified when the TTF program launches.
                </p>
                <Link to="/iatlas/train-the-facilitator" className="iatlas-btn-primary">
                  Learn More & Join Waitlist →
                </Link>
              </div>
            </div>
          </section>

          {/* ── IATLAS Pricing Tiers ─────────────────────────────────────── */}
          <section aria-labelledby="iatlas-pricing-title">
            <div className="iatlas-coming-features" role="region" aria-label="IATLAS pricing tiers">
              <span className="iatlas-cf-kicker">
                <img src="/icons/compass.svg" alt="" width={14} height={14} aria-hidden="true" />
                Choose Your Plan
              </span>
              <h2 className="iatlas-cf-title" id="iatlas-pricing-title">IATLAS Plans &amp; Pricing</h2>
              <p className="iatlas-cf-sub">
                Monthly subscriptions for full access to the IATLAS curriculum. These are separate from
                the one-time Atlas assessment report purchases (Atlas Starter $9.99 / Atlas Navigator $49.99).
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '1.25rem',
                marginBottom: '1.75rem',
              }} role="list">
                {[
                  {
                    id: 'individual',
                    name: 'Individual',
                    price: '$19.99',
                    period: '/month',
                    description: 'Perfect for personal resilience development',
                    features: [
                      'Personal resilience assessments',
                      'Basic progress tracking',
                      'Individual practice pathways',
                      'Mobile app access (beta)',
                    ],
                    available: true,
                    badge: null,
                    cta: 'Get Started',
                    ctaUrl: '/iatlas/subscribe?tier=individual',
                  },
                  {
                    id: 'family',
                    name: 'Family',
                    price: '$39.99',
                    period: '/month',
                    description: "Support your whole family's resilience journey",
                    features: [
                      'Up to 5 family member profiles',
                      'Family progress dashboard',
                      'Age-appropriate content (96+ activities)',
                      'Shared family practices (18 challenges)',
                    ],
                    available: true,
                    badge: null,
                    cta: 'Get Started',
                    ctaUrl: '/iatlas/subscribe?tier=family',
                  },
                  {
                    id: 'complete',
                    name: 'Complete',
                    price: '$99.99',
                    period: '/month',
                    description: 'Full curriculum access + advanced analytics',
                    features: [
                      'Everything in Family',
                      'Full curriculum access (49 modules)',
                      'Advanced progress analytics',
                      'Priority support (launching Q3 2026)',
                    ],
                    available: false,
                    badge: 'COMING SOON',
                    cta: 'Join Waitlist',
                    ctaUrl: '/iatlas/waitlist?tier=complete',
                  },
                  {
                    id: 'practitioner',
                    name: 'Practitioner',
                    price: '$149',
                    period: '/month',
                    description: 'Clinical tools for solo practitioners',
                    features: [
                      'Clinical assessments & session plans',
                      'ABA Protocol Library',
                      'Client resources (launching Q3 2026)',
                      'Progress & outcome reports',
                    ],
                    available: false,
                    badge: 'COMING SOON',
                    cta: 'Join Waitlist',
                    ctaUrl: '/iatlas/waitlist?tier=practitioner',
                  },
                  {
                    id: 'practice',
                    name: 'Practice',
                    price: '$399',
                    period: '/month',
                    description: 'Multi-practitioner group management',
                    features: [
                      'Everything in Practitioner',
                      'Multi-practitioner access (5–25 seats)',
                      'Team collaboration tools',
                      'Group practice dashboard',
                    ],
                    available: false,
                    badge: 'COMING SOON',
                    cta: 'Join Waitlist',
                    ctaUrl: '/iatlas/waitlist?tier=practice',
                  },
                  {
                    id: 'enterprise',
                    name: 'Enterprise',
                    price: 'Contact Us',
                    period: '',
                    description: 'Custom solutions for large organizations',
                    features: [
                      'Everything in Practice',
                      'Unlimited practitioners',
                      'Custom onboarding',
                      'Dedicated support',
                    ],
                    available: true,
                    badge: null,
                    cta: 'Contact Sales',
                    ctaUrl: 'mailto:hello@theresilienceatlas.com?subject=Enterprise%20Inquiry',
                  },
                ].map((plan) => (
                  <div
                    key={plan.id}
                    role="listitem"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      border: plan.available ? '1px solid rgba(79,70,229,.25)' : '1px dashed #c7d2fe',
                      borderRadius: 16,
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      opacity: plan.available ? 1 : 0.92,
                    }}
                  >
                    {plan.badge && (
                      <div style={{
                        position: 'absolute',
                        top: -13,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#f59e0b',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        padding: '3px 12px',
                        borderRadius: 20,
                        whiteSpace: 'nowrap',
                      }}>
                        {plan.badge}
                      </div>
                    )}
                    <h3 className="iatlas-cf-card-title" style={{ fontSize: '1.1rem', marginBottom: '.15rem' }}>{plan.name}</h3>
                    <p style={{ fontSize: '.82rem', color: '#64748b', margin: '0 0 .75rem', lineHeight: 1.45 }}>{plan.description}</p>
                    <div style={{ marginBottom: '1rem' }}>
                      <span style={{ fontSize: 28, fontWeight: 800, color: '#1e293b' }}>{plan.price}</span>
                      {plan.period && (
                        <span style={{ fontSize: 14, color: '#64748b', marginLeft: 3 }}>{plan.period}</span>
                      )}
                    </div>
                    <ul className="iatlas-cf-card-items" style={{ flex: 1, marginBottom: '1rem' }}>
                      {plan.features.map((feature, i) => (
                        <li key={i} className="iatlas-cf-card-item">
                          <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }} aria-hidden="true">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={plan.ctaUrl}
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        padding: '10px 16px',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 14,
                        textDecoration: 'none',
                        background: plan.available ? '#4f46e5' : '#f59e0b',
                        color: '#fff',
                        transition: 'background 0.15s',
                      }}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                ))}
              </div>

              <div className="iatlas-cf-cta">
                <a href="/quiz" className="iatlas-btn-ghost" title="For adults 18+">
                  Take the Free Assessment <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span> →
                </a>
              </div>
            </div>
          </section>

          {/* ── Get Started ──────────────────────────────────────────────── */}
          <section id="iatlas-waitlist" aria-labelledby="iatlas-wl-title">
            <div className="iatlas-waitlist" role="complementary">
              <div>
                <h2 className="iatlas-waitlist-title" id="iatlas-wl-title">
                  Get Started with IATLAS Today
                </h2>
                <p className="iatlas-waitlist-sub">
                  Enter your email to receive a personalized IATLAS plan recommendation
                  based on your Resilience Atlas™ assessment results.
                </p>
              </div>
              {waitlistStatus === 'success' ? (
                <div className="iatlas-waitlist-success" role="status" aria-live="polite">
                  <img src="/icons/checkmark.svg" alt="" width={20} height={20} aria-hidden="true" />
                  You're on the list — we'll be in touch!
                </div>
              ) : (
                <form
                  className="iatlas-waitlist-form"
                  onSubmit={handleWaitlist}
                  aria-label="IATLAS get started form"
                >
                  <label htmlFor="iatlas-email" className="sr-only">Your email address</label>
                  <input
                    id="iatlas-email"
                    type="email"
                    className="iatlas-waitlist-input"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    required
                    aria-required="true"
                    autoComplete="email"
                  />
                  <button type="submit" className="iatlas-waitlist-submit">
                    Get Started
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* ── Bottom CTA ───────────────────────────────────────────────── */}
          <section aria-labelledby="iatlas-bottom-cta-title">
            <div className="iatlas-cta-banner">
              <h2 className="iatlas-cta-title" id="iatlas-bottom-cta-title">
                Start Your Resilience Journey Today
              </h2>
              <p className="iatlas-cta-sub">
                Take the free 10-minute Resilience Atlas™ assessment to discover your dimensional
                profile — and see exactly which IATLAS skills are most relevant for you.
              </p>
              <div className="iatlas-cta-actions">
                <a href="/quiz" className="iatlas-btn-primary" title="For adults 18+">
                  Take the Free Assessment <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span>
                </a>
                <a href="/research" className="iatlas-btn-secondary">
                  Explore the Research
                </a>
              </div>
            </div>
          </section>

          {/* ── Specialized Fields Coming Soon ────────────────────────────── */}
          <section aria-labelledby="iatlas-specialties-title" className="iatlas-specialties-coming-soon">
            <div className="iatlas-section-header">
              <span className="iatlas-section-kicker">Expanding IATLAS</span>
              <h2 className="iatlas-section-title" id="iatlas-specialties-title">
                More Specialized Fields Coming Soon
              </h2>
              <p className="iatlas-section-sub">
                We're developing field-specific resilience curriculum for educators, therapists, and
                specialists. Join the waitlist to be notified when your specialty launches.
              </p>
            </div>

            <div className="iatlas-specialties-grid">
              {Object.values(IATLAS_SPECIALTIES).map((specialty) => (
                <SpecialtyCard
                  key={specialty.id}
                  specialty={specialty}
                  onJoinWaitlist={() => setActiveSpecialty(specialty)}
                />
              ))}
            </div>
          </section>

        </div>
      </main>

      {activeSpecialty && (
        <SpecialtyComingSoonModal
          specialty={activeSpecialty}
          onClose={() => setActiveSpecialty(null)}
        />
      )}
    </>
  );
}
