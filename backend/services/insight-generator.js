'use strict';

/**
 * insight-generator.js
 *
 * Rule-based engine that converts aggregated team statistics into
 * human-readable key observations and actionable leadership recommendations.
 *
 * No AI/LLM dependency — all logic is deterministic and auditable.
 */

const DIMENSIONS = [
  'Cognitive-Narrative',
  'Relational-Connective',
  'Agentic-Generative',
  'Emotional-Adaptive',
  'Spiritual-Reflective',
  'Somatic-Regulative',
];

// Thresholds for classification
const HIGH_THRESHOLD = 70;
const LOW_THRESHOLD = 50;

/**
 * Classify a score as 'high', 'moderate', or 'low'.
 * @param {number} score - 0-100
 * @returns {string}
 */
function classify(score) {
  if (score >= HIGH_THRESHOLD) return 'high';
  if (score >= LOW_THRESHOLD) return 'moderate';
  return 'low';
}

/**
 * Generate 3-5 key observations from dimension averages.
 * @param {Object} dimAnalysis - dimension analysis map { dimName: { average, ... } }
 * @returns {Array<Object>} observations
 */
function generateObservations(dimAnalysis) {
  const observations = [];

  // Sort dimensions by average (highest first)
  const sorted = DIMENSIONS.map((d) => ({
    name: d,
    avg: (dimAnalysis[d] && dimAnalysis[d].average) || 0,
  })).sort((a, b) => b.avg - a.avg);

  const highest = sorted[0];
  const lowest = sorted[sorted.length - 1];

  // ── Strength observation ──────────────────────────────────────────────────
  if (highest.avg >= HIGH_THRESHOLD) {
    observations.push({
      type: 'strength',
      dimension: highest.name,
      observation: `Strong ${highest.name} resilience (avg ${Math.round(highest.avg)}%) is a major team asset that can be leveraged to support growth in lower-scoring dimensions.`,
      confidence: 90,
    });
  }

  // ── Risk observation ─────────────────────────────────────────────────────
  if (lowest.avg < LOW_THRESHOLD) {
    observations.push({
      type: 'risk',
      dimension: lowest.name,
      observation: `Lower ${lowest.name} scores (avg ${Math.round(lowest.avg)}%) suggest the team may benefit from targeted interventions and structured support in this area.`,
      confidence: 85,
    });
  }

  // ── Opportunity observation ───────────────────────────────────────────────
  const moderateDims = sorted.filter(
    (d) => d.avg >= LOW_THRESHOLD && d.avg < HIGH_THRESHOLD
  );
  if (moderateDims.length > 0) {
    const opp = moderateDims[0];
    observations.push({
      type: 'opportunity',
      dimension: opp.name,
      observation: `${opp.name} resilience (avg ${Math.round(opp.avg)}%) shows moderate development — focused team practices here could yield significant gains with relatively low effort.`,
      confidence: 80,
    });
  }

  // ── Balance observation ───────────────────────────────────────────────────
  const allAvgs = sorted.map((d) => d.avg);
  const min = Math.min(...allAvgs);
  const max = Math.max(...allAvgs);
  const spread = max - min;

  if (spread <= 15) {
    observations.push({
      type: 'balance',
      dimension: null,
      observation: `The team shows a well-balanced resilience profile across all dimensions (spread: ${Math.round(spread)} points), suggesting consistent development across multiple areas.`,
      confidence: 85,
    });
  } else if (spread >= 30) {
    observations.push({
      type: 'balance',
      dimension: null,
      observation: `There is a significant gap (${Math.round(spread)} points) between the team's strongest and weakest resilience dimensions. Consider levelling up lower-scoring areas to build a more balanced foundation.`,
      confidence: 85,
    });
  }

  // ── Agentic leverage observation ──────────────────────────────────────────
  const agentic = dimAnalysis['Agentic-Generative'];
  if (agentic && agentic.average >= HIGH_THRESHOLD) {
    observations.push({
      type: 'strength',
      dimension: 'Agentic-Generative',
      observation: `Agentic-Generative resilience is high (avg ${Math.round(agentic.average)}%), indicating strong action-taking capacity; recommend channeling this toward strategic goal-setting and team initiatives.`,
      confidence: 88,
    });
  }

  // Return 3–5 most confident observations
  return observations
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

/**
 * Generate 3–5 actionable recommendations from dimension analysis.
 * @param {Object} dimAnalysis
 * @returns {Array<Object>} recommendations
 */
function generateRecommendations(dimAnalysis) {
  const recs = [];

  const sorted = DIMENSIONS.map((d) => ({
    name: d,
    avg: (dimAnalysis[d] && dimAnalysis[d].average) || 0,
  })).sort((a, b) => a.avg - b.avg); // lowest first — biggest opportunity

  for (const dim of sorted) {
    const level = classify(dim.avg);

    if (dim.name === 'Cognitive-Narrative') {
      if (level === 'low' || level === 'moderate') {
        recs.push({
          title: 'Create structured reflection time after major milestones',
          action: 'Schedule weekly 15-minute team reflection sessions',
          rationale: `Lower Cognitive-Narrative scores (avg ${Math.round(dim.avg)}%) suggest the team could benefit from guided meaning-making practices.`,
          timeline: 'Begin within 2 weeks; run for 3 months',
          expectedImpact: 'Improve narrative resilience by 10–15%',
          difficulty: 'easy',
        });
      }
    }

    if (dim.name === 'Relational-Connective') {
      if (level === 'high') {
        recs.push({
          title: 'Establish peer support accountability partnerships',
          action: 'Pair team members in 3-month mutual-support cohorts',
          rationale: `High Relational strength (avg ${Math.round(dim.avg)}%) is the team's biggest asset — formalise it into structured peer support.`,
          timeline: '3-month rotating cohort program',
          expectedImpact: 'Strengthen team cohesion and mutual support',
          difficulty: 'medium',
        });
      } else {
        recs.push({
          title: 'Invest in relationship-building rituals',
          action: 'Introduce regular team check-ins and shared meals/virtual coffees',
          rationale: `Relational resilience (avg ${Math.round(dim.avg)}%) has room to grow — social bonds buffer stress and improve collaboration.`,
          timeline: 'Monthly team events starting immediately',
          expectedImpact: 'Increase relational resilience scores over 90 days',
          difficulty: 'easy',
        });
      }
    }

    if (dim.name === 'Somatic-Regulative' && (level === 'low' || level === 'moderate')) {
      recs.push({
        title: 'Integrate movement breaks into team routines',
        action: 'Schedule daily 5-minute team stretching or breathing breaks',
        rationale: `Somatic-Regulative resilience (avg ${Math.round(dim.avg)}%) is among the lower scores — physical practices directly build stress regulation.`,
        timeline: 'Daily, starting next week',
        expectedImpact: 'Improve embodied awareness and stress regulation',
        difficulty: 'easy',
      });
    }

    if (dim.name === 'Emotional-Adaptive' && (level === 'low' || level === 'moderate')) {
      recs.push({
        title: 'Introduce emotional literacy workshops',
        action: 'Run monthly emotional regulation skills sessions',
        rationale: `Emotional-Adaptive scores (avg ${Math.round(dim.avg)}%) indicate the team may benefit from expanded emotional vocabulary and coping strategies.`,
        timeline: '90-day workshop series',
        expectedImpact: 'Broader emotional coping toolkit for the whole team',
        difficulty: 'medium',
      });
    }

    if (dim.name === 'Spiritual-Reflective' && (level === 'low' || level === 'moderate')) {
      recs.push({
        title: 'Facilitate values-alignment conversations',
        action: 'Host quarterly team sessions to revisit shared purpose and values',
        rationale: `Spiritual-Existential resilience (avg ${Math.round(dim.avg)}%) reflects how grounded the team feels in meaning and purpose — cultivating this builds long-term resilience.`,
        timeline: 'Quarterly — first session within 30 days',
        expectedImpact: 'Stronger sense of shared purpose and engagement',
        difficulty: 'medium',
      });
    }

    if (dim.name === 'Agentic-Generative' && (level === 'low' || level === 'moderate')) {
      recs.push({
        title: 'Implement structured goal-setting and progress reviews',
        action: 'Adopt OKRs or SMART goals with biweekly progress check-ins',
        rationale: `Agentic-Generative resilience (avg ${Math.round(dim.avg)}%) reflects initiative and creative problem-solving — structured frameworks amplify this capacity.`,
        timeline: 'Quarterly goal cycles with biweekly reviews',
        expectedImpact: 'Greater ownership, momentum, and adaptive action',
        difficulty: 'medium',
      });
    }
  }

  // Return 3–5 highest-priority recommendations
  return recs.slice(0, 5);
}

module.exports = { generateObservations, generateRecommendations };
