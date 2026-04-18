import React, { useState, useCallback } from 'react';
import { NAVIGATOR_QUESTS } from '../../data/kidsGameQuests';
import ConfettiCelebration from '../gamification/ConfettiCelebration';

function stepCanAdvance(currentStep, stepSelection) {
  return currentStep.type === 'reveal'
    || (currentStep.type === 'choice' && stepSelection !== undefined)
    || (currentStep.type === 'multi-choice' && (stepSelection || []).length >= (currentStep.minSelections || 1));
}

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
  const [questError, setQuestError] = useState('');
  const [questToast, setQuestToast] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const startQuest = useCallback((quest) => {
    setActiveQuest(quest);
    setStep(0);
    setSelections({});
    setView('quest');
  }, []);

  const handleChoice = useCallback((stepId, value) => {
    setQuestError('');
    setSelections(prev => ({ ...prev, [stepId]: value }));
  }, []);

  const handleMultiChoice = useCallback((stepId, value) => {
    setQuestError('');
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
    const stepSelection = selections[currentStep.id];
    const canAdvance = stepCanAdvance(currentStep, stepSelection);

    if (!canAdvance) {
      if (currentStep.type === 'choice') {
        setQuestError('Choose an option to continue this quest step.');
      } else if (currentStep.type === 'multi-choice') {
        setQuestError(`Select at least ${currentStep.minSelections || 1} options before completing this step.`);
      } else {
        setQuestError('Complete the step requirements before continuing.');
      }
      return;
    }

    if (step < activeQuest.steps.length - 1) {
      setStep(s => s + 1);
      setQuestError('');
    } else {
      // Complete quest
      setCompleted(prev => {
        const next = new Set(prev);
        next.add(activeQuest.id);
        return next;
      });
      if (onEarnBadge) onEarnBadge(activeQuest.badge);
      setQuestToast(`Congratulations! ${activeQuest.title} completed!`);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2200);
      setTimeout(() => setQuestToast(''), 3200);
      setView('list');
    }
  }, [step, activeQuest, onEarnBadge, selections]);

  if (view === 'list') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>
        <div className="kg-game-header">
          <div className="kg-game-emoji" aria-hidden="true"><img src="/icons/games/navigator-quest.svg" alt="" width={48} height={48} style={{ verticalAlign: 'middle' }} /></div>
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
                  {isCompleted && <span className="kg-quest-done-badge" aria-label="Completed"><img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle' }} /></span>}
                </div>
                <p style={{ fontSize: '.85rem', color: '#334155', margin: '.5rem 0 1rem' }}>
                  {quest.steps.length} steps · {quest.dimension}
                </p>
                <button
                  className="kg-quest-start-btn"
                  style={{ background: quest.accentColor }}
                  onClick={() => startQuest(quest)}
                >
                  {isCompleted ? 'Replay Quest' : 'Start Quest'}
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
  const canAdvance = stepCanAdvance(currentStep, stepSelection);

  return (
    <div className="kg-game-container">
      <ConfettiCelebration active={showConfetti} />
      {questToast && (
        <div className="kg-quest-toast" role="status" aria-live="polite">
          {questToast}
        </div>
      )}
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
                <img src="/icons/story.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />Story Unlocked: <strong>{currentStep.storyUnlock}</strong>
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
          {step < activeQuest.steps.length - 1 ? 'Next Step →' : 'Complete Quest!'}
        </button>
        {!canAdvance && (
          <div className="kg-quest-warning" role="status" aria-live="polite">
            {questError || (currentStep.type === 'multi-choice'
              ? `Select at least ${currentStep.minSelections || 1} options to complete this step.`
              : currentStep.type === 'choice'
                ? 'Select one option to complete this step.'
                : 'Complete this step to continue.')}
          </div>
        )}
      </div>
    </div>
  );
}
