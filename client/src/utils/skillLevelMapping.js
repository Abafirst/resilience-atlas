/**
 * skillLevelMapping.js
 * Converts numeric dimension scores to skills-based proficiency levels.
 * Keeps numeric scores in the backend (for research/analytics) while
 * exposing only skill-level language to the user-facing UI.
 */

/**
 * Returns skill-level metadata for a numeric score (0–100).
 * @param {number} score
 */
export function getSkillLevel(score) {
  if (score >= 70) {
    return {
      level: 'Mastery',
      ring: 3,
      label: 'Developed Skill',
      icon: '🌟',
      description: 'Your anchor. You naturally draw on these skills under pressure.',
    };
  }
  if (score >= 40) {
    return {
      level: 'Building',
      ring: 2,
      label: 'Building Skill',
      icon: '🌱',
      description: 'Actively strengthening. Consistent practice is showing.',
    };
  }
  return {
    level: 'Foundation',
    ring: 1,
    label: 'Foundational Skill',
    icon: '⚡',
    description: 'Your growth edge. Fertile ground for development.',
  };
}

/**
 * Returns the CSS modifier class for a skill-level badge.
 * @param {'Mastery'|'Building'|'Foundation'} level
 */
export function getSkillBadgeClass(level) {
  if (level === 'Mastery') return 'skill-badge--developed';
  if (level === 'Building') return 'skill-badge--building';
  return 'skill-badge--foundation';
}

/**
 * Builds a structured skill profile from a scores object.
 * Accepts scores in the format used by ResultsPage:
 *   { 'Dimension-Name': { percentage: 0-100 } | number }
 *
 * @param {Object} scores
 * @returns {{ primary, secondary, growthEdge, all }}
 */
export function buildSkillsProfile(scores) {
  const entries = Object.entries(scores).map(([dim, scoreObj]) => {
    const pct = typeof scoreObj === 'object' && scoreObj !== null ? scoreObj.percentage : scoreObj;
    return { dimension: dim, score: pct ?? 50, skillLevel: getSkillLevel(pct ?? 50) };
  });

  const sorted = [...entries].sort((a, b) => b.score - a.score);

  return {
    primary: sorted[0],
    secondary: sorted.slice(1, sorted.length - 1),
    growthEdge: sorted[sorted.length - 1],
    all: entries,
  };
}
