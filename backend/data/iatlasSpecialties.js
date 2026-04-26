'use strict';

/**
 * IATLAS specialty identifiers.
 * Single source of truth used by both the Mongoose schema and the route handler.
 */
const IATLAS_VALID_SPECIALTIES = [
  'teachers',
  'slp',
  'ot',
  'daily-living',
  'social-skills',
  'clinicians',
  'caregivers',
];

module.exports = { IATLAS_VALID_SPECIALTIES };
