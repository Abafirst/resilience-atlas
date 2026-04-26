'use strict';

/**
 * practice-permissions.test.js
 *
 * Unit tests for the RBAC permission-checking logic in
 * backend/config/practicePermissions.js.
 */

const { ROLE_PERMISSIONS, getPermissions, hasPermission } = require('../backend/config/practicePermissions');

describe('ROLE_PERMISSIONS — structure', () => {
  const REQUIRED_ROLES = ['admin', 'clinician', 'therapist', 'observer'];
  const REQUIRED_RESOURCES = [
    'children', 'protocols', 'assessments', 'analytics',
    'practitioners', 'cases', 'practice_settings', 'audit_logs',
  ];

  test.each(REQUIRED_ROLES)('%s role is defined', (role) => {
    expect(ROLE_PERMISSIONS[role]).toBeDefined();
  });

  test.each(REQUIRED_ROLES)('%s role has all required resources', (role) => {
    const perms = ROLE_PERMISSIONS[role];
    for (const resource of REQUIRED_RESOURCES) {
      expect(perms[resource]).toBeDefined();
    }
  });
});

describe('getPermissions()', () => {
  test('returns admin permissions for admin role', () => {
    const perms = getPermissions('admin');
    expect(perms).toBe(ROLE_PERMISSIONS.admin);
  });

  test('falls back to observer permissions for unknown role', () => {
    const perms = getPermissions('unknown_role');
    expect(perms).toBe(ROLE_PERMISSIONS.observer);
  });

  test('falls back to observer permissions for null/undefined role', () => {
    expect(getPermissions(null)).toBe(ROLE_PERMISSIONS.observer);
    expect(getPermissions(undefined)).toBe(ROLE_PERMISSIONS.observer);
  });
});

describe('hasPermission() — admin role', () => {
  test('admin can view, create, edit, delete children', () => {
    expect(hasPermission('admin', 'children', 'view')).toBe(true);
    expect(hasPermission('admin', 'children', 'create')).toBe(true);
    expect(hasPermission('admin', 'children', 'edit')).toBe(true);
    expect(hasPermission('admin', 'children', 'delete')).toBe(true);
  });

  test('admin can invite, remove, and edit roles of practitioners', () => {
    expect(hasPermission('admin', 'practitioners', 'invite')).toBe(true);
    expect(hasPermission('admin', 'practitioners', 'remove')).toBe(true);
    expect(hasPermission('admin', 'practitioners', 'edit_roles')).toBe(true);
  });

  test('admin can edit practice settings', () => {
    expect(hasPermission('admin', 'practice_settings', 'view')).toBe(true);
    expect(hasPermission('admin', 'practice_settings', 'edit')).toBe(true);
  });

  test('admin can view all audit logs', () => {
    expect(hasPermission('admin', 'audit_logs', 'view_all')).toBe(true);
    expect(hasPermission('admin', 'audit_logs', 'view_own')).toBe(true);
  });

  test('admin can assign and unassign cases', () => {
    expect(hasPermission('admin', 'cases', 'assign')).toBe(true);
    expect(hasPermission('admin', 'cases', 'unassign')).toBe(true);
    expect(hasPermission('admin', 'cases', 'edit_access')).toBe(true);
  });
});

describe('hasPermission() — clinician role', () => {
  test('clinician can manage children (no delete)', () => {
    expect(hasPermission('clinician', 'children', 'view')).toBe(true);
    expect(hasPermission('clinician', 'children', 'create')).toBe(true);
    expect(hasPermission('clinician', 'children', 'edit')).toBe(true);
    expect(hasPermission('clinician', 'children', 'delete')).toBe(false);
  });

  test('clinician cannot manage practitioners', () => {
    expect(hasPermission('clinician', 'practitioners', 'invite')).toBe(false);
    expect(hasPermission('clinician', 'practitioners', 'remove')).toBe(false);
    expect(hasPermission('clinician', 'practitioners', 'edit_roles')).toBe(false);
  });

  test('clinician cannot edit practice settings', () => {
    expect(hasPermission('clinician', 'practice_settings', 'view')).toBe(false);
    expect(hasPermission('clinician', 'practice_settings', 'edit')).toBe(false);
  });

  test('clinician can only view own audit logs', () => {
    expect(hasPermission('clinician', 'audit_logs', 'view_own')).toBe(true);
    expect(hasPermission('clinician', 'audit_logs', 'view_all')).toBe(false);
  });
});

