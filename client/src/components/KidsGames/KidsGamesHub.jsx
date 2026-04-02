import React, { useState, useCallback, useEffect, useRef } from 'react';
import AgeSelector from './AgeSelector';
import GameCard from './GameCard';
import CompassSpinner from './CompassSpinner';
import MapCollector from './MapCollector';
import BuilderBadges from './BuilderBadges';
import NavigatorQuest from './NavigatorQuest';
import ResilienceMountain from './ResilienceMountain';
import TreasureExplorer from './TreasureExplorer';
import NavigatorChallenges from './NavigatorChallenges';
import ArenaBattles from './ArenaBattles';
import QuestLog from './QuestLog';
import { GAME_CARDS } from '../../data/kidsGames';
import { KIDS_BADGES, getBadgeById } from '../../data/kidsGameBadges';
import '../../styles/kidsGames.css';

const GAME_COMPONENTS = {
  'compass-spinner':       CompassSpinner,
  'map-collector':         MapCollector,
  'builder-badges':        BuilderBadges,
  'navigator-quest':       NavigatorQuest,
  'resilience-mountain':   ResilienceMountain,
  'treasure-explorer':     TreasureExplorer,
  'navigator-challenges':  NavigatorChallenges,
  'arena-battles':         ArenaBattles,
  'quest-log':             QuestLog,
};

/**
 * KidsGamesHub — Main games hub section for the Kids page.
 * Manages age selection, game routing, badge collection, and stars.
 */
export default function KidsGamesHub() {
  const [ageGroup, setAgeGroup] = useState('young');
  const [activeGame, setActiveGame] = useState(null);
  const [stars, setStars] = useState(() => {
    try { return parseInt(localStorage.getItem('kg-stars') || '0', 10); } catch { return 0; }
  });
  const [earnedBadges, setEarnedBadges] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kg-badges') || '[]'); } catch { return []; }
  });
  const [badgeToast, setBadgeToast] = useState(null);
  const gameContainerRef = useRef(null);

  const handleEarnBadge = useCallback((badgeId) => {
    if (earnedBadges.includes(badgeId)) return;
    setEarnedBadges(prev => {
      const next = [...prev, badgeId];
      try { localStorage.setItem('kg-badges', JSON.stringify(next)); } catch {}
      return next;
    });
    setStars(s => {
      const next = s + 5;
      try { localStorage.setItem('kg-stars', String(next)); } catch {}
      return next;
    });
    const badge = getBadgeById(badgeId);
    if (badge) {
      setBadgeToast(badge);
      setTimeout(() => setBadgeToast(null), 3500);
    }
  }, [earnedBadges]);

  const playGame = useCallback((gameId) => {
    setActiveGame(gameId);
  }, []);

  // Scroll to the game container after it mounts, not to the top of the page
  useEffect(() => {
    if (!activeGame) return;
    const el = document.getElementById('kg-game-active');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeGame]);

  const goBack = useCallback(() => {
    setActiveGame(null);
  }, []);

  const games = GAME_CARDS[ageGroup] || [];

  // If a game is active, render it
  if (activeGame) {
    const GameComponent = GAME_COMPONENTS[activeGame];
    if (!GameComponent) {
      return (
        <div className="kg-game-container">
          <button className="kg-back-btn" onClick={goBack}>← Back</button>
          <p>Game not found.</p>
        </div>
      );
    }
    return (
        <div className="kg-hub-wrapper" id="kg-game-active" ref={gameContainerRef}>
        {badgeToast && <BadgeToast badge={badgeToast} />}
        <GameComponent onBack={goBack} onEarnBadge={handleEarnBadge} />
      </div>
    );
  }

  return (
    <div className="kg-hub-wrapper">
      {badgeToast && <BadgeToast badge={badgeToast} />}

      {/* Hub header */}
      <div className="kg-hub-header">
        <span className="section-label">Interactive Games</span>
        <h2 className="kg-hub-title">🧭 Resilience Games</h2>
        <p className="kg-hub-subtitle">
          Fun games that teach resilience skills! Earn stars, collect badges, and go on adventures with Maya, Kai, Jordan, Alex, Sam, and River.
        </p>

        {/* Stars & badges summary */}
        <div className="kg-hub-stats" aria-label="Your progress">
          <div className="kg-stat">
            <span className="kg-stat-icon" aria-hidden="true">⭐</span>
            <span className="kg-stat-num">{stars}</span>
            <span className="kg-stat-label">Stars</span>
          </div>
          <div className="kg-stat">
            <span className="kg-stat-icon" aria-hidden="true">🏅</span>
            <span className="kg-stat-num">{earnedBadges.length}</span>
            <span className="kg-stat-label">Badges</span>
          </div>
        </div>
      </div>

      {/* Age selector */}
      <AgeSelector selected={ageGroup} onChange={setAgeGroup} />

      {/* Game cards */}
      <div className="kg-game-grid" role="list" aria-label={`Games for ${ageGroup === 'young' ? 'ages 5–8' : ageGroup === 'middle' ? 'ages 8–12' : 'ages 12+'}`}>
        {games.map(game => (
          <GameCard key={game.id} game={game} onPlay={playGame} />
        ))}
      </div>

      {/* Badge shelf */}
      {earnedBadges.length > 0 && (
        <div className="kg-badge-shelf" aria-label="Your collected badges">
          <h3 className="kg-badge-shelf-title">🏅 Your Badge Collection</h3>
          <div className="kg-badge-shelf-row">
            {earnedBadges.map(id => {
              const badge = getBadgeById(id);
              if (!badge) return null;
              return (
                <div
                  key={id}
                  className="kg-shelf-badge"
                  style={{ background: badge.color, borderColor: badge.border }}
                  title={badge.label}
                  aria-label={`${badge.label}: ${badge.desc}`}
                >
                  <span className="kg-shelf-badge-emoji" aria-hidden="true">{badge.emoji}</span>
                  <span className="kg-shelf-badge-label">{badge.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BadgeToast({ badge }) {
  return (
    <div
      className="kg-badge-toast-global"
      role="status"
      aria-live="polite"
      style={{ background: badge.color, borderColor: badge.border }}
    >
      <span className="kg-badge-toast-emoji" aria-hidden="true">{badge.emoji}</span>
      <div>
        <strong>🏅 Badge Unlocked: {badge.label}!</strong>
        <p style={{ margin: 0, fontSize: '.82rem' }}>{badge.desc}</p>
      </div>
    </div>
  );
}
