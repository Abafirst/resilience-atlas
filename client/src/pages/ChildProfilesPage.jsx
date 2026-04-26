/**
 * ChildProfilesPage.jsx
 * Full-page child profile management dashboard.
 * Route: /iatlas/profiles
 *
 * Shows the ProfileManager (grid of children) wrapped in the standard
 * site layout. Parents can add, view, edit, and delete profiles here.
 */

import React, { useEffect } from 'react';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';
import ProfileManager from '../components/IATLAS/Profiles/ProfileManager.jsx';
import { Link } from 'react-router-dom';

const PAGE_STYLES = `
  .cp-page {
    background: #f8fafc;
    min-height: 100vh;
  }
  [data-theme="dark"] .cp-page,
  .dark-mode .cp-page {
    background: #0f172a;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .cp-page {
      background: #0f172a;
    }
  }
  .cp-wrap {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.25rem 5rem;
  }
  .cp-breadcrumb {
    display: flex; align-items: center; gap: .4rem;
    font-size: .8rem; color: #6b7280;
    padding: 1.25rem 0 .5rem; flex-wrap: wrap;
  }
  .cp-breadcrumb a { color: inherit; text-decoration: none; }
  .cp-breadcrumb a:hover { color: #4f46e5; text-decoration: underline; }
  .cp-breadcrumb-sep { color: #d1d5db; }
  .cp-hero {
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #a78bfa 100%);
    border-radius: 20px; padding: 2.5rem 2rem 2rem;
    margin: .75rem 0 2rem; color: #fff; position: relative; overflow: hidden;
  }
  .cp-hero::before {
    content: '';
    position: absolute; top: -50px; right: -50px;
    width: 200px; height: 200px; border-radius: 50%;
    background: rgba(255,255,255,.06);
  }
  .cp-hero::after {
    content: '';
    position: absolute; bottom: -30px; left: -30px;
    width: 150px; height: 150px; border-radius: 50%;
    background: rgba(255,255,255,.04);
  }
  .cp-hero-emoji { font-size: 2.5rem; margin-bottom: .5rem; }
  .cp-hero-title { font-size: 1.8rem; font-weight: 900; margin: 0 0 .5rem; }
  .cp-hero-sub { font-size: .95rem; opacity: .85; margin: 0; max-width: 480px; }
  .cp-content {
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 20px;
    padding: 2rem;
  }
  [data-theme="dark"] .cp-content,
  .dark-mode .cp-content {
    background: #1e293b; border-color: #334155;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .cp-content {
      background: #1e293b; border-color: #334155;
    }
  }
`;

export default function ChildProfilesPage() {
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
      <main id="main-content" className="cp-page">
        <style dangerouslySetInnerHTML={{ __html: PAGE_STYLES }} />
        <div className="cp-wrap">
          <nav className="cp-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span className="cp-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">Child Profiles</span>
          </nav>

          <div className="cp-hero">
            <div className="cp-hero-emoji">👶</div>
            <h1 className="cp-hero-title">Child Profiles</h1>
            <p className="cp-hero-sub">
              Create and manage profiles for each child in your family.
              Track progress, set goals, and personalise the learning experience.
            </p>
          </div>

          <div className="cp-content">
            <ProfileManager />
          </div>
        </div>
      </main>
    </>
  );
}
