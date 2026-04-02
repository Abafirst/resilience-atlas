import React, { useState, useEffect, useCallback } from 'react';
import {
  KIDS_DIMENSION_ICON_MAP,
  KIDS_ACTIVITIES,
  KIDS_CHARACTERS,
  KIDS_STORIES,
  KIDS_MORE_STORIES,
  KIDS_SKILL_BUILDERS,
} from '../data/kidsActivities';
import KidsGamesHub from '../components/KidsGames/KidsGamesHub';

const AGE_GROUPS = [
  { id: 'age-5-7',    label: 'Ages 5–7' },
  { id: 'age-8-10',   label: 'Ages 8–10' },
  { id: 'age-11-14',  label: 'Ages 11–14' },
  { id: 'age-15-18',  label: 'Ages 15–18' },
  { id: 'age-18plus', label: '18+' },
];

const SKILLS = [
  { name: 'Agentic-Generative',   tag: 'Ages 8+',   desc: 'Building purpose, initiative, and the drive to create positive change.' },
  { name: 'Relational-Connective', tag: 'All Ages',  desc: 'Nurturing healthy friendships, empathy, and community belonging.' },
  { name: 'Spiritual-Reflective',  tag: 'Ages 10+',  desc: 'Exploring meaning, values, and a sense of something bigger than oneself.' },
  { name: 'Emotional-Adaptive',    tag: 'All Ages',  desc: 'Recognizing feelings, managing emotions, and bouncing back from setbacks.' },
  { name: 'Somatic-Regulative',    tag: 'All Ages',  desc: 'Connecting body and mind through breath, movement, and rest.' },
  { name: 'Cognitive-Narrative',   tag: 'Ages 6+',   desc: 'Reframing stories, building growth mindset, and shaping personal identity.' },
];

/* ── SkillBuilder: reflection panel (textarea fields) ── */
function ReflectionBuilder({ builder }) {
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState({});
  return (
    <div className="skill-builder-card">
      <div className="sb-icon" aria-hidden="true"><img src={builder.icon} alt="" className="icon icon-md" /></div>
      <div className="sb-name">{builder.name}</div>
      <span className="sb-tag" style={{ background: builder.tagBg, color: builder.tagColor }}>{builder.tag}</span>
      <p className="sb-desc">{builder.desc}</p>
      <button
        className="activity-toggle"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        {open ? 'Close Activity' : 'Start Activity'}
      </button>
      {open && (
        <div className="activity-panel">
          {builder.fields.map(f => (
            <div key={f.id} className="reflection-group">
              <label className="reflection-label" htmlFor={f.id}>{f.label}</label>
              <textarea
                className="reflection-input"
                id={f.id}
                rows={2}
                value={vals[f.id] || ''}
                onChange={e => setVals(v => ({ ...v, [f.id]: e.target.value }))}
              />
            </div>
          ))}
          <p style={{ margin: '.75rem 0 0', fontSize: '.82rem', color: builder.quoteColor, fontWeight: 600 }}>{builder.quote}</p>
        </div>
      )}
    </div>
  );
}

/* ── SkillBuilder: emotions picker ── */
function EmotionsBuilder({ builder }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  return (
    <div className="skill-builder-card">
      <div className="sb-icon" aria-hidden="true"><img src={builder.icon} alt="" className="icon icon-md" /></div>
      <div className="sb-name">{builder.name}</div>
      <span className="sb-tag" style={{ background: builder.tagBg, color: builder.tagColor }}>{builder.tag}</span>
      <p className="sb-desc">{builder.desc}</p>
      <button className="activity-toggle" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        {open ? 'Close Activity' : 'Find My Feeling'}
      </button>
      {open && (
        <div className="activity-panel">
          <p style={{ margin: '0 0 .5rem', fontWeight: 600 }}>How are you feeling right now?</p>
          <div className="emotion-grid" role="group" aria-label="Emotion choices">
            {builder.emotions.map(em => (
              <button
                key={em}
                className={`emotion-btn${selected === em.toLowerCase() ? ' selected' : ''}`}
                onClick={() => setSelected(em.toLowerCase())}
              >
                {em}
              </button>
            ))}
          </div>
          {selected && (
            <div className="emotion-prompt" aria-live="polite">
              <p style={{ margin: '.5rem 0 0', fontSize: '.9rem', color: '#1e293b', lineHeight: 1.55 }}>{builder.prompts[selected]}</p>
            </div>
          )}
          <p style={{ margin: '.75rem 0 0', fontSize: '.82rem', color: builder.quoteColor, fontWeight: 600 }}>{builder.quote}</p>
        </div>
      )}
    </div>
  );
}

