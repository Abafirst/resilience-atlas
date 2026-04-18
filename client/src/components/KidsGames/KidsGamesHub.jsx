import React, { useState, useCallback, useEffect, useRef } from 'react';
import AgeSelector from './AgeSelector';
import GameCard from './GameCard';
import CompassSpinner from './CompassSpinner';
import MapCollector from './MapCollector';
import BadgeQuestGame from './BadgeQuestGame';
import NavigatorQuest from './NavigatorQuest';
import ResilienceMountain from './ResilienceMountain';
import TreasureExplorer from './TreasureExplorer';
import NavigatorChallenges from './NavigatorChallenges';
import ArenaBattles from './ArenaBattles';
import QuestLog from './QuestLog';
import BadgeUnlockModal from './BadgeUnlockModal';
import { GAME_CARDS } from '../../data/kidsGames';
import { KIDS_BADGES, getBadgeById } from '../../data/kidsGameBadges';
import '../../styles/kidsGames.css';

const GAME_COMPONENTS = {
  'compass-spinner':       CompassSpinner,
  'map-collector':         MapCollector,
  'builder-badges':        BadgeQuestGame,
  'navigator-quest':       NavigatorQuest,
  'resilience-mountain':   ResilienceMountain,
  'treasure-explorer':     TreasureExplorer,
  'navigator-challenges':  NavigatorChallenges,
  'arena-battles':         ArenaBattles,
  'quest-log':             QuestLog,
};

/** Persistent storage helpers */
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/**
 * Derive a "next badge hint" for the modal by looking at the first
 * KIDS_BADGES entry the player hasn't earned yet.
 */
function getNextHint(currentBadgeId, earnedIds) {
  const next = KIDS_BADGES.find(b => b.id !== currentBadgeId && !earnedIds.includes(b.id));
  return next ? `${next.label} — ${next.desc}` : null;
}

/**
 * KidsGamesHub — Main games hub section for the Kids page.
 * Manages age selection, game routing, badge collection, and stars.
 */
