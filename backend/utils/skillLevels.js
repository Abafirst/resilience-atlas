'use strict';

/**
 * skillLevels.js
 *
 * Skill level utilities for skills-based assessment display.
 * Hides numeric scores from user-facing content while preserving backend data
 * for research and analytics purposes.
 */

const SKILL_LEVELS = {
    MASTERY: {
        min: 70,
        label: 'Developed Skill',
        shortLabel: 'Developed',
        icon: '🌟',
        color: '#10b981',
        description: 'Your anchor. You naturally draw on these skills under pressure.',
    },
    BUILDING: {
        min: 40,
        label: 'Building Skill',
        shortLabel: 'Building',
        icon: '🌱',
        color: '#3b82f6',
        description: 'Actively strengthening. Consistent practice is showing.',
    },
    FOUNDATION: {
        min: 0,
        label: 'Foundational Skill',
        shortLabel: 'Foundation',
        icon: '⚡',
        color: '#f97316',
        description: 'Your growth edge. Fertile ground for development.',
    },
};

/**
 * Get skill level object for a numeric score.
 * @param {number} score - 0-100
 * @returns {object} skill level metadata
 */
function getSkillLevel(score) {
    if (score >= SKILL_LEVELS.MASTERY.min) return SKILL_LEVELS.MASTERY;
    if (score >= SKILL_LEVELS.BUILDING.min) return SKILL_LEVELS.BUILDING;
    return SKILL_LEVELS.FOUNDATION;
}

/**
 * Get the full skill level label (e.g. "Developed Skill").
 * @param {number} score
 * @returns {string}
 */
function getSkillLevelLabel(score) {
    return getSkillLevel(score).label;
}

/**
 * Get the short skill level label (e.g. "Developed").
 * @param {number} score
 * @returns {string}
 */
function getSkillLevelShortLabel(score) {
    return getSkillLevel(score).shortLabel;
}

/**
 * Get the skill level icon emoji (e.g. "🌟").
 * @param {number} score
 * @returns {string}
 */
function getSkillLevelIcon(score) {
    return getSkillLevel(score).icon;
}

/**
 * Get a plain-English description of the skill level.
 * @param {number} score
 * @returns {string}
 */
function getSkillLevelDescription(score) {
    return getSkillLevel(score).description;
}

/**
 * Get the brand color for the skill level.
 * @param {number} score
 * @returns {string} hex color
 */
function getSkillLevelColor(score) {
    return getSkillLevel(score).color;
}

module.exports = {
    SKILL_LEVELS,
    getSkillLevel,
    getSkillLevelLabel,
    getSkillLevelShortLabel,
    getSkillLevelIcon,
    getSkillLevelDescription,
    getSkillLevelColor,
};
