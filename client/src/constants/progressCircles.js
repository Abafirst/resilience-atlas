/**
 * progressCircles.js — Constants for the Progress Circles feature.
 *
 * Role colours, labels and default permission matrices used across the
 * Progress Circle UI components.
 */

export const ROLE_COLORS = {
  parent:        { bg: '#eef2ff', color: '#4f46e5', label: 'Parent',        icon: '👨‍👩‍👧'    },
  guardian:      { bg: '#ede9fe', color: '#7c3aed', label: 'Guardian',      icon: '🛡️'     },
  caregiver:     { bg: '#dbeafe', color: '#2563eb', label: 'Caregiver',     icon: '💙'     },
  grandparent:   { bg: '#fce7f3', color: '#db2777', label: 'Grandparent',   icon: '👴'     },
  foster_parent: { bg: '#fff7ed', color: '#ea580c', label: 'Foster Parent', icon: '🏠'     },
  family_member: { bg: '#f3f4f6', color: '#6b7280', label: 'Family',        icon: '👨‍👩‍👧‍👦'   },
  slp:           { bg: '#d1fae5', color: '#059669', label: 'SLP',           icon: '💬'     },
  ot:            { bg: '#fef3c7', color: '#d97706', label: 'OT',            icon: '🧩'     },
  bcba:          { bg: '#fce7f3', color: '#db2777', label: 'BCBA',          icon: '🎯'     },
  teacher:       { bg: '#e0f2fe', color: '#0891b2', label: 'Teacher',       icon: '📚'     },
  counselor:     { bg: '#ede9fe', color: '#7c3aed', label: 'Counselor',     icon: '🎓'     },
  therapist:     { bg: '#f3f4f6', color: '#6b7280', label: 'Therapist',     icon: '🧠'     },
  coach:         { bg: '#fef3c7', color: '#d97706', label: 'Coach',         icon: '⚡'     },
  employer:      { bg: '#f3f4f6', color: '#374151', label: 'Employer',      icon: '🏢'     },
  mentor:        { bg: '#f0fdf4', color: '#16a34a', label: 'Mentor',        icon: '🌟'     },
  other:         { bg: '#f9fafb', color: '#9ca3af', label: 'Other',         icon: '👤'     },
};

export const ROLE_CATEGORIES = {
  'Family & Caregivers': ['parent', 'guardian', 'caregiver', 'grandparent', 'foster_parent', 'family_member'],
  'Healthcare & Therapy': ['slp', 'ot', 'bcba', 'therapist', 'counselor'],
  'Education': ['teacher'],
  'Work & Community': ['coach', 'mentor', 'employer', 'other'],
};

/** Full list of valid roles matching the backend enum. */
export const VALID_ROLES = [
  'parent', 'guardian', 'caregiver', 'grandparent', 'foster_parent', 'family_member',
  'slp', 'ot', 'bcba', 'teacher', 'counselor', 'therapist', 'coach',
  'employer', 'mentor', 'other',
];

/** Privacy level options. */
export const PRIVACY_LEVELS = [
  {
    value:       'full',
    label:       'Full Access',
    description: 'All stakeholders can see all data, activities, and notes.',
    icon:        '🔓',
  },
  {
    value:       'aggregated',
    label:       'Aggregated (Recommended)',
    description: 'Stakeholders see progress summaries. Individual activity details are shared only with those who have permission.',
    icon:        '📊',
  },
  {
    value:       'minimal',
    label:       'Minimal',
    description: 'Each stakeholder sees only their own contributions. No cross-role data sharing.',
    icon:        '🔒',
  },
];

/** Default permission sets per role. */
export const DEFAULT_PERMISSIONS_BY_ROLE = {
  parent:        { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: true,  canAddActivities: true,  canInviteOthers: true  },
  guardian:      { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: true,  canAddActivities: true,  canInviteOthers: true  },
  caregiver:     { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  grandparent:   { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  foster_parent: { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  family_member: { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: false, canInviteOthers: false },
  slp:           { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  ot:            { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  bcba:          { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  teacher:       { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  counselor:     { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  therapist:     { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  coach:         { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  employer:      { canViewProgress: true,  canViewActivities: false, canViewDimensions: true,  canViewNotes: false, canAddActivities: false, canInviteOthers: false },
  mentor:        { canViewProgress: true,  canViewActivities: true,  canViewDimensions: true,  canViewNotes: false, canAddActivities: true,  canInviteOthers: false },
  other:         { canViewProgress: true,  canViewActivities: false, canViewDimensions: true,  canViewNotes: false, canAddActivities: false, canInviteOthers: false },
};

/** Human-readable labels for permission flags. */
export const PERMISSION_LABELS = {
  canViewProgress:   { label: 'View Progress',    description: 'Can see XP, level, badges, and streak data.' },
  canViewActivities: { label: 'View Activities',  description: 'Can see completed activities in the shared feed.' },
  canViewDimensions: { label: 'View Dimensions',  description: 'Can see scores across all 6 resilience dimensions.' },
  canViewNotes:      { label: 'View Notes',       description: 'Can see private notes left by other stakeholders.' },
  canAddActivities:  { label: 'Log Activities',   description: 'Can mark activities as completed and award XP.' },
  canInviteOthers:   { label: 'Invite Others',    description: 'Can invite new stakeholders to the circle.' },
};

/** Activity setting options. */
export const ACTIVITY_SETTINGS = [
  { value: 'home',      label: 'Home',      icon: '🏠' },
  { value: 'school',    label: 'School',    icon: '🏫' },
  { value: 'clinic',    label: 'Clinic',    icon: '🏥' },
  { value: 'therapy',   label: 'Therapy',   icon: '💊' },
  { value: 'community', label: 'Community', icon: '🏘️' },
  { value: 'work',      label: 'Work',      icon: '🏢' },
  { value: 'other',     label: 'Other',     icon: '📍' },
];
