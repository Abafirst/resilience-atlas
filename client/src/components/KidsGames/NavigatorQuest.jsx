import React, { useState, useCallback } from 'react';
import { NAVIGATOR_QUESTS } from '../../data/kidsGameQuests';

/**
 * NavigatorQuest — Ages 8–12
 * Multi-step adventure quests with story unlocks.
 */
export default function NavigatorQuest({ onBack, onEarnBadge }) {
  const [view, setView] = useState('list'); // 'list' | 'quest'
  const [activeQuest, setActiveQuest] = useState(null);
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({});
  const [completed, setCompleted] = useState(new Set());

  const startQuest = useCallback((quest) => {
    setActiveQuest(quest);
    setStep(0);
    setSelections({});
    setView('quest');
  }, []);

  const handleChoice = useCallback((stepId, value) => {
    setSelections(prev => ({ ...prev, [stepId]: value }));
  }, []);

  const handleMultiChoice = useCallback((stepId, value) => {
    setSelections(prev => {
      const current = prev[stepId] || [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [stepId]: next };
    });
  }, []);

  const advance = useCallback(() => {
    const currentStep = activeQuest.steps[step];
    if (step < activeQuest.steps.length - 1) {
      setStep(s => s + 1);
    } else {
      // Complete quest
      setCompleted(prev => {
        const next = new Set(prev);
        next.add(activeQuest.id);
        return next;
      });
      if (onEarnBadge) onEarnBadge(activeQuest.badge);
      setView('list');
    }
  }, [step, activeQuest, onEarnBadge]);

  if (view === 'list') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>
        <div className="kg-game-header">
          <div className="kg-game-emoji" aria-hidden="true">⚔️</div>
          <h2 className="kg-game-title">Navigator Quest</h2>
          <p className="kg-game-subtitle">Choose your adventure! Each quest has 3 steps.</p>
        </div>
        <div className="kg-quest-list">
          {NAVIGATOR_QUESTS.map(quest => {
            const isCompleted = completed.has(quest.id);
            return (
              <div
                key={quest.id}
                className={`kg-quest-card${isCompleted ? ' kg-quest-done' : ''}`}
                style={{ background: quest.color, borderColor: quest.accentColor }}
              >
                <div className="kg-quest-card-top">
                  <img src={quest.icon} alt="" className="icon icon-sm" aria-hidden="true" />
                  <div>
                    <h3 className="kg-quest-card-title">{quest.title}</h3>
                    <p className="kg-quest-card-char">{quest.character}</p>
                  </div>
                  {isCompleted && <span className="kg-quest-done-badge" aria-label="Completed">✅</span>}
                </div>
                <p style={{ fontSize: '.85rem', color: '#334155', margin: '.5rem 0 1rem' }}>
                  {quest.steps.length} steps · {quest.dimension}
                </p>
                <button
                  className="kg-quest-start-btn"
                  style={{ background: quest.accentColor }}
                  onClick={() => startQuest(quest)}
                >
                  {isCompleted ? '🔄 Replay Quest' : '⚔️ Start Quest'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const currentStep = activeQuest.steps[step];
  const stepSelection = selections[currentStep.id];
  const canAdvance = currentStep.type === 'reveal'
    || currentStep.type === 'choice' ? stepSelection !== undefined
    : currentStep.type === 'multi-choice' ? (stepSelection || []).length >= (currentStep.minSelections || 1)
    : true;

  return (
    <div className="kg-game-container">
      <button className="kg-back-btn" onClick={() => setView('list')} aria-label="Back to quest list">← Quests</button>

      {/* Quest header */}
      <div className="kg-quest-header" style={{ background: activeQuest.color }}>
        <img src={activeQuest.icon} alt="" className="icon icon-sm" aria-hidden="true" />
        <div>
          <div className="kg-quest-name">{activeQuest.title}</div>
          <div className="kg-quest-char">{activeQuest.character}</div>
        </div>
        <div className="kg-quest-step-count">Step {step + 1}/{activeQuest.steps.length}</div>
      </div>

      {/* Step progress dots */}
      <div className="kg-step-dots" aria-label={`Step ${step + 1} of ${activeQuest.steps.length}`}>
        {activeQuest.steps.map((s, i) => (
          <div
            key={s.id}
            className={`kg-step-dot${i < step ? ' done' : i === step ? ' active' : ''}`}
            aria-hidden="true"
          />
        ))}
      </div>

      <div className="kg-quest-step">
        <h3 className="kg-step-title">{currentStep.title}</h3>
        <p className="kg-step-prompt">{currentStep.prompt}</p>

        {currentStep.type === 'choice' && (
          <div className="kg-choice-grid" role="group" aria-label="Choose an option">
            {currentStep.choices.map((choice, i) => (
              <button
                key={i}
                className={`kg-choice-btn${stepSelection === i ? ' selected' : ''}`}
                onClick={() => handleChoice(currentStep.id, i)}
                aria-pressed={stepSelection === i}
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        {currentStep.type === 'multi-choice' && (
          <>
            <p style={{ fontSize: '.82rem', color: '#64748b', marginBottom: '.75rem' }}>
              Select at least {currentStep.minSelections}:
            </p>
            <div className="kg-choice-grid" role="group" aria-label="Select multiple options">
              {currentStep.choices.map((choice, i) => {
                const isSelected = (stepSelection || []).includes(choice);
                return (
                  <button
                    key={i}
                    className={`kg-choice-btn${isSelected ? ' selected' : ''}`}
                    onClick={() => handleMultiChoice(currentStep.id, choice)}
                    aria-pressed={isSelected}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {currentStep.type === 'reveal' && (
          <div className="kg-reveal-box" style={{ background: activeQuest.color, borderColor: activeQuest.accentColor }}>
            <p className="kg-reveal-message">{currentStep.message}</p>
            {currentStep.storyUnlock && (
              <div className="kg-story-unlock">
                <span aria-hidden="true">📖</span> Story Unlocked: <strong>{currentStep.storyUnlock}</strong>
              </div>
            )}
          </div>
        )}

        {/* Encourage message after selection */}
        {stepSelection !== undefined && currentStep.encourage && (
          <div className="kg-encourage" aria-live="polite">
            {currentStep.encourage}
          </div>
        )}

        <button
          className="kg-advance-btn"
          onClick={advance}
          disabled={!canAdvance}
          style={{ background: activeQuest.accentColor }}
        >
          {step < activeQuest.steps.length - 1 ? 'Next Step →' : '🎉 Complete Quest!'}
        </button>
      </div>
    </div>
  );
}
