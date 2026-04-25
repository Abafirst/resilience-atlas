/**
 * levels.js
 * XP level definitions for the IATLAS gamification system.
 */

export const LEVELS = [
  { level: 1, title: 'Explorer',     minXP: 0,     maxXP: 99,       color: '#94a3b8', icon: '🌱' },
  { level: 2, title: 'Seeker',       minXP: 100,   maxXP: 249,      color: '#64748b', icon: '🔍' },
  { level: 3, title: 'Apprentice',   minXP: 250,   maxXP: 499,      color: '#0891b2', icon: '📚' },
  { level: 4, title: 'Practitioner', minXP: 500,   maxXP: 999,      color: '#4f46e5', icon: '⚡' },
  { level: 5, title: 'Adept',        minXP: 1000,  maxXP: 1999,     color: '#7c3aed', icon: '🎯' },
  { level: 6, title: 'Expert',       minXP: 2000,  maxXP: 3499,     color: '#db2777', icon: '🏅' },
  { level: 7, title: 'Master',       minXP: 3500,  maxXP: 5499,     color: '#d97706', icon: '🏆' },
  { level: 8, title: 'Sage',         minXP: 5500,  maxXP: 9999,     color: '#059669', icon: '🌟' },
  { level: 9, title: 'Luminary',     minXP: 10000, maxXP: Infinity, color: '#eab308', icon: '👑' },
];

/**
 * Calculate the current level info from total XP.
 * @param {number} totalXP
 * @returns {{ level: number, title: string, progress: number, color: string, icon: string, currentLevelXP: number, nextLevelXP: number, xpToNext: number }}
 */
export function calculateLevel(totalXP) {
  const xp = Math.max(0, totalXP);
  const levelData = LEVELS.find(l => xp >= l.minXP && xp <= l.maxXP) || LEVELS[LEVELS.length - 1];
  const isMax = levelData.level === LEVELS.length;
  const progress = isMax
    ? 100
    : Math.min(100, Math.round(((xp - levelData.minXP) / (levelData.maxXP - levelData.minXP)) * 100));
  const xpToNext = isMax ? 0 : levelData.maxXP + 1 - xp;
  return {
    level: levelData.level,
    title: levelData.title,
    progress,
    color: levelData.color,
    icon: levelData.icon,
    currentLevelXP: levelData.minXP,
    nextLevelXP: isMax ? levelData.maxXP : levelData.maxXP + 1,
    xpToNext,
    isMax,
  };
}
