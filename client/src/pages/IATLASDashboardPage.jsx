/**
 * IATLASDashboardPage.jsx
 * Full-page IATLAS gamification dashboard.
 * Route: /iatlas/dashboard
 */

import React from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import IATLASProgressDashboard from '../components/Gamification/IATLASProgressDashboard.jsx';

export default function IATLASDashboardPage() {
  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <main id="main-content" style={{ background: '#f8fafc', minHeight: '100vh' }}>
        <IATLASProgressDashboard />
      </main>
    </>
  );
}
