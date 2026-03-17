'use strict';

/**
 * social-content-generator.js
 *
 * Generates platform-specific social media content for each daily insight.
 *
 * Platforms covered:
 *  • X / Twitter  (280 chars — already in philosophical-content-engine.js)
 *  • LinkedIn     (professional — already in philosophical-content-engine.js)
 *  • Instagram    (emoji-enhanced, hashtag-rich caption + alt text)
 *  • Facebook     (community-focused, shareable description)
 *  • Email        (HTML + plain text — already in philosophical-content-engine.js)
 *  • Video script (60-second — already in philosophical-content-engine.js)
 *
 * This module adds Instagram and Facebook content and bundles all platform
 * content into a single structured object.
 */

const BRANDING_URL  = 'resilienceatlas.com';
const BRANDING_NAME = 'The Resilience Atlas™';

// ── Dimension-to-emoji mapping (used for social media platform posts only) ────

const DIMENSION_EMOJIS = {
  'Cognitive-Narrative':   '🧠',
  'Agentic-Generative':    '🌱',
  'Relational-Connective':            '🤝',
  'Emotional-Adaptive':    '💙',
  'Spiritual-Reflective': '✨',
  'Somatic-Regulative':    '🧘',
};

const DEFAULT_EMOJI = '🌟';

// ── Dimension-to-hashtag mapping ───────────────────────────────────────────────

const DIMENSION_HASHTAGS = {
  'Cognitive-Narrative':   ['#MindsetShift', '#GrowthMindset', '#CognitiveFlex', '#Perspective'],
  'Agentic-Generative':    ['#TakeAction', '#PersonalGrowth', '#Momentum', '#GrowthMindset'],
  'Relational-Connective':            ['#Connection', '#Community', '#Relationships', '#SupportSystem'],
  'Emotional-Adaptive':    ['#EmotionalHealth', '#EmotionalIntelligence', '#Feelings', '#EQ'],
  'Spiritual-Reflective': ['#Purpose', '#Meaning', '#SpiritualGrowth', '#Values'],
  'Somatic-Regulative':    ['#Mindfulness', '#BodyMind', '#Wellness', '#SelfCare'],
};

const COMMON_HASHTAGS = [
  '#ResilienceAtlas',
  '#Resilience',
  '#DailyWisdom',
  '#MentalHealth',
  '#WellBeing',
  '#PersonalDevelopment',
  '#DailyQuote',
  '#InspirationDaily',
  '#SelfGrowth',
  '#MindfulLiving',
];

// ── Instagram caption ──────────────────────────────────────────────────────────

/**
 * Generate an Instagram-optimized caption.
 *
 * Format:
 *  [emoji + dimension header]
 *  [quote]
 *  — Author
 *
 *  [practice label + text]
 *
 *  [reflection question]
 *
 *  [CTA]
 *
 *  [hashtags — 20–25 tags]
 *
 * @param {Object} insight - Structured insight object (from buildInsight)
 * @returns {string} Instagram caption
 */
function formatInstagramCaption(insight) {
  const emoji            = DIMENSION_EMOJIS[insight.dimension] || DEFAULT_EMOJI;
  const dimTags          = DIMENSION_HASHTAGS[insight.dimension] || [];
  const dimensionHashtag = insight.dimension.replace(/-/g, '');

  const hashtags = [
    ...COMMON_HASHTAGS,
    ...dimTags,
    `#${dimensionHashtag}`,
    '#QuoteOfTheDay',
    '#DailyResilience',
    '#WisdomQuotes',
    '#ResilienceJourney',
  ].join(' ');

  return [
    `${emoji} ${insight.dimension.toUpperCase()} | ${insight.subtitle}`,
    '',
    `"${insight.quoteText}"`,
    `— ${insight.quoteAuthor}`,
    '',
    `📌 Today's Practice (3–5 min):`,
    insight.microPractice,
    '',
    `🪞 Reflection: ${insight.reflectionQuestion}`,
    '',
    `✨ ${BRANDING_NAME} helps you discover your resilience profile.`,
    `🔗 Link in bio → ${BRANDING_URL}`,
    '',
    hashtags,
  ].join('\n');
}

/**
 * Generate accessible alt text for the Instagram graphic.
 *
 * @param {Object} insight - Structured insight object
 * @returns {string} Alt text (concise, screen-reader friendly)
 */
function formatInstagramAltText(insight) {
  return (
    `The Resilience Atlas™ insight card for the ${insight.dimension} dimension. ` +
    `Quote: "${insight.quoteText}" by ${insight.quoteAuthor}. ` +
    `Today's practice: ${insight.microPractice}`
  );
}

// ── Facebook post ─────────────────────────────────────────────────────────────

/**
 * Generate a Facebook-optimized post.
 *
 * Format:
 *  [headline + dimension]
 *  [quote block]
 *  [practice section]
 *  [reflection]
 *  [community CTA]
 *
 * @param {Object} insight - Structured insight object
 * @returns {string} Facebook post text
 */
function formatFacebookPost(insight) {
  const emoji = DIMENSION_EMOJIS[insight.dimension] || DEFAULT_EMOJI;

  return [
    `${emoji} Today's Resilience Insight — ${insight.dimension}`,
    `${insight.subtitle}`,
    '',
    `"${insight.quoteText}"`,
    `— ${insight.quoteAuthor}`,
    '',
    `📌 Practice for today (3–5 minutes):`,
    insight.microPractice,
    '',
    `🪞 Reflect on this:`,
    insight.reflectionQuestion,
    '',
    `──────────────────────────────`,
    `Building resilience is a daily practice. Share this with someone who might need it today.`,
    '',
    `Discover your resilience profile → ${BRANDING_URL}`,
    `#ResilienceAtlas #Resilience #DailyWisdom #PersonalGrowth`,
  ].join('\n');
}

// ── Full social content bundle ─────────────────────────────────────────────────

/**
 * Generate the complete social content bundle for all platforms.
 *
 * Delegates X/Twitter, LinkedIn, Email and Video to the existing
 * philosophical-content-engine formatters, and adds Instagram and Facebook.
 *
 * @param {Object} contentBundle - Full content bundle from generateContentBundle()
 * @returns {Object} Extended content bundle with all platform formats
 */
function generateSocialContent(contentBundle) {
  const { insight, xPost, linkedIn, email, videoScript, graphicPrompt } = contentBundle;

  return {
    insight,
    platforms: {
      twitter: {
        post:        xPost,
        charCount:   xPost.length,
        charLimit:   280,
        hashtags:    ['#ResilienceAtlas', `#${insight.dimension.replace(/-/g, '')}`],
      },
      linkedin: {
        post:        linkedIn,
        audience:    'professional',
        toneNote:    'Business audience — use full practice and reflection sections',
      },
      instagram: {
        caption:     formatInstagramCaption(insight),
        altText:     formatInstagramAltText(insight),
        hashtagNote: '20–25 relevant hashtags included',
      },
      facebook: {
        post:        formatFacebookPost(insight),
        shareNote:   'Includes community-focused messaging and sharing prompt',
      },
      email: {
        subject:     email.subject,
        html:        email.html,
        text:        email.text,
        responsive:  true,
      },
      videoScript: {
        script:   videoScript,
        duration: '~60 seconds',
        format:   'scene-by-scene with voiceover and visual cues',
      },
    },
    graphicPrompt,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  formatInstagramCaption,
  formatInstagramAltText,
  formatFacebookPost,
  generateSocialContent,
  DIMENSION_EMOJIS,
  DIMENSION_HASHTAGS,
  COMMON_HASHTAGS,
};
