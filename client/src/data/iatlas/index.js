/**
 * index.js
 * Central export for all IATLAS skill module data.
 */

export { agenticGenerativeModules } from './agenticGenerative.js';
export { somaticRegulativeModules } from './somaticRegulative.js';
export { cognitiveNarrativeModules } from './cognitiveNarrative.js';
export { relationalConnectiveModules } from './relationalConnective.js';
export { emotionalAdaptiveModules } from './emotionalAdaptive.js';
export { spiritualExistentialModules } from './spiritualExistential.js';

import { agenticGenerativeModules } from './agenticGenerative.js';
import { somaticRegulativeModules } from './somaticRegulative.js';
import { cognitiveNarrativeModules } from './cognitiveNarrative.js';
import { relationalConnectiveModules } from './relationalConnective.js';
import { emotionalAdaptiveModules } from './emotionalAdaptive.js';
import { spiritualExistentialModules } from './spiritualExistential.js';

/** All modules combined, keyed by dimensionKey */
export const ALL_MODULES_BY_DIMENSION = {
  'agentic-generative': agenticGenerativeModules,
  'somatic-regulative': somaticRegulativeModules,
  'cognitive-narrative': cognitiveNarrativeModules,
  'relational-connective': relationalConnectiveModules,
  'emotional-adaptive': emotionalAdaptiveModules,
  'spiritual-existential': spiritualExistentialModules,
};

/** Flat list of all modules across all dimensions */
export const ALL_MODULES = [
  ...agenticGenerativeModules,
  ...somaticRegulativeModules,
  ...cognitiveNarrativeModules,
  ...relationalConnectiveModules,
  ...emotionalAdaptiveModules,
  ...spiritualExistentialModules,
];

/** Dimension metadata for display */
export const DIMENSION_META = {
  'agentic-generative': {
    key: 'agentic-generative',
    title: 'Agentic-Generative',
    tagline: 'Master your goals and take purposeful action',
    color: '#4f46e5',
    colorLight: '#eef2ff',
    icon: '/icons/agentic-generative.svg',
    emoji: '🎯',
  },
  'somatic-regulative': {
    key: 'somatic-regulative',
    title: 'Somatic-Regulative',
    tagline: 'Harness your body as a resilience resource',
    color: '#059669',
    colorLight: '#d1fae5',
    icon: '/icons/somatic-regulative.svg',
    emoji: '🧘',
  },
  'cognitive-narrative': {
    key: 'cognitive-narrative',
    title: 'Cognitive-Interpretive',
    tagline: 'Reshape how you interpret challenge and adversity',
    color: '#7c3aed',
    colorLight: '#ede9fe',
    icon: '/icons/cognitive-narrative.svg',
    emoji: '💭',
  },
  'relational-connective': {
    key: 'relational-connective',
    title: 'Relational-Connective',
    tagline: 'Build and sustain meaningful connections under stress',
    color: '#0891b2',
    colorLight: '#e0f2fe',
    icon: '/icons/relational-connective.svg',
    emoji: '💗',
  },
  'emotional-adaptive': {
    key: 'emotional-adaptive',
    title: 'Emotional-Adaptive',
    tagline: 'Process emotions with flexibility and compassion',
    color: '#db2777',
    colorLight: '#fce7f3',
    icon: '/icons/emotional-adaptive.svg',
    emoji: '🎨',
  },
  'spiritual-existential': {
    key: 'spiritual-existential',
    title: 'Spiritual-Existential',
    tagline: 'Ground resilience in values, meaning, and purpose',
    color: '#d97706',
    colorLight: '#fef3c7',
    icon: '/icons/spiritual-reflective.svg',
    emoji: '✨',
  },
};

/** Level metadata */
export const LEVEL_META = {
  foundation: {
    key: 'foundation',
    label: 'Foundation',
    description: 'Core skills and initial competencies',
    icon: '/icons/agentic-generative.svg',
    order: 1,
  },
  building: {
    key: 'building',
    label: 'Building',
    description: 'Integrated practices and sustained engagement',
    icon: '/icons/game-target.svg',
    order: 2,
  },
  mastery: {
    key: 'mastery',
    label: 'Mastery',
    description: 'Advanced applications and expert-level integration',
    icon: '/icons/kids-trophy.svg',
    order: 3,
  },
};

/** Get modules for a dimension filtered by level */
export function getModulesByLevel(dimensionKey, level) {
  const modules = ALL_MODULES_BY_DIMENSION[dimensionKey] || [];
  if (!level) return modules;
  return modules.filter(m => m.level === level);
}

/** Find a single module by dimension + id */
export function findModule(dimensionKey, skillId) {
  const modules = ALL_MODULES_BY_DIMENSION[dimensionKey] || [];
  return modules.find(m => m.id === skillId) || null;
}
