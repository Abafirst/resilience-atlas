import React, { useEffect, useRef } from 'react';

/**
 * DimensionModal — Accessible modal showing a full explanation of a
 * resilience dimension including description, why it matters, and
 * "how to improve" pointers.
 *
 * Accessibility features:
 *   - Focus trapped inside the modal while open
 *   - Closes on ESC key
 *   - ARIA roles: dialog, aria-modal, aria-labelledby, aria-describedby
 *   - Returns focus to the trigger element on close
 */

// ── Full dimension data ───────────────────────────────────────────────────────
export const DIMENSION_DETAILS = {
  'Cognitive-Narrative': {
    icon: '/icons/cognitive-narrative.svg',
    color: '#4F46E5',
    tagline: 'How you make meaning from your experiences',
    description:
      'The Cognitive-Narrative dimension reflects your capacity to find meaning, reframe ' +
      'adversity, and construct coherent stories from life\'s challenges. Resilient people in ' +
      'this dimension can step back from a difficult event, interpret it in more than one way, ' +
      'and integrate it into a life story that includes growth rather than only loss.',
    whyItMatters:
      'Research shows that how we narrate our experiences directly shapes our emotional ' +
      'recovery and future coping. People who can reframe setbacks — finding the lesson, ' +
      'the humor, or the silver lining — recover faster from stress and are more likely to ' +
      'attempt difficult things again. Narrative coherence is also strongly linked to ' +
      'psychological well-being and identity stability.',
    howToImprove: [
      'Keep a "reframing journal" — write three alternative ways to interpret a recent challenge.',
      'Practice cognitive defusion: notice thoughts without fusing with them ("I\'m having the thought that…").',
      'Write your resilience story: What difficulties have you overcome? What did they teach you?',
      'Use the "leaves on a stream" ACT exercise to observe your thinking patterns without reacting.',
    ],
    examples: [
      'After a work setback, finding the skill you built rather than only seeing the failure.',
      'Reinterpreting anxiety before a presentation as excitement and energy.',
      'Telling a story of your career that includes both challenges and growth.',
    ],
  },

  'Relational-Connective': {
    icon: '/icons/relational-connective.svg',
    color: '#059669',
    tagline: 'Your capacity for connection, trust, and support',
    description:
      'The Relational-Connective dimension measures the quality and depth of your ' +
      'social resources. This includes your ability to ask for and receive support, ' +
      'your trust in others, the reciprocity in your relationships, and your sense of ' +
      'belonging in a community. Humans are wired for connection — this dimension ' +
      'captures how effectively you activate that wiring under stress.',
    whyItMatters:
      'Decades of resilience research consistently show that social support is one of the ' +
      'single strongest predictors of psychological resilience. People with rich relational ' +
      'networks not only recover from adversity faster but also show lower cortisol responses ' +
      'to stressors. Conversely, loneliness and social disconnection are linked to higher ' +
      'rates of depression, anxiety, and physical illness.',
    howToImprove: [
      'Practice vulnerability: share one real challenge with a trusted person this week.',
      'Schedule connection deliberately — relationships require maintenance, not just availability.',
      'Use the empathic listening technique: focus entirely on the other person without planning your response.',
      'Identify your "resilience network" — 3 people you can call when things get hard.',
    ],
    examples: [
      'Reaching out to a mentor during a career transition instead of isolating.',
      'Being honest with a partner about struggling, rather than appearing fine.',
      'Joining a community (professional, spiritual, or interest-based) that aligns with your values.',
    ],
  },

  'Agentic-Generative': {
    icon: '/icons/agentic-generative.svg',
    color: '#D97706',
    tagline: 'Your capacity for purposeful action and forward momentum',
    description:
      'The Agentic-Generative dimension reflects your ability to take purposeful action, ' +
      'maintain forward momentum in the face of obstacles, and generate new possibilities ' +
      'when old paths are blocked. It combines a sense of personal agency ("I can influence ' +
      'this") with generativity ("I can create something new here") — essential ingredients ' +
      'for bouncing forward rather than just back.',
    whyItMatters:
      'Agency — the belief that your actions matter — is a core component of resilience. ' +
      'Research on learned helplessness shows that people who feel unable to affect their ' +
      'circumstances become passive and depressed. Conversely, those who maintain an action ' +
      'orientation, even when only small steps are possible, sustain motivation, hope, and ' +
      'recovery momentum. Generativity extends this into creativity: turning constraints ' +
      'into opportunities.',
    howToImprove: [
      'Identify the "smallest possible next step" on a goal you\'ve been avoiding — then do it today.',
      'Practice the distinction between what you can and cannot control; focus energy on the former.',
      'Use "possibility thinking": when blocked, ask "What\'s one other way this could work?"',
      'Celebrate micro-completions — acknowledge every step forward, not just the destination.',
    ],
    examples: [
      'After a job loss, identifying two transferable skills and applying them in a new direction.',
      'Breaking an overwhelming project into daily 20-minute action blocks.',
      'Finding a creative workaround when the expected path is unavailable.',
    ],
  },

  'Emotional-Adaptive': {
    icon: '/icons/emotional-adaptive.svg',
    color: '#DC2626',
    tagline: 'Your flexibility in navigating the emotional landscape of stress',
    description:
      'The Emotional-Adaptive dimension captures how skillfully you relate to your ' +
      'own emotions — especially under pressure. It includes emotional awareness (knowing ' +
      'what you feel), tolerance (staying with difficult feelings without being overwhelmed), ' +
      'regulation (modulating intensity when needed), and flexibility (moving between ' +
      'emotional states as the situation calls for). It is not about suppressing emotion — ' +
      'it\'s about having a wide, flexible range.',
    whyItMatters:
      'Emotional rigidity — being stuck in a single feeling or unable to tolerate distress ' +
      '— is a major vulnerability factor for anxiety, depression, and burnout. Research in ' +
      'affective science shows that emotional granularity (the ability to precisely label ' +
      'emotions) and acceptance (allowing feelings without resistance) are strongly linked ' +
      'to adaptive coping. People with high emotional adaptability don\'t feel less — ' +
      'they feel with more agility.',
    howToImprove: [
      'Practice the RAIN technique: Recognize, Allow, Investigate, Nurture — applied to one difficult emotion daily.',
      'Build emotional vocabulary: expand beyond "stressed" or "fine" to name feelings precisely.',
      'Try "urge surfing": when an unpleasant feeling arises, observe it like a wave instead of suppressing or indulging it.',
      'Keep a daily emotion journal: what triggered it, what you felt in your body, how you responded.',
    ],
    examples: [
      'Feeling genuine grief over a loss, then returning to function without getting stuck.',
      'Noticing frustration in a meeting and choosing a thoughtful response rather than reacting.',
      'Being anxious before a presentation and using the energy constructively.',
    ],
  },

  'Spiritual-Reflective': {
    icon: '/icons/spiritual-reflective.svg',
    color: '#7C3AED',
    tagline: 'Your connection to meaning, values, and something larger than yourself',
    description:
      'The Spiritual-Reflective dimension measures the degree to which your life is ' +
      'anchored in a coherent set of values, a sense of purpose, and a relationship to ' +
      'something larger than yourself — whether that is a spiritual tradition, a worldview, ' +
      'a calling, or a commitment to future generations. This dimension is not confined to ' +
      'religious practice; it is about depth of meaning-making and the stability that comes ' +
      'from a well-grounded inner life.',
    whyItMatters:
      'Viktor Frankl\'s landmark work in logotherapy demonstrated that a sense of meaning ' +
      'is the most powerful buffer against suffering. Contemporary positive psychology ' +
      'research confirms this: people with a strong sense of purpose recover faster from ' +
      'adversity, show greater life satisfaction, and are less susceptible to existential ' +
      'anxiety. Values clarity also serves as an internal compass that makes decisions ' +
      'easier under pressure, reducing cognitive load when it matters most.',
    howToImprove: [
      'Write a "values inventory": identify your 5 core values and how each shows up in your current life.',
      'Practice a daily 5-minute gratitude and reflection ritual — especially for difficult moments.',
      'Engage with a practice that connects you to something larger: meditation, nature, service, prayer, art.',
      'Ask the "legacy question" periodically: "What do I want to have contributed 5 years from now?"',
    ],
    examples: [
      'Drawing on a deeply held value (e.g., integrity) to make a difficult ethical decision.',
      'Finding meaning in a period of suffering by seeing it as part of a larger growth arc.',
      'Using a gratitude practice to shift perspective during a period of loss.',
    ],
  },

  'Somatic-Regulative': {
    icon: '/icons/somatic-regulative.svg',
    color: '#0891B2',
    tagline: 'Your body as a resource for stability and recovery',
    description:
      'The Somatic-Regulative dimension reflects how well your body and nervous system ' +
      'serve as a platform for resilience. It includes your awareness of bodily signals ' +
      '(interoception), your ability to use physical practices (breath, movement, sleep, ' +
      'rest) to regulate your nervous system, and the consistency of the health routines ' +
      'that provide a stable foundation. When the body is resourced, the mind is far more ' +
      'capable of navigating difficulty.',
    whyItMatters:
      'Neuroscience has firmly established the bidirectional relationship between body and ' +
      'mind: chronic physiological stress (high cortisol, poor sleep, sedentary behavior) ' +
      'directly impairs emotional regulation, cognitive flexibility, and decision-making. ' +
      'Conversely, practices like diaphragmatic breathing, regular movement, and consistent ' +
      'sleep schedules activate the parasympathetic nervous system, building a physiological ' +
      'buffer against stress. The body is not a vehicle for the mind — it is half the system.',
    howToImprove: [
      'Practice 4-7-8 breathing: inhale 4 counts, hold 7, exhale 8 — activates the vagus nerve.',
      'Add a 15-minute intentional walk to your daily routine; observe how mood and cognition shift.',
      'Establish a consistent sleep-wake schedule — regularity matters more than total hours.',
      'Practice a brief body scan: 3 minutes noticing physical sensations from head to toe without judgment.',
    ],
    examples: [
      'Using diaphragmatic breathing to downregulate before a high-stakes conversation.',
      'Recognizing physical tension as an early warning sign of overwhelm before it escalates.',
      'Using morning movement as a daily nervous-system reset that improves afternoon resilience.',
    ],
  },
};

