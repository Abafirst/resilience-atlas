import React, { useState, useRef } from 'react';
import ResilienceDimensionViz from './ResilienceDimensionViz.jsx';

/**
 * LaunchPostCard — Professional, shareable social media card for The Resilience Atlas™ launch.
 *
 * Props:
 *   variant — 'linkedin' (default) | 'instagram'
 *             'linkedin'  → horizontal/wide card (suitable for LinkedIn / Twitter)
 *             'instagram' → vertical story card (suitable for Instagram)
 *   onExport — optional callback when user clicks "Save as Image"
 *              receives the card DOM node so the caller can run html2canvas
 */

const BRAND = {
  navy:   '#0f2942',
  indigo: '#4F46E5',
  teal:   '#0891B2',
  green:  '#059669',
  amber:  '#D97706',
  red:    '#DC2626',
  purple: '#7C3AED',
  white:  '#ffffff',
  offWhite: '#f8fafc',
  textDark: '#0f172a',
  textMid:  '#334155',
  textLight:'#64748b',
};

const ATLAS_URL = 'https://theresilienceatlas.com';

const LINKEDIN_HASHTAGS = [
  '#ResilienceAtlas', '#ScienceMeetsPractice', '#Wellness',
  '#Leadership', '#Resilience', '#ResearchBased',
];

const INSTAGRAM_HASHTAGS = [
  '#ResilienceAtlas', '#Wellness', '#Leadership', '#Resilience',
];

const BENEFITS = [
  { icon: '/icons/cognitive-narrative.svg', text: 'Your personalized resilience profile — all six dimensions' },
  { icon: '/icons/reflection.svg',          text: 'Narrative insights grounded in 20+ years of clinical practice' },
  { icon: '/icons/compass.svg',             text: 'A visual map of your unique resilience architecture' },
  { icon: '/icons/goal.svg',                text: 'Tools to strengthen what matters most' },
];

