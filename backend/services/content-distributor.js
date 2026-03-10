'use strict';

/**
 * content-distributor.js
 *
 * Coordinates the distribution of daily insight content across all output
 * channels: graphics generation, social media content packaging, email
 * preparation, and asset archival.
 *
 * This module is the single orchestration layer that ties together:
 *  - image-generator.js          — SVG card creation (square, story, feed)
 *  - social-content-generator.js — platform-specific copy for all channels
 *  - philosophical-content-engine.js — core insight data
 *
 * Actual third-party API calls (Mailchimp, Twitter API, LinkedIn API, etc.)
 * are intentionally left as stubs so the distributor can be integrated with
 * any provider without coupling the core logic to a specific service.
 */

const { generateAllGraphics, getGraphicsMetadata } = require('./image-generator');
const { generateSocialContent }                     = require('./social-content-generator');
const { generateContentBundle, getQuoteForDay }     = require('./philosophical-content-engine');
const { PHILOSOPHICAL_QUOTES }                      = require('../data/philosophical-quotes');

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Find a quote entry by its id.
 *
 * @param {string} quoteId
 * @returns {Object|null}
 */
function _findEntryById(quoteId) {
  return PHILOSOPHICAL_QUOTES.find((q) => q.id === quoteId) || null;
}

// ── Distribution result builder ────────────────────────────────────────────────

/**
 * Build the full distribution package for a single insight entry.
 *
 * @param {Object} entry  - Raw quote entry from the library
 * @returns {Object} Distribution package with graphics metadata and social content
 */
function buildDistributionPackage(entry) {
  const contentBundle  = generateContentBundle(entry);
  const { insight }    = contentBundle;

  const graphicsMeta   = getGraphicsMetadata(insight);
  const socialContent  = generateSocialContent(contentBundle);

  return {
    quoteId:        insight.quoteId,
    dimension:      insight.dimension,
    subtitle:       insight.subtitle,
    insight,
    graphics: {
      formats:      graphicsMeta,
      totalFormats: graphicsMeta.length,
    },
    social:         socialContent,
    generatedAt:    new Date().toISOString(),
    status:         'ready',
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Build and return the distribution package for a quote identified by its id.
 *
 * @param {string} quoteId - Quote identifier (e.g. 'cn-001')
 * @returns {Object} Distribution package
 * @throws {Error} If the quoteId is not found in the library
 */
function distributeByQuoteId(quoteId) {
  const entry = _findEntryById(quoteId);
  if (!entry) {
    throw new Error(`Quote not found: "${quoteId}"`);
  }
  return buildDistributionPackage(entry);
}

/**
 * Build and return the distribution package for a specific 1-based day number.
 *
 * @param {number} [dayNumber] - 1-based day within the year (defaults to today)
 * @returns {Object} Distribution package
 */
function distributeForDay(dayNumber) {
  const entry = getQuoteForDay(dayNumber);
  return buildDistributionPackage(entry);
}

/**
 * Generate a graphic buffer for a quote and format.
 *
 * @param {string} quoteId   - Quote identifier
 * @param {string} formatKey - 'square', 'story', or 'feed'
 * @returns {{ buffer: Buffer, format: Object, mimeType: string, extension: string }}
 * @throws {Error} If quoteId or formatKey is invalid
 */
function generateGraphicForQuote(quoteId, formatKey) {
  const entry = _findEntryById(quoteId);
  if (!entry) {
    throw new Error(`Quote not found: "${quoteId}"`);
  }

  const { generateGraphic } = require('./image-generator');
  const contentBundle = generateContentBundle(entry);
  return generateGraphic(contentBundle.insight, formatKey);
}

/**
 * Generate all graphic formats for a quote.
 *
 * @param {string} quoteId - Quote identifier
 * @returns {Object} Map of formatKey → graphic result
 * @throws {Error} If quoteId is invalid
 */
function generateAllGraphicsForQuote(quoteId) {
  const entry = _findEntryById(quoteId);
  if (!entry) {
    throw new Error(`Quote not found: "${quoteId}"`);
  }

  const contentBundle = generateContentBundle(entry);
  return generateAllGraphics(contentBundle.insight);
}

// ── Stub distribution channels ─────────────────────────────────────────────────
// These stubs represent the integration points for third-party services.
// They log intent but do not call external APIs, keeping the core system
// dependency-free and testable.

/**
 * Stub: Send daily insight email to subscribers.
 *
 * @param {Object} distributionPackage
 * @returns {Promise<Object>}
 */
async function sendEmail(distributionPackage) {
  console.log(`[ContentDistributor] Email stub — would send: "${distributionPackage.insight.quoteId}"`);
  return { channel: 'email', status: 'stub', quoteId: distributionPackage.quoteId };
}

/**
 * Stub: Post to X / Twitter.
 *
 * @param {Object} distributionPackage
 * @returns {Promise<Object>}
 */
async function postToTwitter(distributionPackage) {
  console.log(`[ContentDistributor] Twitter stub — would post: "${distributionPackage.quoteId}"`);
  return { channel: 'twitter', status: 'stub', quoteId: distributionPackage.quoteId };
}

/**
 * Stub: Post to LinkedIn.
 *
 * @param {Object} distributionPackage
 * @returns {Promise<Object>}
 */
async function postToLinkedIn(distributionPackage) {
  console.log(`[ContentDistributor] LinkedIn stub — would post: "${distributionPackage.quoteId}"`);
  return { channel: 'linkedin', status: 'stub', quoteId: distributionPackage.quoteId };
}

/**
 * Stub: Post to Instagram.
 *
 * @param {Object} distributionPackage
 * @returns {Promise<Object>}
 */
async function postToInstagram(distributionPackage) {
  console.log(`[ContentDistributor] Instagram stub — would post: "${distributionPackage.quoteId}"`);
  return { channel: 'instagram', status: 'stub', quoteId: distributionPackage.quoteId };
}

/**
 * Stub: Post to Facebook.
 *
 * @param {Object} distributionPackage
 * @returns {Promise<Object>}
 */
async function postToFacebook(distributionPackage) {
  console.log(`[ContentDistributor] Facebook stub — would post: "${distributionPackage.quoteId}"`);
  return { channel: 'facebook', status: 'stub', quoteId: distributionPackage.quoteId };
}

/**
 * Publish a distribution package to all configured channels.
 *
 * @param {Object} distributionPackage - Output of buildDistributionPackage()
 * @returns {Promise<Object[]>} Array of per-channel publish results
 */
async function publishToAllChannels(distributionPackage) {
  const results = await Promise.allSettled([
    sendEmail(distributionPackage),
    postToTwitter(distributionPackage),
    postToLinkedIn(distributionPackage),
    postToInstagram(distributionPackage),
    postToFacebook(distributionPackage),
  ]);

  return results.map((r, i) => {
    const channels = ['email', 'twitter', 'linkedin', 'instagram', 'facebook'];
    if (r.status === 'fulfilled') return r.value;
    return { channel: channels[i], status: 'error', error: r.reason?.message };
  });
}

module.exports = {
  buildDistributionPackage,
  distributeByQuoteId,
  distributeForDay,
  generateGraphicForQuote,
  generateAllGraphicsForQuote,
  publishToAllChannels,
  sendEmail,
  postToTwitter,
  postToLinkedIn,
  postToInstagram,
  postToFacebook,
};
