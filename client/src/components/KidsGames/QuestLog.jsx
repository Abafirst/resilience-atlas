import React, { useState, useCallback } from 'react';
import { QUEST_LOG_SERIES } from '../../data/kidsGameQuests';

/**
 * QuestLog — Ages 12+
 * Multi-part story quests with reading, reflection, and creative writing.
 */
export default function QuestLog({ onBack, onEarnBadge }) {
  const [view, setView] = useState('list'); // 'list' | 'series' | 'part'
  const [activeSeries, setActiveSeries] = useState(null);
  const [activePart, setActivePart] = useState(null);
  const [partIdx, setPartIdx] = useState(0);
  const [completedParts, setCompletedParts] = useState(new Set());
  const [completedSeries, setCompletedSeries] = useState(new Set());
  const [userInputs, setUserInputs] = useState({});
  const [toolkit, setToolkit] = useState({});
  const [challenges, setChallenges] = useState({});
  const [reframeFlipped, setReframeFlipped] = useState({});
  const [reflectionAnswers, setReflectionAnswers] = useState({});

  const startSeries = useCallback((series) => {
    setActiveSeries(series);
    setView('series');
  }, []);

  const startPart = useCallback((series, idx) => {
    setActiveSeries(series);
    setActivePart(series.parts[idx]);
    setPartIdx(idx);
    setView('part');
  }, []);

  const completePart = useCallback((partId, badgeId) => {
    setCompletedParts(prev => {
      const next = new Set(prev);
      next.add(partId);
      return next;
    });
    if (badgeId && onEarnBadge) onEarnBadge(badgeId);
    setView('series');

    // Check if entire series complete
    const allPartIds = activeSeries.parts.map(p => p.id);
    const allDone = allPartIds.every(id => id === partId || completedParts.has(id));
    if (allDone) {
      setCompletedSeries(prev => {
        const next = new Set(prev);
        next.add(activeSeries.id);
        return next;
      });
      if (onEarnBadge) onEarnBadge(activeSeries.completionBadge);
    }
  }, [activeSeries, completedParts, onEarnBadge]);

  const flipReframe = useCallback((idx) => {
    setReframeFlipped(prev => ({ ...prev, [idx]: !prev[idx] }));
  }, []);

  const toggleToolkit = useCallback((emotion, strategy) => {
    setToolkit(prev => {
      const current = prev[emotion] || [];
      const next = current.includes(strategy)
        ? current.filter(s => s !== strategy)
        : [...current, strategy];
      return { ...prev, [emotion]: next };
    });
  }, []);

  const toggleChallenge = useCallback((id) => {
    setChallenges(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  if (view === 'list') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>
        <div className="kg-game-header">
          <div className="kg-game-emoji" aria-hidden="true">📜</div>
          <h2 className="kg-game-title">Quest Log</h2>
          <p className="kg-game-subtitle">Multi-part quests — read, reflect, and create!</p>
          <div className="kg-score-badge">{completedSeries.size}/{QUEST_LOG_SERIES.length} series complete</div>
        </div>
        <div className="kg-quest-list">
          {QUEST_LOG_SERIES.map(series => {
            const isDone = completedSeries.has(series.id);
            const partsComplete = series.parts.filter(p => completedParts.has(p.id)).length;
            return (
              <div
                key={series.id}
                className={`kg-quest-card${isDone ? ' kg-quest-done' : ''}`}
                style={{ background: series.color, borderColor: series.accentColor }}
              >
                <div className="kg-quest-card-top">
                  <img src={series.icon} alt="" className="icon icon-sm" aria-hidden="true" />
                  <div>
                    <h3 className="kg-quest-card-title">{series.title}</h3>
                    <p className="kg-quest-card-char">{series.character}</p>
                    <p style={{ fontSize: '.78rem', color: '#64748b', margin: 0 }}>{series.subtitle}</p>
                  </div>
                  {isDone && <span className="kg-quest-done-badge" aria-label="Series complete"><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={16} height={16} style={{ verticalAlign: 'middle' }} /></span>}
                </div>
                <p style={{ fontSize: '.82rem', color: '#475569', margin: '.5rem 0 .25rem' }}>
                  {partsComplete}/{series.parts.length} parts complete
                </p>
                <div className="kg-peak-progress-wrap" style={{ marginBottom: '.75rem' }}>
                  <div
                    className="kg-peak-progress-fill"
                    style={{ width: `${(partsComplete / series.parts.length) * 100}%`, background: series.accentColor }}
                  />
                </div>
                <button
                  className="kg-quest-start-btn"
                  style={{ background: series.accentColor }}
                  onClick={() => startSeries(series)}
                >
                  {partsComplete > 0 ? '📖 Continue Quest' : '📜 Start Quest'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === 'series') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={() => setView('list')} aria-label="Back to quest list">← Quest Log</button>
        <div className="kg-quest-header" style={{ background: activeSeries.color }}>
          <img src={activeSeries.icon} alt="" className="icon icon-sm" aria-hidden="true" />
          <div>
            <div className="kg-quest-name">{activeSeries.title}</div>
            <div className="kg-quest-char">{activeSeries.character}</div>
          </div>
        </div>

        <div className="kg-quest-parts" role="list" aria-label="Quest parts">
          {activeSeries.parts.map((part, i) => {
            const isDone = completedParts.has(part.id);
            const isLocked = i > 0 && !completedParts.has(activeSeries.parts[i - 1].id);
            return (
              <div
                key={part.id}
                className={`kg-activity-step${isDone ? ' done' : isLocked ? ' locked' : ''}`}
                role="listitem"
              >
                <div
                  className="kg-activity-step-num"
                  style={{ background: isDone ? activeSeries.accentColor : '#e2e8f0', color: isDone ? '#fff' : '#475569' }}
                >
                  {isDone
                    ? <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle' }} />
                    : part.partNumber}
                </div>
                <div className="kg-activity-step-content">
                  <p className="kg-activity-step-title">{part.title}</p>
                  <span className="kg-part-type">{part.type}</span>
                </div>
                {!isDone && !isLocked && (
                  <button
                    className="kg-activity-complete-btn"
                    style={{ background: activeSeries.accentColor }}
                    onClick={() => startPart(activeSeries, i)}
                    aria-label={`Open part ${part.partNumber}: ${part.title}`}
                  >
                    Open →
                  </button>
                )}
                {isLocked && <span className="kg-activity-locked" aria-label="Locked"><img src="/icons/lock.svg" alt="" width={16} height={16} style={{ verticalAlign: 'middle' }} /></span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Part view ── */
  const part = activePart;
  const isPartDone = completedParts.has(part.id);

  return (
    <div className="kg-game-container">
      <button className="kg-back-btn" onClick={() => setView('series')} aria-label="Back to series">← {activeSeries.title}</button>

      <div className="kg-quest-header" style={{ background: activeSeries.color }}>
        <div>
          <div className="kg-quest-name">Part {part.partNumber}: {part.title}</div>
          <div className="kg-quest-char">{activeSeries.character}</div>
        </div>
      </div>

      <div className="kg-part-content">
        {/* READ type */}
        {part.type === 'read' && (
          <div>
            <div className="kg-read-content">
              {part.content.split('\n').map((para, i) => (
                para.trim() ? <p key={i}>{para}</p> : <br key={i} />
              ))}
            </div>
            {part.reflection && (
              <div className="kg-reflection-prompt">
                <strong>💭 Reflect:</strong> {part.reflection}
                <textarea
                  className="reflection-input"
                  rows={3}
                  placeholder="Write your reflection here…"
                  value={userInputs[part.id] || ''}
                  onChange={e => setUserInputs(prev => ({ ...prev, [part.id]: e.target.value }))}
                  aria-label="Reflection input"
                />
              </div>
            )}
          </div>
        )}

        {/* REFRAME type */}
        {part.type === 'reframe' && (
          <div>
            <p className="kg-step-prompt">{part.prompt}</p>
            <div className="kg-reframe-list">
              {part.negativeThoughts.map((item, i) => (
                <button
                  key={i}
                  className={`kg-reframe-card${reframeFlipped[i] ? ' flipped' : ''}`}
                  onClick={() => flipReframe(i)}
                  aria-label={reframeFlipped[i] ? `Flip back: ${item.negative}` : `Flip to reframe: ${item.negative}`}
                >
                  <div className="kg-reframe-front" aria-hidden={reframeFlipped[i]}>
                    <span className="kg-reframe-icon" aria-hidden="true">💭</span>
                    <span>{item.negative}</span>
                  </div>
                  <div className="kg-reframe-back" aria-hidden={!reframeFlipped[i]}>
                    <span className="kg-reframe-icon" aria-hidden="true">✨</span>
                    <span>{item.positive}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WRITE type */}
        {part.type === 'write' && (
          <div>
            <p className="kg-step-prompt">{part.prompt}</p>
            <div className="kg-story-starter">
              <em>{part.storyStarter}</em>
            </div>
            <textarea
              className="reflection-input"
              rows={6}
              placeholder="Continue the story here…"
              value={userInputs[part.id] || ''}
              onChange={e => setUserInputs(prev => ({ ...prev, [part.id]: e.target.value }))}
              aria-label="Story writing area"
              style={{ marginTop: '1rem' }}
            />
            <div className="kg-writing-hints">
              {part.promptHints.map((hint, i) => (
                <span key={i} className="kg-hint-chip">{hint}</span>
              ))}
            </div>
          </div>
        )}

        {/* REFLECTION-QUIZ type */}
        {part.type === 'reflection-quiz' && (
          <div>
            <p className="kg-step-prompt" style={{ marginBottom: '1.25rem' }}>{part.note}</p>
            {part.questions.map((q, qi) => (
              <div key={qi} className="kg-rquiz-item">
                <p className="kg-rquiz-question">{q.q}</p>
                <div className="kg-choice-grid">
                  {q.options.map((opt, oi) => (
                    <button
                      key={oi}
                      className={`kg-choice-btn${reflectionAnswers[`${part.id}-${qi}`] === oi ? ' selected' : ''}`}
                      onClick={() => setReflectionAnswers(prev => ({ ...prev, [`${part.id}-${qi}`]: oi }))}
                      aria-pressed={reflectionAnswers[`${part.id}-${qi}`] === oi}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TOOLKIT-BUILDER type */}
        {part.type === 'toolkit-builder' && (
          <div>
            <p className="kg-step-prompt">{part.prompt}</p>
            {part.emotions.map(emotionGroup => (
              <div key={emotionGroup.emotion} className="kg-toolkit-group">
                <p className="kg-toolkit-emotion">{emotionGroup.emotion}</p>
                <div className="kg-choice-grid" role="group" aria-label={`Strategies for ${emotionGroup.emotion}`}>
                  {emotionGroup.strategies.map((s, si) => {
                    const isSelected = (toolkit[emotionGroup.emotion] || []).includes(s);
                    return (
                      <button
                        key={si}
                        className={`kg-choice-btn${isSelected ? ' selected' : ''}`}
                        onClick={() => toggleToolkit(emotionGroup.emotion, s)}
                        aria-pressed={isSelected}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CONNECTION-MAP type */}
        {part.type === 'connection-map' && (
          <div>
            <p className="kg-step-prompt">{part.prompt}</p>
            <div className="kg-connection-map">
              {part.rings.map((ring, i) => (
                <div key={i} className="kg-connection-ring" style={{ borderColor: ring.color }}>
                  <div className="kg-ring-label" style={{ color: ring.color }}>{ring.label}</div>
                  <p className="kg-ring-desc">{ring.desc}</p>
                  <textarea
                    className="reflection-input"
                    rows={2}
                    placeholder="Who's in this circle?"
                    value={userInputs[`${part.id}-ring-${i}`] || ''}
                    onChange={e => setUserInputs(prev => ({ ...prev, [`${part.id}-ring-${i}`]: e.target.value }))}
                    aria-label={`${ring.label} — who's here?`}
                  />
                </div>
              ))}
              {part.reflection && (
                <div className="kg-reflection-prompt">
                  <strong>💭 Reflect:</strong> {part.reflection}
                  <textarea
                    className="reflection-input"
                    rows={2}
                    placeholder="Your reflection…"
                    value={userInputs[`${part.id}-reflect`] || ''}
                    onChange={e => setUserInputs(prev => ({ ...prev, [`${part.id}-reflect`]: e.target.value }))}
                    aria-label="Connection reflection"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHALLENGE type */}
        {part.type === 'challenge' && (
          <div>
            <p className="kg-step-prompt">{part.prompt}</p>
            <div className="kg-challenge-list" role="list">
              {part.challenges.map(c => (
                <button
                  key={c.id}
                  className={`kg-challenge-item${challenges[c.id] ? ' done' : ''}`}
                  onClick={() => toggleChallenge(c.id)}
                  role="listitem"
                  aria-pressed={challenges[c.id]}
                >
                  <span className="kg-challenge-item-emoji" aria-hidden="true">{c.emoji}</span>
                  <span>{c.label}</span>
                  {challenges[c.id] && <span className="kg-check" aria-hidden="true"><img src="/icons/checkmark.svg" alt="" width={14} height={14} style={{ verticalAlign: 'middle' }} /></span>}
                </button>
              ))}
            </div>
            {part.encouragement && (
              <div className="kg-encourage">{part.encouragement}</div>
            )}
          </div>
        )}

        {/* Complete button */}
        {!isPartDone && (
          <button
            className="kg-advance-btn"
            style={{ background: activeSeries.accentColor, marginTop: '1.5rem' }}
            onClick={() => completePart(part.id, part.badge)}
          >
            <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Mark as Complete
          </button>
        )}
        {isPartDone && (
          <div className="kg-encourage" style={{ marginTop: '1rem' }}>
            <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Part complete! Great work!
          </div>
        )}
      </div>
    </div>
  );
}
