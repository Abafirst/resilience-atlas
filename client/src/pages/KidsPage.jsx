import React, { useState, useEffect } from 'react';

const AGE_GROUPS = [
  { id: 'age-5-7',    label: 'Ages 5–7' },
  { id: 'age-8-10',   label: 'Ages 8–10' },
  { id: 'age-11-14',  label: 'Ages 11–14' },
  { id: 'age-15-18',  label: 'Ages 15–18' },
  { id: 'age-18plus', label: '18+' },
];

const ACTIVITIES = {
  'age-5-7': [
    { title: 'Feelings Weather Report', desc: 'Draw your feelings as weather — sunny, cloudy, or stormy — and talk about what made the weather change.', time: '10 min', level: 'beginner' },
    { title: 'Kindness Scavenger Hunt', desc: 'Find three ways to be kind to someone today and share what happened.', time: '15 min', level: 'beginner' },
    { title: 'Belly Breathing Buddy', desc: 'Place a stuffed animal on your tummy and breathe deeply to make it rise and fall.', time: '5 min', level: 'beginner' },
  ],
  'age-8-10': [
    { title: 'Reframe the Story', desc: 'Take something that went wrong this week and write two different endings — one where you learned something, one where you helped someone.', time: '15 min', level: 'beginner' },
    { title: 'Gratitude Map', desc: "Draw a map of your day and mark three moments you're grateful for with a star.", time: '10 min', level: 'beginner' },
    { title: 'Body Scan Check-In', desc: 'Close your eyes and slowly notice each part of your body from head to toe, noting any tension.', time: '8 min', level: 'intermediate' },
  ],
  'age-11-14': [
    { title: 'Values Compass', desc: 'List five things that matter most to you. Then reflect: did your choices this week point toward those values?', time: '20 min', level: 'intermediate' },
    { title: 'Stress Audit', desc: 'Track your stress triggers for three days, then identify one pattern and a coping strategy.', time: '3 days', level: 'intermediate' },
    { title: 'Peer Connection Challenge', desc: "Reach out to someone you haven't talked to in a while with a genuine compliment or question.", time: '15 min', level: 'beginner' },
  ],
  'age-15-18': [
    { title: 'Identity Narrative', desc: 'Write 300 words about a challenge you overcame and how it shaped who you are today.', time: '30 min', level: 'intermediate' },
    { title: 'Future Self Letter', desc: 'Write a letter from your 30-year-old self back to the person you are now — what wisdom would you share?', time: '25 min', level: 'advanced' },
    { title: 'Mindful Social Media Audit', desc: 'Track how you feel before and after using social media for one week. What patterns do you notice?', time: '1 week', level: 'intermediate' },
  ],
};

const SKILLS = [
  { emoji: '🧭', name: 'Agentic-Generative',   tag: 'Ages 8+',   desc: 'Building purpose, initiative, and the drive to create positive change.' },
  { emoji: '🤝', name: 'Relational-Connective', tag: 'All Ages',  desc: 'Nurturing healthy friendships, empathy, and community belonging.' },
  { emoji: '🌟', name: 'Spiritual-Reflective',  tag: 'Ages 10+',  desc: 'Exploring meaning, values, and a sense of something bigger than oneself.' },
  { emoji: '💙', name: 'Emotional-Adaptive',    tag: 'All Ages',  desc: 'Recognizing feelings, managing emotions, and bouncing back from setbacks.' },
  { emoji: '🧘', name: 'Somatic-Regulative',    tag: 'All Ages',  desc: 'Connecting body and mind through breath, movement, and rest.' },
  { emoji: '📖', name: 'Cognitive-Narrative',   tag: 'Ages 6+',   desc: 'Reframing stories, building growth mindset, and shaping personal identity.' },
];

export default function KidsPage() {
  const [selectedAge, setSelectedAge] = useState('age-5-7');

  useEffect(() => {
    document.title = 'Kids & Teen Resilience Program — The Resilience Atlas™';
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="kids-hero" aria-labelledby="kids-heading">
        <h1 id="kids-heading">Resilience Grows With You</h1>
        <p>
          A developmentally appropriate program for ages 5–18+. Activities, stories, and
          skills mapped to the Six Dimensions of Resilience.
        </p>
        <a href="/quiz" className="btn-cta">Take the Assessment</a>
      </section>

      {/* Six Skills */}
      <section className="landing-section">
        <div className="section-header">
          <h2>Six Skills for Life</h2>
          <p>Each dimension of resilience maps to everyday situations kids and teens face.</p>
        </div>
        <div className="skills-grid">
          {SKILLS.map(skill => (
            <article key={skill.name} className="skill-card">
              <div className="skill-card-emoji">{skill.emoji}</div>
              <div className="skill-card-name">{skill.name}</div>
              <span className="skill-card-tag">{skill.tag}</span>
              <p>{skill.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Age-group activities */}
      <section className="landing-section alt-bg">
        <div className="section-header">
          <span className="section-label">Activities by Age</span>
          <h2>Pick Your Age Group</h2>
          <p>Developmentally matched activities for every stage.</p>
        </div>

        <div className="age-tabs" role="tablist">
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
              {(ACTIVITIES[id] || []).map(activity => (
                <li key={activity.title} className="activity-item">
                  <div className="activity-item-title">{activity.title}</div>
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
      </section>
    </>
  );
}
