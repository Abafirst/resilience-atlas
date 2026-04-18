/**
 * Resilience Atlas — Kids Game Badges
 * Badge definitions for the Kids Interactive Games System.
 */

export const KIDS_BADGES = [
  /* ── Explorer Badges (general) ── */
  { id: 'first-step',       icon: './icons/badge.svg',              label: 'First Step',       desc: 'You started your resilience journey!',          color: '#fef9c3', border: '#fbbf24' },
  { id: 'game-starter',     icon: './icons/badges.svg',             label: 'Game Starter',     desc: 'You played your first game!',                   color: '#ede9fe', border: '#7c3aed' },
  { id: 'explorer',         icon: './icons/compass.svg',            label: 'Explorer',         desc: 'You explored all three age groups!',            color: '#e0f2fe', border: '#0284c7' },
  { id: 'resilience-star',  icon: './icons/star.svg',               label: 'Resilience Star',  desc: 'You earned 10 stars!',                          color: '#fef3c7', border: '#d97706' },
  { id: 'super-star',       icon: './icons/star.svg',               label: 'Super Star',       desc: 'You earned 25 stars!',                          color: '#fef9c3', border: '#ca8a04' },

  /* ── Compass Spinner Badges ── */
  { id: 'spinner-first',    icon: './icons/games/compass-spinner.svg', label: 'Spinner',       desc: 'You completed your first Compass Spin!',        color: '#f0fdf4', border: '#16a34a' },
  { id: 'courage-finder',   icon: './icons/strength.svg',           label: 'Courage Finder',   desc: 'You found "Courage" on the compass!',           color: '#fff7ed', border: '#ea580c' },
  { id: 'word-master',      icon: './icons/story.svg',              label: 'Word Master',      desc: 'You matched 5 resilience words!',               color: '#ede9fe', border: '#7c3aed' },

  /* ── Map Collector Badges ── */
  { id: 'map-starter',      icon: './icons/game-map.svg',           label: 'Map Starter',      desc: 'You found your first map item!',                color: '#e0f2fe', border: '#0284c7' },
  { id: 'helper-finder',    icon: './icons/connection.svg',         label: 'Helper Finder',    desc: 'You found all the helpers on the map!',         color: '#fdf4ff', border: '#a21caf' },
  { id: 'map-master',       icon: './icons/badge.svg',              label: 'Map Master',       desc: 'You completed the full map!',                   color: '#fef9c3', border: '#ca8a04' },

  /* ── Builder Badges ── */
  { id: 'story-listener',   icon: './icons/story.svg',              label: 'Story Listener',   desc: 'You discovered the power of stories!',         color: '#fff7ed', border: '#ea580c' },
  { id: 'feelings-explorer',icon: './icons/emotion.svg',            label: 'Feelings Explorer',desc: 'You explored your feelings!',                  color: '#ffe4e6', border: '#e11d48' },
  { id: 'builder-first',    icon: './icons/games/builder-badges.svg', label: 'Builder',        desc: 'You earned your first Builder Badge!',         color: '#fef9c3', border: '#fbbf24' },

  /* ── Navigator Quest Badges ── */
  { id: 'quest-starter',    icon: './icons/games/navigator-quest.svg', label: 'Quest Starter', desc: 'You began your first Quest!',                  color: '#f0fdf4', border: '#16a34a' },
  { id: 'emotion-hero',     icon: './icons/emotional-adaptive.svg', label: 'Emotion Hero',     desc: 'You completed the Emotional Adventure!',        color: '#fdf4ff', border: '#a21caf' },
  { id: 'quest-master',     icon: './icons/games/navigator-quest.svg', label: 'Quest Master',  desc: 'You completed all three quest steps!',          color: '#fef3c7', border: '#d97706' },

  /* ── Resilience Mountain Badges ── */
  { id: 'climber',          icon: './icons/games/resilience-mountain.svg', label: 'Climber',   desc: 'You started climbing Resilience Mountain!',    color: '#e0f2fe', border: '#0284c7' },
  { id: 'peak-bagger',      icon: './icons/games/resilience-mountain.svg', label: 'Peak Bagger', desc: 'You reached the summit of a peak!',          color: '#ede9fe', border: '#7c3aed' },
  { id: 'summit-legend',    icon: './icons/kids-trophy.svg',        label: 'Summit Legend',    desc: 'You climbed all 6 peaks!',                      color: '#fef9c3', border: '#ca8a04' },

  /* ── Treasure Explorer Badges ── */
  { id: 'treasure-hunter',  icon: './icons/games/treasure-explorer.svg', label: 'Treasure Hunter', desc: 'You found your first treasure!',          color: '#fff7ed', border: '#ea580c' },
  { id: 'island-explorer',  icon: './icons/games/treasure-explorer.svg', label: 'Island Explorer', desc: 'You explored Friendship Beach!',           color: '#e0f2fe', border: '#0284c7' },
  { id: 'treasure-master',  icon: './icons/kids-trophy.svg',        label: 'Treasure Master',  desc: 'You found all the treasures!',                  color: '#fef9c3', border: '#ca8a04' },

  /* ── Navigator Challenges Badges ── */
  { id: 'challenge-taker',  icon: './icons/game-target.svg',        label: 'Challenge Taker',  desc: 'You completed your first challenge!',          color: '#f0fdf4', border: '#16a34a' },
  { id: 'streak-3',         icon: './icons/streaks.svg',            label: 'On Fire',          desc: 'You got 3 correct answers in a row!',           color: '#fff7ed', border: '#ea580c' },
  { id: 'quiz-master',      icon: './icons/cognitive-narrative.svg',label: 'Quiz Master',      desc: 'You scored 10/10 on a challenge round!',        color: '#ede9fe', border: '#7c3aed' },

  /* ── Arena Battles Badges ── */
  { id: 'arena-warrior',    icon: './icons/agentic-generative.svg', label: 'Arena Warrior',    desc: 'You entered the Arena!',                       color: '#fef3c7', border: '#d97706' },
  { id: 'builder-beater',   icon: './icons/kids-trophy.svg',        label: 'Builder Beater',   desc: 'You beat Kai the Builder!',                    color: '#fef9c3', border: '#ca8a04' },
  { id: 'unbeatable',       icon: './icons/kids-trophy.svg',        label: 'Unbeatable',       desc: 'You won 5 arena battles!',                      color: '#ede9fe', border: '#7c3aed' },

  /* ── Quest Log Badges ── */
  { id: 'log-starter',      icon: './icons/games/quest-log.svg',    label: 'Log Starter',      desc: 'You started your first Quest Log!',            color: '#f0fdf4', border: '#16a34a' },
  { id: 'story-shaper',     icon: './icons/writing.svg',            label: 'Story Shaper',     desc: 'You wrote your own resilience story!',          color: '#e0f2fe', border: '#0284c7' },
  { id: 'quest-legend',     icon: './icons/star.svg',               label: 'Quest Legend',     desc: 'You completed all Quest Log parts!',            color: '#fef9c3', border: '#ca8a04' },

  /* ── Badge Quest Challenge Badges ── */
  { id: 'bq-calm',          icon: './icons/breathing.svg',          label: 'Calm Champion',    desc: 'You know how to calm yourself down!',           color: '#e0f2fe', border: '#0284c7' },
  { id: 'bq-brave',         icon: './icons/growth.svg',             label: 'Brave Learner',    desc: 'You embrace trying new things!',                color: '#f0fdf4', border: '#16a34a' },
  { id: 'bq-growth',        icon: './icons/goal.svg',               label: 'Growth Hero',      desc: 'You keep trying after mistakes!',               color: '#fef9c3', border: '#fbbf24' },
  { id: 'bq-helper',        icon: './icons/connection.svg',         label: 'Kind Helper',      desc: 'You show up for friends who are sad!',          color: '#ede9fe', border: '#7c3aed' },
  { id: 'bq-courage',       icon: './icons/strength.svg',           label: 'Courage Star',     desc: 'You understand what true bravery means!',       color: '#fff7ed', border: '#ea580c' },
  { id: 'bq-mindset',       icon: './icons/cognitive-narrative.svg',label: 'Mindset Master',   desc: 'You understand the growth mindset!',            color: '#ede9fe', border: '#7c3aed' },
  { id: 'bq-bounce',        icon: './icons/reframe.svg',            label: 'Bounce Back',      desc: 'You know resilience means bouncing back!',      color: '#dcfce7', border: '#16a34a' },
  { id: 'bq-cope',          icon: './icons/breathing.svg',          label: 'Coping Pro',       desc: 'You have healthy coping strategies!',           color: '#e0f2fe', border: '#0284c7' },
  { id: 'bq-eq',            icon: './icons/emotional-adaptive.svg', label: 'Emotion Expert',   desc: 'You understand emotional intelligence!',        color: '#fdf4ff', border: '#a21caf' },
  { id: 'bq-team',          icon: './icons/connection.svg',         label: 'Team Player',      desc: 'You value the power of teamwork!',              color: '#dcfce7', border: '#16a34a' },
  { id: 'bq-neuro',         icon: './icons/cognitive-narrative.svg',label: 'Neuro Thinker',    desc: 'You understand how the brain can change!',      color: '#e0f2fe', border: '#0284c7' },
  { id: 'bq-psych',         icon: './icons/strength.svg',           label: 'Resilience Ace',   desc: 'You grasp psychological resilience!',           color: '#fef3c7', border: '#d97706' },
  { id: 'bq-compassion',    icon: './icons/relational-connective.svg', label: 'Self-Compassion', desc: 'You understand compassion over criticism!',  color: '#fdf4ff', border: '#a21caf' },
  { id: 'bq-social',        icon: './icons/network.svg',            label: 'Social Strength',  desc: 'You value relationships and support!',          color: '#ede9fe', border: '#7c3aed' },
  { id: 'bq-growth-adv',    icon: './icons/star.svg',               label: 'Growth Pioneer',   desc: 'You understand post-traumatic growth!',         color: '#fef9c3', border: '#ca8a04' },
];

/** Get a badge by its ID */
export function getBadgeById(id) {
  return KIDS_BADGES.find(b => b.id === id);
}
