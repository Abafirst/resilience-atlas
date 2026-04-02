/**
 * Resilience Atlas — Kids Game Badges
 * Badge definitions for the Kids Interactive Games System.
 */

export const KIDS_BADGES = [
  /* ── Explorer Badges (general) ── */
  { id: 'first-step',       emoji: '👣', label: 'First Step',       desc: 'You started your resilience journey!',          color: '#fef9c3', border: '#fbbf24' },
  { id: 'game-starter',     emoji: '🎮', label: 'Game Starter',     desc: 'You played your first game!',                   color: '#ede9fe', border: '#7c3aed' },
  { id: 'explorer',         emoji: '🧭', label: 'Explorer',         desc: 'You explored all three age groups!',            color: '#e0f2fe', border: '#0284c7' },
  { id: 'resilience-star',  emoji: '⭐', label: 'Resilience Star',  desc: 'You earned 10 stars!',                          color: '#fef3c7', border: '#d97706' },
  { id: 'super-star',       emoji: '🌟', label: 'Super Star',       desc: 'You earned 25 stars!',                          color: '#fef9c3', border: '#ca8a04' },

  /* ── Compass Spinner Badges ── */
  { id: 'spinner-first',    emoji: '🌀', label: 'Spinner',          desc: 'You completed your first Compass Spin!',        color: '#f0fdf4', border: '#16a34a' },
  { id: 'courage-finder',   emoji: '💪', label: 'Courage Finder',   desc: 'You found "Courage" on the compass!',           color: '#fff7ed', border: '#ea580c' },
  { id: 'word-master',      emoji: '📖', label: 'Word Master',      desc: 'You matched 5 resilience words!',               color: '#ede9fe', border: '#7c3aed' },

  /* ── Map Collector Badges ── */
  { id: 'map-starter',      emoji: '🗺️',  label: 'Map Starter',     desc: 'You found your first map item!',                color: '#e0f2fe', border: '#0284c7' },
  { id: 'helper-finder',    emoji: '🤝', label: 'Helper Finder',    desc: 'You found all the helpers on the map!',         color: '#fdf4ff', border: '#a21caf' },
  { id: 'map-master',       emoji: '🏅', label: 'Map Master',       desc: 'You completed the full map!',                   color: '#fef9c3', border: '#ca8a04' },

  /* ── Builder Badges ── */
  { id: 'story-listener',   emoji: '👂', label: 'Story Listener',   desc: 'You discovered the power of stories!',         color: '#fff7ed', border: '#ea580c' },
  { id: 'feelings-explorer',emoji: '💭', label: 'Feelings Explorer',desc: 'You explored your feelings!',                  color: '#ffe4e6', border: '#e11d48' },
  { id: 'builder-first',    emoji: '🔨', label: 'Builder',          desc: 'You earned your first Builder Badge!',         color: '#fef9c3', border: '#fbbf24' },

  /* ── Navigator Quest Badges ── */
  { id: 'quest-starter',    emoji: '⚔️', label: 'Quest Starter',    desc: 'You began your first Quest!',                  color: '#f0fdf4', border: '#16a34a' },
  { id: 'emotion-hero',     emoji: '💜', label: 'Emotion Hero',     desc: 'You completed the Emotional Adventure!',        color: '#fdf4ff', border: '#a21caf' },
  { id: 'quest-master',     emoji: '🗡️', label: 'Quest Master',     desc: 'You completed all three quest steps!',          color: '#fef3c7', border: '#d97706' },

  /* ── Resilience Mountain Badges ── */
  { id: 'climber',          emoji: '🧗', label: 'Climber',          desc: 'You started climbing Resilience Mountain!',    color: '#e0f2fe', border: '#0284c7' },
  { id: 'peak-bagger',      emoji: '🏔️', label: 'Peak Bagger',     desc: 'You reached the summit of a peak!',             color: '#ede9fe', border: '#7c3aed' },
  { id: 'summit-legend',    emoji: '🏆', label: 'Summit Legend',    desc: 'You climbed all 6 peaks!',                      color: '#fef9c3', border: '#ca8a04' },

  /* ── Treasure Explorer Badges ── */
  { id: 'treasure-hunter',  emoji: '💎', label: 'Treasure Hunter',  desc: 'You found your first treasure!',               color: '#fff7ed', border: '#ea580c' },
  { id: 'island-explorer',  emoji: '🏝️', label: 'Island Explorer', desc: 'You explored Friendship Beach!',                color: '#e0f2fe', border: '#0284c7' },
  { id: 'treasure-master',  emoji: '👑', label: 'Treasure Master',  desc: 'You found all the treasures!',                  color: '#fef9c3', border: '#ca8a04' },

  /* ── Navigator Challenges Badges ── */
  { id: 'challenge-taker',  emoji: '🎯', label: 'Challenge Taker',  desc: 'You completed your first challenge!',          color: '#f0fdf4', border: '#16a34a' },
  { id: 'streak-3',         emoji: '🔥', label: 'On Fire',          desc: 'You got 3 correct answers in a row!',           color: '#fff7ed', border: '#ea580c' },
  { id: 'quiz-master',      emoji: '🧠', label: 'Quiz Master',      desc: 'You scored 10/10 on a challenge round!',        color: '#ede9fe', border: '#7c3aed' },

  /* ── Arena Battles Badges ── */
  { id: 'arena-warrior',    emoji: '⚡', label: 'Arena Warrior',    desc: 'You entered the Arena!',                       color: '#fef3c7', border: '#d97706' },
  { id: 'builder-beater',   emoji: '🏆', label: 'Builder Beater',   desc: 'You beat Kai the Builder!',                    color: '#fef9c3', border: '#ca8a04' },
  { id: 'unbeatable',       emoji: '👑', label: 'Unbeatable',       desc: 'You won 5 arena battles!',                      color: '#ede9fe', border: '#7c3aed' },

  /* ── Quest Log Badges ── */
  { id: 'log-starter',      emoji: '📜', label: 'Log Starter',      desc: 'You started your first Quest Log!',            color: '#f0fdf4', border: '#16a34a' },
  { id: 'story-shaper',     emoji: '✍️', label: 'Story Shaper',    desc: 'You wrote your own resilience story!',          color: '#e0f2fe', border: '#0284c7' },
  { id: 'quest-legend',     emoji: '🌠', label: 'Quest Legend',     desc: 'You completed all Quest Log parts!',            color: '#fef9c3', border: '#ca8a04' },
];

/** Get a badge by its ID */
export function getBadgeById(id) {
  return KIDS_BADGES.find(b => b.id === id);
}
