/**
 * PracticeSchedulePage.jsx
 * Session scheduling and calendar management page.
 * Route: /iatlas/practice/schedule
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

const PRACTICE_NAV = [
  { to: '/iatlas/practice/dashboard',  label: 'Dashboard',  key: 'dashboard',  icon: '/icons/planning.svg' },
  { to: '/iatlas/practice/clients',    label: 'Clients',    key: 'clients',    icon: '/icons/organization.svg' },
  { to: '/iatlas/practice/schedule',   label: 'Schedule',   key: 'schedule',   icon: '/icons/time.svg' },
  { to: '/iatlas/practice/billing',    label: 'Billing',    key: 'billing',    icon: '/icons/currency.svg' },
  { to: '/iatlas/practice/team',       label: 'Team',       key: 'team',       icon: '/icons/team.svg' },
  { to: '/iatlas/practice/analytics',  label: 'Analytics',  key: 'analytics',  icon: '/icons/growth.svg' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = ['8:00', '9:00', '10:00', '11:00', '12:00', '1:00', '2:00', '3:00', '4:00', '5:00'];

const PRACTITIONER_COLORS = {
  'Dr. Chen':      { bg: '#eef2ff', border: '#6366f1', text: '#4f46e5' },
  'M. Williams':   { bg: '#d1fae5', border: '#10b981', text: '#059669' },
  'P. Patel':      { bg: '#fef3c7', border: '#f59e0b', text: '#d97706' },
  'J. Rodriguez':  { bg: '#fce7f3', border: '#ec4899', text: '#db2777' },
};

const MOCK_WEEK_SESSIONS = [
  { day: 1, hour: 1, client: 'Amir J.',   prac: 'Dr. Chen',     type: 'Therapy',  duration: 1 },
  { day: 1, hour: 3, client: 'Leo N.',     prac: 'Dr. Chen',     type: 'Therapy',  duration: 1 },
  { day: 2, hour: 0, client: 'Lily T.',    prac: 'P. Patel',     type: 'OT',       duration: 1 },
  { day: 2, hour: 2, client: 'Owen P.',    prac: 'M. Williams',  type: 'ABA',      duration: 2 },
  { day: 3, hour: 1, client: 'Maya O.',    prac: 'J. Rodriguez', type: 'Social',   duration: 1 },
  { day: 3, hour: 4, client: 'Amir J.',   prac: 'M. Williams',  type: 'ABA',      duration: 1 },
  { day: 4, hour: 0, client: 'Owen P.',    prac: 'Dr. Chen',     type: 'Therapy',  duration: 1 },
  { day: 4, hour: 2, client: 'Lily T.',    prac: 'P. Patel',     type: 'OT',       duration: 1 },
  { day: 5, hour: 3, client: 'Maya O.',    prac: 'J. Rodriguez', type: 'Social',   duration: 1 },
  { day: 5, hour: 1, client: 'Leo N.',     prac: 'Dr. Chen',     type: 'Therapy',  duration: 1 },
];

const SESSION_TYPES = ['Therapy', 'ABA', 'OT', 'Evaluation', 'Consultation', 'Parent Training'];

export default function PracticeSchedulePage() {
  const [view, setView]         = useState('week');
  const [showModal, setShowModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [newSession, setNewSession] = useState({
    client: '', practitioner: 'Dr. Chen', type: 'Therapy', date: '', time: '', duration: 1,
  });

  function handleSlotClick(day, hour) {
    setSelectedSlot({ day, hour });
    setNewSession(s => ({ ...s, time: HOURS[hour], date: `2026-04-2${day + 7}` }));
    setShowModal(true);
  }

  function handleSave(e) {
    e.preventDefault();
    setShowModal(false);
  }

  // Today's week dates (mock)
  const weekDates = DAYS.map((d, i) => ({ day: d, date: 21 + i }));

  return (
    <>
      <SiteHeader activePage="iatlas" />
      <main style={{ minHeight: '100vh', background: '#f8fafc' }}>
        <style>{`
          .pm-layout { display: flex; min-height: calc(100vh - 64px); }
          .pm-sidebar {
            width: 220px; flex-shrink: 0; background: #1e293b; color: #e2e8f0;
            padding: 1.5rem 0; display: flex; flex-direction: column;
          }
          .pm-sidebar-brand {
            padding: .75rem 1.25rem 1.25rem; font-size: 1rem; font-weight: 800; color: #f1f5f9;
            border-bottom: 1px solid rgba(255,255,255,.08); margin-bottom: .5rem;
          }
          .pm-sidebar-brand span {
            display: block; font-size: .7rem; font-weight: 500; color: #64748b;
            margin-top: .15rem; text-transform: uppercase; letter-spacing: .08em;
          }
          .pm-nav-link {
            display: flex; align-items: center; gap: .6rem;
            padding: .65rem 1.25rem; font-size: .88rem; font-weight: 500;
            color: #94a3b8; text-decoration: none; transition: background .15s, color .15s;
            border-left: 3px solid transparent;
          }
          .pm-nav-link:hover { background: rgba(255,255,255,.06); color: #f1f5f9; }
          .pm-nav-link.active { background: rgba(99,102,241,.15); color: #a5b4fc; border-left-color: #6366f1; }
          .nav-icon { opacity: .85; flex-shrink: 0; }
          .pm-nav-link.active .nav-icon { opacity: 1; }
          button img[aria-hidden="true"] { vertical-align: text-bottom; margin-right: 6px; flex-shrink: 0; }
          .pm-sidebar-footer {
            margin-top: auto; padding: 1rem 1.25rem; border-top: 1px solid rgba(255,255,255,.08);
          }
          .pm-sidebar-footer a { font-size: .8rem; color: #64748b; text-decoration: none; }
          .pm-content { flex: 1; padding: 2rem 1.5rem; overflow-y: auto; }
          .pm-page-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
          }
          .pm-page-title { font-size: 1.5rem; font-weight: 800; color: #1e293b; margin: 0; }
          .pm-page-sub { font-size: .88rem; color: #64748b; margin: .2rem 0 0; }
          .pm-btn {
            display: inline-flex; align-items: center; gap: .4rem;
            background: #6366f1; color: #fff; border: none; border-radius: 8px;
            padding: .6rem 1.2rem; font-size: .88rem; font-weight: 600;
            cursor: pointer; text-decoration: none; transition: background .15s;
          }
          .pm-btn:hover { background: #4f46e5; }

          /* Calendar */
          .cal-toolbar {
            display: flex; align-items: center; gap: .75rem; margin-bottom: 1.25rem; flex-wrap: wrap;
          }
          .cal-view-btn {
            padding: .5rem 1rem; font-size: .85rem; font-weight: 600;
            border: 1.5px solid #e5e7eb; border-radius: 8px;
            background: #fff; cursor: pointer; color: #374151;
            transition: all .15s;
          }
          .cal-view-btn.active { background: #6366f1; color: #fff; border-color: #6366f1; }

          .cal-legend { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1rem; }
          .cal-legend-item {
            display: flex; align-items: center; gap: .4rem;
            font-size: .75rem; font-weight: 600;
          }
          .cal-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }

          .cal-grid {
            border: 1px solid #e5e7eb; border-radius: 12px;
            overflow: hidden; background: #fff; margin-bottom: 1.5rem;
          }
          .cal-header {
            display: grid; grid-template-columns: 52px repeat(7, 1fr);
            background: #f8fafc; border-bottom: 1px solid #e5e7eb;
          }
          .cal-header-cell {
            padding: .6rem .4rem; text-align: center;
            font-size: .78rem; font-weight: 700; color: #374151;
          }
          .cal-header-cell.today { color: #6366f1; }
          .cal-header-date {
            display: block; font-size: .95rem; font-weight: 800; color: #1e293b; margin-top: .1rem;
          }
          .cal-header-cell.today .cal-header-date {
            background: #6366f1; color: #fff;
            border-radius: 50%; width: 28px; height: 28px;
            display: flex; align-items: center; justify-content: center;
            margin: .1rem auto 0;
          }
          .cal-body { overflow-x: auto; }
          .cal-row {
            display: grid; grid-template-columns: 52px repeat(7, 1fr);
            border-bottom: 1px solid #f1f5f9;
            min-height: 56px;
          }
          .cal-row:last-child { border-bottom: none; }
          .cal-time {
            padding: .4rem .5rem;
            font-size: .72rem; font-weight: 600; color: #9ca3af;
            text-align: right; border-right: 1px solid #f1f5f9;
            display: flex; align-items: flex-start; justify-content: flex-end;
          }
          .cal-cell {
            border-right: 1px solid #f1f5f9; padding: .25rem;
            cursor: pointer; min-height: 56px; position: relative;
            transition: background .12s;
          }
          .cal-cell:last-child { border-right: none; }
          .cal-cell:hover { background: #f8fafc; }
          .cal-event {
            border-radius: 6px; padding: .25rem .5rem;
            font-size: .7rem; font-weight: 600; line-height: 1.3;
            cursor: pointer; transition: opacity .12s;
          }
          .cal-event:hover { opacity: .85; }

          /* Modal */
          .modal-overlay {
            position: fixed; inset: 0; background: rgba(0,0,0,.5);
            display: flex; align-items: center; justify-content: center; z-index: 1000;
          }
          .modal-box {
            background: #fff; border-radius: 16px; padding: 2rem;
            width: 100%; max-width: 460px; margin: 0 1rem;
          }
          .modal-title { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin: 0 0 1.25rem; }
          .modal-field { margin-bottom: 1rem; }
          .modal-label { display: block; font-size: .82rem; font-weight: 600; color: #374151; margin-bottom: .35rem; }
          .modal-input, .modal-select {
            width: 100%; padding: .6rem .9rem; font-size: .9rem;
            border: 1.5px solid #e5e7eb; border-radius: 8px; outline: none;
            background: #fff; box-sizing: border-box;
          }
          .modal-input:focus, .modal-select:focus { border-color: #6366f1; }
          .modal-actions { display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.25rem; }
          .modal-cancel {
            background: #f1f5f9; border: none; border-radius: 8px;
            padding: .6rem 1.2rem; font-size: .9rem; font-weight: 600; cursor: pointer;
          }

          @media (max-width: 900px) { .pm-sidebar { display: none; } }
        `}</style>

        <div className="pm-layout">
          {/* Sidebar */}
          <nav className="pm-sidebar" aria-label="Practice navigation">
            <div className="pm-sidebar-brand">Practice Hub<span>IATLAS Management</span></div>
            {PRACTICE_NAV.map(item => (
              <Link
                key={item.key}
                to={item.to}
                className={`pm-nav-link${item.key === 'schedule' ? ' active' : ''}`}
              >
                <img src={item.icon} alt="" aria-hidden="true" className="nav-icon" width={16} height={16} />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="pm-sidebar-footer">
              <Link to="/practice-settings"><img src="/icons/compass.svg" alt="" aria-hidden="true" className="icon icon-sm" /> Practice Settings</Link><br />
              <Link to="/iatlas" style={{ marginTop: '.4rem', display: 'block' }}>← IATLAS Home</Link>
            </div>
          </nav>

          {/* Main */}
          <div className="pm-content">
            <div className="pm-page-header">
              <div>
                <h1 className="pm-page-title">Schedule</h1>
                <p className="pm-page-sub">Week of April 21–27, 2026</p>
              </div>
              <button className="pm-btn" onClick={() => setShowModal(true)}>
                + Schedule Session
              </button>
            </div>

            {/* Legend */}
            <div className="cal-legend" aria-label="Practitioner color key">
              {Object.entries(PRACTITIONER_COLORS).map(([name, c]) => (
                <span key={name} className="cal-legend-item">
                  <span className="cal-legend-dot" style={{ background: c.border }} />
                  {name}
                </span>
              ))}
            </div>

            {/* Toolbar */}
            <div className="cal-toolbar">
              {['week', 'month'].map(v => (
                <button
                  key={v}
                  className={`cal-view-btn${view === v ? ' active' : ''}`}
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)} View
                </button>
              ))}
              <button className="cal-view-btn">‹ Prev</button>
              <button className="cal-view-btn">Today</button>
              <button className="cal-view-btn">Next ›</button>
            </div>

            {/* Week calendar */}
            <div className="cal-grid" role="grid" aria-label="Weekly schedule">
              {/* Header row */}
              <div className="cal-header" role="row">
                <div className="cal-header-cell" role="columnheader"></div>
                {weekDates.map((wd, i) => (
                  <div
                    key={i}
                    className={`cal-header-cell${i === 2 ? ' today' : ''}`}
                    role="columnheader"
                    aria-label={`${wd.day} April ${wd.date}`}
                  >
                    {wd.day}
                    <span className="cal-header-date">{wd.date}</span>
                  </div>
                ))}
              </div>

              {/* Hour rows */}
              {HOURS.map((hour, hi) => (
                <div key={hi} className="cal-row" role="row">
                  <div className="cal-time">{hour}</div>
                  {DAYS.map((_, di) => {
                    const sessions = MOCK_WEEK_SESSIONS.filter(s => s.day === di && s.hour === hi);
                    return (
                      <div
                        key={di}
                        className="cal-cell"
                        role="gridcell"
                        onClick={() => handleSlotClick(di, hi)}
                        aria-label={`${DAYS[di]} ${hour} — click to schedule`}
                      >
                        {sessions.map((s, si) => {
                          const c = PRACTITIONER_COLORS[s.prac] || { bg: '#f1f5f9', border: '#94a3b8', text: '#374151' };
                          return (
                            <div
                              key={si}
                              className="cal-event"
                              style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text }}
                              onClick={e => e.stopPropagation()}
                            >
                              {s.client} · {s.type}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Coming soon */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              borderRadius: 16, padding: '1.25rem 1.5rem',
              color: '#94a3b8', fontSize: '.85rem',
              display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap',
            }}>
              <img src="/icons/warning.svg" aria-hidden="true" className="icon icon-sm" alt="" />
              <p style={{ margin: 0 }}>
                <span style={{ color: '#f1f5f9', fontWeight: 700 }}>Drag-and-drop scheduling — Coming 2026.</span>{' '}
                Real-time availability checking, recurring sessions, automated family reminders,
                and practitioner conflict detection are in development.
              </p>
            </div>
          </div>
        </div>

        {/* Schedule Session Modal */}
        {showModal && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-modal-title"
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <div className="modal-box">
              <h2 className="modal-title" id="schedule-modal-title">Schedule Session</h2>
              <form onSubmit={handleSave}>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="sched-client">Client / Family</label>
                  <input
                    id="sched-client"
                    className="modal-input"
                    type="text"
                    placeholder="Search client…"
                    value={newSession.client}
                    onChange={e => setNewSession(s => ({ ...s, client: e.target.value }))}
                    required
                  />
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="sched-prac">Practitioner</label>
                  <select
                    id="sched-prac"
                    className="modal-select"
                    value={newSession.practitioner}
                    onChange={e => setNewSession(s => ({ ...s, practitioner: e.target.value }))}
                  >
                    {Object.keys(PRACTITIONER_COLORS).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div className="modal-field">
                  <label className="modal-label" htmlFor="sched-type">Session Type</label>
                  <select
                    id="sched-type"
                    className="modal-select"
                    value={newSession.type}
                    onChange={e => setNewSession(s => ({ ...s, type: e.target.value }))}
                  >
                    {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="sched-date">Date</label>
                    <input
                      id="sched-date"
                      className="modal-input"
                      type="date"
                      value={newSession.date}
                      onChange={e => setNewSession(s => ({ ...s, date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <label className="modal-label" htmlFor="sched-time">Time</label>
                    <input
                      id="sched-time"
                      className="modal-input"
                      type="time"
                      value={newSession.time}
                      onChange={e => setNewSession(s => ({ ...s, time: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="modal-cancel" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="pm-btn">
                    Save Session
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
