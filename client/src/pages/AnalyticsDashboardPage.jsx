/**
 * AnalyticsDashboardPage.jsx
 * Full-page wrapper for the IATLAS Advanced Analytics Dashboard.
 *
 * Route: /analytics
 */

import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import AnalyticsDashboard from '../components/IATLAS/Analytics/AnalyticsDashboard.jsx';

export default function AnalyticsDashboardPage() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark')  document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch (_) {}
  }, []);

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />
      <main
        id="main-content"
        style={{ minHeight: '100vh', background: '#f8fafc' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          [data-theme="dark"] main#main-content {
            background: #0f172a;
          }
          @media (prefers-color-scheme: dark) {
            :root:not([data-theme="light"]) main#main-content {
              background: #0f172a;
            }
          }
        ` }} />
        <AnalyticsDashboard />
      </main>
    </>
  );
}
