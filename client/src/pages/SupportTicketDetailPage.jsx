/**
 * SupportTicketDetailPage.jsx — Single support ticket detail view.
 *
 * Route: /support/tickets/:ticketId
 *
 * Shows ticket details, conversation history, and allows the user to
 * add follow-up replies.
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';
import { fetchTicketById, addTicketReply } from '../api/support.js';

const STATUS_LABELS = {
  open:                'Open',
  in_progress:         'In Progress',
  waiting_on_customer: 'Awaiting Reply',
  resolved:            'Resolved',
  closed:              'Closed',
};

const PRIORITY_LABELS = {
  low:      'Low',
  normal:   'Normal',
  high:     'High',
  critical: 'Critical',
};

export default function SupportTicketDetailPage() {
  const { ticketId } = useParams();

  const [ticket,       setTicket]       = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [replyText,    setReplyText]    = useState('');
  const [sending,      setSending]      = useState(false);
  const [replyError,   setReplyError]   = useState('');
  const [replySent,    setReplySent]    = useState(false);

  useEffect(() => {
    if (!ticketId) return;
    async function load() {
      try {
        const data = await fetchTicketById(ticketId);
        setTicket(data.ticket);
      } catch (err) {
        setError(err.message || 'Failed to load ticket.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [ticketId]);

  async function handleReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    setReplyError('');
    setReplySent(false);
    try {
      const data = await addTicketReply(ticketId, replyText.trim());
      setTicket(data.ticket);
      setReplyText('');
      setReplySent(true);
      setTimeout(() => setReplySent(false), 3000);
    } catch (err) {
      setReplyError(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  }

  const isClosed = ticket && ['resolved', 'closed'].includes(ticket.status);

  return (
    <div className="support-ticket-detail-page">
      <SiteHeader />

      <main className="support-ticket-detail-main">
        <div className="support-ticket-detail-container">
          {/* Back nav */}
          <Link to="/support/tickets" className="support-back-link">
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to tickets
          </Link>

          {loading ? (
            <div className="support-tickets-loading" aria-busy="true" aria-label="Loading ticket">
              <div className="support-loading-spinner" />
              <p>Loading ticket…</p>
            </div>
          ) : error ? (
            <div className="support-tickets-error" role="alert">
              <p>{error}</p>
            </div>
          ) : !ticket ? (
            <div className="support-tickets-error" role="alert">
              <p>Ticket not found.</p>
            </div>
          ) : (
            <>
              {/* Ticket header */}
              <div className="support-ticket-detail-header">
                <h1 className="support-ticket-detail-title">{ticket.subject}</h1>
                <div className="support-ticket-detail-badges">
                  <span className={`support-status-badge support-status-${ticket.status}`}>
                    {STATUS_LABELS[ticket.status] || ticket.status}
                  </span>
                  <span className={`support-priority-badge support-priority-${ticket.priority}`}>
                    {PRIORITY_LABELS[ticket.priority] || ticket.priority}
                  </span>
                </div>
                <dl className="support-ticket-detail-meta">
                  <div>
                    <dt>Category</dt>
                    <dd>{ticket.category.replace(/_/g, ' ')}</dd>
                  </div>
                  <div>
                    <dt>Submitted</dt>
                    <dd>
                      {new Date(ticket.createdAt).toLocaleString(undefined, {
                        year:   'numeric',
                        month:  'short',
                        day:    'numeric',
                        hour:   '2-digit',
                        minute: '2-digit',
                      })}
                    </dd>
                  </div>
                  {ticket.slaTarget && (
                    <div>
                      <dt>Response target</dt>
                      <dd>
                        {new Date(ticket.slaTarget).toLocaleString(undefined, {
                          year:   'numeric',
                          month:  'short',
                          day:    'numeric',
                          hour:   '2-digit',
                          minute: '2-digit',
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Conversation thread */}
              <div className="support-ticket-thread">
                {/* Original message */}
                <div className="support-ticket-message support-ticket-message--user">
                  <div className="support-message-meta">
                    <span className="support-message-author">You</span>
                    <span className="support-message-time">
                      {new Date(ticket.createdAt).toLocaleString(undefined, {
                        month:  'short',
                        day:    'numeric',
                        hour:   '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="support-message-body">{ticket.description}</p>
                </div>

                {/* Replies */}
                {ticket.replies && ticket.replies.map((reply, idx) => (
                  <div
                    key={idx}
                    className={`support-ticket-message support-ticket-message--${reply.author}`}
                  >
                    <div className="support-message-meta">
                      <span className="support-message-author">
                        {reply.author === 'support' ? 'Support Team' : 'You'}
                      </span>
                      <span className="support-message-time">
                        {new Date(reply.timestamp).toLocaleString(undefined, {
                          month:  'short',
                          day:    'numeric',
                          hour:   '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="support-message-body">{reply.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply form */}
              {!isClosed && (
                <form onSubmit={handleReply} className="support-reply-form">
                  <label htmlFor="support-reply-text" className="support-form-label">
                    Add a reply
                  </label>
                  <textarea
                    id="support-reply-text"
                    className="support-form-textarea"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Type your message here…"
                    rows={4}
                    required
                    maxLength={5000}
                    disabled={sending}
                  />
                  {replyError && (
                    <p className="support-form-error" role="alert">{replyError}</p>
                  )}
                  {replySent && (
                    <p className="support-form-success" role="status">Reply sent!</p>
                  )}
                  <button
                    type="submit"
                    className="support-form-submit"
                    disabled={sending || !replyText.trim()}
                  >
                    {sending ? 'Sending…' : 'Send Reply'}
                  </button>
                </form>
              )}

              {isClosed && (
                <p className="support-ticket-closed-notice">
                  This ticket is {ticket.status}. No further replies can be added.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
