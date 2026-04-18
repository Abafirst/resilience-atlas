import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

/* TODO: fetch real leadership report data from API */

const REPORT_SECTIONS = [
  {
    icon: '/icons/leaderboards.svg',
    title: 'Team Overview',
    description: 'Aggregated KPIs: team size, overall average resilience score, and primary strength distribution across your organisation.',
  },
  {
    icon: '/icons/network.svg',
    title: 'Dimension Analysis',
    description: 'Team averages (0–100) across all six resilience dimensions — Agentic, Relational, Spiritual, Emotional, Somatic, and Cognitive. No individual data is shown.',
  },
  {
    icon: '/icons/goal.svg',
    title: 'Key Observations',
    description: 'Automatically generated insights highlighting your team\'s strengths, growth areas, balance patterns, and any emerging risks.',
  },
  {
    icon: '/icons/info.svg',
    title: 'Leadership Recommendations',
    description: 'Actionable, evidence-based recommendations tailored to your team\'s unique resilience profile, ready to bring into team meetings.',
  },
  {
    icon: '/icons/story.svg',
    title: 'How to Use This Report',
    description: 'Guidance on sharing insights with HR partners, using findings as conversation starters, and scheduling a 60–90 day reassessment.',
  },
];

export default function LeadershipReportPage() {
  useEffect(() => {
    document.title = 'Leadership Resilience Report — The Resilience Atlas™';
  }, []);

  return (
    <div className="report-layout">

      {/* ── Hero ────────────────────────────────────────────────── */}
      <header className="page-header" role="banner">
        <div className="page-header__inner">
          <div>
            <div className="page-header__brand">The Resilience Atlas™ for Teams</div>
            <h1 className="page-header__title">Leadership Resilience Report</h1>
            <p className="page-header__subtitle">
              Aggregated team insights for organisational leaders — GDPR &amp; CCPA compliant.
            </p>
          </div>
          <nav className="page-header__actions" aria-label="Report actions">
            <Link to="/quiz" className="btn btn--generate">
              Generate Your Report
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" aria-label="Leadership report preview">

        {/* ── Preview notice ────────────────────────────────────── */}
        <section className="report-section" aria-labelledby="preview-heading">
          <h2 className="section-title" id="preview-heading">
            <img src="/icons/compass.svg" alt="" aria-hidden="true" width={16} height={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} /> What's in your report
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted, #666)', marginBottom: '1.25rem' }}>
            Complete the Resilience Atlas assessment with your team to unlock a full leadership report.
            Here's a preview of everything it contains:
          </p>

          <div className="dimension-grid" role="list" aria-label="Report sections">
            {REPORT_SECTIONS.map(({ icon, title, description }) => (
              <div key={title} className="dimension-card" role="listitem">
                <div className="dimension-card__header">
                  <img src={icon} alt="" aria-hidden="true" width={18} height={18} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                  <span className="dimension-card__name">{title}</span>
                </div>
                <p className="dimension-detail" style={{ margin: '0.5rem 0 0', fontSize: '0.88rem' }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Privacy note ──────────────────────────────────────── */}
        <footer className="privacy-footer" role="contentinfo">
          <p>
            <strong>
              <img src="/icons/lock.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Privacy Statement
            </strong>
          </p>
          <p>
            This report contains <strong>only aggregated, anonymous statistics</strong>. No individual
            names, scores, or responses are stored or displayed. It complies with{' '}
            <strong>GDPR</strong> and <strong>CCPA</strong> data-minimisation principles. Access is
            restricted to verified organisation administrators.
          </p>
        </footer>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <section
          className="report-section"
          aria-labelledby="report-cta-heading"
          style={{ textAlign: 'center', padding: '2rem 1rem' }}
        >
          <h2 id="report-cta-heading" className="section-title" style={{ justifyContent: 'center' }}>
            Ready to generate your team's report?
          </h2>
          <p style={{ color: 'var(--text-muted, #555)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Have your team complete the assessment, then return here for a full leadership breakdown.
          </p>
          <Link to="/quiz" className="btn btn--generate" style={{ fontSize: '1rem', padding: '0.75rem 2rem' }}>
            Generate Your Report
          </Link>
        </section>

      </main>
    </div>
  );
}
