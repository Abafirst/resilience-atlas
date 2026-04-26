import React, { useState, useEffect, useCallback, useRef } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import {  KIDS_DIMENSION_ICON_MAP,
  KIDS_ACTIVITIES,
  KIDS_CHARACTERS,
  KIDS_STORIES,
  KIDS_MORE_STORIES,
  KIDS_SKILL_BUILDERS,
} from '../data/kidsActivities';
import KidsGamesHub from '../components/KidsGames/KidsGamesHub';
import VideoStories from '../components/VideoStories.jsx';
import IATLASUnlockModal from '../components/IATLAS/IATLASUnlockModal.jsx';
import KidsProgressDashboard from '../components/IATLAS/Kids/KidsProgressDashboard.jsx';
import ParentDashboard from '../components/IATLAS/Kids/ParentDashboard.jsx';

const KIDS_CATEGORIES = [
  { id: 'all',        label: 'All',        icon: '/icons/compass.svg',             desc: 'Browse everything' },
  { id: 'stories',    label: 'Stories',    icon: '/icons/story.svg',               desc: 'Read resilience stories' },
  { id: 'videos',     label: 'Videos',     icon: '/icons/video.svg',               desc: 'Watch video stories' },
  { id: 'games',      label: 'Games',      icon: '/icons/game.svg',                desc: 'Play interactive games' },
  { id: 'activities', label: 'Activities', icon: '/icons/movement.svg',            desc: 'Activities by age' },
  { id: 'skills',     label: 'Skills',     icon: '/icons/agentic-generative.svg',  desc: 'Explore resilience skills' },
  { id: 'progress',   label: 'My Progress', icon: '/icons/badges.svg',             desc: 'Track your resilience journey' },
];

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

/* ── Kid-friendly subtitles for each resilience type ── */
const SKILL_SUBTITLES = {
  'Relational-Connective': 'Connector',
  'Agentic-Generative':    'Builder',
  'Spiritual-Reflective':  'Guide',
  'Emotional-Adaptive':    'Feeler',
  'Cognitive-Narrative':   'Thinker',
  'Somatic-Regulative':    'Grounder',
};

/* ── Maps a category id to the stable section anchor for that category ── */
const CATEGORY_SECTION_MAP = {
  activities: 'kids-activities',
  stories:    'kids-stories',
  videos:     'kids-videos',
  games:      'kids-games',
  skills:     'kids-skills',
  progress:   'kids-progress',
};