export default function KidsGamesHub() {
  const [ageGroup, setAgeGroup]         = useState('young');
  const [activeGame, setActiveGame]     = useState(null);
  const [soundOn, setSoundOn]           = useState(() => loadJSON('kg-sound', true));
  const [stars, setStars]               = useState(() => loadJSON('kg-stars', 0));
  const [earnedBadges, setEarnedBadges] = useState(() => loadJSON('kg-badges', []));
  /* { [badgeId]: ISO date string } — when the badge was earned */
  const [badgeDates, setBadgeDates]     = useState(() => loadJSON('kg-badge-dates', {}));
  /* Set of gameIds completed at least once */
  const [completedGames, setCompletedGames] = useState(() => new Set(loadJSON('kg-completed-games', [])));

  const [modalBadge, setModalBadge]     = useState(null);   // badge currently shown in modal
  const [modalQueue, setModalQueue]     = useState([]);      // queue of badges to display sequentially
  const [badgeToast, setBadgeToast]     = useState(null);    // legacy toast (kept for non-Builder games)
  const gameContainerRef                = useRef(null);

  // Ref mirrors earnedBadges and is updated immediately (before re-render) so
  // handleEarnBadge always reads the latest value without stale closure issues.
  const earnedBadgesRef = useRef(earnedBadges);
  earnedBadgesRef.current = earnedBadges;

  /* ── Process modal queue ── */
  useEffect(() => {
    if (modalBadge || modalQueue.length === 0) return;
    const [next, ...rest] = modalQueue;
    setModalQueue(rest);
    setModalBadge(next);
  }, [modalBadge, modalQueue]);

  const closeModal = useCallback(() => setModalBadge(null), []);

  /* ── Earn a badge ── */
  const handleEarnBadge = useCallback((badgeId) => {
    // Use the ref for a fast, always-current duplicate check — this prevents
    // double modal queuing when the same badge is awarded multiple times before
    // React has committed a re-render with the updated earnedBadges state.
    if (earnedBadgesRef.current.includes(badgeId)) return;
    // Immediately update the ref so rapid successive calls see the new entry.
    earnedBadgesRef.current = [...earnedBadgesRef.current, badgeId];

    const now = new Date().toISOString();

    // Update earned badges (functional update guards against concurrent React batches)
    setEarnedBadges(prev => {
      if (prev.includes(badgeId)) return prev;
      const next = [...prev, badgeId];
      saveJSON('kg-badges', next);
      return next;
    });

    // Update badge date — these must be OUTSIDE the setEarnedBadges updater
    // because calling state setters inside state updater functions is an
    // anti-pattern that breaks React's reconciliation (modal never appears).
    setBadgeDates(dates => {
      const updated = { ...dates, [badgeId]: now };
      saveJSON('kg-badge-dates', updated);
      return updated;
    });

    setStars(s => {
      const ns = s + 5;
      saveJSON('kg-stars', ns);
      return ns;
    });

    // Queue the modal
    const badge = getBadgeById(badgeId);
    if (badge) {
      setModalQueue(q => [...q, badge]);
      // Also show the legacy toast
      setBadgeToast(badge);
      setTimeout(() => setBadgeToast(null), 3500);
    }
  }, []); // empty deps — reads/writes earnedBadges only through earnedBadgesRef

  /* ── Mark a game as completed (for cross-game achievement tracking) ── */
  const handleGameComplete = useCallback((gameId) => {
    if (completedGames.has(gameId)) return;

    const newCompleted = new Set(completedGames);
    newCompleted.add(gameId);
    setCompletedGames(newCompleted);
    saveJSON('kg-completed-games', [...newCompleted]);

    // Cross-game achievements — called OUTSIDE the state updater
    const newSize = newCompleted.size;
    if (newSize === 1) handleEarnBadge('first-step');
    if (newSize >= 2) handleEarnBadge('game-starter');
  }, [completedGames, handleEarnBadge]);

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
    if (activeGame) handleGameComplete(activeGame);
    setActiveGame(null);
  }, [activeGame, handleGameComplete]);

  const games = GAME_CARDS[ageGroup] || [];

  /* ── Active game view ── */
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
        {modalBadge && (
          <BadgeUnlockModal
            badge={modalBadge}
            nextHint={getNextHint(modalBadge.id, earnedBadges)}
            onClose={closeModal}
            soundOn={soundOn}
          />
        )}
        {badgeToast && <BadgeToast badge={badgeToast} />}
        <GameComponent onBack={goBack} onEarnBadge={handleEarnBadge} ageGroup={ageGroup} />
      </div>
    );
  }

  /* ── Hub view ── */
  const totalBadges = KIDS_BADGES.length;

  return (
    <div className="kg-hub-wrapper">
      {modalBadge && (
        <BadgeUnlockModal
          badge={modalBadge}
          nextHint={getNextHint(modalBadge.id, earnedBadges)}
          onClose={closeModal}
          soundOn={soundOn}
        />
      )}
      {badgeToast && <BadgeToast badge={badgeToast} />}

      {/* Hub header */}
      <div className="kg-hub-header">
        <span className="section-label">Interactive Games</span>
        <h2 className="kg-hub-title">
          <img src="/icons/compass.svg" alt="" aria-hidden="true" className="kg-hub-title-icon" />
          Resilience Games
        </h2>
        <p className="kg-hub-subtitle">
          Fun games that teach resilience skills! Earn stars, collect badges, and go on adventures with Maya, Kai, Jordan, Alex, Sam, and River.
        </p>

        {/* Stars & badges summary */}
        <div className="kg-hub-stats" aria-label="Your progress">
          <div className="kg-stat">
            <span className="kg-stat-icon" aria-hidden="true">
              <img src="/icons/games/star-earned.svg" alt="" className="kg-stat-icon-img" />
            </span>
            <span className="kg-stat-num">{stars}</span>
            <span className="kg-stat-label">Stars</span>
          </div>
          <div className="kg-stat">
            <span className="kg-stat-icon" aria-hidden="true">
              <img src="/icons/games/builder-badges.svg" alt="" className="kg-stat-icon-img" />
            </span>
            <span className="kg-stat-num">{earnedBadges.length}/{totalBadges}</span>
            <span className="kg-stat-label">Badges</span>
          </div>
          {/* Sound toggle */}
          <button
            className="kg-sound-toggle"
            onClick={() => {
              setSoundOn(v => { saveJSON('kg-sound', !v); return !v; });
            }}
            aria-label={soundOn ? 'Mute celebration sounds' : 'Unmute celebration sounds'}
            title={soundOn ? 'Sounds on — click to mute' : 'Sounds off — click to unmute'}
          >
            <img
              src={soundOn ? '/icons/success.svg' : '/icons/lock.svg'}
              alt=""
              aria-hidden="true"
              width={14}
              height={14}
              style={{ verticalAlign: 'middle' }}
            />
          </button>
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

      {/* Badge collection — show all badges (locked + unlocked) */}
      <div className="kg-badge-shelf" aria-label="Your badge collection">
        <h3 className="kg-badge-shelf-title">
          <img src="/icons/games/builder-badges.svg" alt="" aria-hidden="true" className="kg-shelf-title-icon" />
          Your Badges ({earnedBadges.length}/{totalBadges} unlocked)
        </h3>
        <div className="kg-badge-shelf-row">
          {KIDS_BADGES.map(badge => {
            const isEarned = earnedBadges.includes(badge.id);
            const dateStr  = badgeDates[badge.id]
              ? new Date(badgeDates[badge.id]).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : null;
            return (
              <div
                key={badge.id}
                className={`kg-shelf-badge${isEarned ? ' kg-shelf-badge-earned' : ' kg-shelf-badge-locked'}`}
                style={isEarned
                  ? { background: badge.color, borderColor: badge.border }
                  : { background: '#f1f5f9', borderColor: '#cbd5e1' }}
                title={isEarned ? `${badge.label}: ${badge.desc}` : `${badge.label} — not yet earned`}
                aria-label={isEarned
                  ? `${badge.label} badge earned${dateStr ? ` on ${dateStr}` : ''}: ${badge.desc}`
                  : `${badge.label} badge — locked`}
              >
                <span className="kg-shelf-badge-emoji" aria-hidden="true">
                  {isEarned
                    ? <img src={badge.icon} alt="" width={28} height={28} style={{ verticalAlign: 'middle' }} />
                    : <img src="/icons/lock.svg" alt="" width={28} height={28} style={{ verticalAlign: 'middle' }} />}
                </span>
                <span className="kg-shelf-badge-label">
                  {badge.label}
                </span>
                {isEarned && dateStr && (
                  <span className="kg-shelf-badge-date" aria-hidden="true">{dateStr}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
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
      <span className="kg-badge-toast-emoji" aria-hidden="true">
        <img src={badge.icon} alt="" width={28} height={28} style={{ verticalAlign: 'middle' }} />
      </span>
      <div>
        <strong><img src="/icons/badge.svg" alt="" aria-hidden="true" style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 4 }} />Badge Unlocked: {badge.label}!</strong>
        <p style={{ margin: 0, fontSize: '.82rem' }}>{badge.desc}</p>
      </div>
    </div>
  );
}
