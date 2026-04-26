/**
 * IATLASDashboardPage.jsx
 * Full-page IATLAS gamification dashboard.
 * Route: /iatlas/dashboard
 */

import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import IATLASProgressDashboard from '../components/Gamification/IATLASProgressDashboard.jsx';

export default function IATLASDashboardPage() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
  }, []);

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <main id="main-content" className="iatlas-dashboard-page">
        <style dangerouslySetInnerHTML={{ __html: `
          .iatlas-dashboard-page {
            min-height: 100vh;
            background: #f8fafc;
          }
          [data-theme="dark"] .iatlas-dashboard-page {
            background: #0f172a;
          }
          @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) .iatlas-dashboard-page {
              background: #0f172a;
            }
          }
        `}} />
        <IATLASProgressDashboard />
      </main>
    </>
  );
}