/* ── Richer modal content for each skill ── */
const SKILL_DETAILS = {
  'Agentic-Generative': {
    fullDesc: "Builders are the doers — they take action, set goals, and make things happen even when it feels hard. A Builder doesn't wait for permission; they find a way forward one small step at a time. You show this skill when you start a project, help solve a problem, or keep going after a mistake. Every great journey begins with one brave step.",
    tryThis: [
      { label: 'Set a Tiny Goal', href: '/kids?category=activities#kids-activities', category: 'activities', sectionId: 'kids-activities' },
      { label: 'Builder Stories', href: '/kids?category=stories#kids-stories',       category: 'stories',    sectionId: 'kids-stories'    },
      { label: 'Action Activity', href: '/kids?category=activities#kids-activities', category: 'activities', sectionId: 'kids-activities' },
    ],
  },
  'Relational-Connective': {
    fullDesc: "Connectors are warm, caring, and always notice when someone feels left out. This skill is about building real friendships, asking for help when you need it, and letting people know they matter. You use this skill when you include a new kid, check in on a friend, or tell someone how you're feeling. Connection is a superpower — it makes hard things easier.",
    tryThis: [
      { label: 'Connection Stories',   href: '/kids?category=stories#kids-stories',       category: 'stories',    sectionId: 'kids-stories'    },
      { label: 'Friendship Activities', href: '/kids?category=activities#kids-activities', category: 'activities', sectionId: 'kids-activities' },
    ],
  },
  'Spiritual-Reflective': {
    fullDesc: "Guides are the deep thinkers who ask big questions: Why am I here? What really matters? What do I believe? This skill helps you find meaning in tough times and stay true to your values. You use it when you reflect on a hard day, help others figure out what's important, or feel connected to something bigger than yourself. Guides light the way for others.",
    tryThis: [
      { label: 'Reflection Activities', href: '/kids?category=activities#kids-activities', category: 'activities', sectionId: 'kids-activities' },
      { label: 'Values Builder',        href: '/kids?category=skills#kids-skills',         category: 'skills',     sectionId: 'kids-skills'     },
    ],
  },
  'Emotional-Adaptive': {
    fullDesc: "Feelers are in tune with their emotions — and the emotions of the people around them. This skill is about naming feelings, riding the waves of big emotions, and bouncing back after hard moments. You use it when you notice you're scared or sad, take a breath before reacting, or support a friend who's upset. Feeling your feelings (all of them) is a real strength.",
    tryThis: [
      { label: 'Emotion Activities', href: '/kids?category=activities#kids-activities', category: 'activities', sectionId: 'kids-activities' },
      { label: 'Feeler Stories',     href: '/kids?category=stories#kids-stories',       category: 'stories',    sectionId: 'kids-stories'    },
    ],
  },
  'Somatic-Regulative': {
    fullDesc: "Grounders know that your body holds wisdom. This skill is about listening to your body — noticing tension, using breath and movement to calm down, and building steady habits that help you feel safe. You use it when you take slow breaths before a test, go for a walk when you're upset, or get enough sleep so you can face the day. Your body is your first home.",
    tryThis: [
      { label: 'Body Activities',   href: '/kids?category=activities#kids-activities', category: 'activities', sectionId: 'kids-activities' },
      { label: 'Grounder Stories',  href: '/kids?category=stories#kids-stories',       category: 'stories',    sectionId: 'kids-stories'    },
    ],
  },
  'Cognitive-Narrative': {
    fullDesc: "Thinkers are story-changers — they notice the stories they tell about themselves and choose to rewrite the unhelpful ones. This skill is about seeing challenges as chances to grow, catching negative self-talk, and building a growth mindset. You use it when you say 'I can't do this yet' instead of 'I can't do this', or when you see a hard situation from a new angle. Your mind is a powerful tool.",
    tryThis: [
      { label: 'Mindset Activities', href: '/kids?category=activities#kids-activities', category: 'activities', sectionId: 'kids-activities' },
      { label: 'Thinker Stories',    href: '/kids?category=stories#kids-stories',       category: 'stories',    sectionId: 'kids-stories'    },
    ],
  },
};

