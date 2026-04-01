import React, { useEffect } from 'react';

// [DEBUG] KidsPage: top-level module loaded
console.log('[DEBUG][KidsPage] Module loaded');

export default function KidsPage() {
  // [DEBUG] confirm component is mounting
  console.log('[DEBUG][KidsPage] Component rendering');

  useEffect(() => {
    console.log('[DEBUG][KidsPage] Mounted successfully');
    document.title = 'Kids & Teen Resilience Program — The Resilience Atlas™';
  }, []);

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh', background: '#fff' }}>
      {/* DEBUG BANNER — visible confirmation the route is working */}
      <div style={{
        background: '#7c3aed',
        color: '#fff',
        padding: '0.5rem 1.5rem',
        fontSize: '0.8rem',
        textAlign: 'center',
      }}>
        [DEBUG] /kids route is mounted and rendering — React component active
      </div>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #4F46E5 60%, #0f2942 100%)',
        color: '#fff',
        padding: '5rem 1.5rem 4rem',
        textAlign: 'center',
      }}>
        <h1 style={{ color: '#fff', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: '0.75rem' }}>
          Resilience Grows With You
        </h1>
        <p style={{ color: '#ddd6fe', fontSize: '1.05rem', maxWidth: 600, margin: '0 auto 2.5rem', lineHeight: 1.65 }}>
          A developmentally appropriate program for ages 5–18+. Activities, stories, and
          skills mapped to the Six Dimensions of Resilience.
        </p>
        <a
          href="/quiz"
          style={{
            display: 'inline-block',
            background: '#fff',
            color: '#4F46E5',
            fontWeight: 700,
            padding: '0.85rem 2rem',
            borderRadius: 999,
            textDecoration: 'none',
            fontSize: '1rem',
          }}
        >
          Take the Assessment
        </a>
      </div>

      {/* Skills */}
      <div style={{ maxWidth: 1040, margin: '4rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)' }}>Six Skills for Life</h2>
          <p style={{ color: '#64748b', maxWidth: 560, margin: '0 auto' }}>
            Each dimension of resilience maps to everyday situations kids and teens face.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {[
            { emoji: '🧭', name: 'Agentic-Generative', tag: 'Ages 8+', desc: 'Building purpose, initiative, and the drive to create positive change.' },
            { emoji: '🤝', name: 'Relational-Connective', tag: 'All Ages', desc: 'Nurturing healthy friendships, empathy, and community belonging.' },
            { emoji: '🌟', name: 'Spiritual-Reflective', tag: 'Ages 10+', desc: 'Exploring meaning, values, and a sense of something bigger than oneself.' },
            { emoji: '💙', name: 'Emotional-Adaptive', tag: 'All Ages', desc: 'Recognising feelings, managing emotions, and bouncing back from setbacks.' },
            { emoji: '🧘', name: 'Somatic-Regulative', tag: 'All Ages', desc: 'Connecting body and mind through breath, movement, and rest.' },
            { emoji: '📖', name: 'Cognitive-Narrative', tag: 'Ages 6+', desc: 'Reframing stories, building growth mindset, and shaping personal identity.' },
          ].map(skill => (
            <div key={skill.name} style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 16,
              padding: '1.75rem',
              boxShadow: '0 1px 3px rgba(0,0,0,.06)',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{skill.emoji}</div>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.3rem' }}>{skill.name}</div>
              <span style={{
                display: 'inline-block',
                background: '#ede9fe',
                color: '#5b21b6',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.2rem 0.65rem',
                borderRadius: 999,
                marginBottom: '0.75rem',
              }}>{skill.tag}</span>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>{skill.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        background: '#4F46E5',
        color: '#fff',
        padding: '4rem 1.5rem',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', marginBottom: '1rem' }}>
          Start the Journey
        </h2>
        <p style={{ color: 'rgba(255,255,255,.8)', maxWidth: 540, margin: '0 auto 2rem', lineHeight: 1.65 }}>
          Take the Resilience Atlas assessment to discover your child's strengths and
          get a personalised roadmap for growth.
        </p>
        <a
          href="/quiz"
          style={{
            display: 'inline-block',
            background: '#fff',
            color: '#4F46E5',
            fontWeight: 700,
            padding: '0.85rem 2rem',
            borderRadius: 999,
            textDecoration: 'none',
            fontSize: '1rem',
          }}
        >
          Begin Assessment
        </a>
      </div>
    </div>
  );
}
