/**
 * OrgAnalyticsDashboardPage.jsx
 * Task #23a: Multi-Client Dashboard — Enterprise analytics for organizational leaders,
 * clinical directors, and administrators.
 *
 * Tabs:
 *   1. Overview        — KPI cards, 6-D radar chart, recent alerts
 *   2. Cohorts         — Cohort builder + side-by-side comparison
 *   3. Dimension Trends — Org-wide timeline & distribution views
 *   4. Practitioners   — Performance table, leaderboard, caseload metrics
 *   5. Capacity        — Visual caseload board, waitlist, match suggestions
 *   6. Export          — Report templates, scheduling, bulk delivery
 *
 * Route: /iatlas/org/dashboard
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

// ── Navigation ────────────────────────────────────────────────────────────────

const ORG_NAV = [
  { to: '/iatlas/org/dashboard',                label: '📊 Org Dashboard',   key: 'org-dashboard' },
  { to: '/iatlas/practice/dashboard',           label: '🏠 Practice',        key: 'practice' },
  { to: '/iatlas/practice/clients',             label: '👥 Clients',         key: 'clients' },
  { to: '/iatlas/practice/analytics',           label: '📈 Practice Analytics', key: 'analytics' },
  { to: '/iatlas/practice/team',                label: '💬 Team',            key: 'team' },
];

// ── Dimensions ────────────────────────────────────────────────────────────────

const DIMENSIONS = [
  { key: 'agentic',    label: 'Agentic',    color: '#4f46e5', bg: '#eef2ff' },
  { key: 'somatic',    label: 'Somatic',    color: '#059669', bg: '#d1fae5' },
  { key: 'emotional',  label: 'Emotional',  color: '#db2777', bg: '#fce7f3' },
  { key: 'cognitive',  label: 'Cognitive',  color: '#d97706', bg: '#fef3c7' },
  { key: 'relational', label: 'Relational', color: '#0891b2', bg: '#e0f2fe' },
  { key: 'spiritual',  label: 'Spiritual',  color: '#7c3aed', bg: '#ede9fe' },
];

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_KPIS = [
  { label: 'Active Clients',       value: '247',    sub: '↑ 12 from last month',  color: '#4f46e5', trend: 'up',   icon: '👥' },
  { label: 'Sessions (This Month)', value: '1,823', sub: '↑ 234 vs last month',   color: '#059669', trend: 'up',   icon: '📅' },
  { label: 'Avg Improvement',      value: '+18.5%', sub: '↑ 3.2% from last month', color: '#db2777', trend: 'up',  icon: '📈' },
  { label: 'Active Practitioners', value: '14',     sub: '93% utilization rate',  color: '#d97706', trend: 'stable', icon: '👩‍⚕️' },
  { label: 'Program Completion',   value: '72%',    sub: 'Clients who met goals', color: '#0891b2', trend: 'up',   icon: '🎯' },
  { label: 'Retention Rate (90d)', value: '88%',    sub: 'Still active after 90d', color: '#7c3aed', trend: 'down', icon: '🔄' },
];

const MOCK_ORG_DIMS = {
  agentic: 71, somatic: 68, emotional: 65, cognitive: 76, relational: 73, spiritual: 60,
};

const MOCK_BASELINE_DIMS = {
  agentic: 55, somatic: 52, emotional: 49, cognitive: 60, relational: 57, spiritual: 45,
};

const MOCK_ALERTS = [
  { type: 'warning', msg: '3 clients showing regression in Emotional Regulation this week.' },
  { type: 'info',    msg: 'Dr. Smith is at 100% capacity — consider waitlist reassignment.' },
  { type: 'success', msg: '47 clients achieved goals in April 2026 — highest month on record.' },
  { type: 'warning', msg: 'Session note completion dropped to 78% this week (target: 90%).' },
];

const MOCK_MONTHLY_TREND = [
  { month: 'Nov', overall: 58 }, { month: 'Dec', overall: 61 },
  { month: 'Jan', overall: 63 }, { month: 'Feb', overall: 66 },
  { month: 'Mar', overall: 69 }, { month: 'Apr', overall: 72 },
];

const MOCK_PRACTITIONERS = [
  { name: 'Dr. Sarah Chen',    specialty: 'SLP',           clients: 18, max: 20, sessions30d: 72, improvement: '+22%', goals: '89%', docRate: '94%', retention: '91%' },
  { name: 'Marcus Williams',   specialty: 'ABA',           clients: 20, max: 20, sessions30d: 88, improvement: '+19%', goals: '84%', docRate: '81%', retention: '88%' },
  { name: 'Priya Patel',       specialty: 'OT',            clients: 15, max: 18, sessions30d: 56, improvement: '+24%', goals: '93%', docRate: '97%', retention: '95%' },
  { name: 'James Rodriguez',   specialty: 'Social Skills', clients: 12, max: 15, sessions30d: 44, improvement: '+16%', goals: '76%', docRate: '76%', retention: '80%' },
  { name: 'Dr. Aisha Mensah',  specialty: 'Child Psych',  clients: 9,  max: 15, sessions30d: 36, improvement: '+20%', goals: '88%', docRate: '92%', retention: '90%' },
  { name: 'Carlos Reyes',      specialty: 'Behavioral',   clients: 17, max: 20, sessions30d: 64, improvement: '+17%', goals: '80%', docRate: '88%', retention: '85%' },
];

const MOCK_COHORTS = [
  {
    id: 'c1', name: 'Ages 6–12 · ADHD',
    count: 43,
    dims: { agentic: 62, somatic: 58, emotional: 55, cognitive: 70, relational: 65, spiritual: 48 },
    color: '#4f46e5',
  },
  {
    id: 'c2', name: 'Ages 13–17 · Anxiety',
    count: 38,
    dims: { agentic: 68, somatic: 60, emotional: 52, cognitive: 72, relational: 60, spiritual: 55 },
    color: '#db2777',
  },
  {
    id: 'c3', name: 'Adults 18+ · Trauma',
    count: 29,
    dims: { agentic: 75, somatic: 65, emotional: 61, cognitive: 78, relational: 70, spiritual: 65 },
    color: '#059669',
  },
];

const MOCK_DIM_MONTHLY = {
  agentic:    [52, 55, 58, 62, 66, 71],
  somatic:    [49, 51, 55, 59, 63, 68],
  emotional:  [46, 48, 52, 56, 60, 65],
  cognitive:  [57, 60, 63, 67, 71, 76],
  relational: [54, 57, 60, 64, 68, 73],
  spiritual:  [42, 44, 47, 51, 55, 60],
};
const TREND_MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];

const MOCK_WAITLIST = [
  { name: 'Alex K.',   age: 8,  challenge: 'ADHD',    referral: 'School',  waitingSince: '2026-03-12' },
  { name: 'Jordan M.', age: 15, challenge: 'Anxiety', referral: 'Medical', waitingSince: '2026-03-28' },
  { name: 'Casey P.',  age: 11, challenge: 'Autism',  referral: 'Self',    waitingSince: '2026-04-05' },
];

const REPORT_TEMPLATES = [
  { id: 'executive', icon: '📋', name: 'Executive Summary', desc: '1-page monthly snapshot for leadership', format: 'PDF' },
  { id: 'board',     icon: '📊', name: 'Board Report',      desc: 'Quarterly outcomes for board review',   format: 'PDF' },
  { id: 'grant',     icon: '🏛️',  name: 'Grant Report',      desc: 'Custom template for funders & grants',  format: 'PDF' },
  { id: 'csv',       icon: '📑', name: 'Raw Data Export',   desc: 'Full cohort data for external analysis', format: 'CSV' },
];

// ── Mini components ───────────────────────────────────────────────────────────

function DimBar({ value, color, baseline }) {
  const delta = value - (baseline || 0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', width: '100%' }}>
      <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
        {baseline != null && (
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${baseline}%`, background: '#e2e8f0', borderRadius: 999,
          }} />
        )}
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${value}%`, background: color, borderRadius: 999, opacity: .85,
        }} />
      </div>
      <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#374151', width: 28, textAlign: 'right' }}>{value}</span>
      {baseline != null && (
        <span style={{ fontSize: '.72rem', color: delta >= 0 ? '#059669' : '#dc2626', fontWeight: 700, width: 36 }}>
          {delta >= 0 ? '+' : ''}{delta}
        </span>
      )}
    </div>
  );
}

function DimStack({ dims, baseline, showBaseline }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.55rem' }}>
      {DIMENSIONS.map(d => (
        <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '.73rem', color: '#6b7280', width: 72, flexShrink: 0 }}>{d.label}</span>
          <DimBar value={dims[d.key] || 0} color={d.color} baseline={showBaseline ? baseline?.[d.key] : undefined} />
        </div>
      ))}
    </div>
  );
}

function SparkLine({ data, color = '#6366f1' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertBadge({ type }) {
  const styles = {
    warning: { icon: '⚠️', bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
    info:    { icon: 'ℹ️', bg: '#e0f2fe', border: '#bae6fd', color: '#075985' },
    success: { icon: '✅', bg: '#d1fae5', border: '#a7f3d0', color: '#065f46' },
    error:   { icon: '🚨', bg: '#fee2e2', border: '#fecaca', color: '#991b1b' },
  };
  const s = styles[type] || styles.info;
  return (
    <span style={{
      display: 'inline-block', padding: '.15rem .5rem', borderRadius: 6,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      fontSize: '.72rem', fontWeight: 700,
    }}>
      {s.icon}
    </span>
  );
}

function CapacityBar({ current, max, color }) {
  const pct = Math.min(100, Math.round((current / max) * 100));
  const barColor = pct >= 100 ? '#dc2626' : pct >= 80 ? '#d97706' : '#059669';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flex: 1 }}>
      <div style={{ flex: 1, height: 14, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 999, transition: 'width .4s ease' }} />
      </div>
      <span style={{ fontSize: '.78rem', fontWeight: 700, color: barColor, width: 52, textAlign: 'right' }}>
        {current}/{max}
      </span>
    </div>
  );
}

// ── Tab: Overview ─────────────────────────────────────────────────────────────

function OverviewTab() {
  return (
    <div>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {MOCK_KPIS.map(k => (
          <div key={k.label} className="oad-card" style={{ display: 'flex', flexDirection: 'column', gap: '.35rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                {k.label}
              </span>
              <span style={{ fontSize: '1.1rem' }} aria-hidden="true">{k.icon}</span>
            </div>
            <p style={{ margin: 0, fontSize: '2rem', fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</p>
            <p style={{ margin: 0, fontSize: '.78rem', color: '#9ca3af' }}>{k.sub}</p>
            <SparkLine data={MOCK_MONTHLY_TREND.map(m => m.overall)} color={k.color} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="oad-two-col" style={{ marginBottom: '1.5rem' }}>
        {/* 6-D Radar (bar representation) */}
        <div className="oad-card">
          <h2 className="oad-card-title">📡 6-Dimension Organization Average</h2>
          <DimStack dims={MOCK_ORG_DIMS} baseline={MOCK_BASELINE_DIMS} showBaseline />
          <p style={{ fontSize: '.75rem', color: '#9ca3af', margin: '.85rem 0 0' }}>
            Bars show current score. Gray layer = baseline. Delta shown in green/red.
          </p>
        </div>

        {/* Monthly overall trend */}
        <div className="oad-card">
          <h2 className="oad-card-title">📈 Overall Score — 6-Month Trend</h2>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', height: 110, marginTop: '.5rem' }}>
            {MOCK_MONTHLY_TREND.map((m, i) => {
              const pct = ((m.overall - 50) / 50) * 100;
              const isLast = i === MOCK_MONTHLY_TREND.length - 1;
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem' }}>
                  <span style={{ fontSize: '.68rem', color: isLast ? '#4f46e5' : '#9ca3af', fontWeight: 700 }}>{m.overall}</span>
                  <div style={{
                    width: '100%', borderRadius: '4px 4px 0 0',
                    height: `${pct}px`,
                    background: isLast ? '#6366f1' : '#c7d2fe',
                    transition: 'height .3s ease',
                    minHeight: 4,
                  }} />
                  <span style={{ fontSize: '.68rem', color: '#9ca3af' }}>{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="oad-card">
        <h2 className="oad-card-title">🔔 Recent Alerts</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.65rem' }}>
          {MOCK_ALERTS.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.65rem .75rem', borderRadius: 10, background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <AlertBadge type={a.type} />
              <p style={{ margin: 0, fontSize: '.85rem', color: '#374151' }}>{a.msg}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Cohorts ──────────────────────────────────────────────────────────────

function CohortsTab() {
  const [selectedCohorts, setSelectedCohorts] = useState(['c1', 'c2']);
  const [newCohortName, setNewCohortName] = useState('');
  const [showBuilder, setShowBuilder] = useState(false);
  const [cohortFilters, setCohortFilters] = useState({ ageMin: '', ageMax: '', gender: '', diagnosis: '' });

  const toggleCohort = useCallback(id => {
    setSelectedCohorts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
  }, []);

  const visibleCohorts = MOCK_COHORTS.filter(c => selectedCohorts.includes(c.id));

  return (
    <div>
      {/* Cohort selector */}
      <div className="oad-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.85rem', flexWrap: 'wrap', gap: '.5rem' }}>
          <h2 className="oad-card-title" style={{ margin: 0 }}>🧩 Saved Cohorts</h2>
          <button
            className="oad-btn"
            onClick={() => setShowBuilder(v => !v)}
            aria-expanded={showBuilder}
          >
            {showBuilder ? '✕ Cancel' : '＋ New Cohort'}
          </button>
        </div>

        {/* Cohort builder */}
        {showBuilder && (
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '1rem', marginBottom: '1rem', border: '1px solid #e5e7eb' }}>
            <p style={{ margin: '0 0 .75rem', fontSize: '.85rem', fontWeight: 700, color: '#374151' }}>Define Cohort Filters</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.6rem' }}>
              <div>
                <label className="oad-field-label">Cohort Name</label>
                <input
                  type="text"
                  value={newCohortName}
                  onChange={e => setNewCohortName(e.target.value)}
                  placeholder="e.g. Ages 6–12 ADHD"
                  className="oad-input"
                />
              </div>
              <div>
                <label className="oad-field-label">Min Age</label>
                <input type="number" min={0} max={100} value={cohortFilters.ageMin}
                  onChange={e => setCohortFilters(f => ({ ...f, ageMin: e.target.value }))}
                  className="oad-input" placeholder="0" />
              </div>
              <div>
                <label className="oad-field-label">Max Age</label>
                <input type="number" min={0} max={100} value={cohortFilters.ageMax}
                  onChange={e => setCohortFilters(f => ({ ...f, ageMax: e.target.value }))}
                  className="oad-input" placeholder="99" />
              </div>
              <div>
                <label className="oad-field-label">Gender</label>
                <select value={cohortFilters.gender}
                  onChange={e => setCohortFilters(f => ({ ...f, gender: e.target.value }))}
                  className="oad-input">
                  <option value="">Any</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-Binary</option>
                </select>
              </div>
              <div>
                <label className="oad-field-label">Diagnosis / Challenge</label>
                <select value={cohortFilters.diagnosis}
                  onChange={e => setCohortFilters(f => ({ ...f, diagnosis: e.target.value }))}
                  className="oad-input">
                  <option value="">Any</option>
                  <option value="adhd">ADHD</option>
                  <option value="anxiety">Anxiety</option>
                  <option value="autism">Autism</option>
                  <option value="trauma">Trauma</option>
                  <option value="depression">Depression</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.6rem', marginTop: '.85rem', justifyContent: 'flex-end' }}>
              <button className="oad-btn" style={{ background: '#059669' }}
                onClick={() => { alert(`Cohort "${newCohortName || 'Unnamed'}" would be created via API.`); setShowBuilder(false); }}>
                💾 Save Cohort
              </button>
            </div>
          </div>
        )}

        {/* Cohort chips */}
        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          {MOCK_COHORTS.map(c => (
            <button
              key={c.id}
              onClick={() => toggleCohort(c.id)}
              aria-pressed={selectedCohorts.includes(c.id)}
              style={{
                padding: '.35rem .85rem', borderRadius: 999, fontSize: '.82rem', fontWeight: 600,
                border: `2px solid ${selectedCohorts.includes(c.id) ? c.color : '#e5e7eb'}`,
                background: selectedCohorts.includes(c.id) ? c.color + '18' : '#fff',
                color: selectedCohorts.includes(c.id) ? c.color : '#6b7280',
                cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {c.name} <span style={{ opacity: .7 }}>({c.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-side comparison */}
      {visibleCohorts.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 .85rem' }}>
            📊 Side-by-Side Dimension Comparison
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${visibleCohorts.length}, 1fr)`, gap: '1rem' }}>
            {visibleCohorts.map(c => (
              <div key={c.id} className="oad-card" style={{ borderTop: `3px solid ${c.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                  <h3 style={{ margin: 0, fontSize: '.92rem', fontWeight: 700, color: '#1e293b' }}>{c.name}</h3>
                  <span style={{ background: c.color + '18', color: c.color, borderRadius: 999, padding: '.15rem .55rem', fontSize: '.72rem', fontWeight: 700 }}>
                    n={c.count}
                  </span>
                </div>
                <DimStack dims={c.dims} />
                {/* Summary stats */}
                <div style={{ marginTop: '.85rem', paddingTop: '.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Mean</p>
                    <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: c.color }}>
                      {Math.round(Object.values(c.dims).reduce((s, v) => s + v, 0) / 6)}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Strongest</p>
                    <p style={{ margin: 0, fontSize: '.82rem', fontWeight: 700, color: '#374151' }}>
                      {DIMENSIONS.find(d => d.key === Object.keys(c.dims).reduce((a, b) => c.dims[a] > c.dims[b] ? a : b))?.label}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0, fontSize: '.68rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase' }}>Focus Area</p>
                    <p style={{ margin: 0, fontSize: '.82rem', fontWeight: 700, color: '#374151' }}>
                      {DIMENSIONS.find(d => d.key === Object.keys(c.dims).reduce((a, b) => c.dims[a] < c.dims[b] ? a : b))?.label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Dimension Trends ─────────────────────────────────────────────────────

function DimensionTrendsTab() {
  const [selectedDim, setSelectedDim] = useState('agentic');
  const dim = DIMENSIONS.find(d => d.key === selectedDim);
  const trendData = MOCK_DIM_MONTHLY[selectedDim] || [];
  const maxVal = Math.max(...trendData, 1);

  return (
    <div>
      {/* Org-wide average heat map */}
      <div className="oad-card" style={{ marginBottom: '1.25rem' }}>
        <h2 className="oad-card-title">🔥 Dimension Heat Map — Organization Average</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '.75rem', marginTop: '.5rem' }}>
          {DIMENSIONS.map(d => {
            const score = MOCK_ORG_DIMS[d.key] || 0;
            const level = score >= 70 ? 'strong' : score >= 55 ? 'moderate' : 'focus';
            const levelStyles = {
              strong:   { bg: '#d1fae5', color: '#059669', label: 'Strong' },
              moderate: { bg: '#fef3c7', color: '#d97706', label: 'Moderate' },
              focus:    { bg: '#fee2e2', color: '#dc2626', label: 'Focus Area' },
            };
            const ls = levelStyles[level];
            return (
              <div key={d.key} style={{
                background: ls.bg, borderRadius: 12, padding: '.85rem .75rem',
                textAlign: 'center', border: `1.5px solid ${d.color}22`,
              }}>
                <p style={{ margin: '0 0 .3rem', fontSize: '.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.04em' }}>{d.label}</p>
                <p style={{ margin: '0 0 .25rem', fontSize: '1.6rem', fontWeight: 800, color: d.color }}>{score}</p>
                <span style={{ fontSize: '.68rem', fontWeight: 700, color: ls.color, background: '#fff8', padding: '.1rem .4rem', borderRadius: 999 }}>
                  {ls.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timeline drill-down */}
      <div className="oad-card" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '.5rem' }}>
          <h2 className="oad-card-title" style={{ margin: 0 }}>📅 6-Month Dimension Timeline</h2>
          <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
            {DIMENSIONS.map(d => (
              <button key={d.key}
                onClick={() => setSelectedDim(d.key)}
                aria-pressed={selectedDim === d.key}
                style={{
                  padding: '.25rem .65rem', borderRadius: 999, fontSize: '.75rem', fontWeight: 600,
                  border: `1.5px solid ${selectedDim === d.key ? d.color : '#e5e7eb'}`,
                  background: selectedDim === d.key ? d.color : '#fff',
                  color: selectedDim === d.key ? '#fff' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', height: 120 }}>
          {trendData.map((v, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem' }}>
              <span style={{ fontSize: '.68rem', fontWeight: 700, color: dim?.color }}>{v}</span>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height: `${(v / maxVal) * 90}px`,
                background: i === trendData.length - 1 ? dim?.color : (dim?.color + '55'),
                minHeight: 4,
              }} />
              <span style={{ fontSize: '.65rem', color: '#9ca3af' }}>{TREND_MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* All dimensions side by side — latest vs baseline */}
      <div className="oad-card">
        <h2 className="oad-card-title">⬆️ Baseline vs. Current — All Dimensions</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="oad-table" aria-label="Dimension progress comparison">
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Baseline</th>
                <th>Current</th>
                <th>Improvement</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {DIMENSIONS.map(d => {
                const base = MOCK_BASELINE_DIMS[d.key] || 0;
                const curr = MOCK_ORG_DIMS[d.key] || 0;
                const delta = curr - base;
                return (
                  <tr key={d.key}>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: d.color, marginRight: '.4rem', verticalAlign: 'middle' }} />
                      {d.label}
                    </td>
                    <td style={{ color: '#9ca3af' }}>{base}</td>
                    <td style={{ fontWeight: 700 }}>{curr}</td>
                    <td style={{ color: delta >= 0 ? '#059669' : '#dc2626', fontWeight: 700 }}>
                      {delta >= 0 ? '+' : ''}{delta}
                    </td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${curr}%`, background: d.color, borderRadius: 999 }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Tab: Practitioners ────────────────────────────────────────────────────────

function PractitionersTab() {
  const [sortCol, setSortCol] = useState('clients');
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...MOCK_PRACTITIONERS].sort((a, b) => {
    const av = parseFloat(String(a[sortCol]).replace(/[^0-9.-]/g, '')) || 0;
    const bv = parseFloat(String(b[sortCol]).replace(/[^0-9.-]/g, '')) || 0;
    return sortAsc ? av - bv : bv - av;
  });

  const colHeader = (col, label) => (
    <th
      onClick={() => { setSortCol(col); setSortAsc(prev => sortCol === col ? !prev : false); }}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      aria-sort={sortCol === col ? (sortAsc ? 'ascending' : 'descending') : 'none'}
    >
      {label} {sortCol === col ? (sortAsc ? '▲' : '▼') : ''}
    </th>
  );

  return (
    <div>
      {/* Top KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Practitioners',    value: '14',   color: '#4f46e5' },
          { label: 'Avg Sessions / Prac.',   value: '60',   color: '#059669' },
          { label: 'Avg Goal Achievement',   value: '85%',  color: '#0891b2' },
          { label: 'Avg Doc Compliance',     value: '88%',  color: '#7c3aed' },
        ].map(m => (
          <div key={m.label} className="oad-card">
            <p style={{ margin: '0 0 .25rem', fontSize: '.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.05em' }}>{m.label}</p>
            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Performance table */}
      <div className="oad-card" style={{ marginBottom: '1.25rem' }}>
        <h2 className="oad-card-title">📋 Practitioner Performance — April 2026</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="oad-table" aria-label="Practitioner performance">
            <thead>
              <tr>
                <th>Practitioner</th>
                <th>Specialty</th>
                {colHeader('clients',      'Caseload')}
                {colHeader('sessions30d',  'Sessions (30d)')}
                {colHeader('improvement',  'Avg Improvement')}
                {colHeader('goals',        'Goal Achievement')}
                {colHeader('docRate',      'Doc Rate')}
                {colHeader('retention',    'Retention')}
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => {
                const pct = Math.round((p.clients / p.max) * 100);
                const atCap = pct >= 100;
                return (
                  <tr key={p.name} style={{ background: i === 0 ? '#fafffe' : undefined }}>
                    <td style={{ fontWeight: 600 }}>
                      {i === 0 && <span style={{ marginRight: '.3rem' }}>🏆</span>}
                      {p.name}
                    </td>
                    <td>
                      <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 6, padding: '.15rem .5rem', fontSize: '.73rem', fontWeight: 600 }}>
                        {p.specialty}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: atCap ? '#dc2626' : '#374151', fontWeight: 700 }}>
                        {p.clients}/{p.max} {atCap && '⚠️'}
                      </span>
                    </td>
                    <td>{p.sessions30d}</td>
                    <td style={{ color: '#059669', fontWeight: 700 }}>{p.improvement}</td>
                    <td style={{ color: parseFloat(p.goals) >= 85 ? '#059669' : '#d97706', fontWeight: 600 }}>{p.goals}</td>
                    <td style={{ color: parseFloat(p.docRate) >= 90 ? '#059669' : '#d97706' }}>{p.docRate}</td>
                    <td style={{ color: parseFloat(p.retention) >= 90 ? '#059669' : '#d97706' }}>{p.retention}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Specialization radar — top 4 */}
      <div className="oad-card">
        <h2 className="oad-card-title">🌱 Practitioner Dimension Strengths (Top 4)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem', marginTop: '.5rem' }}>
          {sorted.slice(0, 4).map(p => {
            const mockDims = DIMENSIONS.reduce((acc, d, i) => {
              const base = [82, 68, 85, 70, 90, 55, 75, 60][i % 8];
              return { ...acc, [d.key]: Math.min(99, base + Math.round(Math.random() * 10)) };
            }, {});
            return (
              <div key={p.name} style={{ background: '#f8fafc', borderRadius: 12, padding: '1rem', border: '1px solid #e5e7eb' }}>
                <p style={{ margin: '0 0 .6rem', fontWeight: 700, fontSize: '.88rem', color: '#1e293b' }}>{p.name}</p>
                <DimStack dims={mockDims} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Capacity ─────────────────────────────────────────────────────────────

function CapacityTab() {
  const available    = MOCK_PRACTITIONERS.filter(p => (p.clients / p.max) < 0.80);
  const nearCapacity = MOCK_PRACTITIONERS.filter(p => { const r = p.clients / p.max; return r >= 0.80 && r < 1; });
  const atCapacity   = MOCK_PRACTITIONERS.filter(p => p.clients >= p.max);

  const CapCol = ({ title, color, bg, items, badge }) => (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ padding: '.5rem .75rem', borderRadius: '8px 8px 0 0', background: bg, borderBottom: `2px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 700, fontSize: '.82rem', color }}>{title}</span>
        <span style={{ background: color, color: '#fff', borderRadius: 999, padding: '.1rem .5rem', fontSize: '.72rem', fontWeight: 700 }}>{items.length}</span>
      </div>
      <div style={{ background: '#fff', border: `1px solid ${color}33`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '.5rem' }}>
        {items.length === 0
          ? <p style={{ color: '#9ca3af', fontSize: '.8rem', textAlign: 'center', padding: '.5rem' }}>None</p>
          : items.map(p => (
            <div key={p.name} style={{ padding: '.6rem .5rem', borderRadius: 8, marginBottom: '.35rem', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.35rem' }}>
                <span style={{ fontSize: '.82rem', fontWeight: 600, color: '#1e293b' }}>{p.name}</span>
                <span style={{ fontSize: '.72rem', color: '#6b7280', background: '#eef2ff', borderRadius: 6, padding: '.1rem .4rem' }}>{p.specialty}</span>
              </div>
              <CapacityBar current={p.clients} max={p.max} />
            </div>
          ))
        }
      </div>
    </div>
  );

  return (
    <div>
      {/* Capacity grid */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <CapCol title="✅ Available"      color="#059669" bg="#d1fae5" items={available}    />
        <CapCol title="⚡ Near Capacity"  color="#d97706" bg="#fef3c7" items={nearCapacity} />
        <CapCol title="🚫 At Capacity"   color="#dc2626" bg="#fee2e2" items={atCapacity}   />
      </div>

      {/* Waitlist */}
      <div className="oad-card" style={{ marginBottom: '1.25rem' }}>
        <h2 className="oad-card-title">📋 Waitlist ({MOCK_WAITLIST.length} clients)</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="oad-table" aria-label="Client waitlist">
            <thead>
              <tr><th>Client</th><th>Age</th><th>Challenge</th><th>Referral</th><th>Waiting Since</th><th>Best Match</th></tr>
            </thead>
            <tbody>
              {MOCK_WAITLIST.map(w => {
                const match = available[0] || nearCapacity[0];
                return (
                  <tr key={w.name}>
                    <td style={{ fontWeight: 600 }}>{w.name}</td>
                    <td>{w.age}</td>
                    <td>
                      <span style={{ background: '#eef2ff', color: '#4f46e5', borderRadius: 6, padding: '.15rem .5rem', fontSize: '.73rem', fontWeight: 600 }}>
                        {w.challenge}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280' }}>{w.referral}</td>
                    <td style={{ color: '#9ca3af' }}>{new Date(w.waitingSince).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                    <td>
                      {match ? (
                        <span style={{ color: '#059669', fontWeight: 600, fontSize: '.82rem' }}>
                          💡 {match.name}
                        </span>
                      ) : <span style={{ color: '#9ca3af', fontSize: '.82rem' }}>No slot available</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Capacity summary */}
      <div className="oad-card">
        <h2 className="oad-card-title">📊 Organization Capacity Summary</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Total Slots',        value: MOCK_PRACTITIONERS.reduce((s, p) => s + p.max, 0),     color: '#4f46e5' },
            { label: 'Filled Slots',       value: MOCK_PRACTITIONERS.reduce((s, p) => s + p.clients, 0), color: '#059669' },
            { label: 'Open Slots',         value: MOCK_PRACTITIONERS.reduce((s, p) => s + Math.max(0, p.max - p.clients), 0), color: '#0891b2' },
            { label: 'Waitlist',           value: MOCK_WAITLIST.length, color: '#d97706' },
          ].map(m => (
            <div key={m.label} style={{ textAlign: 'center', padding: '.85rem', background: '#f8fafc', borderRadius: 12, border: '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 .25rem', fontSize: '.72rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>{m.label}</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: m.color }}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Tab: Export ───────────────────────────────────────────────────────────────

function ExportTab() {
  const [selectedTemplate, setSelectedTemplate] = useState('executive');
  const [scheduleFreq, setScheduleFreq] = useState('monthly');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipients, setRecipients] = useState(['director@organization.org']);
  const [exportMsg, setExportMsg] = useState('');

  const addRecipient = () => {
    const email = recipientEmail.trim();
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !recipients.includes(email)) {
      setRecipients(prev => [...prev, email]);
      setRecipientEmail('');
    }
  };

  const handleExport = () => {
    setExportMsg(`✅ ${REPORT_TEMPLATES.find(t => t.id === selectedTemplate)?.name} queued for generation. Download link will be emailed to recipients.`);
    setTimeout(() => setExportMsg(''), 5000);
  };

  return (
    <div>
      {/* Template gallery */}
      <div className="oad-card" style={{ marginBottom: '1.25rem' }}>
        <h2 className="oad-card-title">📁 Report Templates</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '1rem', marginTop: '.5rem' }}>
          {REPORT_TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTemplate(t.id)}
              aria-pressed={selectedTemplate === t.id}
              style={{
                background: selectedTemplate === t.id ? '#4f46e5' : '#f8fafc',
                border: `2px solid ${selectedTemplate === t.id ? '#4f46e5' : '#e5e7eb'}`,
                borderRadius: 12, padding: '1rem',
                textAlign: 'left', cursor: 'pointer',
                transition: 'all .15s',
              }}
            >
              <p style={{ margin: '0 0 .4rem', fontSize: '1.4rem' }}>{t.icon}</p>
              <p style={{ margin: '0 0 .25rem', fontWeight: 700, fontSize: '.88rem', color: selectedTemplate === t.id ? '#fff' : '#1e293b' }}>{t.name}</p>
              <p style={{ margin: '0 0 .35rem', fontSize: '.75rem', color: selectedTemplate === t.id ? 'rgba(255,255,255,.8)' : '#6b7280' }}>{t.desc}</p>
              <span style={{
                background: selectedTemplate === t.id ? 'rgba(255,255,255,.2)' : '#eef2ff',
                color: selectedTemplate === t.id ? '#fff' : '#4f46e5',
                borderRadius: 6, padding: '.1rem .4rem', fontSize: '.7rem', fontWeight: 700,
              }}>{t.format}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Delivery settings */}
      <div className="oad-two-col" style={{ marginBottom: '1.25rem' }}>
        <div className="oad-card">
          <h2 className="oad-card-title">⏰ Scheduled Delivery</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div>
              <label className="oad-field-label">Frequency</label>
              <select value={scheduleFreq} onChange={e => setScheduleFreq(e.target.value)} className="oad-input">
                <option value="weekly">Weekly (every Monday at 9 AM)</option>
                <option value="monthly">Monthly (1st of each month)</option>
                <option value="quarterly">Quarterly</option>
                <option value="manual">Manual only</option>
              </select>
            </div>
            <p style={{ margin: 0, fontSize: '.8rem', color: '#6b7280' }}>
              Reports will be automatically generated and emailed to all recipients below.
            </p>
          </div>
        </div>

        <div className="oad-card">
          <h2 className="oad-card-title">📧 Recipients</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '.75rem' }}>
            {recipients.map(r => (
              <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', borderRadius: 8, padding: '.4rem .75rem', border: '1px solid #e5e7eb' }}>
                <span style={{ fontSize: '.82rem', color: '#374151' }}>{r}</span>
                <button
                  onClick={() => setRecipients(prev => prev.filter(x => x !== r))}
                  style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
                  aria-label={`Remove ${r}`}
                >✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '.4rem' }}>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRecipient()}
              placeholder="Add email address…"
              className="oad-input"
              style={{ flex: 1 }}
            />
            <button className="oad-btn" onClick={addRecipient} style={{ flexShrink: 0 }}>Add</button>
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="oad-card">
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="oad-btn" style={{ background: '#059669', fontSize: '.92rem', padding: '.75rem 1.5rem' }} onClick={handleExport}>
            📥 Generate &amp; Download Now
          </button>
          <button className="oad-btn" style={{ background: '#4f46e5', fontSize: '.92rem', padding: '.75rem 1.5rem' }}>
            📅 Save Schedule
          </button>
          {exportMsg && (
            <p style={{ margin: 0, fontSize: '.85rem', color: '#059669', fontWeight: 600 }}>{exportMsg}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

export default function OrgAnalyticsDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('this-month');

  const TABS = [
    { key: 'overview',   label: '📊 Overview' },
    { key: 'cohorts',    label: '🧩 Cohorts' },
    { key: 'trends',     label: '📈 Dimension Trends' },
    { key: 'practitioners', label: '👩‍⚕️ Practitioners' },
    { key: 'capacity',   label: '🗂️ Capacity' },
    { key: 'export',     label: '📥 Export' },
  ];

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f1f5f9' }}>
        <style>{`
          /* Layout */
          .oad-layout { display: flex; min-height: calc(100vh - 64px); }

          /* Sidebar */
          .oad-sidebar {
            width: 230px; flex-shrink: 0; background: #0f172a; color: #e2e8f0;
            padding: 1.5rem 0; display: flex; flex-direction: column;
          }
          .oad-sidebar-brand {
            padding: .85rem 1.25rem 1.25rem; font-size: 1rem; font-weight: 800; color: #f1f5f9;
            border-bottom: 1px solid rgba(255,255,255,.07); margin-bottom: .5rem;
          }
          .oad-sidebar-brand span {
            display: block; font-size: .68rem; font-weight: 500; color: #475569;
            margin-top: .15rem; text-transform: uppercase; letter-spacing: .09em;
          }
          .oad-nav-link {
            display: flex; align-items: center; gap: .6rem;
            padding: .6rem 1.25rem; font-size: .85rem; font-weight: 500;
            color: #64748b; text-decoration: none; transition: background .15s, color .15s;
            border-left: 3px solid transparent;
          }
          .oad-nav-link:hover { background: rgba(255,255,255,.05); color: #e2e8f0; }
          .oad-nav-link.active { background: rgba(99,102,241,.18); color: #a5b4fc; border-left-color: #6366f1; }
          .oad-sidebar-footer {
            margin-top: auto; padding: .85rem 1.25rem; border-top: 1px solid rgba(255,255,255,.07);
          }
          .oad-sidebar-footer a { font-size: .78rem; color: #475569; text-decoration: none; }
          .oad-sidebar-footer a:hover { color: #94a3b8; }

          /* Content area */
          .oad-content { flex: 1; padding: 2rem 1.75rem; overflow-y: auto; max-width: 1200px; }

          /* Page header */
          .oad-page-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
          }
          .oad-page-title { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0; }
          .oad-page-sub   { font-size: .85rem; color: #64748b; margin: .2rem 0 0; }

          /* Buttons */
          .oad-btn {
            display: inline-flex; align-items: center; gap: .4rem;
            background: #6366f1; color: #fff; border: none; border-radius: 8px;
            padding: .55rem 1.1rem; font-size: .85rem; font-weight: 600;
            cursor: pointer; text-decoration: none; transition: filter .15s;
          }
          .oad-btn:hover { filter: brightness(1.1); }

          /* Tabs */
          .oad-tabs { display: flex; gap: 0; border-bottom: 2px solid #e2e8f0; margin-bottom: 1.5rem; overflow-x: auto; }
          .oad-tab {
            background: none; border: none; padding: .65rem 1rem;
            font-size: .84rem; font-weight: 600; color: #64748b; cursor: pointer;
            border-bottom: 2px solid transparent; margin-bottom: -2px; white-space: nowrap;
            transition: color .15s, border-color .15s;
          }
          .oad-tab.active { color: #6366f1; border-bottom-color: #6366f1; }

          /* Cards */
          .oad-card {
            background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.35rem;
          }
          .oad-card-title { font-size: .95rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem; }
          .oad-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem; }

          /* Table */
          .oad-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
          .oad-table th {
            background: #f8fafc; padding: .65rem .85rem; text-align: left;
            font-size: .72rem; font-weight: 700; color: #64748b;
            text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #e2e8f0;
          }
          .oad-table td { padding: .75rem .85rem; border-bottom: 1px solid #f1f5f9; color: #374151; }
          .oad-table tr:last-child td { border-bottom: none; }
          .oad-table tr:hover td { background: #f8fafc; }

          /* Form fields */
          .oad-field-label { display: block; font-size: .75rem; font-weight: 700; color: #374151; margin-bottom: .3rem; }
          .oad-input {
            width: 100%; padding: .45rem .7rem; font-size: .85rem;
            border: 1.5px solid #e2e8f0; border-radius: 8px;
            background: #fff; color: #1e293b; outline: none; box-sizing: border-box;
          }
          .oad-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px #6366f122; }

          /* Responsive */
          @media (max-width: 1000px) { .oad-sidebar { display: none; } .oad-content { padding: 1.25rem 1rem; } }
          @media (max-width: 640px)  { .oad-two-col { grid-template-columns: 1fr; } }
        `}</style>

        <div className="oad-layout">
          {/* Sidebar */}
          <nav className="oad-sidebar" aria-label="Organization dashboard navigation">
            <div className="oad-sidebar-brand">
              Org Dashboard
              <span>Enterprise Analytics</span>
            </div>
            {ORG_NAV.map(item => (
              <Link
                key={item.key}
                to={item.to}
                className={`oad-nav-link${item.key === 'org-dashboard' ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="oad-sidebar-footer">
              <Link to="/practice-settings">⚙️ Settings</Link><br />
              <Link to="/iatlas" style={{ marginTop: '.4rem', display: 'block' }}>← IATLAS Home</Link>
            </div>
          </nav>

          {/* Main content */}
          <div className="oad-content">
            <div className="oad-page-header">
              <div>
                <h1 className="oad-page-title">📊 Organization Dashboard</h1>
                <p className="oad-page-sub">Enterprise analytics · 247 active clients · 14 practitioners</p>
              </div>
              <div style={{ display: 'flex', gap: '.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={dateRange}
                  onChange={e => setDateRange(e.target.value)}
                  className="oad-input"
                  style={{ width: 'auto', fontSize: '.82rem' }}
                  aria-label="Date range"
                >
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="last-quarter">Last Quarter</option>
                  <option value="this-year">This Year</option>
                  <option value="custom">Custom Range…</option>
                </select>
                <button className="oad-btn" onClick={() => setActiveTab('export')}>📥 Export</button>
              </div>
            </div>

            {/* Tabs */}
            <div className="oad-tabs" role="tablist">
              {TABS.map(t => (
                <button
                  key={t.key}
                  className={`oad-tab${activeTab === t.key ? ' active' : ''}`}
                  role="tab"
                  aria-selected={activeTab === t.key}
                  onClick={() => setActiveTab(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div role="tabpanel" aria-label={TABS.find(t => t.key === activeTab)?.label}>
              {activeTab === 'overview'      && <OverviewTab />}
              {activeTab === 'cohorts'       && <CohortsTab />}
              {activeTab === 'trends'        && <DimensionTrendsTab />}
              {activeTab === 'practitioners' && <PractitionersTab />}
              {activeTab === 'capacity'      && <CapacityTab />}
              {activeTab === 'export'        && <ExportTab />}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
