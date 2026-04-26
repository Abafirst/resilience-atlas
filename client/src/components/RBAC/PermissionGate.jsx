/**
 * PermissionGate.jsx
 * Conditionally renders children based on the user's role and permission.
 *
 * Usage:
 *   <PermissionGate role={userRole} resource="children" action="edit">
 *     <EditButton />
 *   </PermissionGate>
 */

import React from 'react';

const ROLE_PERMISSIONS = {
  admin: {
    children: { view: true, create: true, edit: true, delete: true },
    protocols: { view: true, create: true, edit: true, delete: true },
    assessments: { view: true, create: true, edit: true, delete: true },
    analytics: { view: true, export: true },
    practitioners: { view: true, invite: true, remove: true, edit_roles: true },
    practice_settings: { view: true, edit: true },
    audit_logs: { view_own: true, view_all: true },
  },
  clinician: {
    children: { view: true, create: true, edit: true, delete: false },
    protocols: { view: true, create: true, edit: true, delete: true },
    assessments: { view: true, create: true, edit: true, delete: false },
    analytics: { view: true, export: true },
    practitioners: { view: true, invite: false, remove: false, edit_roles: false },
    practice_settings: { view: false, edit: false },
    audit_logs: { view_own: true, view_all: false },
  },
  therapist: {
    children: { view: true, create: false, edit: true, delete: false },
    protocols: { view: true, create: false, edit: false, delete: false },
    assessments: { view: true, create: false, edit: false, delete: false },
    analytics: { view: true, export: false },
    practitioners: { view: false, invite: false, remove: false, edit_roles: false },
    practice_settings: { view: false, edit: false },
    audit_logs: { view_own: true, view_all: false },
  },
  observer: {
    children: { view: true, create: false, edit: false, delete: false },
    protocols: { view: true, create: false, edit: false, delete: false },
    assessments: { view: true, create: false, edit: false, delete: false },
    analytics: { view: false, export: false },
    practitioners: { view: false, invite: false, remove: false, edit_roles: false },
    practice_settings: { view: false, edit: false },
    audit_logs: { view_own: false, view_all: false },
  },
};

export function hasPermission(role, resource, action) {
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  return !!(perms[resource] && perms[resource][action]);
}

export default function PermissionGate({ role, resource, action, fallback = null, children }) {
  if (!hasPermission(role, resource, action)) {
    return fallback;
  }
  return children;
}
