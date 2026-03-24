'use strict';

/**
 * design-system.js
 *
 * Shared design tokens for the Resilience Atlas social media graphics system.
 *
 * All color values, typography settings, layout constants and output format
 * definitions live here so that every graphics service draws from a single
 * source of truth.
 */

// ── color palette ─────────────────────────────────────────────────────────────

const COLORS = {
  primary:    '#1565C0',  // Deep Navy
  secondary:  '#0097A7',  // Soft Teal
  tertiary:   '#6A4C93',  // Muted Purple

  // Neutrals
  neutral100: '#212121',
  neutral200: '#424242',
  neutral300: '#757575',
  neutral400: '#BDBDBD',

  // Backgrounds
  bgLight:    '#FAFAFA',
  bgDark:     '#F5F5F5',
  white:      '#FFFFFF',

  // Overlay / transparency helpers (CSS rgba strings)
  practiceBoxBg: 'rgba(21, 101, 192, 0.06)',
  practiceBoxBorder: 'rgba(21, 101, 192, 0.2)',
};

// ── Typography ─────────────────────────────────────────────────────────────────

const TYPOGRAPHY = {
  headline: {
    family: 'Inter, system-ui, -apple-system, sans-serif',
    size:   32,
    weight: 600,
  },
  quote: {
    family: 'Georgia, "Times New Roman", Times, serif',
    size:   36,
    weight: 400,
    style:  'italic',
  },
  author: {
    family: 'Inter, system-ui, -apple-system, sans-serif',
    size:   18,
    weight: 400,
  },
  practice: {
    family: 'Inter, system-ui, -apple-system, sans-serif',
    size:   20,
    weight: 500,
  },
  cta: {
    family: 'Inter, system-ui, -apple-system, sans-serif',
    size:   12,
    weight: 500,
  },
};

// ── Output formats ─────────────────────────────────────────────────────────────

const FORMATS = {
  square: {
    key:    'square',
    width:  1080,
    height: 1080,
    label:  'Instagram Square',
    uses:   ['Instagram feed', 'Social media sharing', 'Shareable cards'],
  },
  story: {
    key:    'story',
    width:  1080,
    height: 1920,
    label:  'Instagram Story',
    uses:   ['Instagram Stories', 'Full-screen mobile viewing', 'Vertical emphasis'],
  },
  feed: {
    key:    'feed',
    width:  1200,
    height: 630,
    label:  'Facebook / LinkedIn Feed',
    uses:   ['Facebook posts', 'LinkedIn sharing', 'Email headers', 'Blog post images'],
  },
};

// ── Branding ───────────────────────────────────────────────────────────────────

const BRANDING = {
  name:         'The Resilience Atlas™',
  url:          'resilienceatlas.com',
  cta:          'Discover your resilience profile at resilienceatlas.com',
  shortCta:     'resilienceatlas.com',
  tagline:      'Build resilience. Live fully.',
};

// ── Layout constants (square 1080×1080 baseline) ───────────────────────────────

const LAYOUT = {
  padding:         60,    // horizontal margin on each side
  headlineTop:     80,    // y-start of headline text
  headlineHeight:  140,   // vertical space allocated to headline layer
  compassY:        200,   // center-y of compass watermark
  compassR:        55,    // radius of compass watermark
  compassOpacity:  0.15,
  quoteTop:        280,   // y-start of quote block
  quoteBottom:     700,   // y-end of quote block
  practiceTop:     770,   // y-start of practice box
  practiceBottom:  910,   // y-end of practice box
  footerTop:       940,   // y-start of CTA / footer
};

module.exports = { COLORS, TYPOGRAPHY, FORMATS, BRANDING, LAYOUT };
