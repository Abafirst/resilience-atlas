'use strict';

/**
 * leadership-report-generator.js
 *
 * Generates aggregated leadership insight reports from team assessment data.
 * All output is privacy-safe: only aggregated statistics, no individual scores.
 */

const ResilienceResult = require('../models/ResilienceResult');
const LeadershipReport = require('../models/LeadershipReport');
const Organization = require('../models/Organization');
const { generateObservations, generateRecommendations } = require('./insight-generator');

const DIMENSIONS = [
  'Cognitive-Narrative',
  'Relational-Connective',
  'Agentic-Generative',
  'Emotional-Adaptive',
  'Spiritual-Reflective',
  'Somatic-Regulative',
];

// Dimension-level interpretation copy
const DIMENSION_COPY = {
  'Cognitive-Narrative': {
    high: 'Good at reframing challenges, finding meaning, and maintaining perspective under pressure.',
    low: 'May struggle with negative thought patterns and perspective-taking during adversity.',
    teamPattern: 'Team pattern: {level} development',
    recommendation: 'Invest in narrative workshops, journaling practices, and guided reflection sessions.',
  },
  Relational: {
    high: 'Strong relational networks provide social support and collaborative problem-solving.',
    low: 'Team may feel isolated during stress; relational connections need intentional nurturing.',
    teamPattern: 'Team pattern: {level} development',
    recommendation: 'Create structured team bonding activities and peer support partnerships.',
  },
  'Agentic-Generative': {
    high: 'Strong action-taking capacity, creative initiative, and proactive problem-solving.',
    low: 'Team may feel stuck or reactive; building confidence in agency and initiative is key.',
    teamPattern: 'Team pattern: {level} development',
    recommendation: 'Implement goal-setting frameworks and celebrate small wins to build momentum.',
  },
  'Emotional-Adaptive': {
    high: 'Healthy emotional regulation and flexibility when adapting to change.',
    low: 'Emotional overwhelm or rigidity may impair decision-making under pressure.',
    teamPattern: 'Team pattern: {level} development',
    recommendation: 'Introduce emotional literacy training and coping skills workshops.',
  },
  'Spiritual-Reflective': {
    high: 'Strong sense of purpose, values alignment, and meaning-making capacity.',
    low: 'Disconnection from purpose may reduce motivation and long-term resilience.',
    teamPattern: 'Team pattern: {level} development',
    recommendation: 'Facilitate values-alignment conversations and purpose-driven goal-setting.',
  },
  'Somatic-Regulative': {
    high: 'Body-aware, physically grounded stress regulation and healthy behavioral habits.',
    low: 'Somatic stress responses may go unregulated; embodied practices can help.',
    teamPattern: 'Team pattern: {level} development',
    recommendation: 'Integrate movement breaks, breathing exercises, and physical wellness practices.',
  },
};

/**
 * Classify an average score into a resilience level label.
 * @param {number} avg - 0-100
 * @returns {string}
 */
function classifyResilienceLevel(avg) {
  if (avg >= 81) return 'high';
  if (avg >= 61) return 'strong';
  if (avg >= 41) return 'developing';
  return 'emerging';
}

/**
 * Classify dimension average into a descriptive label.
 */
function dimensionLevel(avg) {
  if (avg >= 70) return 'highly';
  if (avg >= 50) return 'moderately';
  return 'emerging';
}

/**
 * Calculate standard deviation for an array of numbers.
 */
