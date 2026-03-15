/* ============================================================
   ShareButtons.js — Social sharing component
   for The Resilience Atlas

   Provides share buttons for:
     • LinkedIn
     • X (Twitter)
     • Download SVG image
     • Copy share link

   Uses the Web Share API when available, with fallbacks for
   manual share links on unsupported browsers.
   ============================================================ */

'use strict';

(function (global) {

    // ── Default share content ──────────────────────────────────────────────────

    var DEFAULT_TITLE = 'My Resilience Profile — The Resilience Atlas';
    var DEFAULT_TEXT  = 'Discover your resilience profile with The Resilience Atlas. #ResilienceAtlas';
    var DEFAULT_URL   = global.location ? global.location.href : 'https://resilienceatlas.com';

    // ── Utility ────────────────────────────────────────────────────────────────

    function encodeShare(str) {
        return encodeURIComponent(str);
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback: textarea trick
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity  = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
        } catch (e) { /* noop */ }
        document.body.removeChild(ta);
        return Promise.resolve();
    }

    // ── Button builders ────────────────────────────────────────────────────────

    function createButton(label, icon, cls, onClick) {
        var btn = document.createElement('button');
        btn.type      = 'button';
        btn.className = 'share-btn ' + cls;
        btn.setAttribute('aria-label', label);
        btn.innerHTML = (icon ? '<span class="share-icon" aria-hidden="true">' + icon + '</span>' : '') +
                        '<span class="share-label">' + label + '</span>';
        btn.addEventListener('click', onClick);
        return btn;
    }

    // ── Share handlers ─────────────────────────────────────────────────────────

    function shareLinkedIn(url, title) {
        var shareUrl = 'https://www.linkedin.com/shareArticle?' +
            'mini=true' +
            '&url=' + encodeShare(url) +
            '&title=' + encodeShare(title) +
            '&summary=' + encodeShare(DEFAULT_TEXT) +
            '&source=resilienceatlas.com';
        window.open(shareUrl, '_blank', 'width=600,height=520,noopener,noreferrer');
    }

    function shareTwitter(text, url) {
        var shareUrl = 'https://x.com/intent/tweet?' +
            'text=' + encodeShare(text + ' ' + url) +
            '&hashtags=ResilienceAtlas';
        window.open(shareUrl, '_blank', 'width=600,height=520,noopener,noreferrer');
    }

    async function shareNative(opts, onSuccess, onError) {
        try {
            await navigator.share({
                title: opts.title || DEFAULT_TITLE,
                text:  opts.text  || DEFAULT_TEXT,
                url:   opts.url   || DEFAULT_URL,
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            if (err.name !== 'AbortError' && onError) {
                onError(err);
            }
        }
    }

    function downloadImage(imageUrl, filename) {
        if (!imageUrl) {
            // Fall back to share card API
            imageUrl = '/api/share/profile-card';
        }
        var a = document.createElement('a');
        a.href     = imageUrl;
        a.download = filename || 'resilience-profile.svg';
        a.target   = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // ── Main render function ───────────────────────────────────────────────────

    /**
     * Render share buttons into a container element.
     *
     * @param {HTMLElement} container - DOM element to render buttons into
     * @param {Object} opts
     * @param {string}  [opts.url]        - Share URL (defaults to current page)
     * @param {string}  [opts.title]      - Share title
     * @param {string}  [opts.text]       - Share text / tweet text
     * @param {string}  [opts.imageUrl]   - URL to the share image (SVG)
     * @param {string}  [opts.imageFile]  - Filename for download
     * @param {Function} [opts.onCopied]  - Callback after link is copied
     */
    function renderShareButtons(container, opts) {
        if (!container) return;

        opts = opts || {};
        var url       = opts.url      || DEFAULT_URL;
        var title     = opts.title    || DEFAULT_TITLE;
        var text      = opts.text     || DEFAULT_TEXT;
        var imageUrl  = opts.imageUrl || '/api/share/profile-card';
        var imageFile = opts.imageFile || 'resilience-profile.svg';

        var wrapper = document.createElement('div');
        wrapper.className = 'share-buttons';

        // ── Native share (mobile / modern browsers) ─────────────────────────
        if (navigator.share) {
            var nativeBtn = createButton('Share', '&#8679;', 'share-btn-native', function () {
                shareNative({ title: title, text: text, url: url });
            });
            wrapper.appendChild(nativeBtn);
        }

        // ── LinkedIn ────────────────────────────────────────────────────────
        var liBtn = createButton('Share on LinkedIn', 'in', 'share-btn-linkedin', function () {
            shareLinkedIn(url, title);
        });
        wrapper.appendChild(liBtn);

        // ── X (Twitter) ──────────────────────────────────────────────────────
        var twBtn = createButton('Share on X', 'X', 'share-btn-twitter', function () {
            shareTwitter(text, url);
        });
        wrapper.appendChild(twBtn);

        // ── Download image ───────────────────────────────────────────────────
        var dlBtn = createButton('Download Image', '&#8681;', 'share-btn-download', function () {
            downloadImage(imageUrl, imageFile);
        });
        wrapper.appendChild(dlBtn);

        // ── Copy link ────────────────────────────────────────────────────────
        var copyBtn = createButton('Copy Share Link', '', 'share-btn-copy', function () {
            copyToClipboard(url).then(function () {
                copyBtn.querySelector('.share-label').textContent = 'Copied!';
                setTimeout(function () {
                    copyBtn.querySelector('.share-label').textContent = 'Copy Share Link';
                }, 2000);
                if (opts.onCopied) opts.onCopied(url);
            });
        });
        wrapper.appendChild(copyBtn);

        container.innerHTML = '';
        container.appendChild(wrapper);
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    global.ShareButtons = {
        render:       renderShareButtons,
        copyToClipboard: copyToClipboard,
        downloadImage:   downloadImage,
    };

}(typeof window !== 'undefined' ? window : this));
