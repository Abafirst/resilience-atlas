'use strict';

/**
 * child-profile-management.test.js
 * Unit tests for child profile creation/management logic:
 * - Data validation rules (name, ageGroup, gender, dateOfBirth)
 * - Clinical data sanitisation
 * - Preferences sanitisation
 * - Profile age calculation
 * - Step wizard field validation
 */

// ── Constants (mirror backend/model values) ───────────────────────────────────

const VALID_AGE_GROUPS   = ['5-7', '8-10', '11-14', '15-18'];
const VALID_GENDERS      = ['male', 'female', 'non-binary', 'prefer-not-to-say', ''];
const VALID_SUPPORT_LVLS = ['low', 'moderate', 'high', 'intensive', ''];

const MAX_NAME_LENGTH     = 64;
const MAX_TEXT_LENGTH     = 500;
const MAX_ARRAY_ITEMS     = 20;

// ── Profile field validators (mirror backend route logic) ─────────────────────

function validateName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return 'Profile name is required.';
  }
  if (name.trim().length > MAX_NAME_LENGTH) {
    return `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }
  return null;
}

function validateAgeGroup(ageGroup) {
  if (!ageGroup) return null; // optional
  if (!VALID_AGE_GROUPS.includes(ageGroup)) return 'Invalid age group.';
  return null;
}

function validateGender(gender) {
  if (gender === undefined || gender === null) return null; // optional
  if (!VALID_GENDERS.includes(gender)) return 'Invalid gender value.';
  return null;
}

function validateDateOfBirth(dob) {
  if (!dob) return null; // optional
  const parsed = new Date(dob);
  if (isNaN(parsed.getTime())) return 'Invalid date of birth.';
  if (parsed > new Date()) return 'Date of birth cannot be in the future.';
  return null;
}

function sanitiseClinical(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const out = {};
  if (Array.isArray(raw.diagnoses))  out.diagnoses  = raw.diagnoses.map(String).slice(0, MAX_ARRAY_ITEMS);
  if (Array.isArray(raw.goals))      out.goals      = raw.goals.map(String).slice(0, MAX_ARRAY_ITEMS);
  if (typeof raw.strengths   === 'string') out.strengths   = raw.strengths.slice(0, MAX_TEXT_LENGTH);
  if (typeof raw.challenges  === 'string') out.challenges  = raw.challenges.slice(0, MAX_TEXT_LENGTH);
  if (VALID_SUPPORT_LVLS.includes(raw.supportLevel)) out.supportLevel = raw.supportLevel;
  return Object.keys(out).length ? out : undefined;
}

function sanitisePreferences(raw) {
  if (!raw || typeof raw !== 'object') return undefined;
  const out = {};
  if (Array.isArray(raw.activities)) out.activities = raw.activities.map(String).slice(0, MAX_ARRAY_ITEMS);
  if (typeof raw.sensoryPreferences  === 'string') out.sensoryPreferences  = raw.sensoryPreferences.slice(0, MAX_TEXT_LENGTH);
  if (typeof raw.communicationStyle  === 'string') out.communicationStyle  = raw.communicationStyle.slice(0, MAX_TEXT_LENGTH);
  if (typeof raw.learningPreferences === 'string') out.learningPreferences = raw.learningPreferences.slice(0, MAX_TEXT_LENGTH);
  return Object.keys(out).length ? out : undefined;
}

function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  return Math.floor((Date.now() - dob) / (365.25 * 24 * 3600 * 1000));
}

// ── Tests: name validation ────────────────────────────────────────────────────

describe('validateName', () => {
  test('accepts a valid name', () => {
    expect(validateName('Alex')).toBeNull();
    expect(validateName('  Jordan  ')).toBeNull();
  });

  test('rejects an empty name', () => {
    expect(validateName('')).not.toBeNull();
    expect(validateName('   ')).not.toBeNull();
  });

  test('rejects null or undefined', () => {
    expect(validateName(null)).not.toBeNull();
    expect(validateName(undefined)).not.toBeNull();
  });

  test('rejects a name exceeding max length', () => {
    expect(validateName('A'.repeat(MAX_NAME_LENGTH + 1))).not.toBeNull();
  });

  test('accepts a name at exactly max length', () => {
    expect(validateName('A'.repeat(MAX_NAME_LENGTH))).toBeNull();
  });
});

// ── Tests: age group validation ───────────────────────────────────────────────

describe('validateAgeGroup', () => {
  test('accepts all valid age groups', () => {
    VALID_AGE_GROUPS.forEach(ag => {
      expect(validateAgeGroup(ag)).toBeNull();
    });
  });

  test('accepts undefined/null (optional)', () => {
    expect(validateAgeGroup(undefined)).toBeNull();
    expect(validateAgeGroup(null)).toBeNull();
    expect(validateAgeGroup('')).toBeNull();
  });

  test('rejects unknown age groups', () => {
    expect(validateAgeGroup('1-4')).not.toBeNull();
    expect(validateAgeGroup('19-25')).not.toBeNull();
    expect(validateAgeGroup('all')).not.toBeNull();
  });
});

// ── Tests: gender validation ──────────────────────────────────────────────────

describe('validateGender', () => {
  test('accepts all valid gender values', () => {
    VALID_GENDERS.forEach(g => {
      expect(validateGender(g)).toBeNull();
    });
  });

  test('accepts null/undefined (optional)', () => {
    expect(validateGender(null)).toBeNull();
    expect(validateGender(undefined)).toBeNull();
  });

  test('rejects unknown gender values', () => {
    expect(validateGender('other')).not.toBeNull();
    expect(validateGender('unknown')).not.toBeNull();
  });
});

// ── Tests: date of birth validation ──────────────────────────────────────────

describe('validateDateOfBirth', () => {
  test('accepts a valid past date string', () => {
    expect(validateDateOfBirth('2015-06-15')).toBeNull();
    expect(validateDateOfBirth('2000-01-01')).toBeNull();
  });

  test('accepts undefined/empty (optional)', () => {
    expect(validateDateOfBirth(undefined)).toBeNull();
    expect(validateDateOfBirth('')).toBeNull();
    expect(validateDateOfBirth(null)).toBeNull();
  });

  test('rejects an invalid date string', () => {
    expect(validateDateOfBirth('not-a-date')).not.toBeNull();
    expect(validateDateOfBirth('2025-13-45')).not.toBeNull();
  });

  test('rejects a future date', () => {
    const future = new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0];
    expect(validateDateOfBirth(future)).not.toBeNull();
  });
});

// ── Tests: clinical data sanitisation ────────────────────────────────────────

describe('sanitiseClinical', () => {
  test('returns undefined for null/undefined/non-object input', () => {
    expect(sanitiseClinical(null)).toBeUndefined();
    expect(sanitiseClinical(undefined)).toBeUndefined();
    expect(sanitiseClinical('string')).toBeUndefined();
  });

  test('returns undefined for an empty object', () => {
    expect(sanitiseClinical({})).toBeUndefined();
  });

  test('passes through valid diagnoses array', () => {
    const result = sanitiseClinical({ diagnoses: ['ASD', 'ADHD'] });
    expect(result.diagnoses).toEqual(['ASD', 'ADHD']);
  });

  test('truncates diagnoses array to max items', () => {
    const many = Array.from({ length: 25 }, (_, i) => `Diagnosis ${i}`);
    const result = sanitiseClinical({ diagnoses: many });
    expect(result.diagnoses).toHaveLength(MAX_ARRAY_ITEMS);
  });

  test('passes through valid strengths string', () => {
    const result = sanitiseClinical({ strengths: 'Very creative' });
    expect(result.strengths).toBe('Very creative');
  });

  test('truncates strengths to max length', () => {
    const long = 'x'.repeat(MAX_TEXT_LENGTH + 100);
    const result = sanitiseClinical({ strengths: long });
    expect(result.strengths).toHaveLength(MAX_TEXT_LENGTH);
  });

  test('accepts valid support level', () => {
    VALID_SUPPORT_LVLS.filter(Boolean).forEach(sl => {
      const result = sanitiseClinical({ supportLevel: sl });
      expect(result.supportLevel).toBe(sl);
    });
  });

  test('ignores invalid support level', () => {
    const result = sanitiseClinical({ supportLevel: 'extreme' });
    expect(result).toBeUndefined();
  });

  test('passes through goals array', () => {
    const result = sanitiseClinical({ goals: ['Improve social skills', 'Build confidence'] });
    expect(result.goals).toHaveLength(2);
  });
});

// ── Tests: preferences sanitisation ──────────────────────────────────────────

describe('sanitisePreferences', () => {
  test('returns undefined for null/undefined input', () => {
    expect(sanitisePreferences(null)).toBeUndefined();
    expect(sanitisePreferences(undefined)).toBeUndefined();
  });

  test('returns undefined for an empty object', () => {
    expect(sanitisePreferences({})).toBeUndefined();
  });

  test('passes through valid activities array', () => {
    const result = sanitisePreferences({ activities: ['Music', 'Arts & Crafts'] });
    expect(result.activities).toEqual(['Music', 'Arts & Crafts']);
  });

  test('truncates activities array to max items', () => {
    const many = Array.from({ length: 25 }, (_, i) => `Activity ${i}`);
    const result = sanitisePreferences({ activities: many });
    expect(result.activities).toHaveLength(MAX_ARRAY_ITEMS);
  });

  test('truncates text fields to max length', () => {
    const long = 'x'.repeat(MAX_TEXT_LENGTH + 50);
    const result = sanitisePreferences({
      sensoryPreferences:  long,
      communicationStyle:  long,
      learningPreferences: long,
    });
    expect(result.sensoryPreferences).toHaveLength(MAX_TEXT_LENGTH);
    expect(result.communicationStyle).toHaveLength(MAX_TEXT_LENGTH);
    expect(result.learningPreferences).toHaveLength(MAX_TEXT_LENGTH);
  });
});

// ── Tests: age calculation ────────────────────────────────────────────────────

describe('calculateAge', () => {
  test('returns null for undefined/null input', () => {
    expect(calculateAge(undefined)).toBeNull();
    expect(calculateAge(null)).toBeNull();
    expect(calculateAge('')).toBeNull();
  });

  test('returns null for an invalid date', () => {
    expect(calculateAge('not-a-date')).toBeNull();
  });

  test('returns a non-negative integer for a valid birth date', () => {
    const age = calculateAge('2015-01-01');
    expect(typeof age).toBe('number');
    expect(age).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(age)).toBe(true);
  });

  test('calculates age for a 10-year-old born exactly 10 years ago', () => {
    const tenYearsAgo = new Date(Date.now() - 10 * 365.25 * 24 * 3600 * 1000);
    const dob = tenYearsAgo.toISOString().split('T')[0];
    const age = calculateAge(dob);
    expect(age).toBe(10);
  });
});

// ── Tests: wizard step validation ─────────────────────────────────────────────

describe('Wizard step 1 validation', () => {
  function validateStep1({ name, dateOfBirth, gender, ageGroup }) {
    const errors = [];
    const nameErr = validateName(name);
    if (nameErr) errors.push(nameErr);
    const dobErr = validateDateOfBirth(dateOfBirth);
    if (dobErr) errors.push(dobErr);
    const genderErr = validateGender(gender);
    if (genderErr) errors.push(genderErr);
    const ageErr = validateAgeGroup(ageGroup);
    if (ageErr) errors.push(ageErr);
    return errors;
  }

  test('passes with only name provided', () => {
    expect(validateStep1({ name: 'Alex' })).toHaveLength(0);
  });

  test('fails with empty name', () => {
    expect(validateStep1({ name: '' })).toHaveLength(1);
  });

  test('fails with invalid age group', () => {
    expect(validateStep1({ name: 'Alex', ageGroup: 'infant' })).toHaveLength(1);
  });

  test('passes with all valid fields', () => {
    const errors = validateStep1({
      name:        'Jordan',
      dateOfBirth: '2015-03-20',
      gender:      'female',
      ageGroup:    '8-10',
    });
    expect(errors).toHaveLength(0);
  });
});

// ── Tests: profile data model integrity ───────────────────────────────────────

describe('Profile data model', () => {
  test('all valid age groups are recognised', () => {
    expect(VALID_AGE_GROUPS).toContain('5-7');
    expect(VALID_AGE_GROUPS).toContain('8-10');
    expect(VALID_AGE_GROUPS).toContain('11-14');
    expect(VALID_AGE_GROUPS).toContain('15-18');
    expect(VALID_AGE_GROUPS).toHaveLength(4);
  });

  test('all valid genders are recognised', () => {
    expect(VALID_GENDERS).toContain('male');
    expect(VALID_GENDERS).toContain('female');
    expect(VALID_GENDERS).toContain('non-binary');
    expect(VALID_GENDERS).toContain('prefer-not-to-say');
    expect(VALID_GENDERS).toContain(''); // allow blank (unset)
  });

  test('all valid support levels are recognised', () => {
    expect(VALID_SUPPORT_LVLS).toContain('low');
    expect(VALID_SUPPORT_LVLS).toContain('moderate');
    expect(VALID_SUPPORT_LVLS).toContain('high');
    expect(VALID_SUPPORT_LVLS).toContain('intensive');
  });

  test('MAX_NAME_LENGTH is 64', () => {
    expect(MAX_NAME_LENGTH).toBe(64);
  });

  test('MAX_TEXT_LENGTH is 500', () => {
    expect(MAX_TEXT_LENGTH).toBe(500);
  });

  test('MAX_ARRAY_ITEMS is 20', () => {
    expect(MAX_ARRAY_ITEMS).toBe(20);
  });
});