function stdDev(values) {
  if (!values.length) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Build a 10-bucket distribution array from score values (0-100).
 * Each bucket covers 10 points (0-9, 10-19, …, 90-100).
 */
function buildDistribution(values) {
  const buckets = new Array(10).fill(0);
  for (const v of values) {
    const idx = Math.min(Math.floor(v / 10), 9);
    buckets[idx]++;
  }
  return buckets;
}

/**
 * Compute a rough percentile rank relative to a neutral baseline of 60.
 * Returns 0-100.
 */
function estimatePercentile(avg) {
  // Linear interpolation: 0→0th, 60→50th, 100→100th percentile
  return Math.min(100, Math.max(0, Math.round((avg / 100) * 100)));
}

/**
 * Analyse per-dimension scores from an array of ResilienceResult score maps.
 * @param {Array<Object>} results - raw ResilienceResult documents
 * @returns {Object} dimensionAnalysis map
 */
function analyseDimensions(results) {
  const perDim = {};

  for (const dim of DIMENSIONS) {
    perDim[dim] = [];
  }

  for (const result of results) {
    const scoresMap = result.scores instanceof Map ? result.scores : new Map(Object.entries(result.scores || {}));

    for (const dim of DIMENSIONS) {
      const entry = scoresMap.get(dim);
      if (entry && typeof entry.percentage === 'number') {
        perDim[dim].push(entry.percentage);
      }
    }
  }

  const analysis = {};

  for (const dim of DIMENSIONS) {
    const values = perDim[dim];
    if (!values.length) {
      analysis[dim] = {
        average: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        percentile: 0,
        distribution: new Array(10).fill(0),
        interpretation: DIMENSION_COPY[dim].low,
        recommendation: DIMENSION_COPY[dim].recommendation,
      };
      continue;
    }

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const level = dimensionLevel(avg);
    const copy = DIMENSION_COPY[dim];

    analysis[dim] = {
      average: Math.round(avg * 10) / 10,
      min: Math.round(Math.min(...values) * 10) / 10,
      max: Math.round(Math.max(...values) * 10) / 10,
      stdDev: Math.round(stdDev(values) * 10) / 10,
      percentile: estimatePercentile(avg),
      distribution: buildDistribution(values),
      interpretation: avg >= 70 ? copy.high : copy.low,
      recommendation: copy.recommendation,
    };
  }

  return analysis;
}

/**
 * Build dominant-type strength distribution map.
 * @param {Array<Object>} results
 * @returns {Object} { dimensionName: count }
 */
function buildStrengthDistribution(results) {
  const dist = {};
  for (const dim of DIMENSIONS) dist[dim] = 0;

  for (const result of results) {
    if (result.dominantType && dist.hasOwnProperty(result.dominantType)) {
      dist[result.dominantType]++;
    }
  }

  return dist;
}

/**
 * Main entry point — generate and persist a LeadershipReport.
 *
 * @param {string|ObjectId} organizationId
 * @param {string|ObjectId|null} generatedByUserId
 * @returns {Promise<LeadershipReport>}
 */
async function generateLeadershipReport(organizationId, generatedByUserId = null) {
  const org = await Organization.findById(organizationId);
  if (!org) throw new Error('Organization not found');

  // Fetch all completed results for this organization
  const results = await ResilienceResult.find({
    _id: { $in: org.completedResultIds },
  });

  const totalInvited = org.invitedEmails.length;
  const totalRespondents = results.length;
  const responseRate = totalInvited > 0
    ? Math.round((totalRespondents / totalInvited) * 100)
    : 0;

  // Overall team average
  const overallScores = results
    .map((r) => r.overall)
    .filter((v) => typeof v === 'number');

  const averageOverallScore = overallScores.length
    ? Math.round((overallScores.reduce((a, b) => a + b, 0) / overallScores.length) * 10) / 10
    : 0;

  const resilienceLevel = classifyResilienceLevel(averageOverallScore);

  // Trend vs. previous report
  const previousReport = await LeadershipReport.findOne({
    organizationId,
    isArchived: false,
  })
    .sort({ reportDate: -1 })
    .select('teamOverview.averageOverallScore');

  const previousAverageScore =
    previousReport ? previousReport.teamOverview.averageOverallScore : null;
  const scoreTrend =
    previousAverageScore !== null
      ? Math.round((averageOverallScore - previousAverageScore) * 10) / 10
      : null;

  // Dimension analysis
  const dimensionAnalysis = analyseDimensions(results);

  // Strength distribution
  const strengthDistribution = buildStrengthDistribution(results);

  // Key observations
  const keyObservations = generateObservations(dimensionAnalysis);

  // Recommendations
  const recommendations = generateRecommendations(dimensionAnalysis);

  // Persist
  const report = await LeadershipReport.create({
    organizationId,
    reportDate: new Date(),
    teamOverview: {
      totalInvited,
      totalRespondents,
      responseRate,
      averageOverallScore,
      resilienceLevel,
      previousAverageScore,
      scoreTrend,
    },
    dimensionAnalysis,
    strengthDistribution,
    keyObservations,
    recommendations,
    generatedBy: generatedByUserId || null,
    lastUpdated: new Date(),
  });

  // Link report to org
  await Organization.findByIdAndUpdate(organizationId, {
    $push: { leadershipReportIds: report._id },
  });

  return report;
}

/**
 * Check if auto-generation should be triggered (≥50% response rate).
 * If yes, generates the report and returns it; otherwise returns null.
 *
 * @param {string|ObjectId} organizationId
 * @returns {Promise<LeadershipReport|null>}
 */
async function maybeAutoGenerate(organizationId) {
  const org = await Organization.findById(organizationId);
  if (!org || !org.autoGenerateEnabled) return null;

  const totalInvited = org.invitedEmails.length;
  if (totalInvited === 0) return null;

  const totalCompleted = org.completedResultIds.length;
  const responseRate = totalCompleted / totalInvited;

  if (responseRate >= 0.5) {
    return generateLeadershipReport(organizationId, null);
  }

  return null;
}

module.exports = { generateLeadershipReport, maybeAutoGenerate };