// ── Focusable elements selector ───────────────────────────────────────────────
const FOCUSABLE_SELECTORS = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'textarea:not([disabled])', 'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.65)',
    zIndex: 9000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    overflowY: 'auto',
  },
  modal: {
    background: '#fff',
    borderRadius: 20,
    maxWidth: 640,
    width: '100%',
    boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
    position: 'relative',
    maxHeight: '90vh',
    overflowY: 'auto',
    outline: 'none',
  },
  header: (color) => ({
    padding: '28px 28px 20px',
    borderBottom: '1px solid #e2e8f0',
    background: `linear-gradient(135deg, ${color}10, ${color}06)`,
  }),
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: 'rgba(0,0,0,0.06)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    padding: '6px 10px',
    fontSize: 18,
    lineHeight: 1,
    color: '#475569',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: (color) => ({
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }),
  title: {
    fontSize: 22,
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px',
    lineHeight: 1.2,
  },
  tagline: {
    fontSize: 14,
    color: '#64748b',
    margin: 0,
    lineHeight: 1.5,
  },
  body: {
    padding: '24px 28px 28px',
  },
  sectionLabel: (color) => ({
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color,
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  }),
  p: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 1.7,
    margin: '0 0 20px',
  },
  listItem: {
    display: 'flex',
    gap: 10,
    marginBottom: 10,
    fontSize: 14,
    color: '#334155',
    lineHeight: 1.6,
    alignItems: 'flex-start',
  },
  bullet: (color) => ({
    flexShrink: 0,
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color,
    marginTop: 8,
  }),
  exampleBox: (color) => ({
    background: `${color}08`,
    border: `1px solid ${color}25`,
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 8,
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.6,
    fontStyle: 'italic',
  }),
};

