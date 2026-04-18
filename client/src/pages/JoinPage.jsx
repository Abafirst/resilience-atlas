import React, { useEffect } from 'react';

const styles = `
    :root {
      --brand-primary: #2c5f8a;
      --brand-dark:    #1a3e5c;
      --brand-accent:  #4caf8a;
      --text-main:     #1a2533;
      --text-muted:    #6b7a8d;
      --bg-page:       #f4f7fb;
      --bg-card:       #ffffff;
      --border:        #dce4ef;
      --shadow:        0 2px 16px rgba(44,95,138,0.13);
      --radius:        12px;
    }
    *, *::before, *::after { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
      background: var(--bg-page);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: var(--bg-card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 2.5rem 2rem;
      max-width: 440px;
      width: 100%;
      text-align: center;
    }
    .brand {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .org-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--brand-dark);
      margin: 0.25rem 0 0.5rem;
    }
    .invite-detail {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin: 0 0 1.75rem;
    }
    .invite-badge {
      display: inline-block;
      background: #e8f0fa;
      color: var(--brand-primary);
      border-radius: 20px;
      padding: 0.25rem 0.85rem;
      font-size: 0.82rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 0.75rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: opacity 0.15s, transform 0.1s;
    }
    .btn:hover  { opacity: 0.88; transform: translateY(-1px); }
    .btn--primary { background: var(--brand-primary); color: #fff; }
    .btn--secondary {
      background: transparent;
      border: 2px solid var(--brand-primary);
      color: var(--brand-primary);
    }
    .btn--ghost {
      background: transparent;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-muted);
      font-size: 0.82rem;
      margin: 0.25rem 0;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    #status-msg {
      padding: 0.8rem 1rem;
      border-radius: 8px;
      font-size: 0.88rem;
      font-weight: 500;
      margin-bottom: 1.25rem;
      display: none;
    }
    #status-msg.error   { background:#fde8e8; color:#c0392b; border-left:3px solid #c0392b; text-align:left; }
    #status-msg.info    { background:#e8f0fa; color:var(--brand-dark); border-left:3px solid var(--brand-primary); text-align:left; }
    #status-msg.success { background:#e8f9ef; color:#1e7e4a; border-left:3px solid var(--brand-accent); text-align:left; }
    .spinner {
      display: inline-block;
      width: 32px; height: 32px;
      border: 3px solid #dce4ef;
      border-top-color: var(--brand-primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-wrap { padding: 2rem 0; }
    #invite-info { display:none; }
    #not-found   { display:none; }
`;

export default function JoinPage() {
  useEffect(() => {
    try {
      const t = localStorage.getItem('ra-theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else if (t === 'light') document.documentElement.setAttribute('data-theme', 'light');
      else if (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)
        document.documentElement.setAttribute('data-theme', 'dark');
    } catch(e) {}
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <div className="card" role="main" aria-live="polite">

        {/* Loading */}
        <div id="loading-wrap" className="loading-wrap">
          <div className="spinner" aria-label="Loading invitation…"></div>
          <p style={{color:'var(--text-muted)',fontSize:'0.9rem',marginTop:'0.75rem'}}>Verifying your invitation…</p>
        </div>

        {/* Not found / expired */}
        <div id="not-found">
          <img src="/icons/warning.svg" alt="" aria-hidden="true" width={40} height={40} style={{ marginBottom: '0.75rem' }} />
          <h1 style={{fontSize:'1.25rem',color:'var(--brand-dark)',margin:'0 0 0.5rem'}}>Invitation Not Found</h1>
          <p id="not-found-msg" style={{color:'var(--text-muted)',fontSize:'0.9rem',margin:'0 0 1.5rem'}}>
            This invitation link is invalid or has expired.
          </p>
          <a href="/" className="btn btn--primary">Go to Resilience Atlas</a>
        </div>

        {/* Valid invite */}
        <div id="invite-info">
          <div className="brand">The Resilience Atlas™</div>
          <img src="/icons/connection.svg" alt="" aria-hidden="true" width={40} height={40} style={{ marginBottom: '0.5rem' }} />
          <h1 className="org-name" id="org-display">Join Your Team</h1>
          <p className="invite-detail">
            You've been invited to participate in a team resilience assessment.
          </p>
          <div id="invite-badges" style={{marginBottom:'1.25rem'}}></div>

          <div id="status-msg" role="alert"></div>

          <div className="actions" id="action-buttons">
            <button className="btn btn--primary" id="btn-accept-logged-in" style={{display:'none'}}>
              <img src="/icons/checkmark.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Accept &amp; Join Organization
            </button>
            <a id="btn-signup" href="/register" className="btn btn--primary">
              <img src="/icons/compass.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Create Account &amp; Join
            </a>
            <div className="divider">or</div>
            <a id="btn-login" href="/login" className="btn btn--secondary">
              <img src="/icons/lock.svg" alt="" aria-hidden="true" width={14} height={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Log In to Accept
            </a>
            <button className="btn btn--ghost" onClick={() => { window.location.href = '/'; }}>Decline</button>
          </div>
        </div>

      </div>
    </>
  );
}
