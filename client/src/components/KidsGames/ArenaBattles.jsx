import React, { useState, useCallback } from 'react';
import { ARENA_QUESTIONS } from '../../data/kidsGameChallenges';

const CHARACTERS_FOR_ARENA = [
  { name: 'Kai — The Builder',     color: '#fef9c3', accentColor: '#854d0e', emoji: '🔨' },
  { name: 'Alex — The Thinker',    color: '#e0f2fe', accentColor: '#0284c7', emoji: '💡' },
  { name: 'Maya — The Connector',  color: '#ede9fe', accentColor: '#7c3aed', emoji: '🤝' },
  { name: 'Jordan — The Feeler',   color: '#ffe4e6', accentColor: '#be123c', emoji: '💭' },
  { name: 'Sam — The Grounder',    color: '#dcfce7', accentColor: '#15803d', emoji: '🌬️' },
  { name: 'River — The Guide',     color: '#f0fdf4', accentColor: '#065f46', emoji: '✨' },
];

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * ArenaBattles — Ages 12+
 * Quiz-based battles vs resilience characters.
 */
export default function ArenaBattles({ onBack, onEarnBadge }) {
  const [view, setView] = useState('select'); // 'select' | 'battle' | 'victory' | 'defeat'
  const [opponent, setOpponent] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [playerScore, setPlayerScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [wins, setWins] = useState(() => {
    try { return parseInt(localStorage.getItem('kg-arena-wins') || '0', 10); } catch { return 0; }
  });

  const startBattle = useCallback((char) => {
    setOpponent(char);
    // Filter questions for this character's dimension, or fall back to all
    const charName = char.name;
    const relevant = ARENA_QUESTIONS.filter(q => q.character === charName);
    const others = shuffle(ARENA_QUESTIONS.filter(q => q.character !== charName));
    const pool = shuffle([...relevant, ...others]).slice(0, 5);
    setQuestions(pool);
    setQIdx(0);
    setPlayerScore(0);
    setAiScore(0);
    setSelected(null);
    setAnswered(false);
    setView('battle');
  }, []);

  const handleAnswer = useCallback((idx) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);

    const q = questions[qIdx];
    const correct = idx === q.correct;

    if (correct) {
      setPlayerScore(s => s + 1);
    } else {
      // AI gets a point
      setAiScore(s => s + 1);
    }

    setTimeout(() => {
      if (qIdx + 1 >= questions.length) {
        // End of battle
        const finalPlayer = correct ? playerScore + 1 : playerScore;
        const finalAI = correct ? aiScore : aiScore + 1;
        if (finalPlayer > finalAI) {
          if (onEarnBadge) {
            onEarnBadge('arena-warrior');
            if (opponent.name.includes('Builder')) onEarnBadge('builder-beater');
          }
          const newWins = wins + 1;
          setWins(newWins);
          try { localStorage.setItem('kg-arena-wins', String(newWins)); } catch {}
          // Award 'unbeatable' OUTSIDE the setWins updater to ensure the modal fires
          if (newWins >= 5 && onEarnBadge) onEarnBadge('unbeatable');
          setView('victory');
        } else {
          setView('defeat');
        }
      } else {
        setQIdx(i => i + 1);
        setSelected(null);
        setAnswered(false);
      }
    }, 1800);
  }, [answered, questions, qIdx, playerScore, aiScore, opponent, onEarnBadge, wins]);

  if (view === 'select') {
    return (
      <div className="kg-game-container">
        <button className="kg-back-btn" onClick={onBack} aria-label="Back to games">← Back</button>
        <div className="kg-game-header">
          <div className="kg-game-emoji" aria-hidden="true">🏆</div>
          <h2 className="kg-game-title">Arena Battles</h2>
          <p className="kg-game-subtitle">Choose a character to battle! Answer resilience questions to win.</p>
          {wins > 0 && <div className="kg-score-badge">🏅 {wins} battle wins</div>}
        </div>

        <div className="kg-arena-select-grid" role="list" aria-label="Select a character to battle">
          {CHARACTERS_FOR_ARENA.map(char => (
            <button
              key={char.name}
              className="kg-arena-char-card"
              style={{ background: char.color, borderColor: char.accentColor }}
              onClick={() => startBattle(char)}
              role="listitem"
              aria-label={`Battle ${char.name}`}
            >
              <div className="kg-arena-char-emoji" aria-hidden="true">{char.emoji}</div>
              <div className="kg-arena-char-name">{char.name}</div>
              <div className="kg-arena-char-cta" style={{ color: char.accentColor }}>
                ⚔️ Challenge!
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'victory' || view === 'defeat') {
    const won = view === 'victory';
    return (
      <div className="kg-game-container">
        <div className="kg-battle-result" style={{ background: won ? '#f0fdf4' : '#fff7ed' }}>
          <div className="kg-battle-result-emoji" aria-hidden="true">{won ? '🏆' : '💪'}</div>
          <h2 className="kg-battle-result-title">
            {won ? `You beat ${opponent.name}!` : `${opponent.name} wins this time!`}
          </h2>
          <p className="kg-battle-result-score">
            Your score: {playerScore} vs {opponent.name}: {aiScore}
          </p>
          <p>
            {won
              ? 'Incredible! You really know your resilience. The characters are proud of you! 🌟'
              : 'Great try! Every battle makes you stronger. Want to try again?'
            }
          </p>
          {won && <p className="kg-battle-tip">{questions[questions.length - 1]?.tip}</p>}
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button className="kg-spin-btn" onClick={() => startBattle(opponent)}>🔄 Rematch!</button>
          <button className="kg-spin-btn" style={{ background: '#475569' }} onClick={() => setView('select')}>⚔️ New Battle</button>
          <button className="kg-back-btn" style={{ position: 'static' }} onClick={onBack}>← Back</button>
        </div>
      </div>
    );
  }

  const q = questions[qIdx];
  return (
    <div className="kg-game-container">
      {/* Battle HUD */}
      <div className="kg-battle-hud">
        <div className="kg-battle-player">
          <span aria-hidden="true">🧭</span>
          <span>You: {playerScore}</span>
        </div>
        <div className="kg-battle-vs">VS</div>
        <div className="kg-battle-opponent" style={{ color: opponent.accentColor }}>
          <span aria-hidden="true">{opponent.emoji}</span>
          <span>{opponent.name.split(' — ')[1]}: {aiScore}</span>
        </div>
      </div>

      <div className="kg-hud-progress" style={{ textAlign: 'center', margin: '.5rem 0' }}>
        Question {qIdx + 1}/{questions.length}
      </div>

      <div className="kg-challenge-card" style={{ borderColor: opponent.accentColor }}>
        <div className="kg-challenge-dimension" style={{ color: opponent.accentColor }}>
          {q.character} asks:
        </div>
        <p className="kg-challenge-scenario">{q.question}</p>

        <div className="kg-choice-grid" role="group" aria-label="Choose your answer">
          {q.options.map((opt, i) => {
            let extra = '';
            if (answered) {
              if (i === q.correct) extra = ' correct';
              else if (i === selected) extra = ' wrong';
            }
            return (
              <button
                key={i}
                className={`kg-choice-btn${selected === i && !answered ? ' selected' : ''}${extra}`}
                onClick={() => handleAnswer(i)}
                disabled={answered}
                aria-pressed={selected === i}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`kg-feedback ${selected === q.correct ? 'kg-feedback-match' : 'kg-feedback-miss'}`}
            aria-live="polite" role="status"
          >
            {selected === q.correct ? `✓ Correct! ` : `Not quite! `}{q.tip}
          </div>
        )}
      </div>
    </div>
  );
}
