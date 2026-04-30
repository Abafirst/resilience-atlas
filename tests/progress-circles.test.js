'use strict';

/**
 * progress-circles.test.js
 * Unit tests for the Progress Circles feature:
 * - Permission logic (role-based defaults)
 * - Privacy level filtering
 * - Member validation
 * - Activity logging validation
 * - Role constants integrity
 */

// ── Constants (mirror backend values) ────────────────────────────────────────

const VALID_ROLES = [
  'parent', 'guardian', 'caregiver', 'grandparent', 'foster_parent',
  'family_member', 'slp', 'ot', 'bcba', 'teacher', 'counselor',
  'therapist', 'coach', 'employer', 'mentor', 'other',
];

const VALID_PRIVACY_LEVELS = ['full', 'aggregated', 'minimal'];

const VALID_SETTINGS = ['home', 'school', 'clinic', 'therapy', 'community', 'work', 'other'];

const ADMIN_ROLES = ['parent', 'guardian'];

const DEFAULT_PERMISSIONS_BY_ROLE = {
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

// ── Helper functions (mirror backend route logic) ─────────────────────────────

function validateRole(role) {
  if (!role || !VALID_ROLES.includes(role)) return 'Invalid role.';
  return null;
}

function validatePrivacyLevel(level) {
  if (!level || !VALID_PRIVACY_LEVELS.includes(level)) return 'Invalid privacy level.';
  return null;
}

function validateEmail(email) {
  if (!email || typeof email !== 'string' || !email.trim()) return 'Email is required.';
  const trimmed = email.trim();
  const atIdx = trimmed.indexOf('@');
  const lastDotIdx = trimmed.lastIndexOf('.');
  if (
    atIdx < 1 ||
    atIdx === trimmed.length - 1 ||
    lastDotIdx <= atIdx + 1 ||
    lastDotIdx === trimmed.length - 1 ||
    trimmed.includes(' ')
  ) {
    return 'Invalid email address.';
  }
  return null;
}

function validateSetting(setting) {
  if (!setting) return null; // optional
  if (!VALID_SETTINGS.includes(setting)) return 'Invalid setting.';
  return null;
}

function validateCircleName(name) {
  if (!name || typeof name !== 'string' || !name.trim()) return 'Circle name is required.';
  if (name.trim().length > 80) return 'Circle name must be 80 characters or fewer.';
  return null;
}

function isAdminRole(role) {
  return ADMIN_ROLES.includes(role);
}

function applyPrivacyFilter(data, memberUserId, memberRole, privacyLevel) {
  if (privacyLevel === 'full') return data;

  if (privacyLevel === 'minimal') {
    return {
      ...data,
      recentActivities: (data.recentActivities || []).filter(
        (a) => a.completedBy && memberUserId && a.completedBy.toString() === memberUserId.toString()
      ),
    };
  }

  // aggregated: employers see no activity details
  if (memberRole === 'employer') {
    return { ...data, recentActivities: [] };
  }

  return data;
}

// ── Tests: role validation ────────────────────────────────────────────────────

describe('validateRole', () => {
  test('accepts all valid roles', () => {
    VALID_ROLES.forEach((role) => {
      expect(validateRole(role)).toBeNull();
    });
  });

  test('rejects unknown roles', () => {
    expect(validateRole('admin')).not.toBeNull();
    expect(validateRole('nurse')).not.toBeNull();
    expect(validateRole('')).not.toBeNull();
    expect(validateRole(null)).not.toBeNull();
    expect(validateRole(undefined)).not.toBeNull();
  });
});

// ── Tests: privacy level validation ──────────────────────────────────────────

describe('validatePrivacyLevel', () => {
  test('accepts valid privacy levels', () => {
    VALID_PRIVACY_LEVELS.forEach((level) => {
      expect(validatePrivacyLevel(level)).toBeNull();
    });
  });

  test('rejects invalid privacy levels', () => {
    expect(validatePrivacyLevel('public')).not.toBeNull();
    expect(validatePrivacyLevel('none')).not.toBeNull();
    expect(validatePrivacyLevel('')).not.toBeNull();
    expect(validatePrivacyLevel(null)).not.toBeNull();
  });
});

// ── Tests: email validation ───────────────────────────────────────────────────

describe('validateEmail', () => {
  test('accepts valid emails', () => {
    expect(validateEmail('parent@example.com')).toBeNull();
    expect(validateEmail('teacher+school@org.edu')).toBeNull();
    expect(validateEmail('  user@domain.io  ')).toBeNull();
  });

  test('rejects empty / missing emails', () => {
    expect(validateEmail('')).not.toBeNull();
    expect(validateEmail(null)).not.toBeNull();
    expect(validateEmail(undefined)).not.toBeNull();
    expect(validateEmail('   ')).not.toBeNull();
  });

  test('rejects malformed emails', () => {
    expect(validateEmail('notanemail')).not.toBeNull();
    expect(validateEmail('@nodomain')).not.toBeNull();
    expect(validateEmail('missing@')).not.toBeNull();
  });
});

// ── Tests: setting validation ─────────────────────────────────────────────────

describe('validateSetting', () => {
  test('accepts all valid settings', () => {
    VALID_SETTINGS.forEach((s) => {
      expect(validateSetting(s)).toBeNull();
    });
  });

  test('accepts undefined / empty (optional field)', () => {
    expect(validateSetting(undefined)).toBeNull();
    expect(validateSetting(null)).toBeNull();
    expect(validateSetting('')).toBeNull();
  });

  test('rejects unknown settings', () => {
    expect(validateSetting('gym')).not.toBeNull();
    expect(validateSetting('office')).not.toBeNull();
  });
});

// ── Tests: circle name validation ─────────────────────────────────────────────

describe('validateCircleName', () => {
  test('accepts a valid name', () => {
    expect(validateCircleName("Emma's Care Team")).toBeNull();
    expect(validateCircleName('Amir Support Circle')).toBeNull();
  });

  test('rejects empty or whitespace-only names', () => {
    expect(validateCircleName('')).not.toBeNull();
    expect(validateCircleName('   ')).not.toBeNull();
    expect(validateCircleName(null)).not.toBeNull();
  });

  test('rejects names longer than 80 characters', () => {
    expect(validateCircleName('A'.repeat(81))).not.toBeNull();
  });

  test('accepts a name at exactly 80 characters', () => {
    expect(validateCircleName('A'.repeat(80))).toBeNull();
  });
});

// ── Tests: admin role detection ───────────────────────────────────────────────

describe('isAdminRole', () => {
  test('parent and guardian are admin roles', () => {
    expect(isAdminRole('parent')).toBe(true);
    expect(isAdminRole('guardian')).toBe(true);
  });

  test('all other roles are not admin roles', () => {
    const nonAdmins = VALID_ROLES.filter((r) => !ADMIN_ROLES.includes(r));
    nonAdmins.forEach((role) => {
      expect(isAdminRole(role)).toBe(false);
    });
  });
});

// ── Tests: default permissions by role ───────────────────────────────────────

describe('DEFAULT_PERMISSIONS_BY_ROLE', () => {
  const PERMISSION_FIELDS = [
    'canViewProgress', 'canViewActivities', 'canViewDimensions',
    'canViewNotes', 'canAddActivities', 'canInviteOthers',
  ];

  test('all valid roles have a default permission entry', () => {
    VALID_ROLES.forEach((role) => {
      expect(DEFAULT_PERMISSIONS_BY_ROLE[role]).toBeDefined();
    });
  });

  test('all permission entries contain all 6 fields', () => {
    Object.entries(DEFAULT_PERMISSIONS_BY_ROLE).forEach(([role, perms]) => {
      PERMISSION_FIELDS.forEach((field) => {
        expect(typeof perms[field]).toBe('boolean'),
          `${role} is missing boolean field ${field}`;
      });
    });
  });

  test('parent can do everything', () => {
    const p = DEFAULT_PERMISSIONS_BY_ROLE.parent;
    PERMISSION_FIELDS.forEach((field) => {
      expect(p[field]).toBe(true);
    });
  });

  test('guardian can do everything', () => {
    const g = DEFAULT_PERMISSIONS_BY_ROLE.guardian;
    PERMISSION_FIELDS.forEach((field) => {
      expect(g[field]).toBe(true);
    });
  });

  test('employer cannot add activities or view individual activity feed', () => {
    const e = DEFAULT_PERMISSIONS_BY_ROLE.employer;
    expect(e.canAddActivities).toBe(false);
    expect(e.canViewActivities).toBe(false);
    expect(e.canInviteOthers).toBe(false);
    expect(e.canViewNotes).toBe(false);
  });

  test('family_member cannot add activities or invite others', () => {
    const f = DEFAULT_PERMISSIONS_BY_ROLE.family_member;
    expect(f.canAddActivities).toBe(false);
    expect(f.canInviteOthers).toBe(false);
  });

  test('clinical roles (slp, ot, bcba) can add activities but not invite', () => {
    ['slp', 'ot', 'bcba'].forEach((role) => {
      const p = DEFAULT_PERMISSIONS_BY_ROLE[role];
      expect(p.canAddActivities).toBe(true);
      expect(p.canInviteOthers).toBe(false);
    });
  });
});

// ── Tests: privacy level filtering ───────────────────────────────────────────

describe('applyPrivacyFilter', () => {
  const USER_A = 'user-a-id';
  const USER_B = 'user-b-id';
  const USER_C = 'user-c-id';

  const sampleActivities = [
    { activityId: 'act-1', completedBy: USER_A, completedByRole: 'parent',  setting: 'home'   },
    { activityId: 'act-2', completedBy: USER_B, completedByRole: 'teacher', setting: 'school' },
    { activityId: 'act-3', completedBy: USER_C, completedByRole: 'slp',     setting: 'clinic' },
  ];
  const sampleData = {
    progress: { totalXP: 100, level: 2 },
    recentActivities: sampleActivities,
  };

  test('full: all activities visible', () => {
    const result = applyPrivacyFilter(sampleData, USER_B, 'teacher', 'full');
    expect(result.recentActivities).toHaveLength(3);
  });

  test('minimal: only own activities visible (filtered by userId)', () => {
    const result = applyPrivacyFilter(sampleData, USER_B, 'teacher', 'minimal');
    expect(result.recentActivities).toHaveLength(1);
    expect(result.recentActivities[0].completedBy).toBe(USER_B);
  });

  test('minimal: no activities shown when user has logged nothing', () => {
    const result = applyPrivacyFilter(sampleData, 'unknown-user', 'teacher', 'minimal');
    expect(result.recentActivities).toHaveLength(0);
  });

  test('aggregated + employer: no activities shown', () => {
    const result = applyPrivacyFilter(sampleData, USER_B, 'employer', 'aggregated');
    expect(result.recentActivities).toHaveLength(0);
  });

  test('aggregated + non-employer: all activities shown', () => {
    const result = applyPrivacyFilter(sampleData, USER_B, 'teacher', 'aggregated');
    expect(result.recentActivities).toHaveLength(3);
  });

  test('progress data is preserved regardless of privacy level', () => {
    (['full', 'aggregated', 'minimal']).forEach((level) => {
      const result = applyPrivacyFilter(sampleData, USER_B, 'teacher', level);
      expect(result.progress.totalXP).toBe(100);
    });
  });
});

// ── Tests: valid roles list integrity ────────────────────────────────────────

describe('VALID_ROLES list', () => {
  test('contains all expected roles', () => {
    const expected = ['parent', 'guardian', 'caregiver', 'grandparent', 'foster_parent',
      'family_member', 'slp', 'ot', 'bcba', 'teacher', 'counselor', 'therapist',
      'coach', 'employer', 'mentor', 'other'];
    expected.forEach((role) => {
      expect(VALID_ROLES).toContain(role);
    });
  });

  test('does not contain unexpected roles', () => {
    expect(VALID_ROLES).not.toContain('admin');
    expect(VALID_ROLES).not.toContain('user');
    expect(VALID_ROLES).not.toContain('nurse');
  });
});

// ── Tests: admin role constant ────────────────────────────────────────────────

describe('ADMIN_ROLES', () => {
  test('contains parent and guardian', () => {
    expect(ADMIN_ROLES).toContain('parent');
    expect(ADMIN_ROLES).toContain('guardian');
    expect(ADMIN_ROLES).toHaveLength(2);
  });
});
