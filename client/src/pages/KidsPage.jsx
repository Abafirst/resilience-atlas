import React, { useState, useEffect } from 'react';
import { KIDS_DIMENSION_ICON_MAP, KIDS_ACTIVITIES } from '../data/kidsActivities';

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
              <div className="skill-card-emoji">
                <img src={KIDS_DIMENSION_ICON_MAP[skill.name]} alt="" aria-hidden="true" width="40" height="40" />
              </div>
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
      </section>
    </>
  );
}