/* ── SkillBuilder: values picker ── */
function ValuesBuilder({ builder }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const toggle = v => setSelected(prev =>
    prev.includes(v) ? prev.filter(x => x !== v) : prev.length < 3 ? [...prev, v] : prev
  );
  return (
    <div className="skill-builder-card">
      <div className="sb-icon" aria-hidden="true"><img src={builder.icon} alt="" className="icon icon-md" /></div>
      <div className="sb-name">{builder.name}</div>
      <span className="sb-tag" style={{ background: builder.tagBg, color: builder.tagColor }}>{builder.tag}</span>
      <p className="sb-desc">{builder.desc}</p>
      <button className="activity-toggle" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        {open ? 'Close Activity' : 'Find My Values'}
      </button>
      {open && (
        <div className="activity-panel">
          <p style={{ margin: '0 0 .5rem', fontSize: '.82rem', color: 'var(--slate-600)' }}>Pick up to 3 things that matter most to you:</p>
          <div className="value-grid" role="group" aria-label="Values choices">
            {builder.values.map(v => (
              <button
                key={v}
                className={`value-chip${selected.includes(v) ? ' selected' : ''}`}
                onClick={() => toggle(v)}
                aria-pressed={selected.includes(v)}
              >
                {v}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="value-result" aria-live="polite">
              <p style={{ margin: '.5rem 0 0', fontSize: '.9rem', color: '#1e293b' }}>
                Your values: <strong>{selected.join(', ')}</strong>. These are your compass — return to them when things get hard.
              </p>
            </div>
          )}
          <p style={{ margin: '.75rem 0 0', fontSize: '.82rem', color: builder.quoteColor, fontWeight: 600 }}>{builder.quote}</p>
        </div>
      )}
    </div>
  );
}

function SkillBuilderCard({ builder }) {
  if (builder.type === 'emotions') return <EmotionsBuilder builder={builder} />;
  if (builder.type === 'values') return <ValuesBuilder builder={builder} />;
  return <ReflectionBuilder builder={builder} />;
}

/* ── Story Modal ── */
function StoryModal({ story, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="story-modal" role="dialog" aria-modal="true" aria-labelledby="story-modal-title" onClick={handleBackdropClick}>
      <div className="story-modal-inner">
        <button className="story-modal-close" onClick={onClose} aria-label="Close story">&#x2715;</button>
        <p className="story-modal-title" id="story-modal-title">{story.title}</p>
        <p className="story-modal-meta">{story.meta}</p>
        <div className="story-modal-body">
          {story.body.map((para, i) => <p key={i}>{para}</p>)}
        </div>
        <div className="story-lesson">{story.lesson}</div>
      </div>
    </div>
  );
}

export default function KidsPage() {
  const [selectedAge, setSelectedAge] = useState('age-5-7');
  const [activeStory, setActiveStory] = useState(null);
  const closeStory = useCallback(() => setActiveStory(null), []);

  useEffect(() => {
    document.title = 'Kids & Teen Resilience Program — The Resilience Atlas™';
  }, []);

  return (
    <>
      {activeStory && <StoryModal story={activeStory} onClose={closeStory} />}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="site-header" role="banner">
        <div className="header-inner">
          <a className="logo" href="/">
            <div className="logo-icon" aria-hidden="true">
              <img src="/assets/compass-icon.svg" alt="The Resilience Atlas™" width="36" height="36" />
            </div>
            The Resilience Atlas&#8482;
          </a>
          <nav className="header-nav" aria-label="Main navigation">
            <a href="/" className="nav-link">Home</a>
            <a href="/assessment" className="nav-link">Assessment</a>
            <a href="/research" className="nav-link">Research</a>
            <a href="/teams" className="nav-link">Teams</a>
            <a href="/kids" className="nav-link active">Kids</a>
            <a href="/about" className="nav-link">About</a>
            <button className="theme-toggle" aria-label="Switch to dark mode" aria-pressed="false" title="Toggle dark mode"></button>
            <a className="btn btn-primary" href="/quiz">Take the Assessment</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="kids-hero" aria-labelledby="kids-heading">
        <h1 id="kids-heading">Build Resilience Together</h1>
        <p>
          Resilience isn&rsquo;t about being tough. It&rsquo;s about understanding yourself, knowing your
          strengths, and having people who get it. Activities and stories for ages 5–18+.
        </p>
        <a href="/quiz" className="btn-cta">Discover Your Dimensions</a>
      </section>

      {/* Six Skills */}
      <section className="skills-section" id="skills" aria-labelledby="skills-heading">
        <div className="section-header">
          <span className="section-label">The Six Resilience Dimensions</span>
          <h2 id="skills-heading">Your Resilience Looks Different from Everyone Else&rsquo;s</h2>
          <p>That&rsquo;s not a problem&mdash;it&rsquo;s the point. Each dimension shows up in everyday situations young people actually face.</p>
        </div>
        <div className="skills-grid">
          {SKILLS.map(skill => (
            <article key={skill.name} className="skill-card">
              <div className="skill-icon">
                <img src={KIDS_DIMENSION_ICON_MAP[skill.name]} alt="" aria-hidden="true" className="icon icon-md" />
              </div>
              <div className="skill-card-name">{skill.name}</div>
              <span className="skill-card-tag">{skill.tag}</span>
              <p>{skill.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Characters */}
      <section className="characters-section" aria-labelledby="characters-heading">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="section-label">Meet the Guides</span>
          <h2 id="characters-heading">Your Six Resilience Guides</h2>
          <p style={{ color: 'var(--slate-600)', maxWidth: '560px', margin: '.75rem auto 0' }}>
            Each character represents one resilience dimension. They&rsquo;re here to help young people discover their own strengths&mdash;and to show that resilience looks different for everyone.
          </p>
        </div>
        <div className="character-grid">
          {KIDS_CHARACTERS.map(char => (
            <article key={char.name} className="character-card" aria-label={`${char.name} character`}>
              <div className="character-avatar" style={{ background: char.avatarBg }} aria-hidden="true">
                <img src={char.icon} alt="" className="icon icon-md" />
              </div>
              <div>
                <h3 className="character-name">{char.name}</h3>
                <p className="character-title">{char.title}</p>
              </div>
              <span className="character-skill-tag" style={{ background: char.tagBg, color: char.tagColor }}>{char.dimension}</span>
              <p className="character-desc">{char.desc}</p>
              <p className="character-skill"><strong>Resilience Skill:</strong> {char.skill}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Stories */}
      <section className="stories-section" id="stories" aria-labelledby="stories-heading">
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-label">Resilience Stories</span>
            <h2 id="stories-heading">Read a Story</h2>
            <p style={{ color: 'var(--slate-600)', maxWidth: '560px', margin: '.75rem auto 0' }}>
              Each character faces a real challenge and uses their resilience skill to find a way through. Ages 5–14.
            </p>
          </div>
          <div className="story-grid">
            {KIDS_STORIES.map(story => (
              <div key={story.title} className="story-card">
                <div className="story-icon" aria-hidden="true"><img src={story.icon} alt="" className="icon icon-sm" /></div>
                <p className="story-subtitle">{story.subtitle}</p>
                <h3 className="story-title">{story.title}</h3>
                <p className="story-preview">{story.preview}</p>
                <button
                  className="btn-story"
                  onClick={() => setActiveStory(story)}
                  aria-label={`Read ${story.title}`}
                >
                  Read Story &#8594;
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* More Stories */}
      <section className="stories-section" id="more-stories" aria-labelledby="more-stories-heading" style={{ background: '#fff' }}>
        <div className="section-inner">
          <div className="section-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-label">More Stories</span>
            <h2 id="more-stories-heading">More Resilience Stories</h2>
            <p style={{ color: 'var(--slate-600)', maxWidth: '560px', margin: '.75rem auto 0' }}>
              Every character is different. Every challenge is real. Every lesson builds resilience.
            </p>
          </div>
          <div className="story-grid">
            {KIDS_MORE_STORIES.map(story => (
              <div key={story.title} className="story-card">
                <div className="story-icon" aria-hidden="true"><img src={story.icon} alt="" className="icon icon-sm" /></div>
                <p className="story-subtitle">{story.subtitle}</p>
                <h3 className="story-title">{story.title}</h3>
                <p className="story-preview">{story.preview}</p>
                <button
                  className="btn-story"
                  onClick={() => setActiveStory(story)}
                  aria-label={`Read ${story.title}`}
                >
                  Read Story &#8594;
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Skill Builders */}
      <section className="skill-builders-section" id="skill-builders" aria-labelledby="skill-builders-heading">
        <div className="section-header">
          <span className="section-label">Skills Library</span>
          <h2 id="skill-builders-heading">Try a Skill Builder</h2>
          <p style={{ color: 'var(--slate-600)', maxWidth: '560px', margin: '.75rem auto 0' }}>
            Each activity is a simple exercise you can do right now to practice one resilience skill. Click to get started.
          </p>
        </div>
        <div className="skill-builder-grid">
          {KIDS_SKILL_BUILDERS.map(builder => (
            <SkillBuilderCard key={builder.name} builder={builder} />
          ))}
        </div>
      </section>

      {/* Interactive Games Hub */}
      <section className="games-section" id="games" aria-labelledby="games-heading">
        <div className="section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="section-label">Play &amp; Discover</span>
          <h2 id="games-heading">Interactive Discovery Games</h2>
          <p style={{ color: 'var(--slate-600)', maxWidth: '560px', margin: '.75rem auto 0' }}>
            Not lessons. Discovery. Games that help young people explore their resilience map, earn badges for what they learn, and find out their version is valid.
          </p>
        </div>
        <KidsGamesHub />
      </section>

      {/* Age-group activities */}
      <section className="activity-guides-section" id="activity-guides" aria-labelledby="activity-guides-heading">
        <div className="section-inner">
          <div className="section-header">
            <span className="section-label">Activity Guides</span>
            <h2 id="activity-guides-heading">Activities by Age</h2>
            <p>Developmentally matched activities for every stage.</p>
          </div>

          <div className="age-tabs" role="tablist" aria-label="Age group activities">
            {AGE_GROUPS.map(({ id, label }) => (
              <button
                key={id}
                className="age-tab"
                role="tab"
                data-group={id}
                aria-selected={selectedAge === id}
                onClick={() => setSelectedAge(id)}
              >
                {label}
              </button>
            ))}
          </div>

          {AGE_GROUPS.filter(g => g.id !== 'age-18plus').map(({ id }) => (
            <div
              key={id}
              id={id}
              className={selectedAge === id ? 'age-content active' : 'age-content'}
              hidden={selectedAge !== id}
            >
              <ul className="activity-list">
                {(KIDS_ACTIVITIES[id] || []).map(activity => (
                  <li key={activity.title} className="activity-item">
                    <div className="activity-item-title">
                      {activity.icon && (
                        <img src={activity.icon} alt="" aria-hidden="true" width="20" height="20" style={{ verticalAlign: 'middle', marginRight: '0.4em' }} />
                      )}
                      {activity.title}
                    </div>
                    {activity.subtype && (
                      <div className="activity-item-subtype">{activity.subtype}</div>
                    )}
                    <div className="activity-item-desc">{activity.desc}</div>
                    <div className="activity-item-meta">
                      <span className="activity-meta-tag">{activity.time}</span>
                      <span className={`activity-meta-tag ${activity.level}`}>{activity.level.charAt(0).toUpperCase() + activity.level.slice(1)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {selectedAge === 'age-18plus' && (
            <div className="age-18plus-panel">
              <div className="dimension-pills">
                {['Agentic', 'Relational', 'Spiritual', 'Emotional', 'Somatic', 'Cognitive'].map(d => (
                  <span key={d} className="dim-pill">{d}</span>
                ))}
              </div>
              <h3>Ready for the Full Assessment?</h3>
              <p>Take the complete Resilience Atlas assessment and get your personalised report across all six dimensions.</p>
              <a href="/quiz" className="btn-cta">Take the Assessment</a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
