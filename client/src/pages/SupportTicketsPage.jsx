/**
 * SupportTicketsPage.jsx — My Support Tickets list page.
 *
 * Route: /support/tickets
 *
 * Lists all support tickets submitted by the authenticated user,
 * sorted newest-first.  Clicking a ticket navigates to its detail view.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import { fetchUserTickets } from '../api/support.js';

const STATUS_LABELS = {
  open:                 'Open',
  in_progress:          'In Progress',
  waiting_on_customer:  'Awaiting Reply',
  resolved:             'Resolved',
  closed:               'Closed',
};

const PRIORITY_LABELS = {
  low:      'Low',
  normal:   'Normal',
  high:     'High',
  critical: 'Critical',
};

export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    async function loadTickets() {
      try {
        const data = await fetchUserTickets();
        setTickets(data.tickets || []);
      } catch (err) {
        setError(err.message || 'Failed to load support tickets.');
      } finally {
        setLoading(false);
      }
    }
    loadTickets();
  }, []);

  return (
    <div className="support-tickets-page">
      <SiteHeader />

      <main className="support-tickets-main">
        <div className="support-tickets-container">
          <div className="support-tickets-header">
            <div>
              <h1 className="support-tickets-title">My Support Tickets</h1>
              <p className="support-tickets-subtitle">
                View and manage your support requests
              </p>
            </div>
            <button
              className="support-tickets-new-btn"
              onClick={() => navigate('/')}
              aria-label="Open support widget to submit a new ticket"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                width="16"
                height="16"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5"  y1="12" x2="19" y2="12" />
              </svg>
              New Ticket
            </button>
          </div>

          {loading ? (
            <div className="support-tickets-loading" aria-busy="true" aria-label="Loading tickets">
              <div className="support-loading-spinner" />
              <p>Loading tickets…</p>
            </div>
          ) : error ? (
            <div className="support-tickets-error" role="alert">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                width="24"
                height="24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>{error}</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="support-tickets-empty">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                width="48"
                height="48"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <p className="support-tickets-empty-title">No support tickets yet</p>
              <p className="support-tickets-empty-sub">
                Use the Support button in the corner to submit a ticket.
              </p>
            </div>
          ) : (
            <div className="support-tickets-list" role="list">
              {tickets.map(ticket => (
                <Link
                  key={ticket._id}
                  to={`/support/tickets/${ticket._id}`}
                  className="support-ticket-card"
                  role="listitem"
                >
                  <div className="support-ticket-card-top">
                    <span
                      className={`support-status-badge support-status-${ticket.status}`}
                      aria-label={`Status: ${STATUS_LABELS[ticket.status] || ticket.status}`}
                    >
                      {STATUS_LABELS[ticket.status] || ticket.status}
                    </span>
                    <span
                      className={`support-priority-badge support-priority-${ticket.priority}`}
                      aria-label={`Priority: ${PRIORITY_LABELS[ticket.priority] || ticket.priority}`}
                    >
                      {ticket.priority === 'critical' || ticket.priority === 'high' ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                          width="10"
                          height="10"
                        >
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                      ) : null}
                      {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                    </span>
                  </div>

                  <h3 className="support-ticket-subject">{ticket.subject}</h3>

                  <div className="support-ticket-meta">
                    <span className="support-ticket-category">{ticket.category.replace(/_/g, ' ')}</span>
                    <span className="support-ticket-date">
                      {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                        year:  'numeric',
                        month: 'short',
                        day:   'numeric',
                      })}
                    </span>
                  </div>

                  {ticket.replies && ticket.replies.length > 0 && (
                    <p className="support-ticket-reply-count">
                      {ticket.replies.length}{' '}
                      {ticket.replies.length === 1 ? 'reply' : 'replies'}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