export default function DimensionModal({ dimension, onClose, triggerRef }) {
  const modalRef = useRef(null);
  const detail   = DIMENSION_DETAILS[dimension];

  // ── Focus trap + ESC close ────────────────────────────────────────────────
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    el.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = [...el.querySelectorAll(FOCUSABLE_SELECTORS)];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Return focus to the trigger element that opened the modal.
      if (triggerRef && triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, [onClose, triggerRef]);

  if (!detail) return null;

  const { color, tagline, description, whyItMatters, howToImprove, examples } = detail;

  return (
    <div
      style={s.backdrop}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dim-modal-title"
        aria-describedby="dim-modal-desc"
        style={s.modal}
        tabIndex={-1}
      >
        {/* Close button */}
        <button
          type="button"
          style={s.closeBtn}
          onClick={onClose}
          aria-label="Close dimension detail"
        >
          ✕
        </button>

        {/* Header */}
        <div style={s.header(color)}>
          <div style={s.eyebrow(color)}>
            <img
              src={detail.icon}
              alt=""
              aria-hidden="true"
              width={14}
              height={14}
              style={{ filter: 'none' }}
            />
            Resilience Dimension
          </div>
          <h2 id="dim-modal-title" style={s.title}>{dimension}</h2>
          <p style={s.tagline}>{tagline}</p>
        </div>

        {/* Body */}
        <div style={s.body}>

          {/* Description */}
          <p id="dim-modal-desc" style={s.p}>{description}</p>

          {/* Why it matters */}
          <div style={s.sectionLabel(color)}>
            <img src="/icons/info.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom' }} /> Why It Matters
          </div>
          <p style={s.p}>{whyItMatters}</p>

          {/* How to improve */}
          <div style={s.sectionLabel(color)}>
            <img src="/icons/goal.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom' }} /> How to Strengthen This Dimension
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
            {howToImprove.map((tip, i) => (
              <li key={i} style={s.listItem}>
                <span style={s.bullet(color)} aria-hidden="true" />
                {tip}
              </li>
            ))}
          </ul>

          {/* Examples */}
          <div style={s.sectionLabel(color)}>
            <img src="/icons/growth.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom' }} /> Real-World Examples
          </div>
          {examples.map((ex, i) => (
            <div key={i} style={s.exampleBox(color)}>{ex}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
