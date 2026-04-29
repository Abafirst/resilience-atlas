/**
 * TrainTheFacilitatorPage.jsx
 * "Train the Facilitator" curriculum landing page — Coming Soon teaser.
 * Route: /iatlas/train-the-facilitator
 *
 * Philosophy: Facilitators, clinicians, caregivers, families, teachers, and
 * participants ALL build resilience through the same 6 IATLAS dimensions.
 * Everyone in the ecosystem grows together.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import DarkModeHint from '../components/DarkModeHint.jsx';

const DIMENSIONS = [
  { key: 'agentic',   icon: '/icons/agentic-generative.svg',  label: 'Agentic-Generative',   color: '#4f46e5', bg: '#eef2ff',  desc: 'Lead with purpose & model goal-directed action for those you serve.' },
  { key: 'somatic',   icon: '/icons/somatic-regulative.svg',  label: 'Somatic-Regulative',   color: '#059669', bg: '#d1fae5',  desc: 'Regulate your own nervous system so you can co-regulate with others.' },
  { key: 'emotional', icon: '/icons/emotional-reflective.svg',label: 'Emotional-Reflective',  color: '#db2777', bg: '#fce7f3',  desc: 'Process your own emotions before facilitating emotional growth.' },
  { key: 'cognitive', icon: '/icons/cognitive-imaginative.svg',label: 'Cognitive-Imaginative', color: '#d97706', bg: '#fef3c7',  desc: 'Expand creative thinking and model cognitive flexibility.' },
  { key: 'relational',icon: '/icons/relational-connective.svg',label: 'Relational-Connective', color: '#0891b2', bg: '#e0f2fe',  desc: 'Build authentic connection — the foundation of effective facilitation.' },
  { key: 'spiritual', icon: '/icons/spiritual-purposive.svg',  label: 'Spiritual-Purposive',  color: '#7c3aed', bg: '#f5f3ff',  desc: 'Ground your practice in meaning and sustain long-term practitioner wellbeing.' },
];

const WHO_BENEFITS = [
  { icon: '/icons/clinical.svg', role: 'Clinicians & Therapists',        desc: 'ABA therapists, psychologists, LCSWs — build your own resilience while equipping clients.' },
  { icon: '/icons/speech.svg', role: 'Speech-Language Pathologists',   desc: 'Integrate resilience principles into communication-focused treatment.' },
  { icon: '/icons/movement.svg', role: 'Occupational Therapists',        desc: 'Use sensory and somatic dimensions to support both clients and yourself.' },
  { icon: '/icons/teacher.svg', role: 'Teachers & Educators',           desc: 'Bring classroom-ready resilience tools to students of all ages.' },
  { icon: '/icons/relational-connective.svg', role: 'Caregivers & Families',          desc: 'Parents, guardians, and siblings who support resilience-building at home.' },
  { icon: '/icons/organization.svg', role: 'Practice Administrators',        desc: 'Lead a resilience-centered practice culture from the top down.' },
  { icon: '/icons/facilitation-team.svg', role: 'Group Facilitators',             desc: 'Run workshops, support groups, and teams using IATLAS protocols.' },
  { icon: '/icons/connection.svg', role: 'Community Support Workers',      desc: 'Social workers, case managers, and community advocates.' },
];

const TTF_MODULES = [
  {
    num: '01',
    title: 'Foundations of IATLAS',
    color: '#4f46e5',
    bg: '#eef2ff',
    items: [
      'Six-dimensional resilience framework',
      'ABA + ACT integration principles',
      'Fidelity to evidence-based protocols',
      'Your own dimensional self-assessment',
    ],
  },
  {
    num: '02',
    title: 'Assessment & Planning',
    color: '#059669',
    bg: '#d1fae5',
    items: [
      'Conducting dimensional assessments',
      'Creating individualized intervention plans',
      'Progress monitoring systems',
      'Adapting protocols across populations',
    ],
  },
  {
    num: '03',
    title: 'Facilitation Skills',
    color: '#db2777',
    bg: '#fce7f3',
    items: [
      'Trauma-informed delivery',
      'Cultural responsiveness',
      'Group facilitation techniques',
      'Managing challenging behaviors',
    ],
  },
  {
    num: '04',
    title: 'Practitioner Resilience',
    color: '#d97706',
    bg: '#fef3c7',
    items: [
      'Your own 6-dimension growth plan',
      'Burnout prevention strategies',
      'Professional peer support',
      'Reflective practice habits',
    ],
  },
  {
    num: '05',
    title: 'Practicum & Supervision',
    color: '#0891b2',
    bg: '#e0f2fe',
    items: [
      'Supervised protocol delivery',
      'Peer review and feedback',
      'Competency demonstration',
      'Portfolio development',
    ],
  },
  {
    num: '06',
    title: 'Certification',
    color: '#7c3aed',
    bg: '#f5f3ff',
    items: [
      'Final competency assessment',
      'Ethics & professional standards',
      'IATLAS Certified Facilitator credential',
      'Ongoing professional development',
    ],
  },
];

// ── Page styles ────────────────────────────────────────────────────────────────
const STYLES = `
  /* ── Page shell ──────────────────────────────────────────────────────────── */
  .ttf-page {
    background:
      radial-gradient(circle at 5% 0%, rgba(79,70,229,.1) 0%, transparent 36%),
      radial-gradient(circle at 95% 5%, rgba(16,185,129,.08) 0%, transparent 32%),
      linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f8fafc 100%);
    min-height: 100vh;
  }

  .ttf-wrap {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 1.25rem 5rem;
  }

  /* ── Skip link ────────────────────────────────────────────────────────────── */
  .ttf-skip {
    position: absolute;
    left: -9999px;
    top: auto;
    width: 1px;
    height: 1px;
    overflow: hidden;
  }
  .ttf-skip:focus {
    position: fixed;
    left: 1rem;
    top: 1rem;
    width: auto;
    height: auto;
    padding: .6rem 1.2rem;
    background: #4f46e5;
    color: #fff;
    border-radius: 8px;
    z-index: 9999;
    font-weight: 700;
    text-decoration: none;
  }

  /* ── Visually hidden (screen reader only) ────────────────────────────────── */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* ── Breadcrumb ───────────────────────────────────────────────────────────── */
  .ttf-breadcrumb {
    display: flex;
    align-items: center;
    gap: .4rem;
    font-size: .8rem;
    color: #6b7280;
    padding: 1.25rem 0 .5rem;
    flex-wrap: wrap;
  }
  .ttf-breadcrumb a { color: inherit; text-decoration: none; }
  .ttf-breadcrumb a:hover { color: #4f46e5; text-decoration: underline; }
  .ttf-breadcrumb-sep { color: #d1d5db; }

  /* ── Hero ─────────────────────────────────────────────────────────────────── */
  .ttf-hero {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-radius: 24px;
    padding: 3.5rem 3rem;
    color: #ffffff;
    position: relative;
    overflow: hidden;
    margin: 1rem 0 2.5rem;
  }
  .ttf-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at 80% 20%, rgba(110,231,183,.15) 0%, transparent 50%),
      radial-gradient(circle at 20% 80%, rgba(79,70,229,.2) 0%, transparent 50%);
    pointer-events: none;
  }
  .ttf-hero-content { position: relative; z-index: 1; max-width: 680px; }

  .ttf-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,.15);
    backdrop-filter: blur(10px);
    border-radius: 20px;
    padding: .4rem 1rem;
    font-size: .85rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
  }

  .ttf-hero-title {
    font-size: clamp(2rem, 5vw, 2.75rem);
    font-weight: 900;
    line-height: 1.2;
    margin: 0 0 1rem;
  }

  .ttf-hero-subtitle {
    font-size: 1.15rem;
    opacity: .9;
    margin: 0 0 1rem;
    font-weight: 600;
    color: #6ee7b7;
  }

  .ttf-hero-desc {
    font-size: 1rem;
    line-height: 1.75;
    opacity: .85;
    margin: 0 0 2rem;
  }

  .ttf-hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: .75rem;
    align-items: center;
  }

  /* ── Shared buttons ────────────────────────────────────────────────────────── */
  .ttf-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: #4f46e5;
    color: #fff;
    border: none;
    border-radius: 10px;
    padding: .75rem 1.5rem;
    font-size: .95rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: background .18s ease, transform .18s ease, box-shadow .18s ease;
    box-shadow: 0 4px 14px rgba(79,70,229,.35);
  }
  .ttf-btn-primary:hover, .ttf-btn-primary:focus-visible {
    background: #4338ca;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(79,70,229,.45);
  }

  .ttf-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: rgba(255,255,255,.15);
    color: #fff;
    border: 1.5px solid rgba(255,255,255,.3);
    border-radius: 10px;
    padding: .72rem 1.35rem;
    font-size: .95rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: none;
    transition: background .18s ease, transform .18s ease;
  }
  .ttf-btn-secondary:hover, .ttf-btn-secondary:focus-visible {
    background: rgba(255,255,255,.25);
    transform: translateY(-1px);
  }

  /* ── Philosophy / "All-inclusive" section ────────────────────────────────── */
  .ttf-philosophy {
    background: #fff;
    border-radius: 20px;
    padding: 2.5rem;
    margin-bottom: 2.5rem;
    box-shadow: 0 2px 16px rgba(0,0,0,.06);
    border: 1px solid #e5e7eb;
  }
  [data-theme="dark"] .ttf-philosophy { background: #1e293b; border-color: #334155; }

  .ttf-philosophy-kicker {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: #ede9fe;
    color: #4f46e5;
    border-radius: 20px;
    padding: .35rem .9rem;
    font-size: .8rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  [data-theme="dark"] .ttf-philosophy-kicker { background: rgba(79,70,229,.25); color: #a5b4fc; }

  .ttf-philosophy-title {
    font-size: 1.6rem;
    font-weight: 900;
    margin: 0 0 1rem;
    color: #0f172a;
  }
  [data-theme="dark"] .ttf-philosophy-title { color: #f1f5f9; }

  .ttf-philosophy-text {
    font-size: 1rem;
    line-height: 1.75;
    color: #475569;
    margin: 0 0 1.5rem;
    max-width: 780px;
  }
  [data-theme="dark"] .ttf-philosophy-text { color: #94a3b8; }

  .ttf-philosophy-quote {
    background: linear-gradient(135deg, #ede9fe, #ddd6fe);
    border-left: 4px solid #4f46e5;
    border-radius: 12px;
    padding: 1.25rem 1.5rem;
    font-size: 1.1rem;
    font-weight: 700;
    color: #3730a3;
    font-style: italic;
    display: flex;
    align-items: flex-start;
    gap: .75rem;
  }
  [data-theme="dark"] .ttf-philosophy-quote {
    background: rgba(79,70,229,.2);
    color: #a5b4fc;
  }
  .ttf-philosophy-quote-mark { font-size: 2rem; line-height: 1; opacity: .6; flex-shrink: 0; }

  /* ── Universal roles table ───────────────────────────────────────────────── */
  .ttf-roles-section { margin-bottom: 2.5rem; }

  .ttf-section-header { margin-bottom: 1.5rem; }
  .ttf-section-kicker {
    display: inline-flex;
    align-items: center;
    gap: .4rem;
    background: #ecfdf5;
    color: #059669;
    border-radius: 20px;
    padding: .35rem .9rem;
    font-size: .8rem;
    font-weight: 700;
    margin-bottom: .75rem;
  }
  [data-theme="dark"] .ttf-section-kicker { background: rgba(5,150,105,.2); color: #34d399; }

  .ttf-section-title {
    font-size: 1.6rem;
    font-weight: 900;
    margin: 0 0 .5rem;
    color: #0f172a;
  }
  [data-theme="dark"] .ttf-section-title { color: #f1f5f9; }

  .ttf-section-sub {
    font-size: 1rem;
    color: #64748b;
    margin: 0;
    max-width: 650px;
    line-height: 1.65;
  }
  [data-theme="dark"] .ttf-section-sub { color: #94a3b8; }

  .ttf-roles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 1rem;
  }

  .ttf-role-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 1.25rem;
    display: flex;
    gap: .9rem;
    align-items: flex-start;
    transition: box-shadow .2s ease, transform .2s ease;
  }
  .ttf-role-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.08); transform: translateY(-2px); }
  [data-theme="dark"] .ttf-role-card { background: #1e293b; border-color: #334155; }

  .ttf-role-icon { width: 2rem; height: 2rem; flex-shrink: 0; }
  .ttf-role-name { font-size: .9rem; font-weight: 700; margin: 0 0 .25rem; color: #0f172a; }
  [data-theme="dark"] .ttf-role-name { color: #f1f5f9; }
  .ttf-role-benefit { font-size: .8rem; color: #64748b; margin: 0; line-height: 1.4; }
  [data-theme="dark"] .ttf-role-benefit { color: #94a3b8; }

  /* ── Dual track ───────────────────────────────────────────────────────────── */
  .ttf-dual-track {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }
  @media (max-width: 700px) { .ttf-dual-track { grid-template-columns: 1fr; } }

  .ttf-track-card {
    border-radius: 20px;
    padding: 2rem;
    color: #fff;
    position: relative;
    overflow: hidden;
  }
  .ttf-track-card-personal {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  }
  .ttf-track-card-professional {
    background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
  }
  .ttf-track-card-icon { width: 2rem; height: 2rem; margin-bottom: .75rem; display: block; filter: brightness(0) invert(1); }
  .ttf-track-card-title { font-size: 1.2rem; font-weight: 900; margin: 0 0 .5rem; }
  .ttf-track-card-desc { font-size: .9rem; opacity: .9; line-height: 1.65; margin: 0 0 1.25rem; }
  .ttf-track-card-items { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .4rem; }
  .ttf-track-card-items li {
    font-size: .85rem;
    display: flex;
    align-items: flex-start;
    gap: .5rem;
    opacity: .9;
  }
  .ttf-track-card-items li::before { content: '✓'; flex-shrink: 0; font-weight: 900; }

  /* ── Curriculum modules ───────────────────────────────────────────────────── */
  .ttf-modules-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2.5rem;
  }

  .ttf-module-card {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 16px;
    padding: 1.5rem;
    transition: box-shadow .2s ease, transform .2s ease;
  }
  .ttf-module-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,.08); transform: translateY(-2px); }
  [data-theme="dark"] .ttf-module-card { background: #1e293b; border-color: #334155; }

  .ttf-module-num {
    display: inline-block;
    background: #ede9fe;
    color: #4f46e5;
    border-radius: 8px;
    padding: .2rem .6rem;
    font-size: .8rem;
    font-weight: 800;
    margin-bottom: .75rem;
  }
  [data-theme="dark"] .ttf-module-num { background: rgba(79,70,229,.25); color: #a5b4fc; }

  .ttf-module-title { font-size: 1rem; font-weight: 800; margin: 0 0 .5rem; color: #0f172a; }
  [data-theme="dark"] .ttf-module-title { color: #f1f5f9; }

  .ttf-module-desc { font-size: .875rem; color: #475569; line-height: 1.65; margin: 0 0 1rem; }
  [data-theme="dark"] .ttf-module-desc { color: #94a3b8; }

  .ttf-module-topics { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .35rem; }
  .ttf-module-topics li {
    font-size: .8rem;
    color: #64748b;
    display: flex;
    gap: .4rem;
    align-items: flex-start;
  }
  .ttf-module-topics li::before { content: '›'; color: #4f46e5; font-weight: 900; flex-shrink: 0; }
  [data-theme="dark"] .ttf-module-topics li { color: #94a3b8; }

  /* ── Certification pathway ────────────────────────────────────────────────── */
  .ttf-pathway {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    border-radius: 20px;
    padding: 2.5rem;
    color: #fff;
    margin-bottom: 2.5rem;
    position: relative;
    overflow: hidden;
  }
  .ttf-pathway::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 80% 50%, rgba(110,231,183,.1) 0%, transparent 60%);
    pointer-events: none;
  }
  .ttf-pathway-title { font-size: 1.5rem; font-weight: 900; margin: 0 0 .5rem; position: relative; }
  .ttf-pathway-sub { opacity: .8; margin: 0 0 2rem; font-size: .95rem; position: relative; }

  .ttf-pathway-steps {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    position: relative;
  }
  .ttf-pathway-step {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
  }
  .ttf-pathway-step-num {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    background: rgba(255,255,255,.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    font-size: .9rem;
  }
  .ttf-pathway-step-label { font-weight: 700; margin: 0 0 .2rem; font-size: .95rem; }
  .ttf-pathway-step-desc { font-size: .85rem; opacity: .8; margin: 0; line-height: 1.5; }

  /* ── Pricing ──────────────────────────────────────────────────────────────── */
  .ttf-pricing-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2.5rem;
  }

  .ttf-pricing-card {
    background: #fff;
    border: 1.5px solid #e5e7eb;
    border-radius: 20px;
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    gap: .75rem;
    transition: box-shadow .2s ease, transform .2s ease;
  }
  .ttf-pricing-card:hover { box-shadow: 0 4px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
  [data-theme="dark"] .ttf-pricing-card { background: #1e293b; border-color: #334155; }

  .ttf-pricing-card.ttf-pricing-featured {
    border-color: #4f46e5;
    box-shadow: 0 4px 24px rgba(79,70,229,.2);
  }

  .ttf-pricing-badge {
    display: inline-block;
    background: #4f46e5;
    color: #fff;
    border-radius: 20px;
    padding: .2rem .75rem;
    font-size: .75rem;
    font-weight: 700;
    align-self: flex-start;
  }

  .ttf-pricing-tier { font-size: .85rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; margin: 0; }
  [data-theme="dark"] .ttf-pricing-tier { color: #94a3b8; }

  .ttf-pricing-price { font-size: 2rem; font-weight: 900; color: #0f172a; margin: 0; }
  [data-theme="dark"] .ttf-pricing-price { color: #f1f5f9; }
  .ttf-pricing-period { font-size: .85rem; color: #6b7280; font-weight: 400; }

  .ttf-pricing-desc { font-size: .875rem; color: #475569; line-height: 1.6; margin: 0; }
  [data-theme="dark"] .ttf-pricing-desc { color: #94a3b8; }

  .ttf-pricing-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: .5rem; flex: 1; }
  .ttf-pricing-features li { font-size: .85rem; color: #374151; display: flex; gap: .5rem; align-items: flex-start; }
  .ttf-pricing-features li::before { content: '✓'; color: #059669; font-weight: 900; flex-shrink: 0; }
  [data-theme="dark"] .ttf-pricing-features li { color: #cbd5e1; }

  .ttf-pricing-cta {
    display: block;
    text-align: center;
    background: #4f46e5;
    color: #fff;
    border-radius: 10px;
    padding: .72rem 1rem;
    font-size: .9rem;
    font-weight: 700;
    text-decoration: none;
    transition: background .18s ease;
    border: none;
    cursor: pointer;
    margin-top: auto;
  }
  .ttf-pricing-cta:hover { background: #4338ca; }
  .ttf-pricing-cta-outline {
    background: transparent;
    border: 1.5px solid #4f46e5;
    color: #4f46e5;
  }
  [data-theme="dark"] .ttf-pricing-cta-outline { color: #a5b4fc; border-color: #a5b4fc; }
  .ttf-pricing-cta-outline:hover { background: #4f46e5; color: #fff; }

  /* ── Waitlist ──────────────────────────────────────────────────────────────── */
  .ttf-waitlist {
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    border-radius: 20px;
    padding: 2.5rem;
    color: #fff;
    margin-bottom: 2.5rem;
    text-align: center;
  }
  .ttf-waitlist-title { font-size: 1.75rem; font-weight: 900; margin: 0 0 .75rem; }
  .ttf-waitlist-sub { font-size: 1rem; opacity: .9; margin: 0 0 1.75rem; max-width: 540px; margin-left: auto; margin-right: auto; line-height: 1.65; }

  .ttf-waitlist-form {
    display: flex;
    gap: .75rem;
    max-width: 500px;
    margin: 0 auto;
    flex-wrap: wrap;
    justify-content: center;
  }
  .ttf-waitlist-input {
    flex: 1;
    min-width: 220px;
    padding: .75rem 1rem;
    border-radius: 10px;
    border: 2px solid rgba(255,255,255,.3);
    background: rgba(255,255,255,.15);
    color: #fff;
    font-size: .95rem;
    outline: none;
    transition: border-color .18s ease;
  }
  .ttf-waitlist-input::placeholder { color: rgba(255,255,255,.6); }
  .ttf-waitlist-input:focus { border-color: rgba(255,255,255,.7); }
  .ttf-waitlist-submit {
    padding: .75rem 1.5rem;
    background: #fff;
    color: #4f46e5;
    border: none;
    border-radius: 10px;
    font-size: .95rem;
    font-weight: 700;
    cursor: pointer;
    transition: background .18s ease, transform .18s ease;
    white-space: nowrap;
  }
  .ttf-waitlist-submit:hover { background: #f0f0f0; transform: translateY(-1px); }
  .ttf-waitlist-success {
    display: inline-flex;
    align-items: center;
    gap: .5rem;
    background: rgba(255,255,255,.2);
    border-radius: 12px;
    padding: .75rem 1.5rem;
    font-size: 1rem;
    font-weight: 700;
  }

  /* ── FAQ ──────────────────────────────────────────────────────────────────── */
  .ttf-faq { margin-bottom: 2.5rem; }
  .ttf-faq-list { display: flex; flex-direction: column; gap: .75rem; }
  .ttf-faq-item {
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    overflow: hidden;
    transition: box-shadow .2s ease;
  }
  .ttf-faq-item:hover { box-shadow: 0 2px 12px rgba(0,0,0,.06); }
  [data-theme="dark"] .ttf-faq-item { background: #1e293b; border-color: #334155; }

  .ttf-faq-question {
    width: 100%;
    background: transparent;
    border: none;
    padding: 1.1rem 1.25rem;
    text-align: left;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    font-size: .95rem;
    font-weight: 700;
    color: #0f172a;
    transition: color .18s ease;
  }
  .ttf-faq-question:hover { color: #4f46e5; }
  [data-theme="dark"] .ttf-faq-question { color: #f1f5f9; }
  .ttf-faq-chevron { font-size: 1rem; flex-shrink: 0; transition: transform .2s ease; }
  .ttf-faq-chevron.open { transform: rotate(180deg); }
  .ttf-faq-answer {
    padding: 0 1.25rem 1.1rem;
    font-size: .9rem;
    color: #475569;
    line-height: 1.7;
  }
  [data-theme="dark"] .ttf-faq-answer { color: #94a3b8; }

  /* ── Testimonial placeholder ─────────────────────────────────────────────── */
  .ttf-testimonials {
    background: #f8fafc;
    border-radius: 20px;
    padding: 2.5rem;
    margin-bottom: 2.5rem;
    text-align: center;
    border: 1px dashed #cbd5e1;
  }
  [data-theme="dark"] .ttf-testimonials { background: #1e293b; border-color: #334155; }
  .ttf-testimonials-title { font-size: 1.3rem; font-weight: 800; margin: 0 0 .75rem; color: #0f172a; }
  [data-theme="dark"] .ttf-testimonials-title { color: #f1f5f9; }
  .ttf-testimonials-placeholder { font-size: .9rem; color: #64748b; margin: 0; }
  [data-theme="dark"] .ttf-testimonials-placeholder { color: #94a3b8; }

  /* ── Responsive ────────────────────────────────────────────────────────────── */
  @media (max-width: 700px) {
    .ttf-hero { padding: 2rem 1.5rem; }
    .ttf-philosophy { padding: 1.75rem 1.25rem; }
    .ttf-pathway { padding: 2rem 1.25rem; }
    .ttf-waitlist { padding: 2rem 1.25rem; }
    .ttf-roles-grid { grid-template-columns: 1fr; }
    .ttf-modules-grid { grid-template-columns: 1fr; }
    .ttf-pricing-grid { grid-template-columns: 1fr; }
  }
`;

// ── Data ───────────────────────────────────────────────────────────────────────
const ROLES = [
  { icon: '/icons/clinical.svg', role: 'Clinicians & Therapists', benefit: 'Self-care + client intervention skills', detail: 'Build your own dimensional resilience while mastering evidence-based protocols to deliver with clients' },
  { icon: '/icons/teacher.svg', role: 'Teachers & Educators', benefit: 'Personal wellness + classroom resilience', detail: 'Reduce burnout, improve your own emotional regulation, and bring resilience skills directly into the classroom' },
  { icon: '/icons/relational-connective.svg', role: 'Parents & Caregivers', benefit: 'Self-regulation + parenting skills', detail: 'Grow your own resilience while learning to model and teach resilience skills to your children every day' },
  { icon: '/icons/organization.svg', role: 'Team Leaders & Coaches', benefit: 'Leadership resilience + team development', detail: 'Lead from a place of authentic resilience and build a collective culture of dimensional wellbeing on your team' },
  { icon: '/icons/certification.svg', role: 'Trainers & Facilitators', benefit: 'Professional growth + training excellence', detail: 'Deepen your own practice across all 6 dimensions while earning credentials to deliver IATLAS programs at scale' },
  { icon: '/icons/professional.svg', role: 'HR & Wellbeing Professionals', benefit: 'Organizational resilience + employee support', detail: 'Champion resilience-forward culture from the inside out, starting with your own dimensional growth' },
  { icon: '/icons/kids-spark.svg', role: 'Kids & Youth (5–18)', benefit: 'Age-appropriate skill building + emotional growth', detail: 'The same 6-dimensional framework, adapted for play-based and developmentally appropriate learning' },
  { icon: '/icons/facilitation-team.svg', role: 'Teams & Organizations', benefit: 'Collective resilience + individual growth', detail: 'Align team culture around dimensional resilience through shared language, practices, and accountability' },
];

const MODULES = [
  {
    num: 'Module 1',
    title: 'Foundations of IATLAS',
    desc: 'Develop deep fluency with the 6-dimensional resilience framework, its theoretical grounding in ABA/ACT, and how it applies across all roles and age groups.',
    topics: [
      'Six-dimensional resilience model overview',
      'ABA + ACT integration principles',
      'Universal application: kids, adults, teams, families',
      'Self-assessment across all 6 dimensions',
    ],
  },
  {
    num: 'Module 2',
    title: 'Personal Resilience Development',
    desc: 'Before you teach resilience, you build it. This module guides facilitators through their own dimensional journey using the same tools participants will use.',
    topics: [
      'Conducting your own dimensional self-assessment',
      'Designing your personal resilience development plan',
      'Daily micropractice routines across 6 dimensions',
      '"Empty cup" reflection and self-monitoring',
    ],
  },
  {
    num: 'Module 3',
    title: 'Assessment & Planning',
    desc: 'Learn to administer dimensional assessments, interpret results, and create individualized or group-level resilience plans with fidelity.',
    topics: [
      'Administering dimensional assessments (all ages)',
      'Reading and interpreting resilience profiles',
      'Creating individualized intervention plans',
      'Group and cohort planning strategies',
    ],
  },
  {
    num: 'Module 4',
    title: 'Facilitation Skills & Delivery',
    desc: 'Master the craft of resilience facilitation — from group dynamics and trauma-informed delivery to cultural responsiveness and inclusive practice.',
    topics: [
      'Trauma-informed facilitation principles',
      'Cultural responsiveness and inclusive delivery',
      'Group dynamics, pacing, and engagement',
      'Adapting for virtual, in-person, and hybrid settings',
    ],
  },
  {
    num: 'Module 5',
    title: 'Protocol Fidelity',
    desc: 'Deliver IATLAS protocols with evidence-based fidelity while maintaining the flexibility needed for different populations and settings.',
    topics: [
      'ABA protocol structures and delivery sequences',
      'ACT-based acceptance and defusion techniques',
      'Micropractice design and facilitation',
      'Fidelity checklists and self-monitoring tools',
    ],
  },
  {
    num: 'Module 6',
    title: 'Supervised Practicum',
    desc: 'Gain real-world facilitation experience with live supervision, peer feedback, and competency-based assessments.',
    topics: [
      'Observed facilitation sessions (minimum 3 sessions)',
      'Peer review and structured feedback',
      'Competency assessment rubric',
      'Reflection and professional growth planning',
    ],
  },
];

const PATHWAY_STEPS = [
  { label: 'Enroll & Orientation', desc: 'Complete onboarding, meet your cohort, and set your personal resilience development goals.' },
  { label: 'Self-Assessment', desc: 'Take the full IATLAS dimensional assessment and create your personal growth plan.' },
  { label: 'Complete Core Modules', desc: 'Work through Modules 1–5 at your own pace within the cohort timeline.' },
  { label: 'Supervised Practicum', desc: 'Deliver at least 3 facilitated IATLAS sessions with coaching support and peer feedback.' },
  { label: 'Final Assessment', desc: 'Demonstrate facilitator competencies via observation, portfolio review, and oral reflection.' },
  { label: 'Earn TTF Credential', desc: 'Receive your Train the Facilitator certification and join the IATLAS facilitator community.' },
  { label: 'Ongoing Renewal', desc: 'Maintain certification through continuing education, annual re-assessment, and community engagement.' },
];

const PRICING_TIERS = [
  {
    tier: 'Professional Development',
    price: '$497',
    period: '/person',
    desc: 'Self-paced certification with cohort community and live Q&A sessions.',
    features: [
      'All 6 TTF core modules',
      'Personal resilience self-assessment',
      'Cohort community of practice',
      'Live virtual Q&A sessions',
      'Supervised practicum (3 sessions)',
      'TTF digital credential',
    ],
    cta: 'Join Waitlist',
    featured: false,
  },
  {
    tier: 'Group Licensing',
    price: '$1,997',
    period: '/group (up to 10)',
    desc: 'Train your whole team or cohort together with dedicated facilitation support.',
    features: [
      'Everything in Professional Development',
      'Group cohort with shared workspace',
      'Dedicated facilitator coach',
      'Custom organizational context',
      'Group progress dashboard',
      'Group certificate of completion',
    ],
    cta: 'Join Waitlist',
    featured: true,
  },
  {
    tier: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'Large-scale TTF programs for healthcare systems, school districts, and organizations.',
    features: [
      'Everything in Group Licensing',
      'Unlimited cohort members',
      'Custom branding and curriculum',
      'On-site or hybrid delivery',
      'Organizational analytics dashboard',
      'Dedicated account support',
    ],
    cta: 'Contact Us',
    featured: false,
  },
];

const FAQS = [
  {
    q: 'Do I need prior experience with IATLAS to enroll?',
    a: 'No prior experience is required. The TTF program starts from the foundations and takes you through everything you need. Having taken the Resilience Atlas™ assessment is helpful but not required.',
  },
  {
    q: 'How long does the TTF program take?',
    a: 'Most participants complete the core modules and practicum in 8–12 weeks. The program is designed to be cohort-based with self-paced modules and live touchpoints.',
  },
  {
    q: 'Does TTF apply to me if I work with kids?',
    a: 'Absolutely. The TTF program covers facilitation across all age groups, including the IATLAS Kids curriculum (ages 5–18). You\'ll learn to adapt the 6-dimensional framework for developmentally appropriate delivery.',
  },
  {
    q: 'Is this program accredited or does it provide CEUs?',
    a: 'We are actively pursuing CEU accreditation for BACB (Behavior Analyst Certification Board). BACB ACE approval is currently pending. Details will be announced at launch. The program is designed to meet the continuing education standards for BCBAs, BCaBAs, and RBTs.',
  },
  {
    q: 'How is the TTF credential maintained?',
    a: 'TTF credentials are renewed annually through continuing education hours, participation in the community of practice, and a brief annual self-assessment. This ensures facilitators stay current and continue their own dimensional resilience growth.',
  },
  {
    q: 'Can I facilitate IATLAS without the TTF credential?',
    a: 'Individual users can use IATLAS for their own growth without any certification. The TTF credential is required to formally deliver IATLAS programs to clients, students, teams, or organizational groups as an authorized facilitator.',
  },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function TrainTheFacilitatorPage() {
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle');
  const [openFaq, setOpenFaq] = useState(null);

  function handleWaitlist(e) {
    e.preventDefault();
    if (!waitlistEmail.trim()) return;
    setWaitlistStatus('success');
  }

  function toggleFaq(idx) {
    setOpenFaq(prev => (prev === idx ? null : idx));
  }

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <style>{`
          .ttf-wrap {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 1.25rem 4rem;
          }

          /* Hero */
          .ttf-hero {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 0 0 32px 32px;
            padding: clamp(3rem, 8vw, 5rem) 1.5rem clamp(2.5rem, 6vw, 4rem);
            text-align: center;
            color: #f1f5f9;
            position: relative;
            overflow: hidden;
            margin-bottom: 3rem;
          }
          .ttf-hero::before {
            content: '';
            position: absolute;
            top: -80px; right: -80px;
            width: 300px; height: 300px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(99,102,241,.25) 0%, transparent 70%);
            pointer-events: none;
          }
          .ttf-hero::after {
            content: '';
            position: absolute;
            bottom: -60px; left: -60px;
            width: 240px; height: 240px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(217,119,6,.18) 0%, transparent 70%);
            pointer-events: none;
          }
          .ttf-hero-inner { position: relative; z-index: 1; max-width: 760px; margin: 0 auto; }
          .ttf-coming-badge {
            display: inline-flex;
            align-items: center;
            gap: .4rem;
            background: rgba(245,158,11,.2);
            border: 1px solid rgba(245,158,11,.4);
            border-radius: 999px;
            padding: .3rem .9rem;
            font-size: .72rem;
            font-weight: 700;
            letter-spacing: .1em;
            text-transform: uppercase;
            color: #fbbf24;
            margin-bottom: 1rem;
          }
          .ttf-hero-title {
            font-size: clamp(2rem, 5vw, 3.25rem);
            font-weight: 900;
            margin: 0 0 1rem;
            line-height: 1.15;
            color: #f1f5f9;
          }
          .ttf-hero-sub {
            font-size: clamp(.95rem, 2vw, 1.1rem);
            color: #94a3b8;
            line-height: 1.7;
            max-width: 60ch;
            margin: 0 auto 2rem;
          }
          .ttf-hero-actions {
            display: flex;
            flex-wrap: wrap;
            gap: .75rem;
            justify-content: center;
          }

          /* Buttons */
          .ttf-btn-primary {
            display: inline-flex; align-items: center; gap: .4rem;
            background: #6366f1; color: #fff; border: none; border-radius: 10px;
            padding: .75rem 1.5rem; font-size: .95rem; font-weight: 700;
            text-decoration: none; cursor: pointer;
            transition: background .18s, transform .18s;
          }
          .ttf-btn-primary:hover { background: #4f46e5; transform: translateY(-2px); }
          .ttf-btn-secondary {
            display: inline-flex; align-items: center; gap: .4rem;
            background: rgba(255,255,255,.1); color: #e2e8f0;
            border: 1.5px solid rgba(255,255,255,.25); border-radius: 10px;
            padding: .72rem 1.4rem; font-size: .93rem; font-weight: 600;
            text-decoration: none; cursor: pointer;
            transition: background .18s, transform .18s;
          }
          .ttf-btn-secondary:hover { background: rgba(255,255,255,.18); transform: translateY(-2px); }

          /* Philosophy banner */
          .ttf-philosophy {
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            border-radius: 24px;
            padding: clamp(2rem, 5vw, 3rem);
            text-align: center;
            color: #fff;
            margin-bottom: 3rem;
          }
          .ttf-philosophy-kicker {
            font-size: .75rem; font-weight: 700; letter-spacing: .12em;
            text-transform: uppercase; color: #c4b5fd; margin-bottom: .6rem;
          }
          .ttf-philosophy-title {
            font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800;
            margin: 0 0 .8rem; color: #fff;
          }
          .ttf-philosophy-text {
            font-size: 1rem; color: rgba(255,255,255,.85);
            line-height: 1.7; max-width: 70ch; margin: 0 auto;
          }

          /* Section headers */
          .ttf-section-kicker {
            font-size: .72rem; font-weight: 700; letter-spacing: .12em;
            text-transform: uppercase; color: #6366f1;
            margin-bottom: .4rem; display: block;
          }
          .ttf-section-title {
            font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 800;
            color: #1e293b; margin: 0 0 .5rem;
          }
          .ttf-section-sub {
            font-size: .95rem; color: #64748b; line-height: 1.65;
            max-width: 65ch; margin: 0 0 2rem;
          }

          /* Dimensions grid */
          .ttf-dims-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
          }
          .ttf-dim-card {
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: .6rem;
          }
          .ttf-dim-header {
            display: flex; align-items: center; gap: .75rem;
          }
          .ttf-dim-icon-wrap {
            width: 42px; height: 42px; border-radius: 12px;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
          }
          .ttf-dim-label {
            font-size: .95rem; font-weight: 700; color: #1e293b;
          }
          .ttf-dim-desc {
            font-size: .85rem; color: #64748b; line-height: 1.55;
          }

          /* Who benefits */
          .ttf-who-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
          }
          .ttf-who-card {
            background: #fff; border: 1px solid #e2e8f0;
            border-radius: 16px; padding: 1.25rem;
          }
          .ttf-who-icon {
            width: 2rem; height: 2rem; margin-bottom: .5rem; display: block;
          }
          .ttf-who-role {
            font-size: .93rem; font-weight: 700; color: #1e293b;
            margin-bottom: .35rem;
          }
          .ttf-who-desc {
            font-size: .82rem; color: #64748b; line-height: 1.55;
          }

          /* Modules */
          .ttf-modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
            margin-bottom: 3rem;
          }
          .ttf-module-card {
            background: #fff; border: 1px solid #e2e8f0;
            border-radius: 16px; padding: 1.35rem;
          }
          .ttf-module-num {
            font-size: .7rem; font-weight: 700; letter-spacing: .1em;
            text-transform: uppercase; margin-bottom: .4rem;
          }
          .ttf-module-title {
            font-size: 1rem; font-weight: 700; color: #1e293b;
            margin-bottom: .8rem;
          }
          .ttf-module-list {
            list-style: none; padding: 0; margin: 0;
            display: flex; flex-direction: column; gap: .35rem;
          }
          .ttf-module-item {
            font-size: .83rem; color: #64748b;
            display: flex; align-items: baseline; gap: .5rem;
          }
          .ttf-module-bullet { color: #94a3b8; flex-shrink: 0; }

          /* Waitlist */
          .ttf-waitlist {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 24px;
            padding: clamp(2rem, 5vw, 3rem);
            text-align: center;
            color: #f1f5f9;
            margin-bottom: 2rem;
          }
          .ttf-waitlist-title {
            font-size: clamp(1.3rem, 3vw, 1.8rem); font-weight: 800;
            margin: 0 0 .6rem; color: #f1f5f9;
          }
          .ttf-waitlist-sub {
            font-size: .95rem; color: #94a3b8; line-height: 1.65;
            max-width: 55ch; margin: 0 auto 1.5rem;
          }
          .ttf-waitlist-form {
            display: flex; flex-wrap: wrap; gap: .5rem;
            justify-content: center; max-width: 480px; margin: 0 auto;
          }
          .ttf-waitlist-input {
            flex: 1; min-width: 220px;
            background: rgba(255,255,255,.08);
            border: 1.5px solid rgba(255,255,255,.2);
            border-radius: 10px; padding: .72rem 1rem;
            font-size: .95rem; color: #f1f5f9;
            outline: none;
          }
          .ttf-waitlist-input::placeholder { color: #64748b; }
          .ttf-waitlist-input:focus { border-color: rgba(99,102,241,.7); }
          .ttf-waitlist-submit {
            background: #6366f1; color: #fff; border: none;
            border-radius: 10px; padding: .72rem 1.5rem;
            font-size: .95rem; font-weight: 700; cursor: pointer;
            transition: background .18s;
          }
          .ttf-waitlist-submit:hover { background: #4f46e5; }
          .ttf-waitlist-success {
            background: rgba(16,185,129,.15);
            border: 1px solid rgba(16,185,129,.3);
            border-radius: 12px; padding: 1rem 1.5rem;
            color: #6ee7b7; font-weight: 600;
            display: inline-flex; align-items: center; gap: .5rem;
          }

          @media (max-width: 640px) {
            .ttf-dims-grid,
            .ttf-who-grid,
            .ttf-modules-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        {/* ── Hero ─────────────────────────────────────────────────── */}
      <DarkModeHint />
        <div className="ttf-wrap">

          {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
          <nav className="ttf-breadcrumb" aria-label="Breadcrumb">
            <Link to="/iatlas">IATLAS</Link>
            <span className="ttf-breadcrumb-sep" aria-hidden="true">›</span>
            <span aria-current="page">Train the Facilitator</span>
          </nav>

          {/* ── Hero ──────────────────────────────────────────────────────── */}
          <section className="ttf-hero" aria-labelledby="ttf-hero-title">
            <div className="ttf-hero-content">
              <div className="ttf-hero-badge" aria-label="Program status: Coming Soon">
                <img src="/icons/certification.svg" alt="" width={16} height={16} aria-hidden="true" />
                <span>Coming Soon — Join the Waitlist</span>
              </div>
              <h1 className="ttf-hero-title" id="ttf-hero-title">
                Train the Facilitator<br />Certification
              </h1>
              <p className="ttf-hero-subtitle">Build your own resilience while teaching others to build theirs</p>
              <p className="ttf-hero-desc">
                The IATLAS Train the Facilitator (TTF) program is a dual-track professional development
                certification that equips clinicians, educators, therapists, coaches, and group leaders
                to deliver evidence-based resilience protocols — <strong>while strengthening their own
                dimensional resilience in the process</strong>. Because you can't pour from an empty cup.
              </p>
              <div className="ttf-hero-actions">
                <a href="#ttf-waitlist" className="ttf-btn-primary">
                  <img src="/icons/certification.svg" alt="" width={16} height={16} aria-hidden="true" />
                  Join the Waitlist
                </a>
                <a href="#ttf-modules" className="ttf-btn-secondary">
                  Explore the Curriculum
                </a>
              </div>
            </div>
          </section>

          {/* ── Philosophy ────────────────────────────────────────────────── */}
          <section aria-labelledby="ttf-philosophy-title" id="ttf-philosophy">
            <div className="ttf-philosophy">
              <div className="ttf-philosophy-kicker">
                <img src="/icons/relational-connective.svg" alt="" width={16} height={16} aria-hidden="true" />
                Core Philosophy
              </div>
              <h2 className="ttf-philosophy-title" id="ttf-philosophy-title">
                An All-Inclusive Resilience System
              </h2>
              <p className="ttf-philosophy-text">
                IATLAS is built on a <strong>recursive resilience model</strong>: the same 6-dimensional
                framework that helps kids build emotional regulation also helps teachers manage classroom
                stress. The same protocols that support therapy clients also build clinician resilience.
                The same system that strengthens team culture also develops individual leaders.
              </p>
              <p className="ttf-philosophy-text">
                Every person who interacts with IATLAS — whether a 6-year-old doing a feelings activity,
                a therapist delivering a session, a parent guiding their child, or a trainer certifying
                a new cohort — is simultaneously building their own dimensional resilience.
                <strong> The system is recursive: the better your own resilience, the better you
                facilitate resilience in others.</strong>
              </p>
              <div className="ttf-philosophy-quote" role="blockquote">
                <span className="ttf-philosophy-quote-mark" aria-hidden="true">"</span>
                <span>You can't pour from an empty cup. TTF ensures every facilitator fills their own cup first — and keeps it full while they pour into others.</span>
              </div>
            </div>
          </section>

          {/* ── Universal roles ────────────────────────────────────────────── */}
          <section aria-labelledby="ttf-roles-title" className="ttf-roles-section">
            <div className="ttf-section-header">
              <div className="ttf-section-kicker">
                <img src="/icons/connection.svg" alt="" width={14} height={14} aria-hidden="true" />
                Universal Resilience Building
              </div>
              <h2 className="ttf-section-title" id="ttf-roles-title">
                Everyone Benefits — Everyone Grows
              </h2>
              <p className="ttf-section-sub">
                All stakeholders in the IATLAS ecosystem use the same 6-dimensional framework to build
                their own resilience, regardless of their role in the system.
              </p>
            </div>
            <div className="ttf-roles-grid" role="list" aria-label="Roles that benefit from IATLAS">
              {ROLES.map((item, idx) => (
                <div key={idx} className="ttf-role-card" role="listitem">
                  <img src={item.icon} alt="" width={32} height={32} className="ttf-role-icon" aria-hidden="true" />
                  <div>
                    <p className="ttf-role-name">{item.role}</p>
                    <p className="ttf-role-benefit">{item.benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Who Benefits ─────────────────────────────────────────── */}
          <section aria-labelledby="ttf-who-title">
            <span className="ttf-section-kicker">One Stop Shop</span>
            <h2 className="ttf-section-title" id="ttf-who-title">
              Built for Every Service Provider
            </h2>
            <p className="ttf-section-sub">
              IATLAS TTF is designed as a universal training system — one curriculum that equips all
              the people in a participant's ecosystem to facilitate resilience across every setting.
            </p>
            <div className="ttf-who-grid">
              {WHO_BENEFITS.map(w => (
                <div key={w.role} className="ttf-who-card">
                  <img src={w.icon} alt="" width={32} height={32} className="ttf-who-icon" aria-hidden="true" />
                  <p className="ttf-who-role">{w.role}</p>
                  <p className="ttf-who-desc">{w.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Curriculum Modules ───────────────────────────────────── */}
          <section aria-labelledby="ttf-modules-title">
            <span className="ttf-section-kicker">Certification Pathway</span>
            <h2 className="ttf-section-title" id="ttf-modules-title">
              TTF Curriculum Overview
            </h2>
            <p className="ttf-section-sub">
              A six-module professional certification that blends personal resilience development
              with facilitation skill-building, practicum hours, and competency assessment.
            </p>
            <div className="ttf-modules-grid">
              {TTF_MODULES.map(mod => (
                <div key={mod.num} className="ttf-module-card">
                  <p className="ttf-module-num" style={{ color: mod.color }}>Module {mod.num}</p>
                  <h3 className="ttf-module-title" style={{ borderLeft: `3px solid ${mod.color}`, paddingLeft: '.6rem' }}>
                    {mod.title}
                  </h3>
                  <ul className="ttf-module-list">
                    {mod.items.map((item, i) => (
                      <li key={i} className="ttf-module-item">
                        <span className="ttf-module-bullet" aria-hidden="true">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Dual-track ─────────────────────────────────────────────────── */}
          <section aria-labelledby="ttf-tracks-title" style={{ marginBottom: '2.5rem' }}>
            <div className="ttf-section-header">
              <div className="ttf-section-kicker">
                <img src="/icons/agentic-generative.svg" alt="" width={14} height={14} aria-hidden="true" />
                Dual-Track Approach
              </div>
              <h2 className="ttf-section-title" id="ttf-tracks-title">Two Tracks, One Integrated Journey</h2>
              <p className="ttf-section-sub">
                TTF weaves together personal resilience development and professional facilitation
                competency — because authentic facilitation flows from authentic practice.
              </p>
            </div>
            <div className="ttf-dual-track">
              <div className="ttf-track-card ttf-track-card-personal" role="region" aria-label="Personal Growth Track">
                <img src="/icons/growth.svg" alt="" width={32} height={32} className="ttf-track-card-icon" aria-hidden="true" />
                <h3 className="ttf-track-card-title">Personal Growth Track</h3>
                <p className="ttf-track-card-desc">
                  Complete your own dimensional assessment, engage in daily micropractices, and track
                  your resilience journey across all 6 dimensions as an ongoing personal practice.
                </p>
                <ul className="ttf-track-card-items">
                  <li>Dimensional self-assessment at enrollment, midpoint, and completion</li>
                  <li>Personalized micropractice plan across all 6 dimensions</li>
                  <li>Reflective journaling and self-monitoring</li>
                  <li>Ongoing community of practice engagement</li>
                </ul>
              </div>
              <div className="ttf-track-card ttf-track-card-professional" role="region" aria-label="Professional Skills Track">
                <img src="/icons/agentic-generative.svg" alt="" width={32} height={32} className="ttf-track-card-icon" aria-hidden="true" />
                <h3 className="ttf-track-card-title">Professional Skills Track</h3>
                <p className="ttf-track-card-desc">
                  Master facilitation techniques, group dynamics, trauma-informed delivery, cultural
                  responsiveness, and ABA/ACT protocol fidelity across all IATLAS programs.
                </p>
                <ul className="ttf-track-card-items">
                  <li>Evidence-based facilitation techniques</li>
                  <li>Trauma-informed and culturally responsive delivery</li>
                  <li>Protocol fidelity and quality assurance</li>
                  <li>Supervised practicum and competency assessment</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ── Curriculum modules ─────────────────────────────────────────── */}
          <section aria-labelledby="ttf-modules-title" id="ttf-modules">
            <div className="ttf-section-header">
              <div className="ttf-section-kicker">
                <img src="/icons/planning.svg" alt="" width={14} height={14} aria-hidden="true" />
                Curriculum
              </div>
              <h2 className="ttf-section-title" id="ttf-modules-title">TTF Curriculum Modules</h2>
              <p className="ttf-section-sub">
                Six comprehensive modules covering everything from foundational resilience science to
                supervised real-world facilitation practice.
              </p>
            </div>
            <div className="ttf-modules-grid" role="list" aria-label="TTF curriculum modules">
              {MODULES.map((mod, idx) => (
                <div key={idx} className="ttf-module-card" role="listitem">
                  <span className="ttf-module-num">{mod.num}</span>
                  <h3 className="ttf-module-title">{mod.title}</h3>
                  <p className="ttf-module-desc">{mod.desc}</p>
                  <ul className="ttf-module-topics" aria-label={`Topics in ${mod.title}`}>
                    {mod.topics.map((t, i) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* ── Specialties Preview ──────────────────────────────────── */}
          <section aria-labelledby="ttf-specialties-title" style={{ marginBottom: '3rem' }}>
            <div style={{
              background: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: 24,
              padding: 'clamp(1.75rem, 4vw, 2.5rem)',
            }}>
              <span className="ttf-section-kicker">Specialty Tracks</span>
              <h2 className="ttf-section-title" id="ttf-specialties-title">
                Field-Specific Advanced Modules
              </h2>
              <p className="ttf-section-sub">
                After core TTF certification, practitioners can pursue specialty tracks aligned with
                their professional field and the IATLAS specialties already in development.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem' }}>
                {[
                  { label: 'Teachers & Educators', color: '#eef2ff', text: '#4f46e5' },
                  { label: 'Speech-Language Pathologists', color: '#e0f2fe', text: '#0891b2' },
                  { label: 'Occupational Therapists', color: '#d1fae5', text: '#059669' },
                  { label: 'Daily Living Skills', color: '#fef3c7', text: '#d97706' },
                  { label: 'Social Skills', color: '#fce7f3', text: '#db2777' },
                  { label: 'Caregivers & Families', color: '#f5f3ff', text: '#7c3aed' },
                  { label: 'Clinicians', color: '#fff7ed', text: '#ea580c' },
                ].map(tag => (
                  <span key={tag.label} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '.35rem',
                    background: tag.color, color: tag.text,
                    border: `1px solid ${tag.text}33`,
                    borderRadius: 999, padding: '.3rem .85rem',
                    fontSize: '.8rem', fontWeight: 600,
                  }}>
                    {tag.label}
                    <span style={{ fontSize: '.65rem', opacity: .8, fontStyle: 'italic' }}>Coming 2026</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* ── Waitlist ─────────────────────────────────────────────── */}
          <section id="ttf-waitlist" aria-labelledby="ttf-wl-title">
            <div className="ttf-waitlist">
              <h2 className="ttf-waitlist-title" id="ttf-wl-title">
                Be the First to Get Certified
              </h2>
              <p className="ttf-waitlist-sub">
                TTF launches in 2026. Join the waitlist to receive program updates, early-access
                pricing, and a free preview module when it drops.
              </p>
              {waitlistStatus === 'success' ? (
                <div className="ttf-waitlist-success" role="status" aria-live="polite">
                  ✓ You're on the list — we'll be in touch!
                </div>
              ) : (
                <form className="ttf-waitlist-form" onSubmit={handleWaitlist} aria-label="TTF waitlist form">
                  <label htmlFor="ttf-email" style={{ position: 'absolute', left: '-9999px' }}>
                    Your email address
                  </label>
                  <input id="ttf-email" type="email" className="ttf-waitlist-input" placeholder="your@email.com" value={waitlistEmail} onChange={e => setWaitlistEmail(e.target.value)} required autoComplete="email" />
                  <button type="submit" className="ttf-waitlist-submit">Join the Waitlist →</button>
                </form>
              )}
            </div>
          </section>

          {/* ── Certification pathway ──────────────────────────────────────── */}
          <section aria-labelledby="ttf-pathway-title" style={{ marginBottom: '2.5rem' }}>
            <div className="ttf-pathway">
              <h2 className="ttf-pathway-title" id="ttf-pathway-title">Certification Pathway</h2>
              <p className="ttf-pathway-sub">From enrollment to credential in 8–12 weeks</p>
              <ol className="ttf-pathway-steps" aria-label="Certification steps">
                {PATHWAY_STEPS.map((step, idx) => (
                  <li key={idx} className="ttf-pathway-step">
                    <div className="ttf-pathway-step-num" aria-hidden="true">{idx + 1}</div>
                    <div>
                      <p className="ttf-pathway-step-label">{step.label}</p>
                      <p className="ttf-pathway-step-desc">{step.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ── Pricing ────────────────────────────────────────────────────── */}
          <section aria-labelledby="ttf-pricing-title" style={{ marginBottom: '2.5rem' }}>
            <div className="ttf-section-header">
              <div className="ttf-section-kicker">
                <img src="/icons/goal.svg" alt="" width={14} height={14} aria-hidden="true" />
                Investment
              </div>
              <h2 className="ttf-section-title" id="ttf-pricing-title">TTF Pricing</h2>
              <p className="ttf-section-sub">
                Flexible pricing for individual professionals, teams, and large organizations.
                All tiers include personal resilience development + professional facilitation training.
              </p>
            </div>
            <div className="ttf-pricing-grid" role="list" aria-label="TTF pricing tiers">
              {PRICING_TIERS.map((tier, idx) => (
                <div
                  key={idx}
                  className={`ttf-pricing-card${tier.featured ? ' ttf-pricing-featured' : ''}`}
                  role="listitem"
                >
                  {tier.featured && <span className="ttf-pricing-badge">Most Popular</span>}
                  <p className="ttf-pricing-tier">{tier.tier}</p>
                  <p className="ttf-pricing-price">
                    {tier.price}
                    {tier.period && <span className="ttf-pricing-period"> {tier.period}</span>}
                  </p>
                  <p className="ttf-pricing-desc">{tier.desc}</p>
                  <ul className="ttf-pricing-features" aria-label={`${tier.tier} features`}>
                    {tier.features.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                  <a href="#ttf-waitlist" className={`ttf-pricing-cta${!tier.featured ? ' ttf-pricing-cta-outline' : ''}`}>
                    {tier.cta}
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* ── Waitlist ───────────────────────────────────────────────────── */}
          <section aria-labelledby="ttf-waitlist-title" id="ttf-waitlist">
            <div className="ttf-waitlist">
              <h2 className="ttf-waitlist-title" id="ttf-waitlist-title">
                Join the TTF Waitlist
              </h2>
              <p className="ttf-waitlist-sub">
                Be the first to know when the Train the Facilitator program launches.
                Early waitlist members receive priority enrollment and a founding-cohort discount.
              </p>
              {waitlistStatus === 'success' ? (
                <div className="ttf-waitlist-success" role="status" aria-live="polite">
                  <img src="/icons/success.svg" alt="" width={20} height={20} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '.4rem' }} />
                  You're on the list! We'll reach out when TTF launches.
                </div>
              ) : (
                <form className="ttf-waitlist-form" onSubmit={handleWaitlist} aria-label="TTF waitlist signup form">
                  <label htmlFor="ttf-email" className="sr-only">Your email address</label>
                  <input
                    id="ttf-email"
                    type="email"
                    className="ttf-waitlist-input"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={e => setWaitlistEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <button type="submit" className="ttf-waitlist-submit">
                    Join the Waitlist →
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* ── Bottom nav ───────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.75rem', justifyContent: 'center' }}>
            <Link
              to="/iatlas"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                background: '#6366f1', color: '#fff', borderRadius: 10,
                padding: '.7rem 1.4rem', fontWeight: 700, fontSize: '.93rem',
                textDecoration: 'none',
              }}
            >
              ← Back to IATLAS Curriculum
            </Link>
            <Link
              to="/iatlas/practice/dashboard"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                background: '#fff', color: '#1e293b',
                border: '1.5px solid #e2e8f0',
                borderRadius: 10, padding: '.7rem 1.4rem',
                fontWeight: 600, fontSize: '.93rem',
                textDecoration: 'none',
              }}
            >
              Practice Dashboard →
            </Link>
          </div>
          {/* ── FAQ ────────────────────────────────────────────────────────── */}
          <section aria-labelledby="ttf-faq-title" className="ttf-faq">
            <div className="ttf-section-header">
              <div className="ttf-section-kicker">
                <img src="/icons/info.svg" alt="" width={14} height={14} aria-hidden="true" />
                FAQ
              </div>
              <h2 className="ttf-section-title" id="ttf-faq-title">Frequently Asked Questions</h2>
            </div>
            <div className="ttf-faq-list">
              {FAQS.map((faq, idx) => (
                <div key={idx} className="ttf-faq-item">
                  <button
                    className="ttf-faq-question"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={openFaq === idx}
                    aria-controls={`ttf-faq-answer-${idx}`}
                  >
                    {faq.q}
                    <span className={`ttf-faq-chevron${openFaq === idx ? ' open' : ''}`} aria-hidden="true">▾</span>
                  </button>
                  {openFaq === idx && (
                    <div id={`ttf-faq-answer-${idx}`} className="ttf-faq-answer" role="region">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ── Testimonials placeholder ───────────────────────────────────── */}
          <section aria-labelledby="ttf-testimonials-title">
            <div className="ttf-testimonials">
              <h2 className="ttf-testimonials-title" id="ttf-testimonials-title">Facilitator Stories</h2>
              <p className="ttf-testimonials-placeholder">
                Testimonials from certified IATLAS facilitators will appear here after the program launches.
              </p>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}
