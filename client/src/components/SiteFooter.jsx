import React from 'react';

export default function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <nav className="footer-nav" aria-label="Footer navigation">
        <div className="footer-nav-group">
          <strong className="footer-nav-heading">Assessment</strong>
          <a href="/assessment">About the Assessment</a>
          <a href="/quiz" title="For adults 18+">Take the Quiz <span style={{fontSize: '0.85em', opacity: 0.85}}>(18+)</span></a>
          <a href="/results">My Results</a>
        </div>
        <div className="footer-nav-group">
          <strong className="footer-nav-heading">Research</strong>
          <a href="/research">Foundations</a>
          <a href="/research#dimensions">Six Dimensions</a>
        </div>
        <div className="footer-nav-group">
          <strong className="footer-nav-heading">Programs</strong>
          <a href="/teams">For Teams</a>
          <a href="/iatlas" title="IATLAS: Integrated Applied Teaching and Learning Analysis System">IATLAS Curriculum</a>
          <a href="/resources">Resources</a>
          <a href="/gamification">Gamification</a>
          <a href="/kids">For Kids</a>
        </div>
        <div className="footer-nav-group">
          <strong className="footer-nav-heading">Company</strong>
          <a href="/about">About</a>
          <a href="/founder">Our Founder</a>
          <a href="/privacy">Privacy &amp; Data Control</a>
        </div>
        <div className="footer-nav-group">
          <strong className="footer-nav-heading">IATLAS&#8482;</strong>
          <p style={{ fontSize: '0.82rem', color: 'inherit', margin: '0 0 0.5rem', lineHeight: 1.5 }}>
            Integrated Applied Teaching and Learning Analysis System
          </p>
          <a href="/iatlas">IATLAS Curriculum</a>
          <a href="/iatlas/kids">IATLAS Kids</a>
          <a href="/iatlas/train-the-facilitator">Train the Facilitator</a>
        </div>
      </nav>
      <div className="footer-bottom">
        <p><strong>The Resilience Atlas&#8482; — Understand. Strengthen. Transform.</strong></p>
        <p className="footer-research-line">
          <img src="/icons/story.svg" alt="" aria-hidden="true" className="footer-research-icon" />
          A research-based resilience assessment platform founded on published 2013 doctoral research.
        </p>
        <p>&copy; 2026 The Resilience Atlas&#8482; &mdash; a trademark of <strong>Janeen Molchany Ph.D., BCBA</strong>.</p>
        <p>
          <a href="https://theresilienceatlas.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
            https://theresilienceatlas.com
          </a>
          {' '}| All Rights Reserved
        </p>
        <p>For educational and self-reflection purposes only. Not a clinical assessment.</p>
      </div>
    </footer>
  );
}
