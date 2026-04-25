import React, { useState, useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

// ── Dimension data ─────────────────────────────────────────────────────────────
const DIMENSIONS = [
  {
    key: 'agentic-generative',
    icon: '/icons/agentic-generative.svg',
    emoji: '🎯',
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
    emoji: '🧘',
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
    emoji: '🧠',
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
    emoji: '🤝',
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
    emoji: '💙',
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
    key: 'spiritual-reflective',
    icon: '/icons/spiritual-reflective.svg',
    emoji: '✨',
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
function GatedContent({ items, label = 'Coming Soon' }) {
  return (
    <div className="iarf-gated-block" aria-label={`${label} — payment required`}>
      <div className="iarf-gated-header">
        <span className="iarf-lock-icon" aria-hidden="true">
          <img src="/icons/lock.svg" alt="" width={18} height={18} />
        </span>
        <span className="iarf-coming-soon-badge">{label}</span>
      </div>
      <ul className="iarf-gated-list" aria-label="Features coming soon">
        {items.map((item, i) => (
          <li key={i} className="iarf-gated-item">
            <span className="iarf-check" aria-hidden="true">✓</span>
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
      className="iarf-dim-card"
      style={{ '--dim-color': dim.color, '--dim-color-light': dim.colorLight, '--dim-color-border': dim.colorBorder }}
      aria-labelledby={`dim-title-${dim.key}`}
    >
      {/* Card header */}
      <div className="iarf-dim-header">
        <div className="iarf-dim-icon-wrap" aria-hidden="true">
          <img src={dim.icon} alt="" width={40} height={40} className="iarf-dim-icon" />
        </div>
        <div className="iarf-dim-meta">
          <span className="iarf-dim-number" aria-hidden="true">Dimension {index + 1}</span>
          <h3 className="iarf-dim-title" id={`dim-title-${dim.key}`}>
            <span aria-hidden="true">{dim.emoji} </span>{dim.title}
          </h3>
          <p className="iarf-dim-tagline">{dim.tagline}</p>
        </div>
      </div>

      {/* Description */}
      <p className="iarf-dim-desc">{dim.description}</p>

      {/* Key Competencies (free) */}
      <div className="iarf-dim-section">
        <h4 className="iarf-dim-section-title">Key Competencies</h4>
        <ul className="iarf-dim-competency-list">
          {dim.competencies.map((c, i) => (
            <li key={i} className="iarf-dim-competency-item">
              <span className="iarf-bullet" aria-hidden="true" style={{ color: dim.color }}>●</span>
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* Sample Skills (free preview) */}
      <div className="iarf-dim-section">
        <h4 className="iarf-dim-section-title">Sample Skills You'll Learn</h4>
        <ul className="iarf-dim-skill-list">
          {dim.sampleSkills.map((s, i) => (
            <li key={i} className="iarf-dim-skill-item">
              <span className="iarf-check-green" aria-hidden="true">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* Toggle to see gated content preview */}
      <button
        className="iarf-expand-btn"
        aria-expanded={expanded}
        aria-controls={`gated-${dim.key}`}
        onClick={() => setExpanded(e => !e)}
      >
        {expanded ? 'Hide details' : 'What&apos;s included when available'}
        <span aria-hidden="true" className={`iarf-chevron${expanded ? ' iarf-chevron--up' : ''}`}>›</span>
      </button>

      {expanded && (
        <div id={`gated-${dim.key}`}>
          <GatedContent items={dim.comingSoon} />
        </div>
      )}
    </article>
  );
}

// ── Page styles ────────────────────────────────────────────────────────────────
const STYLES = `
  /* ── Page shell ─────────────────────────────────────────────────────────── */
  .iarf-page {
    background:
      radial-gradient(circle at 5% 0%, rgba(79,70,229,.1) 0%, transparent 36%),
      radial-gradient(circle at 95% 5%, rgba(217,119,6,.08) 0%, transparent 32%),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%);
    min-height: 100vh;
  }

  .iarf-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem;
  }

  /* ── Skip link ───────────────────────────────────────────────────────────── */
  .iarf-skip {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  .iarf-skip:focus {
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
  .iarf-hero {
    padding: 3.5rem 0 2.5rem;
  }

  .iarf-hero-card {
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

  .iarf-hero-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 70% 60% at 85% 50%, rgba(79,70,229,.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .iarf-kicker {
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

  .iarf-hero-title {
    font-size: clamp(1.9rem, 4.5vw, 3.1rem);
    line-height: 1.12;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 .75rem;
    letter-spacing: -.02em;
  }

  .iarf-hero-sub {
    font-size: 1.05rem;
    line-height: 1.7;
    color: #475569;
    max-width: 55ch;
    margin: 0 0 1.4rem;
  }

  .iarf-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .7rem;
    align-items: center;
  }

  .iarf-btn-primary {
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
  .iarf-btn-primary:hover, .iarf-btn-primary:focus-visible {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(79,70,229,.38);
    outline: none;
  }
  .iarf-btn-primary:focus-visible {
    outline: 3px solid #4f46e5;
    outline-offset: 3px;
  }

  .iarf-btn-secondary {
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
  .iarf-btn-secondary:hover, .iarf-btn-secondary:focus-visible {
    border-color: #4f46e5;
    color: #4338ca;
    transform: translateY(-1px);
    outline: none;
  }
  .iarf-btn-secondary:focus-visible {
    outline: 3px solid #4f46e5;
    outline-offset: 3px;
  }

  .iarf-hero-visual {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: .6rem;
    min-width: 140px;
  }

  .iarf-hero-badge {
    background: rgba(255,255,255,.9);
    border: 1.5px solid rgba(79,70,229,.2);
    border-radius: 16px;
    padding: .9rem 1.1rem;
    text-align: center;
    box-shadow: 0 4px 18px rgba(79,70,229,.1);
  }

  .iarf-hero-badge-num {
    display: block;
    font-size: 2.4rem;
    font-weight: 800;
    color: #4338ca;
    line-height: 1;
  }

  .iarf-hero-badge-label {
    display: block;
    font-size: .7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: #64748b;
    margin-top: .25rem;
  }

  /* ── Overview section ────────────────────────────────────────────────────── */
  .iarf-overview {
    margin-top: 3rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1rem;
  }

  .iarf-overview-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    padding: 1.3rem 1.25rem;
    box-shadow: 0 4px 16px rgba(15,23,42,.05);
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .iarf-overview-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px rgba(15,23,42,.09);
  }

  .iarf-ov-icon {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: .75rem;
    font-size: 1.4rem;
  }

  .iarf-ov-title {
    font-size: 1rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 .35rem;
  }

  .iarf-ov-desc {
    font-size: .88rem;
    color: #475569;
    line-height: 1.6;
    margin: 0;
  }

  /* ── Section headings ────────────────────────────────────────────────────── */
  .iarf-section-header {
    text-align: center;
    padding: 3.5rem 0 1.75rem;
  }

  .iarf-section-kicker {
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

  .iarf-section-title {
    font-size: clamp(1.6rem, 3.5vw, 2.3rem);
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 .65rem;
    letter-spacing: -.015em;
  }

  .iarf-section-sub {
    font-size: 1rem;
    color: #475569;
    max-width: 58ch;
    margin: 0 auto;
    line-height: 1.7;
  }

  /* ── Dimension grid ──────────────────────────────────────────────────────── */
  .iarf-dim-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
    gap: 1.25rem;
    padding-bottom: 1rem;
  }

  /* ── Dimension card ──────────────────────────────────────────────────────── */
  .iarf-dim-card {
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
  .iarf-dim-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(15,23,42,.1);
  }

  .iarf-dim-header {
    display: flex;
    align-items: flex-start;
    gap: .9rem;
  }

  .iarf-dim-icon-wrap {
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

  .iarf-dim-icon {
    opacity: .9;
  }

  .iarf-dim-meta {
    flex: 1;
    min-width: 0;
  }

  .iarf-dim-number {
    font-size: .7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--dim-color);
    opacity: .85;
  }

  .iarf-dim-title {
    font-size: 1.15rem;
    font-weight: 800;
    color: #1e293b;
    margin: .2rem 0 .25rem;
    line-height: 1.25;
  }

  .iarf-dim-tagline {
    font-size: .84rem;
    color: #64748b;
    margin: 0;
    line-height: 1.5;
  }

  .iarf-dim-desc {
    font-size: .88rem;
    color: #475569;
    line-height: 1.65;
    margin: 0;
  }

  .iarf-dim-section {
    border-top: 1px solid #f1f5f9;
    padding-top: .85rem;
  }

  .iarf-dim-section-title {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .07em;
    color: #64748b;
    margin: 0 0 .55rem;
  }

  .iarf-dim-competency-list,
  .iarf-dim-skill-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .32rem;
  }

  .iarf-dim-competency-item,
  .iarf-dim-skill-item {
    font-size: .87rem;
    color: #334155;
    display: flex;
    align-items: baseline;
    gap: .5rem;
    line-height: 1.5;
  }

  .iarf-bullet {
    font-size: .5rem;
    flex-shrink: 0;
    position: relative;
    top: -.05em;
  }

  .iarf-check-green {
    color: #16a34a;
    font-size: .85rem;
    flex-shrink: 0;
    font-weight: 700;
  }

  /* ── Expand button ───────────────────────────────────────────────────────── */
  .iarf-expand-btn {
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
  .iarf-expand-btn:hover, .iarf-expand-btn:focus-visible {
    background: rgba(0,0,0,.04);
    outline: none;
  }
  .iarf-expand-btn:focus-visible {
    outline: 2px solid var(--dim-color);
    outline-offset: 2px;
  }

  .iarf-chevron {
    font-size: 1.2rem;
    line-height: 1;
    transform: rotate(90deg);
    display: inline-block;
    transition: transform .2s ease;
  }
  .iarf-chevron--up {
    transform: rotate(-90deg);
  }

  /* ── Gated content block ─────────────────────────────────────────────────── */
  .iarf-gated-block {
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

  .iarf-gated-header {
    display: flex;
    align-items: center;
    gap: .5rem;
    margin-bottom: .65rem;
  }

  .iarf-lock-icon {
    opacity: .65;
  }

  .iarf-coming-soon-badge {
    background: #1e293b;
    color: #f1f5f9;
    font-size: .68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    border-radius: 999px;
    padding: .2rem .65rem;
  }

  .iarf-gated-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .28rem;
  }

  .iarf-gated-item {
    font-size: .83rem;
    color: #64748b;
    display: flex;
    align-items: baseline;
    gap: .45rem;
    line-height: 1.5;
  }

  .iarf-check {
    color: #94a3b8;
    font-size: .8rem;
    flex-shrink: 0;
    font-weight: 700;
  }

  /* ── Coming Soon features section ───────────────────────────────────────── */
  .iarf-coming-features {
    margin: 3rem 0;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 28px;
    padding: clamp(1.75rem, 4vw, 2.75rem);
    color: #f1f5f9;
    position: relative;
    overflow: hidden;
  }

  .iarf-coming-features::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: 240px;
    height: 240px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(79,70,229,.22) 0%, transparent 70%);
    pointer-events: none;
  }

  .iarf-coming-features::after {
    content: '';
    position: absolute;
    bottom: -40px;
    left: -40px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(217,119,6,.18) 0%, transparent 70%);
    pointer-events: none;
  }

  .iarf-cf-kicker {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: rgba(255,255,255,.12);
    border: 1px solid rgba(255,255,255,.2);
    border-radius: 999px;
    padding: .28rem .8rem;
    font-size: .68rem;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
    color: #a5b4fc;
    margin-bottom: .8rem;
  }

  .iarf-cf-title {
    font-size: clamp(1.4rem, 3vw, 2rem);
    font-weight: 800;
    margin: 0 0 .5rem;
    color: #f1f5f9;
  }

  .iarf-cf-sub {
    font-size: .95rem;
    color: #94a3b8;
    max-width: 55ch;
    line-height: 1.65;
    margin: 0 0 1.75rem;
  }

  .iarf-cf-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 1rem;
    margin-bottom: 1.75rem;
  }

  .iarf-cf-card {
    background: rgba(255,255,255,.07);
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 16px;
    padding: 1.1rem;
  }

  .iarf-cf-card-icon {
    font-size: 1.6rem;
    margin-bottom: .5rem;
    display: block;
  }

  .iarf-cf-card-title {
    font-size: .95rem;
    font-weight: 700;
    color: #f1f5f9;
    margin: 0 0 .35rem;
  }

  .iarf-cf-card-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .25rem;
  }

  .iarf-cf-card-item {
    font-size: .82rem;
    color: #94a3b8;
    display: flex;
    align-items: baseline;
    gap: .4rem;
    line-height: 1.45;
  }

  .iarf-cf-cta {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    align-items: center;
    position: relative;
    z-index: 1;
  }

  .iarf-btn-white {
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
  .iarf-btn-white:hover, .iarf-btn-white:focus-visible {
    background: #f1f5f9;
    transform: translateY(-2px);
    outline: none;
  }
  .iarf-btn-white:focus-visible {
    outline: 3px solid #fff;
    outline-offset: 3px;
  }

  .iarf-btn-ghost {
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
  .iarf-btn-ghost:hover, .iarf-btn-ghost:focus-visible {
    border-color: #a5b4fc;
    color: #c7d2fe;
    transform: translateY(-1px);
    outline: none;
  }
  .iarf-btn-ghost:focus-visible {
    outline: 3px solid #a5b4fc;
    outline-offset: 3px;
  }

  /* ── Waitlist form ───────────────────────────────────────────────────────── */
  .iarf-waitlist {
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

  .iarf-waitlist-title {
    font-size: 1.2rem;
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 .3rem;
  }

  .iarf-waitlist-sub {
    font-size: .9rem;
    color: #475569;
    margin: 0;
    line-height: 1.6;
  }

  .iarf-waitlist-form {
    display: flex;
    gap: .6rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .iarf-waitlist-input {
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    padding: .62rem .95rem;
    font-size: .93rem;
    color: #1e293b;
    background: #f8fafc;
    min-width: 220px;
    transition: border-color .18s ease;
  }
  .iarf-waitlist-input:focus {
    border-color: #4f46e5;
    outline: none;
    background: #fff;
  }
  .iarf-waitlist-input::placeholder {
    color: #94a3b8;
  }

  .iarf-waitlist-submit {
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
  .iarf-waitlist-submit:hover {
    background: #4338ca;
  }
  .iarf-waitlist-submit:focus-visible {
    outline: 3px solid #4f46e5;
    outline-offset: 3px;
  }

  .iarf-waitlist-success {
    display: flex;
    align-items: center;
    gap: .5rem;
    color: #16a34a;
    font-weight: 600;
    font-size: .92rem;
  }

  /* ── Methodology section ─────────────────────────────────────────────────── */
  .iarf-method {
    margin: 2.5rem 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
  }

  .iarf-method-card {
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.1rem 1.2rem;
    background: #fff;
    box-shadow: 0 2px 12px rgba(15,23,42,.04);
    position: relative;
  }

  .iarf-method-step {
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

  .iarf-method-icon {
    font-size: 1.5rem;
    margin-bottom: .5rem;
    display: block;
  }

  .iarf-method-title {
    font-size: .95rem;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 .3rem;
  }

  .iarf-method-desc {
    font-size: .84rem;
    color: #475569;
    line-height: 1.6;
    margin: 0;
  }

  /* ── CTA banner ──────────────────────────────────────────────────────────── */
  .iarf-cta-banner {
    background: linear-gradient(135deg, #eef2ff 0%, #fdf4ff 100%);
    border: 1.5px solid rgba(79,70,229,.2);
    border-radius: 22px;
    padding: clamp(1.5rem, 3vw, 2.25rem);
    text-align: center;
    margin: 2.5rem 0 4rem;
    box-shadow: 0 4px 20px rgba(79,70,229,.08);
  }

  .iarf-cta-title {
    font-size: clamp(1.2rem, 2.5vw, 1.65rem);
    font-weight: 800;
    color: #1e293b;
    margin: 0 0 .4rem;
  }

  .iarf-cta-sub {
    color: #475569;
    font-size: .96rem;
    max-width: 50ch;
    margin: 0 auto .9rem;
    line-height: 1.65;
  }

  .iarf-cta-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .7rem;
    justify-content: center;
  }

  /* ── Motion preferences ──────────────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .iarf-dim-card,
    .iarf-overview-card,
    .iarf-btn-primary,
    .iarf-btn-secondary,
    .iarf-btn-white,
    .iarf-btn-ghost,
    .iarf-chevron {
      transition: none !important;
      animation: none !important;
    }
    .iarf-dim-card:hover,
    .iarf-overview-card:hover {
      transform: none;
    }
  }

  /* ── Responsive ─────────────────────────────────────────────────────────── */
  @media (max-width: 720px) {
    .iarf-hero-card {
      grid-template-columns: 1fr;
    }
    .iarf-hero-visual {
      display: none;
    }
    .iarf-waitlist {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    .iarf-dim-grid {
      grid-template-columns: 1fr;
    }
  }

  /* ── Dark mode ───────────────────────────────────────────────────────────── */
  [data-theme="dark"] .iarf-page,
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .iarf-page {
      background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    }
  }

  [data-theme="dark"] .iarf-hero-card {
    background: linear-gradient(135deg, #1e293b 0%, #2d1f4a 50%, #1c1a0e 100%);
    border-color: rgba(165,180,252,.18);
  }
  [data-theme="dark"] .iarf-hero-title { color: #f1f5f9; }
  [data-theme="dark"] .iarf-hero-sub { color: #94a3b8; }
  [data-theme="dark"] .iarf-hero-badge { background: rgba(255,255,255,.1); border-color: rgba(165,180,252,.2); }
  [data-theme="dark"] .iarf-hero-badge-num { color: #a5b4fc; }
  [data-theme="dark"] .iarf-hero-badge-label { color: #64748b; }
  [data-theme="dark"] .iarf-kicker { background: rgba(255,255,255,.1); color: #a5b4fc; }
  [data-theme="dark"] .iarf-overview-card { background: #1e293b; border-color: #334155; }
  [data-theme="dark"] .iarf-ov-title { color: #f1f5f9; }
  [data-theme="dark"] .iarf-ov-desc { color: #94a3b8; }
  [data-theme="dark"] .iarf-section-title { color: #f1f5f9; }
  [data-theme="dark"] .iarf-section-sub { color: #94a3b8; }
  [data-theme="dark"] .iarf-section-kicker { background: rgba(165,180,252,.15); color: #a5b4fc; }
  [data-theme="dark"] .iarf-dim-card { background: #1e293b; border-color: rgba(165,180,252,.15); }
  [data-theme="dark"] .iarf-dim-title { color: #f1f5f9; }
  [data-theme="dark"] .iarf-dim-desc { color: #94a3b8; }
  [data-theme="dark"] .iarf-dim-tagline { color: #64748b; }
  [data-theme="dark"] .iarf-dim-section { border-color: #334155; }
  [data-theme="dark"] .iarf-dim-section-title { color: #64748b; }
  [data-theme="dark"] .iarf-dim-competency-item,
  [data-theme="dark"] .iarf-dim-skill-item { color: #cbd5e1; }
  [data-theme="dark"] .iarf-gated-block { border-color: #475569; background: repeating-linear-gradient(135deg, rgba(255,255,255,.02) 0px, rgba(255,255,255,.02) 2px, transparent 2px, transparent 10px); }
  [data-theme="dark"] .iarf-coming-soon-badge { background: #f1f5f9; color: #1e293b; }
  [data-theme="dark"] .iarf-gated-item { color: #94a3b8; }
  [data-theme="dark"] .iarf-waitlist { background: #1e293b; border-color: #334155; }
  [data-theme="dark"] .iarf-waitlist-title { color: #f1f5f9; }
  [data-theme="dark"] .iarf-waitlist-sub { color: #94a3b8; }
  [data-theme="dark"] .iarf-waitlist-input { background: #0f172a; border-color: #475569; color: #f1f5f9; }
  [data-theme="dark"] .iarf-waitlist-input:focus { border-color: #818cf8; background: #1e293b; }
  [data-theme="dark"] .iarf-method-card { background: #1e293b; border-color: #334155; }
  [data-theme="dark"] .iarf-method-title { color: #f1f5f9; }
  [data-theme="dark"] .iarf-method-desc { color: #94a3b8; }
  [data-theme="dark"] .iarf-method-step { background: rgba(165,180,252,.15); color: #a5b4fc; }
  [data-theme="dark"] .iarf-cta-banner { background: linear-gradient(135deg, #1e293b 0%, #2d1f4a 100%); border-color: rgba(165,180,252,.2); }
  [data-theme="dark"] .iarf-cta-title { color: #f1f5f9; }
  [data-theme="dark"] .iarf-cta-sub { color: #94a3b8; }
  [data-theme="dark"] .iarf-btn-secondary { background: rgba(255,255,255,.08); color: #cbd5e1; border-color: #475569; }
  [data-theme="dark"] .iarf-btn-secondary:hover { border-color: #818cf8; color: #a5b4fc; }
  [data-theme="dark"] .iarf-expand-btn { background: rgba(255,255,255,.07); border-color: rgba(255,255,255,.12); }
`;

// ── Main page component ────────────────────────────────────────────────────────
export default function IARFCurriculumPage() {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle'); // idle | success | error

  // Sync dark-mode preference on mount
  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
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

      <a href="#iarf-dimensions" className="iarf-skip">Skip to curriculum dimensions</a>

      <SiteHeader activePage="iarf" />
      <DarkModeHint />

      <main className="iarf-page" id="main-content">
        <div className="iarf-wrap">

          {/* ── Hero ─────────────────────────────────────────────────────── */}
          <section className="iarf-hero" aria-labelledby="iarf-hero-title">
            <div className="iarf-hero-card">
              <div>
                <span className="iarf-kicker">
                  <img src="/icons/compass.svg" alt="" width={13} height={13} aria-hidden="true" />
                  IARF Curriculum
                </span>
                <h1 className="iarf-hero-title" id="iarf-hero-title">
                  Build Resilience Across<br />6 Dimensions
                </h1>
                <p className="iarf-hero-sub">
                  The Integrated ABA Resilience Framework (IARF) translates your Resilience Atlas™ assessment
                  into structured, science-based skill-building across six dimensions of human resilience —
                  grounded in Applied Behavior Analysis and Acceptance &amp; Commitment Therapy.
                </p>
                <div className="iarf-hero-actions">
                  <a href="/quiz" className="iarf-btn-primary">
                    <img src="/icons/compass.svg" alt="" width={16} height={16} aria-hidden="true" />
                    Take the Free Assessment
                  </a>
                  <a href="#iarf-overview" className="iarf-btn-secondary">
                    Learn more about IARF
                  </a>
                </div>
              </div>
              <div className="iarf-hero-visual" aria-hidden="true">
                <div className="iarf-hero-badge">
                  <span className="iarf-hero-badge-num">6</span>
                  <span className="iarf-hero-badge-label">Dimensions</span>
                </div>
                <div className="iarf-hero-badge">
                  <span className="iarf-hero-badge-num">ABA</span>
                  <span className="iarf-hero-badge-label">+ ACT</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <section id="iarf-overview" aria-labelledby="iarf-ov-title">
            <div className="iarf-section-header" style={{ paddingBottom: '1rem' }}>
              <span className="iarf-section-kicker">What is IARF?</span>
              <h2 className="iarf-section-title" id="iarf-ov-title">A Science-Based Resilience Curriculum</h2>
              <p className="iarf-section-sub">
                IARF is the practice-facing complement to the Resilience Atlas™. Where the Atlas
                measures and maps resilience, IARF provides the structured methodology for building it.
              </p>
            </div>

            <div className="iarf-overview" role="list">
              {[
                { icon: '📐', bg: '#eef2ff', title: 'Evidence-Based', desc: 'Grounded in Applied Behavior Analysis (ABA) and Acceptance & Commitment Therapy (ACT) — two of the most rigorously validated approaches in behavioral science.' },
                { icon: '🎯', bg: '#fef3c7', title: 'Assessment-Driven', desc: 'Built directly on your Resilience Atlas™ dimensional profile. Every skill module targets your real growth edges, not generic advice.' },
                { icon: '🔄', bg: '#d1fae5', title: 'Four-Phase Cycle', desc: 'Assess → Analyze → Intervene → Monitor. A structured, data-informed process that ensures measurable, lasting resilience growth.' },
                { icon: '🌱', bg: '#fce7f3', title: 'Values-Aligned', desc: 'Every practice and skill is anchored to what matters most to you. Resilience built on intrinsic motivation, not external pressure.' },
              ].map((c) => (
                <div key={c.title} className="iarf-overview-card" role="listitem">
                  <div className="iarf-ov-icon" style={{ background: c.bg }} aria-hidden="true">
                    {c.icon}
                  </div>
                  <h3 className="iarf-ov-title">{c.title}</h3>
                  <p className="iarf-ov-desc">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Methodology ──────────────────────────────────────────────── */}
          <section aria-labelledby="iarf-method-title" style={{ marginTop: '2.5rem' }}>
            <div className="iarf-section-header" style={{ paddingBottom: '1rem' }}>
              <span className="iarf-section-kicker">The IARF Methodology</span>
              <h2 className="iarf-section-title" id="iarf-method-title">How It Works</h2>
            </div>
            <div className="iarf-method" role="list">
              {[
                { step: 1, icon: '🗺️', title: 'Assess', desc: 'Start with a comprehensive Resilience Atlas™ assessment across all six dimensions to establish your baseline profile.' },
                { step: 2, icon: '🔬', title: 'Analyze', desc: 'ABA-informed analysis of your dimensional strengths, growth edges, and the barriers and patterns shaping your resilience.' },
                { step: 3, icon: '🛠️', title: 'Intervene', desc: 'Engage targeted, individualized skill modules and micropractices across each dimension, integrating ABA and ACT strategies.' },
                { step: 4, icon: '📊', title: 'Monitor', desc: 'Continuous progress tracking and data collection to measure growth, guide decisions, and celebrate meaningful milestones.' },
              ].map((m) => (
                <div key={m.step} className="iarf-method-card" role="listitem">
                  <span className="iarf-method-step" aria-label={`Step ${m.step}`}>{m.step}</span>
                  <span className="iarf-method-icon" aria-hidden="true">{m.icon}</span>
                  <h3 className="iarf-method-title">{m.title}</h3>
                  <p className="iarf-method-desc">{m.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Dimension Cards ───────────────────────────────────────────── */}
          <section id="iarf-dimensions" aria-labelledby="iarf-dim-title">
            <div className="iarf-section-header">
              <span className="iarf-section-kicker">The Six Dimensions</span>
              <h2 className="iarf-section-title" id="iarf-dim-title">Explore the IARF Curriculum</h2>
              <p className="iarf-section-sub">
                Each dimension has its own curriculum, skill progression, and micropractices.
                Descriptions and competency previews are free — full skill modules and interactive
                activities will be available when the curriculum launches.
              </p>
            </div>

            <div className="iarf-dim-grid" role="list">
              {DIMENSIONS.map((dim, i) => (
                <div key={dim.key} role="listitem">
                  <DimensionCard dim={dim} index={i} />
                </div>
              ))}
            </div>
          </section>

          {/* ── Coming Soon Features ─────────────────────────────────────── */}
          <section aria-labelledby="iarf-cf-title">
            <div className="iarf-coming-features" role="region" aria-label="Coming soon features">
              <span className="iarf-cf-kicker">🚀 Launching Soon</span>
              <h2 className="iarf-cf-title" id="iarf-cf-title">Coming Soon to IARF</h2>
              <p className="iarf-cf-sub">
                We're building a full gamified learning experience for the IARF curriculum.
                Here's what's on the way:
              </p>

              <div className="iarf-cf-grid" role="list">
                {[
                  {
                    icon: '⚡',
                    title: 'Gamified Learning',
                    items: ['Earn XP for every practice', 'Level up: Explorer → Master', 'Unlock badges & achievements', 'Dimensional balance wheel'],
                  },
                  {
                    icon: '🔥',
                    title: 'Practice Streaks',
                    items: ['Daily micropractice streaks', 'Bronze → Diamond badges', 'Streak forgiveness (1 miss/mo)', '7, 30, 90, 365-day milestones'],
                  },
                  {
                    icon: '📜',
                    title: 'Quest System',
                    items: ['30-Day Foundation Quest', '7-Day Sprint Challenges', '90-Day Epic Transformation', 'Dimensional Deep-Dives'],
                  },
                  {
                    icon: '📊',
                    title: 'Progress Dashboard',
                    items: ['Animated radar chart', 'Before/after comparisons', 'Personalized skill recommendations', 'Celebration animations'],
                  },
                ].map((cf) => (
                  <div key={cf.title} className="iarf-cf-card" role="listitem">
                    <span className="iarf-cf-card-icon" aria-hidden="true">{cf.icon}</span>
                    <h3 className="iarf-cf-card-title">{cf.title}</h3>
                    <ul className="iarf-cf-card-items">
                      {cf.items.map((item, i) => (
                        <li key={i} className="iarf-cf-card-item">
                          <span aria-hidden="true">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="iarf-cf-cta">
                <a href="#iarf-waitlist" className="iarf-btn-white">
                  🎉 Join the Waitlist
                </a>
                <a href="/quiz" className="iarf-btn-ghost">
                  Take the Free Assessment →
                </a>
              </div>
            </div>
          </section>

          {/* ── Waitlist ─────────────────────────────────────────────────── */}
          <section id="iarf-waitlist" aria-labelledby="iarf-wl-title">
            <div className="iarf-waitlist" role="complementary">
              <div>
                <h2 className="iarf-waitlist-title" id="iarf-wl-title">
                  Get Notified When IARF Launches
                </h2>
                <p className="iarf-waitlist-sub">
                  Be first to access the full curriculum, skill modules, and gamified learning experience.
                  No spam — one email when it's ready.
                </p>
              </div>
              {waitlistStatus === 'success' ? (
                <div className="iarf-waitlist-success" role="status" aria-live="polite">
                  <span aria-hidden="true">✅</span>
                  You're on the list — we'll be in touch!
                </div>
              ) : (
                <form
                  className="iarf-waitlist-form"
                  onSubmit={handleWaitlist}
                  aria-label="IARF waitlist signup form"
                >
                  <label htmlFor="iarf-email" className="sr-only">Your email address</label>
                  <input
                    id="iarf-email"
                    type="email"
                    className="iarf-waitlist-input"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    required
                    aria-required="true"
                    autoComplete="email"
                  />
                  <button type="submit" className="iarf-waitlist-submit">
                    Notify Me
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* ── Bottom CTA ───────────────────────────────────────────────── */}
          <section aria-labelledby="iarf-bottom-cta-title">
            <div className="iarf-cta-banner">
              <h2 className="iarf-cta-title" id="iarf-bottom-cta-title">
                Start Your Resilience Journey Today
              </h2>
              <p className="iarf-cta-sub">
                Take the free 10-minute Resilience Atlas™ assessment to discover your dimensional
                profile — and see exactly which IARF skills are most relevant for you.
              </p>
              <div className="iarf-cta-actions">
                <a href="/quiz" className="iarf-btn-primary">
                  Take the Free Assessment
                </a>
                <a href="/research" className="iarf-btn-secondary">
                  Explore the Research
                </a>
              </div>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
