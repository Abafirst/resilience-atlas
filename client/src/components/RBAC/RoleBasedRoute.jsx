/**
 * RoleBasedRoute.jsx
 * Protected route that checks role permissions before rendering.
 *
 * Usage:
 *   <RoleBasedRoute role={userRole} resource="practice_settings" action="view">
 *     <PracticeSettingsPage />
 *   </RoleBasedRoute>
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasPermission } from './PermissionGate.jsx';
import AccessDeniedPage from '../../pages/AccessDeniedPage.jsx';

export default function RoleBasedRoute({ role, resource, action, redirectTo, children }) {
  if (!hasPermission(role, resource, action)) {
    if (redirectTo) return <Navigate to={redirectTo} replace />;
    return <AccessDeniedPage />;
  }
  return children;
}