const WHY_MATTERS = [
  { color: BRAND.indigo, text: 'Resilience is built on six interconnected dimensions — not one-size-fits-all strategies.' },
  { color: BRAND.green,  text: 'Science-backed framework from 20+ years of research and lived clinical experience.' },
  { color: BRAND.teal,   text: 'Practical, accessible tools for individuals, teams, and the next generation.' },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

function CheckItem({ color, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
      <span style={{
        flexShrink: 0,
        width: 20, height: 20,
        borderRadius: '50%',
        background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5L4.5 8L9 3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span style={{ fontSize: 13, color: BRAND.textMid, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function BenefitRow({ icon, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'rgba(79,70,229,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <img src={icon} alt="" width={18} height={18} style={{ opacity: 0.8 }} />
      </div>
      <span style={{ fontSize: 13, color: BRAND.textMid, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function Divider({ color = 'rgba(0,0,0,0.07)', my = 16 }) {
  return <div style={{ height: 1, background: color, margin: `${my}px 0` }} />;
}

// ── LinkedIn / Twitter variant ────────────────────────────────────────────────

function LinkedInCard({ cardRef }) {
  return (
    <div
      ref={cardRef}
      style={{
        width: 640,
        background: BRAND.white,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(15,41,66,0.15)',
        fontFamily: "'Inter','Segoe UI',sans-serif",
        color: BRAND.textDark,
      }}
    >
      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.navy} 0%, #1a3a5c 60%, #0f2942 100%)`,
        padding: '28px 32px 16px',
        display: 'flex',
        gap: 24,
        alignItems: 'center',
      }}>
        <div style={{ flex: '0 0 auto' }}>
          <ResilienceDimensionViz size={200} compact showLines={false} style={{ margin: 0 }} />
        </div>
        <div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(79,70,229,0.35)',
            color: '#a5b4fc',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: 4,
            marginBottom: 10,
          }}>
            Official Launch
          </div>
          <h1 style={{
            margin: '0 0 10px',
            fontSize: 22,
            fontWeight: 800,
            color: BRAND.white,
            lineHeight: 1.25,
          }}>
            The Resilience Atlas™<br />
            <span style={{ color: '#93c5fd' }}>is officially live!</span>
          </h1>
          <p style={{
            margin: 0,
            fontSize: 13,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.55,
            maxWidth: 300,
          }}>
            A research-backed framework spanning 20+ years of clinical practice — now in a free, personalized assessment.
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 32px 24px', display: 'flex', gap: 28 }}>
        {/* Left: Why it matters */}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: BRAND.textDark, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Why it matters
          </h2>
          {WHY_MATTERS.map((item, i) => (
            <CheckItem key={i} color={item.color} text={item.text} />
          ))}
        </div>

        <div style={{ width: 1, background: 'rgba(0,0,0,0.07)', flexShrink: 0 }} />

        {/* Right: What you get */}
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: BRAND.textDark, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            What you get — free
          </h2>
          {BENEFITS.map((b, i) => (
            <BenefitRow key={i} icon={b.icon} text={b.text} />
          ))}
        </div>
      </div>

      <Divider />

      {/* Launch bonus */}
      <div style={{ padding: '0 32px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          background: 'rgba(5,150,105,0.1)',
          border: '1px solid rgba(5,150,105,0.3)',
          borderRadius: 8,
          padding: '8px 14px',
          flex: 1,
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: BRAND.green }}>🌱 Launch Week Bonus</span>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: BRAND.textMid }}>
            All kids' resources are <strong>free this week</strong>. Because resilience should be accessible to everyone.
          </p>
        </div>
      </div>

      {/* CTA footer */}
      <div style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
        borderTop: '1px solid rgba(79,70,229,0.1)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: BRAND.textDark }}>
            Take the Free Assessment
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: BRAND.textLight }}>
            Discover your dimensions. Understand your capacity.
          </p>
        </div>
        <a
          href={ATLAS_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            background: `linear-gradient(135deg, ${BRAND.indigo} 0%, #7C3AED 100%)`,
            color: BRAND.white,
            fontSize: 13,
            fontWeight: 700,
            padding: '10px 20px',
            borderRadius: 8,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 12px rgba(79,70,229,0.35)',
          }}
        >
          → theresilienceatlas.com
        </a>
      </div>

      {/* Hashtag strip */}
      <div style={{
        background: BRAND.navy,
        padding: '8px 32px',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
      }}>
        {LINKEDIN_HASHTAGS.map(tag => (
          <span key={tag} style={{ fontSize: 11, color: 'rgba(165,180,252,0.8)', fontWeight: 500 }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

// ── Instagram / Story variant ─────────────────────────────────────────────────

function InstagramCard({ cardRef }) {
  return (
    <div
      ref={cardRef}
      style={{
        width: 360,
        background: `linear-gradient(180deg, ${BRAND.navy} 0%, #1a2e5a 45%, #0f2942 100%)`,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(15,41,66,0.25)',
        fontFamily: "'Inter','Segoe UI',sans-serif",
        color: BRAND.white,
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      {/* Badge */}
      <div style={{
        background: 'rgba(79,70,229,0.4)',
        color: '#a5b4fc',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '4px 12px',
        borderRadius: 20,
        marginBottom: 20,
      }}>
        Official Launch
      </div>

      {/* Constellation */}
      <ResilienceDimensionViz
        size={280}
        compact
        showLines
        style={{ margin: '0 0 4px' }}
      />

      {/* Headline */}
      <h1 style={{
        margin: '16px 0 8px',
        fontSize: 24,
        fontWeight: 800,
        color: BRAND.white,
        lineHeight: 1.2,
      }}>
        The Resilience Atlas™<br />
        <span style={{ color: '#93c5fd' }}>is officially live!</span>
      </h1>

      <p style={{
        margin: '0 0 24px',
        fontSize: 13,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.6,
        maxWidth: 280,
      }}>
        Map your six dimensions of resilience with a free personalized assessment rooted in 20+ years of research.
      </p>

      {/* 3 key points */}
      <div style={{ width: '100%', marginBottom: 24 }}>
        {WHY_MATTERS.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            marginBottom: 10, textAlign: 'left',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: item.color,
              flexShrink: 0, marginTop: 5,
            }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{item.text}</span>
          </div>
        ))}
      </div>

      {/* Launch bonus */}
      <div style={{
        width: '100%',
        background: 'rgba(5,150,105,0.2)',
        border: '1px solid rgba(5,150,105,0.4)',
        borderRadius: 10,
        padding: '10px 14px',
        marginBottom: 24,
        textAlign: 'left',
      }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#6ee7b7' }}>Launch Week Bonus</p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
          All kids' resources free this week!
        </p>
      </div>

      {/* CTA button */}
      <a
        href={ATLAS_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block',
          width: '100%',
          background: `linear-gradient(135deg, ${BRAND.indigo} 0%, #7C3AED 100%)`,
          color: BRAND.white,
          fontSize: 15,
          fontWeight: 700,
          padding: '14px 20px',
          borderRadius: 10,
          textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
          marginBottom: 16,
        }}
      >
        Take the Free Assessment
      </a>

      <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(165,180,252,0.8)', fontWeight: 500 }}>
        theresilienceatlas.com
      </p>

      {/* Hashtags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
        {INSTAGRAM_HASHTAGS.map(tag => (
          <span key={tag} style={{ fontSize: 11, color: 'rgba(165,180,252,0.7)', fontWeight: 500 }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function LaunchPostCard({ variant = 'linkedin', onExport }) {
  const cardRef = useRef(null);
  const [activeVariant, setActiveVariant] = useState(variant);

  function handleExport() {
    if (onExport && cardRef.current) {
      onExport(cardRef.current);
    }
  }

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Variant switcher */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginRight: 4 }}>Variant:</span>
        {[
          { key: 'linkedin',  label: 'LinkedIn / Twitter' },
          { key: 'instagram', label: 'Instagram Story' },
        ].map(v => (
          <button
            key={v.key}
            onClick={() => setActiveVariant(v.key)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: `2px solid ${activeVariant === v.key ? BRAND.indigo : '#e2e8f0'}`,
              background: activeVariant === v.key ? '#eef2ff' : '#fff',
              color: activeVariant === v.key ? BRAND.indigo : '#64748b',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {v.label}
          </button>
        ))}

        {onExport && (
          <button
            onClick={handleExport}
            style={{
              marginLeft: 'auto',
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: BRAND.indigo,
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M2 10v2a1 1 0 001 1h8a1 1 0 001-1v-2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Save as Image
          </button>
        )}
      </div>

      {/* Card */}
      <div style={{ display: 'inline-block' }}>
        {activeVariant === 'linkedin'
          ? <LinkedInCard cardRef={cardRef} />
          : <InstagramCard cardRef={cardRef} />
        }
      </div>
    </div>
  );
}