/* ── Skill Modal ── */
function SkillModal({ skill, onClose, onTryThis }) {
  const modalRef = useRef(null);
  const subtitle = SKILL_SUBTITLES[skill.name] || skill.name;
  const details  = SKILL_DETAILS[skill.name] || {};

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    // Move focus into the modal
    if (modalRef.current) modalRef.current.focus();
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="story-modal skill-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="skill-modal-title"
      onClick={handleBackdropClick}
    >
      <div
        className="story-modal-inner skill-modal-inner"
        ref={modalRef}
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <button className="story-modal-close" onClick={onClose} aria-label="Close">&#x2715;</button>

        {/* Icon + title + subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 4, paddingRight: '2.5rem' }}>
          <img
            src={KIDS_DIMENSION_ICON_MAP[skill.name]}
            alt=""
            aria-hidden="true"
            className="icon"
            style={{ width: 40, height: 40, flexShrink: 0 }}
          />
          <div>
            <p className="story-modal-title" id="skill-modal-title" style={{ margin: 0 }}>{subtitle}</p>
            <p style={{ margin: 0, fontSize: '.82rem', fontWeight: 600, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {skill.name}
            </p>
          </div>
        </div>

        <span className="skill-card-tag" style={{ marginBottom: '1.25rem', display: 'inline-block' }}>{skill.tag}</span>

        {/* Full description */}
        <div className="story-modal-body" style={{ marginBottom: details.tryThis ? '1.25rem' : 0 }}>
          <p>{details.fullDesc || skill.desc}</p>
        </div>

        {/* Try this suggestions */}
        {details.tryThis && details.tryThis.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
            <p style={{ margin: '0 0 .6rem', fontSize: '.8rem', fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Try this
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
              {details.tryThis.map((item) => (
                <button
                  key={item.label}
                  onClick={() => onTryThis(item)}
                  className="skill-modal-try-btn"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


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

/* ── Category Nav (tabs/segmented control) ── */
function CategoryNav({ active, onChange }) {
  const navRef = useRef(null);

  // Scroll active tab into view on mobile
  useEffect(() => {
    if (!navRef.current) return;
    const activeBtn = navRef.current.querySelector('[aria-selected="true"]');
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    }
  }, [active]);

  return (
    <nav className="kids-category-nav" aria-label="Browse content by category">
      <div className="kids-category-nav-inner" ref={navRef} role="tablist">
        {KIDS_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`kids-cat-tab${active === cat.id ? ' active' : ''}`}
            role="tab"
            aria-selected={active === cat.id}
            onClick={() => onChange(cat.id)}
          >
            <span className="kids-cat-icon" aria-hidden="true">
              <img
                src={cat.icon}
                alt=""
                width={22}
                height={22}
                onError={e => { e.currentTarget.src = '/icons/compass.svg'; e.currentTarget.onerror = null; }}
              />
            </span>
            <span className="kids-cat-label">{cat.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

/* Helper: should section be visible? */
function show(activeCategory, ...ids) {
  return activeCategory === 'all' || ids.includes(activeCategory);
}

export default function KidsPage() {
  const [selectedAge, setSelectedAge] = useState('age-5-7');
  const [activeStory, setActiveStory] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSkill, setActiveSkill] = useState(null);
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [showActivitiesModal, setShowActivitiesModal] = useState(false);
  const [showParentZone, setShowParentZone] = useState(false);
  const closeStory = useCallback(() => setActiveStory(null), []);
  const closeSkill = useCallback(() => setActiveSkill(null), []);

  const handleCategoryChange = useCallback((id) => {
    setActiveCategory(id);
    // After React re-renders the newly visible section, scroll it into view.
    // A single rAF is enough for the layout to settle before scrolling.
    if (id !== 'all') {
      requestAnimationFrame(() => {
        const sectionId = CATEGORY_SECTION_MAP[id] || 'kids-content-area';
        const el = document.getElementById(sectionId) || document.getElementById('kids-content-area');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  const handleTryThis = useCallback((item) => {
    // 1) Close the modal
    setActiveSkill(null);
    // 2) Switch to the target category
    const category = item.category || 'all';
    setActiveCategory(category);
    // 3) After React renders the newly visible section, scroll to the specific anchor
    requestAnimationFrame(() => {
      const sectionId = item.sectionId || CATEGORY_SECTION_MAP[category] || 'kids-content-area';
      const el = document.getElementById(sectionId) || document.getElementById('kids-content-area');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useEffect(() => {
    document.title = 'Kids & Teen Resilience Program — The Resilience Atlas™';
  }, []);

  return (
    <>
      {activeStory && <StoryModal story={activeStory} onClose={closeStory} />}
      {activeSkill && <SkillModal skill={activeSkill} onClose={closeSkill} onTryThis={handleTryThis} />}
      {showGamesModal && (
        <IATLASUnlockModal
          variant="kids"
          onClose={() => setShowGamesModal(false)}
        />
      )}
      {showActivitiesModal && (
        <IATLASUnlockModal
          variant="kids"
          onClose={() => setShowActivitiesModal(false)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <SiteHeader activePage="kids" />
      <DarkModeHint />

      {/* Hero */}
      <section className="kids-hero" aria-labelledby="kids-heading">
        <h1 id="kids-heading">Build Resilience Together</h1>
        <p>
          Resilience isn&rsquo;t about being tough. It&rsquo;s about understanding yourself, knowing your
          strengths, and having people who get it. Activities and stories for ages 5–18+.
        </p>
        <div className="kids-hero-buttons">
          <a href="/quiz" className="btn-cta" title="For adults 18+">Discover Your Dimensions <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span></a>
          <button
            className="btn-cta-secondary"
            onClick={() => handleCategoryChange('progress')}
            aria-label="Go to My Progress dashboard"
          >
            My Progress
          </button>
        </div>
      </section>

      {/* ── Category Navigation ─────────────────────────────────────────── */}
      <CategoryNav active={activeCategory} onChange={handleCategoryChange} />

      {/* ── Content sections (filtered by active category) ─────────────── */}
      <div id="kids-content-area">

        {/* Six Skills */}
        {show(activeCategory, 'skills') && (
          <section className="skills-section" id="skills" aria-labelledby="skills-heading">
            <div className="section-header">
              <span className="section-label">The Six Resilience Dimensions</span>
              <h2 id="skills-heading">Your Resilience Looks Different from Everyone Else&rsquo;s</h2>
              <p>That&rsquo;s not a problem&mdash;it&rsquo;s the point. Each dimension shows up in everyday situations young people actually face. Tap a card to learn more.</p>
            </div>
            <div className="skills-grid">
              {SKILLS.map(skill => (
                <button
                  key={skill.name}
                  className="skill-card skill-card-btn"
                  onClick={() => setActiveSkill(skill)}
                  aria-label={`Learn more about ${SKILL_SUBTITLES[skill.name] || skill.name} — ${skill.name}`}
                >
                  <div className="skill-icon">
                    <img src={KIDS_DIMENSION_ICON_MAP[skill.name]} alt="" aria-hidden="true" className="icon icon-md" />
                  </div>
                  <div className="skill-card-name">{skill.name}</div>
                  <div className="skill-card-subtitle">{SKILL_SUBTITLES[skill.name]}</div>
                  <span className="skill-card-tag">{skill.tag}</span>
                  <p>{skill.desc}</p>
                  <span className="skill-card-cta" aria-hidden="true">Learn more</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Characters */}
        {show(activeCategory, 'skills') && (
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
        )}

        {/* Stories */}
        {show(activeCategory, 'stories') && (
          <section className="stories-section kids-scroll-anchor" id="kids-stories" aria-labelledby="stories-heading">
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
        )}

        {/* More Stories */}
        {show(activeCategory, 'stories') && (
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
        )}

        {/* Video Stories */}
        {show(activeCategory, 'videos') && (
          <div id="kids-videos" className="kids-scroll-anchor">
            <VideoStories />
          </div>
        )}

        {/* Skill Builders */}
        {show(activeCategory, 'skills') && (
          <section className="skill-builders-section kids-scroll-anchor" id="kids-skills" aria-labelledby="skill-builders-heading">
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
        )}

        {/* Interactive Games Hub */}
        {show(activeCategory, 'games') && (
          <section className="games-section kids-scroll-anchor" id="kids-games" aria-labelledby="games-heading">
            <div className="section-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <span className="section-label">Play &amp; Discover</span>
              <h2 id="games-heading">Interactive Discovery Games</h2>
              <p style={{ color: 'var(--slate-600)', maxWidth: '560px', margin: '.75rem auto 0' }}>
                Not lessons. Discovery. Games that help young people explore their resilience map, earn badges for what they learn, and find out their version is valid.
              </p>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{ filter: 'blur(2px)', pointerEvents: 'none', userSelect: 'none' }} aria-hidden="true">
                <KidsGamesHub />
              </div>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.8)',
                borderRadius: '16px',
              }}>
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }} aria-hidden="true">🎮</div>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    Interactive Games
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.25rem 0 1rem' }}>
                    Available with IATLAS Individual ($19.99/mo) or higher
                  </p>
                  <button
                    onClick={() => setShowGamesModal(true)}
                    className="iatlas-btn-primary"
                    style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.6rem 1.25rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                  >
                    Get IATLAS Access
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Age-group activities */}
        {show(activeCategory, 'activities') && (
          <section className="activity-guides-section kids-scroll-anchor" id="kids-activities" aria-labelledby="activity-guides-heading">
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
                    onClick={() => setShowActivitiesModal(true)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} aria-hidden="true">📚</div>
                <p style={{ fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem' }}>Age-Specific Activities</p>
                <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem' }}>Select an age group above to see activities — available with any IATLAS plan.</p>
                <button
                  onClick={() => setShowActivitiesModal(true)}
                  style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: '10px', padding: '0.65rem 1.4rem', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}
                >
                  Get IATLAS Access
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── My Progress Dashboard ── */}
        {show(activeCategory, 'progress') && (
          <section
            className="kids-scroll-anchor"
            id="kids-progress"
            aria-labelledby="progress-heading"
            style={{ paddingTop: '1.5rem' }}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '0 1.25rem' }}>
              <span className="section-label">Your Resilience Journey</span>
              <h2 id="progress-heading" style={{ margin: '.5rem 0 .4rem' }}>My Progress</h2>
              <p style={{ color: 'var(--slate-600)', maxWidth: '520px', margin: '0 auto' }}>
                Track your stars, badges, streaks, and adventures as you build resilience.
              </p>
            </div>
            {showParentZone ? (
              <ParentDashboard onBack={() => setShowParentZone(false)} />
            ) : (
              <KidsProgressDashboard onParentZone={() => setShowParentZone(true)} />
            )}
          </section>
        )}

      </div>
    </>
  );
}
