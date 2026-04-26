'use strict';

const ROLE_PERMISSIONS = {
  admin: {
    children: { view: true, create: true, edit: true, delete: true },
    protocols: { view: true, create: true, edit: true, delete: true },
    assessments: { view: true, create: true, edit: true, delete: true },
    analytics: { view: true, export: true },
    practitioners: { view: true, invite: true, remove: true, edit_roles: true },
    cases: { assign: true, unassign: true, edit_access: true },
    practice_settings: { view: true, edit: true },
    audit_logs: { view_own: true, view_all: true },
  },
  clinician: {
    children: { view: true, create: true, edit: true, delete: false },
    protocols: { view: true, create: true, edit: true, delete: true },
    assessments: { view: true, create: true, edit: true, delete: false },
    analytics: { view: true, export: true },
    practitioners: { view: true, invite: false, remove: false, edit_roles: false },
    cases: { assign: true, unassign: true, edit_access: false },
    practice_settings: { view: false, edit: false },
    audit_logs: { view_own: true, view_all: false },
  },
  therapist: {
    children: { view: true, create: false, edit: true, delete: false },
    protocols: { view: true, create: false, edit: false, delete: false },
    assessments: { view: true, create: false, edit: false, delete: false },
    analytics: { view: true, export: false },
    practitioners: { view: false, invite: false, remove: false, edit_roles: false },
    cases: { assign: false, unassign: false, edit_access: false },
    practice_settings: { view: false, edit: false },
    audit_logs: { view_own: true, view_all: false },
  },
  observer: {
    children: { view: true, create: false, edit: false, delete: false },
    protocols: { view: true, create: false, edit: false, delete: false },
    assessments: { view: true, create: false, edit: false, delete: false },
    analytics: { view: false, export: false },
    practitioners: { view: false, invite: false, remove: false, edit_roles: false },
    cases: { assign: false, unassign: false, edit_access: false },
    practice_settings: { view: false, edit: false },
    audit_logs: { view_own: false, view_all: false },
  },
};

function getPermissions(role) {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.observer;
}

function hasPermission(role, resource, action) {
  const perms = getPermissions(role);
  return !!(perms[resource] && perms[resource][action]);
}

module.exports = { ROLE_PERMISSIONS, getPermissions, hasPermission };