describe('hasPermission() — therapist role', () => {
  test('therapist can view but not create children', () => {
    expect(hasPermission('therapist', 'children', 'view')).toBe(true);
    expect(hasPermission('therapist', 'children', 'create')).toBe(false);
    expect(hasPermission('therapist', 'children', 'delete')).toBe(false);
  });

  test('therapist cannot create or edit protocols/assessments', () => {
    expect(hasPermission('therapist', 'protocols', 'create')).toBe(false);
    expect(hasPermission('therapist', 'protocols', 'edit')).toBe(false);
    expect(hasPermission('therapist', 'assessments', 'create')).toBe(false);
    expect(hasPermission('therapist', 'assessments', 'edit')).toBe(false);
  });

  test('therapist cannot invite practitioners', () => {
    expect(hasPermission('therapist', 'practitioners', 'invite')).toBe(false);
    expect(hasPermission('therapist', 'practitioners', 'remove')).toBe(false);
  });

  test('therapist cannot assign cases', () => {
    expect(hasPermission('therapist', 'cases', 'assign')).toBe(false);
    expect(hasPermission('therapist', 'cases', 'unassign')).toBe(false);
  });

  test('therapist can view analytics but cannot export', () => {
    expect(hasPermission('therapist', 'analytics', 'view')).toBe(true);
    expect(hasPermission('therapist', 'analytics', 'export')).toBe(false);
  });
});

describe('hasPermission() — observer role', () => {
  test('observer can view children but cannot modify', () => {
    expect(hasPermission('observer', 'children', 'view')).toBe(true);
    expect(hasPermission('observer', 'children', 'create')).toBe(false);
    expect(hasPermission('observer', 'children', 'edit')).toBe(false);
    expect(hasPermission('observer', 'children', 'delete')).toBe(false);
  });

  test('observer can view protocols and assessments but cannot modify', () => {
    expect(hasPermission('observer', 'protocols', 'view')).toBe(true);
    expect(hasPermission('observer', 'protocols', 'create')).toBe(false);
    expect(hasPermission('observer', 'assessments', 'view')).toBe(true);
    expect(hasPermission('observer', 'assessments', 'edit')).toBe(false);
  });

  test('observer cannot access analytics', () => {
    expect(hasPermission('observer', 'analytics', 'view')).toBe(false);
    expect(hasPermission('observer', 'analytics', 'export')).toBe(false);
  });

  test('observer cannot view any audit logs', () => {
    expect(hasPermission('observer', 'audit_logs', 'view_own')).toBe(false);
    expect(hasPermission('observer', 'audit_logs', 'view_all')).toBe(false);
  });

  test('observer cannot modify practitioners or settings', () => {
    expect(hasPermission('observer', 'practitioners', 'invite')).toBe(false);
    expect(hasPermission('observer', 'practice_settings', 'edit')).toBe(false);
  });
});

describe('hasPermission() — edge cases', () => {
  test('returns false for non-existent resource', () => {
    expect(hasPermission('admin', 'nonexistent_resource', 'view')).toBe(false);
  });

  test('returns false for non-existent action on valid resource', () => {
    expect(hasPermission('admin', 'children', 'nonexistent_action')).toBe(false);
  });

  test('returns false for null role', () => {
    expect(hasPermission(null, 'children', 'view')).toBe(true); // falls back to observer which can view
    expect(hasPermission(null, 'children', 'delete')).toBe(false);
  });
});
