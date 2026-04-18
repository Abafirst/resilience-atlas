import React from 'react';

export default function SiteFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <nav className="footer-nav" aria-label="Footer navigation">
        <div className="footer-nav-group">
          <strong className="footer-nav-heading">Assessment</strong>
          <a href="/assessment">About the Assessment</a>
          <a href="/quiz">Take the Quiz</a>
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
      </nav>
      <div className="footer-bottom">
        <p><strong>The Resilience Atlas&#8482; — Understand. Strengthen. Transform.</strong></p>
        <p className="footer-research-line">
          <img src="./icons/story.svg" alt="" aria-hidden="true" className="footer-research-icon" />
          A research-based resilience assessment platform founded on published 2013 doctoral research.
        </p>
        <p>&copy; {new Date().getFullYear()} The Resilience Atlas&#8482; &mdash; a trademark of <strong>Janeen Molchany Ph.D., BCBA</strong>.</p>
        <p>For educational and self-reflection purposes only. Not a clinical assessment.</p>
      </div>
    </footer>
  );
}
