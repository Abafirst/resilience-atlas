/**
 * sharing.js — Viral sharing functionality for Resilience Atlas results page.
 *
 * Exposes `ResilienceSharing` global object with methods:
 *   - shareLinkedIn(dominantDimension)
 *   - shareTwitter(dominantDimension)
 *   - copyShareLink()
 *   - downloadRadarImage()
 *   - trackShare(platform)
 */

(function () {
  'use strict';

  const BASE_URL = window.location.origin;

  /* ── Helpers ───────────────────────────────────────────── */

  function showToast(message) {
    let toast = document.getElementById('shareToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'shareToast';
      toast.className = 'share-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 2800);
  }

  function trackShareEvent(platform, dimension) {
    try {
      fetch('/api/growth/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'results_shared',
          properties: { platform, dimension },
        }),
      }).catch(() => {});
    } catch (_) {}
  }

  /* ── Share Text Builder ─────────────────────────────────── */

  function buildShareText(dimension) {
    const dim = dimension || 'Resilience';
    return (
      `My strongest resilience dimension is ${dim}. What\u2019s yours? ` +
      'Take the Resilience Atlas assessment to map your Six Dimensions of Resilience.'
    );
  }

  /* ── Public API ─────────────────────────────────────────── */

  const ResilienceSharing = {

    /**
     * Share dominant dimension on LinkedIn.
     * @param {string} dominantDimension
     */
    shareLinkedIn(dominantDimension) {
      const text = encodeURIComponent(buildShareText(dominantDimension));
      const url  = encodeURIComponent(BASE_URL + '/quiz.html');
      const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}&summary=${text}`;
      window.open(shareUrl, '_blank', 'width=600,height=520,noopener,noreferrer');
      trackShareEvent('linkedin', dominantDimension);
    },

    /**
     * Share dominant dimension on X (Twitter).
     * @param {string} dominantDimension
     */
    shareTwitter(dominantDimension) {
      const text = encodeURIComponent(buildShareText(dominantDimension));
      const url  = encodeURIComponent(BASE_URL + '/quiz.html');
      const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      window.open(shareUrl, '_blank', 'width=600,height=400,noopener,noreferrer');
      trackShareEvent('twitter', dominantDimension);
    },

    /**
     * Copy the current results page share link to clipboard.
     */
    copyShareLink() {
      const link = BASE_URL + '/quiz.html';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(link).then(() => {
          const btn = document.getElementById('btnShareCopy');
          if (btn) {
            btn.classList.add('copied');
            btn.innerHTML = '<span class="share-icon">✓</span> Copied!';
            setTimeout(() => {
              btn.classList.remove('copied');
              btn.innerHTML = '<span class="share-icon">🔗</span> Copy Link';
            }, 2500);
          }
          showToast('Link copied to clipboard!');
          trackShareEvent('copy_link', null);
        }).catch(() => showToast('Could not copy — please copy the URL manually.'));
      } else {
        // Fallback for browsers without Clipboard API: prompt user to copy manually
        showToast('Please copy this link: ' + link);
        trackShareEvent('copy_link', null);
      }
    },

    /**
     * Download the radar chart canvas as a PNG image.
     */
    downloadRadarImage() {
      const canvas = document.getElementById('radarChart');
      if (!canvas) {
        showToast('Radar chart not available yet. Complete the quiz first.');
        return;
      }
      try {
        const link = document.createElement('a');
        link.download = 'my-resilience-atlas.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Radar image downloaded!');
        trackShareEvent('download_radar', null);
      } catch (err) {
        showToast('Download failed — please try again.');
        console.error('Radar download error:', err);
      }
    },

    /**
     * Initialise sharing UI — call after DOM is ready and dimension is known.
     * @param {string} dominantDimension
     */
    init(dominantDimension) {
      const dim = dominantDimension || '';

      // Preview text
      const preview = document.getElementById('sharePreviewText');
      if (preview) preview.textContent = '"' + buildShareText(dim) + '"';

      // Wire buttons
      const btnLinkedIn = document.getElementById('btnShareLinkedIn');
      if (btnLinkedIn) {
        btnLinkedIn.addEventListener('click', () => this.shareLinkedIn(dim));
      }

      const btnTwitter = document.getElementById('btnShareTwitter');
      if (btnTwitter) {
        btnTwitter.addEventListener('click', () => this.shareTwitter(dim));
      }

      const btnCopy = document.getElementById('btnShareCopy');
      if (btnCopy) {
        btnCopy.addEventListener('click', () => this.copyShareLink());
      }

      const btnDownload = document.getElementById('btnShareDownload');
      if (btnDownload) {
        btnDownload.addEventListener('click', () => this.downloadRadarImage());
      }

      // Invite form
      const inviteForm = document.getElementById('inviteColleagueForm');
      if (inviteForm) {
        inviteForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const emailInput = document.getElementById('inviteEmailInput');
          const status = document.getElementById('inviteStatus');
          const email = emailInput ? emailInput.value.trim() : '';
          if (!email) return;

          fetch('/api/growth/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'team_invite_sent',
              properties: { invitedEmail: email },
            }),
          }).catch(() => {});

          if (status) status.textContent = `Invite noted! Share your results link with ${email}`;
          if (emailInput) emailInput.value = '';
        });
      }
    },
  };

  window.ResilienceSharing = ResilienceSharing;
})();
