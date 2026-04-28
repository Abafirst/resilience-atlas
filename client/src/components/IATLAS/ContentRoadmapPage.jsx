/**
 * ContentRoadmapPage.jsx
 * IATLAS Content Development Roadmap — strategic 3-phase rollout view.
 * Route: /iatlas/roadmap
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../SiteHeader.jsx';
import DarkModeHint from '../DarkModeHint.jsx';
import {
  ROADMAP_PHASES,
  QUALITY_CHECKLIST,
  DEVELOPMENT_WORKFLOW,
  DOWNLOADABLE_RESOURCES,
  PIPELINE_STATS,
} from '../../data/contentRoadmap.js';

const PAGE_STYLES = `
  /* ── Page shell ───────────────────────────────────────────────────────────── */
  .crp-page {
    background: #f8fafc;
    min-height: 100vh;
  }

  .dark-mode .crp-page {
    background: #0f172a;
  }

  .crp-wrap {
    max-width: 960px;
    margin: 0 auto;
    padding: 0 1.25rem 5rem;
  }

  /* ── Breadcrumb ──────────────────────────────────────────────────────────── */
  .crp-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }

  .crp-breadcrumb a { color: inherit; text-decoration: none; }
  .crp-breadcrumb a:hover { color: #4f46e5; text-decoration: underline; }
  .crp-breadcrumb-sep { color: #d1d5db; }

  /* ── Hero ────────────────────────────────────────────────────────────────── */
  .crp-hero {
    background: linear-gradient(135deg, #1e293b, #0f172a);
    border-radius: 20px;
    padding: 2.5rem 2rem;
    margin: .75rem 0 2.5rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
  }

  .crp-hero::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 200px;
    height: 200px;
    background: rgba(255,255,255,.04);
    border-radius: 50%;
    pointer-events: none;
  }

  .crp-hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: .45rem;
    background: rgba(255,255,255,.1);
    border-radius: 20px;
    padding: .3rem .9rem;
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    margin-bottom: 1rem;
  }

  .crp-hero-kicker-icon {
    width: 14px;
    height: 14px;
    filter: brightness(0) invert(1);
  }

  .crp-hero-title {
    font-size: 2rem;
    font-weight: 900;
    margin: 0 0 .6rem;
    line-height: 1.2;
  }

  .crp-hero-sub {
    font-size: .95rem;
    opacity: .8;
    margin: 0;
    max-width: 540px;
    line-height: 1.6;
  }

  /* ── Pipeline stats ──────────────────────────────────────────────────────── */
  .crp-pipeline {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    padding: 1.75rem;
    margin-bottom: 2.5rem;
  }

  .dark-mode .crp-pipeline {
    background: #1e293b;
    border-color: #334155;
  }

  .crp-pipeline-title {
    font-size: 1rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 1.25rem;
  }

  .dark-mode .crp-pipeline-title {
    color: #f1f5f9;
  }

  .crp-pipeline-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: .85rem;
  }

  .crp-stat-card {
    background: #f8fafc;
    border-radius: 10px;
    padding: .85rem 1rem;
  }

  .dark-mode .crp-stat-card {
    background: #0f172a;
  }

  .crp-stat-label {
    font-size: .75rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: .4rem;
  }

  .dark-mode .crp-stat-label { color: #94a3b8; }

  .crp-stat-bar-wrap {
    height: 6px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: .35rem;
  }

  .dark-mode .crp-stat-bar-wrap { background: #334155; }

  .crp-stat-bar {
    height: 100%;
    border-radius: 3px;
    transition: width .5s ease;
  }

  .crp-stat-numbers {
    font-size: .78rem;
    color: #374151;
    font-weight: 600;
  }

  .dark-mode .crp-stat-numbers { color: #cbd5e1; }

  /* ── Section layout ──────────────────────────────────────────────────────── */
  .crp-section {
    margin-bottom: 3rem;
  }

  .crp-section-kicker {
    font-size: .78rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .06em;
    color: #6366f1;
    display: flex;
    align-items: center;
    gap: .35rem;
    margin-bottom: .4rem;
  }

  .crp-section-kicker-icon {
    width: 14px;
    height: 14px;
  }

  .crp-section-title {
    font-size: 1.5rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .4rem;
  }

  .dark-mode .crp-section-title { color: #f1f5f9; }

  .crp-section-sub {
    font-size: .9rem;
    color: #64748b;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }

  .dark-mode .crp-section-sub { color: #94a3b8; }

  /* ── Phase cards ─────────────────────────────────────────────────────────── */
  .crp-phase-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    overflow: hidden;
    margin-bottom: 1.25rem;
  }

  .dark-mode .crp-phase-card {
    background: #1e293b;
    border-color: #334155;
  }

  .crp-phase-header {
    padding: 1.5rem;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    cursor: pointer;
    border: none;
    background: none;
    width: 100%;
    text-align: left;
  }

  .crp-phase-header:hover {
    background: #f8fafc;
  }

  .dark-mode .crp-phase-header:hover {
    background: #0f172a;
  }

  .crp-phase-num {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .9rem;
    font-weight: 800;
    color: #ffffff;
    flex-shrink: 0;
  }

  .crp-phase-meta {
    flex: 1;
  }

  .crp-phase-timeframe {
    font-size: .75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .05em;
    opacity: .65;
    margin-bottom: .3rem;
    color: #374151;
  }

  .dark-mode .crp-phase-timeframe { color: #94a3b8; }

  .crp-phase-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0;
    line-height: 1.3;
  }

  .dark-mode .crp-phase-title { color: #f1f5f9; }

  .crp-phase-subtitle {
    font-size: .83rem;
    color: #64748b;
    margin-top: .2rem;
  }

  .dark-mode .crp-phase-subtitle { color: #94a3b8; }

  .crp-phase-status {
    padding: .25rem .7rem;
    border-radius: 20px;
    font-size: .75rem;
    font-weight: 700;
    align-self: flex-start;
    white-space: nowrap;
  }

  .crp-phase-chevron {
    font-size: 1.1rem;
    opacity: .4;
    transition: transform .2s;
    align-self: center;
    flex-shrink: 0;
  }

  .crp-phase-chevron--open {
    transform: rotate(90deg);
    opacity: .7;
  }

  .crp-phase-body {
    padding: 0 1.5rem 1.5rem;
  }

  .crp-phase-goal {
    font-size: .88rem;
    color: #475569;
    margin: 0 0 1.25rem;
    padding: .75rem 1rem;
    background: #f8fafc;
    border-radius: 8px;
    line-height: 1.5;
  }

  .dark-mode .crp-phase-goal {
    background: #0f172a;
    color: #94a3b8;
  }

  .crp-deliverables {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }

  .crp-deliverable {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1rem;
  }

  .dark-mode .crp-deliverable {
    border-color: #334155;
  }

  .crp-deliverable-header {
    display: flex;
    align-items: center;
    gap: .6rem;
    margin-bottom: .75rem;
  }

  .crp-deliverable-icon {
    width: 18px;
    height: 18px;
    opacity: .7;
  }

  .crp-deliverable-title {
    font-size: .85rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .dark-mode .crp-deliverable-title { color: #f1f5f9; }

  .crp-deliverable-progress {
    margin-bottom: .6rem;
  }

  .crp-del-bar-wrap {
    height: 5px;
    background: #e2e8f0;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: .25rem;
  }

  .dark-mode .crp-del-bar-wrap { background: #334155; }

  .crp-deliverable-items {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: .3rem;
  }

  .crp-deliverable-item {
    font-size: .78rem;
    color: #475569;
    display: flex;
    align-items: flex-start;
    gap: .4rem;
    line-height: 1.4;
  }

  .dark-mode .crp-deliverable-item { color: #94a3b8; }

  .crp-del-check {
    color: #10b981;
    font-weight: 700;
    flex-shrink: 0;
  }

  .crp-criteria {
    margin-top: 1rem;
    padding: .75rem 1rem;
    background: #fef3c7;
    border-radius: 8px;
    font-size: .82rem;
    color: #78350f;
    line-height: 1.5;
  }

  .dark-mode .crp-criteria {
    background: #2d2008;
    color: #fcd34d;
  }

  .crp-criteria-label {
    font-weight: 700;
    margin-right: .35rem;
  }

  /* ── Quality checklist ───────────────────────────────────────────────────── */
  .crp-checklist {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: .5rem;
  }

  .crp-check-item {
    display: flex;
    align-items: center;
    gap: .6rem;
    padding: .6rem .85rem;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: .83rem;
    color: #374151;
  }

  .dark-mode .crp-check-item {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
  }

  .crp-check-box {
    width: 18px;
    height: 18px;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dark-mode .crp-check-box { border-color: #475569; }

  /* ── Workflow steps ──────────────────────────────────────────────────────── */
  .crp-workflow {
    display: flex;
    gap: 0;
    overflow-x: auto;
    padding-bottom: .5rem;
  }

  .crp-workflow-step {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-right: none;
    padding: 1.25rem;
    flex: 1;
    min-width: 140px;
    max-width: 200px;
    position: relative;
  }

  .crp-workflow-step:first-child {
    border-radius: 12px 0 0 12px;
  }

  .crp-workflow-step:last-child {
    border-radius: 0 12px 12px 0;
    border-right: 1px solid #e2e8f0;
  }

  .dark-mode .crp-workflow-step {
    background: #1e293b;
    border-color: #334155;
  }

  .dark-mode .crp-workflow-step:last-child {
    border-right-color: #334155;
  }

  .crp-wf-num {
    width: 28px;
    height: 28px;
    background: #eef2ff;
    color: #4f46e5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: .8rem;
    font-weight: 800;
    margin-bottom: .6rem;
  }

  .dark-mode .crp-wf-num {
    background: #1e2a40;
    color: #818cf8;
  }

  .crp-wf-title {
    font-size: .9rem;
    font-weight: 800;
    color: #0f172a;
    margin: 0 0 .25rem;
  }

  .dark-mode .crp-wf-title { color: #f1f5f9; }

  .crp-wf-time {
    font-size: .75rem;
    color: #64748b;
    margin-bottom: .6rem;
  }

  .dark-mode .crp-wf-time { color: #94a3b8; }

  .crp-wf-tasks {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: .78rem;
    color: #475569;
    display: flex;
    flex-direction: column;
    gap: .25rem;
  }

  .dark-mode .crp-wf-tasks { color: #94a3b8; }

  .crp-wf-task::before {
    content: '• ';
    opacity: .5;
  }
`;

const STATUS_STYLES = {
  'in-progress': { bg: '#dcfce7', color: '#166534', label: 'In Progress' },
  'planned':     { bg: '#f1f5f9', color: '#475569', label: 'Planned' },
  'complete':    { bg: '#d1fae5', color: '#065f46', label: 'Complete' },
};

function ProgressBar({ current, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="crp-stat-bar-wrap">
      <div
        className="crp-stat-bar"
        style={{ width: `${pct}%`, background: color }}
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`${current} of ${target}`}
      />
    </div>
  );
}

function PhaseCard({ phase }) {
  const [open, setOpen] = useState(phase.status === 'in-progress');
  const statusStyle = STATUS_STYLES[phase.status] || STATUS_STYLES.planned;

  return (
    <div className="crp-phase-card" style={{ borderTopColor: phase.color, borderTopWidth: 3 }}>
      <button
        className="crp-phase-header"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <div
          className="crp-phase-num"
          style={{ background: phase.color }}
          aria-hidden="true"
        >
          {phase.phase}
        </div>
        <div className="crp-phase-meta">
          <p className="crp-phase-timeframe">{phase.timeframe}</p>
          <p className="crp-phase-title">
            Phase {phase.phase}: {phase.title}
          </p>
          <p className="crp-phase-subtitle">{phase.subtitle} — {phase.goal}</p>
        </div>
        <span
          className="crp-phase-status"
          style={{ background: statusStyle.bg, color: statusStyle.color }}
        >
          {statusStyle.label}
        </span>
        <span
          className={`crp-phase-chevron${open ? ' crp-phase-chevron--open' : ''}`}
          aria-hidden="true"
        >›</span>
      </button>

      {open && (
        <div className="crp-phase-body">
          <p className="crp-phase-goal">
            <strong>Goal:</strong> {phase.goal}
          </p>

          <div className="crp-deliverables" role="list">
            {phase.deliverables.map(d => {
              const pct = d.target > 0 ? Math.round((d.current / d.target) * 100) : 0;
              return (
                <div key={d.id} className="crp-deliverable" role="listitem">
                  <div className="crp-deliverable-header">
                    <img src={d.icon} alt="" className="crp-deliverable-icon" aria-hidden="true" />
                    <h4 className="crp-deliverable-title">{d.category}</h4>
                  </div>
                  <div className="crp-deliverable-progress">
                    <div className="crp-del-bar-wrap">
                      <div
                        className="crp-stat-bar"
                        style={{ width: `${pct}%`, background: phase.color }}
                        role="progressbar"
                        aria-valuenow={d.current}
                        aria-valuemin={0}
                        aria-valuemax={d.target}
                      />
                    </div>
                    <span style={{ fontSize: '.72rem', color: '#64748b' }}>
                      {d.current}/{d.target} ({pct}%)
                    </span>
                  </div>
                  <ul className="crp-deliverable-items" aria-label={`${d.category} items`}>
                    {d.items.map((item, i) => (
                      <li key={i} className="crp-deliverable-item">
                        <span className="crp-del-check" aria-hidden="true">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <p className="crp-criteria">
            <span className="crp-criteria-label">Completion Criteria:</span>
            {phase.completionCriteria}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ContentRoadmapPage() {
  const allStats = [
    ...Object.values(PIPELINE_STATS.adult),
    ...Object.values(PIPELINE_STATS.kids),
    ...Object.values(PIPELINE_STATS.resources),
  ];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  }, []);

  const statColors = {
    'Adult Foundation': '#10b981',
    'Adult Building':   '#6366f1',
    'Adult Mastery':    '#d97706',
    'Kids 5–7':   '#f59e0b',
    'Kids 8–10':  '#10b981',
    'Kids 11–14': '#6366f1',
    'Kids 15–18': '#8b5cf6',
    'Worksheets':   '#db2777',
    'Audio Guides': '#0891b2',
    'Video Content':'#64748b',
  };

  return (
    <>
      <style>{PAGE_STYLES}</style>
      <a href="#main-content" className="iatlas-skip">Skip to roadmap</a>
      <SiteHeader activePage="iatlas" />
      <DarkModeHint />

      <main className="crp-page" id="main-content">
        <div className="crp-wrap">

          {/* Breadcrumb */}
          <nav className="crp-breadcrumb" aria-label="Breadcrumb">
            <a href="/iatlas">IATLAS</a>
            <span className="crp-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">Content Roadmap</span>
          </nav>

          {/* Hero */}
          <section className="crp-hero" aria-labelledby="crp-hero-title">
            <span className="crp-hero-kicker">
              <img src="/icons/planning.svg" alt="" className="crp-hero-kicker-icon" aria-hidden="true" />
              Content Development
            </span>
            <h1 className="crp-hero-title" id="crp-hero-title">
              IATLAS Content Roadmap
            </h1>
            <p className="crp-hero-sub">
              An interactive visual guide to the <strong>IATLAS</strong> (Integrated Applied Teaching and Learning Analysis System) curriculum —
              strategic 3-phase rollout plan for building out the full ecosystem across ages 5–18.
              Adult skills, kids activities, gamification, and resources.
            </p>
          </section>

          {/* Pipeline stats */}
          <section className="crp-pipeline" aria-labelledby="crp-pipeline-title">
            <h2 className="crp-pipeline-title" id="crp-pipeline-title">
              Content Pipeline Overview
            </h2>
            <div className="crp-pipeline-grid" role="list">
              {allStats.map(stat => {
                const pct = stat.target > 0 ? Math.round((stat.current / stat.target) * 100) : 0;
                const color = statColors[stat.label] || '#6366f1';
                return (
                  <div key={stat.label} className="crp-stat-card" role="listitem">
                    <p className="crp-stat-label">{stat.label}</p>
                    <ProgressBar current={stat.current} target={stat.target} color={color} />
                    <span className="crp-stat-numbers">
                      {stat.current}/{stat.target} · {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Phase cards */}
          <section className="crp-section" aria-labelledby="crp-phases-title">
            <div>
              <span className="crp-section-kicker">
                <img src="/icons/quest.svg" alt="" className="crp-section-kicker-icon" aria-hidden="true" />
                3-Phase Rollout
              </span>
              <h2 className="crp-section-title" id="crp-phases-title">Strategic Development Phases</h2>
              <p className="crp-section-sub">
                Each phase builds on the last — from MVP launch through full curriculum to advanced personalization.
              </p>
            </div>

            <div role="list">
              {ROADMAP_PHASES.map(phase => (
                <div key={phase.id} role="listitem">
                  <PhaseCard phase={phase} />
                </div>
              ))}
            </div>
          </section>

          {/* Quality checklist */}
          <section className="crp-section" aria-labelledby="crp-quality-title">
            <div>
              <span className="crp-section-kicker">
                <img src="/icons/checkmark.svg" alt="" className="crp-section-kicker-icon" aria-hidden="true" />
                Quality Standards
              </span>
              <h2 className="crp-section-title" id="crp-quality-title">Content Quality Checklist</h2>
              <p className="crp-section-sub">
                Every skill module and activity must pass this checklist before publication.
              </p>
            </div>

            <div className="crp-checklist" role="list">
              {QUALITY_CHECKLIST.map(item => (
                <div key={item.id} className="crp-check-item" role="listitem">
                  <span className="crp-check-box" aria-hidden="true" />
                  {item.label}
                </div>
              ))}
            </div>
          </section>

          {/* Development workflow */}
          <section className="crp-section" aria-labelledby="crp-workflow-title">
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="crp-section-kicker">
                <img src="/icons/planning.svg" alt="" className="crp-section-kicker-icon" aria-hidden="true" />
                Development Process
              </span>
              <h2 className="crp-section-title" id="crp-workflow-title">Curriculum Development Workflow</h2>
              <p className="crp-section-sub">
                ~2.5 hours per skill module · 50 skills ≈ 125 hours ≈ 3 weeks full-time.
              </p>
            </div>

            <div className="crp-workflow" role="list" aria-label="Development workflow steps">
              {DEVELOPMENT_WORKFLOW.map(step => (
                <div key={step.step} className="crp-workflow-step" role="listitem">
                  <div className="crp-wf-num" aria-hidden="true">{step.step}</div>
                  <p className="crp-wf-title">{step.title}</p>
                  <p className="crp-wf-time">{step.time}</p>
                  <ul className="crp-wf-tasks" aria-label={`${step.title} tasks`}>
                    {step.tasks.map((task, i) => (
                      <li key={i} className="crp-wf-task">{task}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Downloadable resources plan */}
          <section className="crp-section" aria-labelledby="crp-resources-title">
            <div>
              <span className="crp-section-kicker">
                <img src="/icons/reflection.svg" alt="" className="crp-section-kicker-icon" aria-hidden="true" />
                Resources Plan
              </span>
              <h2 className="crp-section-title" id="crp-resources-title">Downloadable Resources</h2>
              <p className="crp-section-sub">
                Worksheets, audio guides, and video content planned for each phase.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {[
                { title: 'Worksheets (PDFs)', items: DOWNLOADABLE_RESOURCES.worksheets, icon: '/icons/writing.svg' },
                { title: 'Audio Guides (MP3s)', items: DOWNLOADABLE_RESOURCES.audioGuides, icon: '/icons/breathing.svg' },
                { title: 'Video Content (Future)', items: DOWNLOADABLE_RESOURCES.videoContent, icon: '/icons/video.svg' },
              ].map(group => (
                <div
                  key={group.title}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '1.25rem',
                  }}
                  className="dark-mode-aware"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '1rem' }}>
                    <img src={group.icon} alt="" width={18} height={18} aria-hidden="true" />
                    <strong style={{ fontSize: '.88rem', color: '#0f172a' }}>{group.title}</strong>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    {group.items.map(item => (
                      <li
                        key={item.id}
                        style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: '#475569' }}
                      >
                        <span
                          style={{
                            padding: '.1rem .45rem',
                            borderRadius: 4,
                            fontSize: '.68rem',
                            fontWeight: 700,
                            background: item.status === 'planned' ? '#fef3c7' : '#e0f2fe',
                            color: item.status === 'planned' ? '#92400e' : '#075985',
                          }}
                        >
                          {item.status}
                        </span>
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Navigation links */}
          <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
            <Link
              to="/iatlas/kids"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem',
                background: '#4f46e5',
                color: '#fff',
                borderRadius: 8,
                padding: '.6rem 1.2rem',
                fontSize: '.88rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <img src="/icons/kids-spark.svg" alt="" width={16} height={16} aria-hidden="true" style={{ filter: 'brightness(0) invert(1)' }} />
              Explore Kids Curriculum
            </Link>
            <Link
              to="/iatlas"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '.4rem',
                background: '#f1f5f9',
                color: '#374151',
                borderRadius: 8,
                padding: '.6rem 1.2rem',
                fontSize: '.88rem',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              ← Back to IATLAS
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
