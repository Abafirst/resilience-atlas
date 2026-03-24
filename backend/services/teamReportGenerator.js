'use strict';

/**
 * teamReportGenerator.js — Auto-generate narrative team resilience reports.
 *
 * Produces a prose summary of the team's resilience profile including:
 *  - Overall narrative introduction
 *  - Dimension-by-dimension analysis (strengths / growth areas)
 *  - Actionable recommendations per dimension
 *  - Peer comparison insights
 *  - Benchmark context
 */

const DIMENSIONS = ['relational', 'cognitive', 'somatic', 'emotional', 'spiritual', 'agentic'];

const DIMENSION_LABELS = {
  relational: 'Relational-Connective',
  cognitive:  'Cognitive-Narrative',
  somatic:    'Somatic-Behavioral',
  emotional:  'Emotional-Adaptive',
  spiritual:  'Spiritual-Existential',
  agentic:    'Agentic-Generative',
};

const DIMENSION_DESCRIPTIONS = {
  relational: 'the capacity to build and sustain meaningful connections during difficult times',
  cognitive:  'the ability to construct empowering narratives and reframe challenges constructively',
  somatic:    'physical self-regulation, body awareness, and somatic grounding under stress',
  emotional:  'recognising, expressing, and regulating emotions with flexibility and self-compassion',
  spiritual:  'a sense of meaning, purpose, and connection to values larger than oneself',
  agentic:    'proactive action-taking, self-efficacy, and the capacity to initiate positive change',
};

const DIMENSION_STRENGTHS_TEXT = {
  relational: 'Your team excels at maintaining and nurturing human connection — a significant resilience asset when navigating adversity together.',
  cognitive:  'Team members demonstrate strong narrative flexibility, reframing setbacks as opportunities and maintaining constructive internal dialogue.',
  somatic:    'The team shows solid somatic awareness, drawing on body-based practices to regulate stress and restore balance.',
  emotional:  'Emotional adaptability is a standout strength — your team handles emotional complexity with maturity and self-awareness.',
  spiritual:  'A strong sense of collective purpose gives your team resilience during uncertainty; members are anchored by shared values.',
  agentic:    'High agency and initiative characterise this team — members take ownership of challenges and mobilise resources effectively.',
};

const DIMENSION_GROWTH_TEXT = {
  relational: 'Relational resilience has room for growth. Investing in intentional connection practices — such as regular check-ins, peer-support circles, or team rituals — can strengthen interpersonal bonds.',
  cognitive:  'Cognitive resilience could be strengthened through structured reflection practices, storytelling workshops, or reframing exercises that help the team shift unproductive narratives.',
  somatic:    'Developing somatic awareness may be valuable — consider introducing breathwork, movement breaks, or mindfulness-based practices to support physical self-regulation.',
  emotional:  'Expanding the team\'s emotional vocabulary and creating safe spaces for emotional expression can deepen collective emotional resilience.',
  spiritual:  'Exploring shared values, mission alignment exercises, and purpose-driven conversations could help the team cultivate a stronger sense of collective meaning.',
  agentic:    'Building agentic resilience through goal-setting frameworks, skills development, and celebrating small wins may help the team feel more empowered to drive change.',
};

const DIMENSION_RECOMMENDATIONS = {
  relational: [
    'Schedule monthly team connection activities (e.g., team lunches, virtual coffee chats).',
    'Introduce peer-support pairs or buddy systems for ongoing check-ins.',
    'Use the Relational-Connective Workshop Guide to facilitate structured connection conversations.',
  ],
  cognitive: [
    'Run a quarterly narrative reframing workshop using the Cognitive-Narrative Workshop Guide.',
    'Encourage journaling or reflective writing practices to identify limiting thought patterns.',
    'Introduce cognitive flexibility exercises in team retrospectives.',
  ],
  somatic: [
    'Introduce short movement or breathwork breaks during long meetings.',
    'Encourage team members to explore the Somatic-Behavioral micro-practice cards.',
    'Consider a team wellness challenge focused on physical self-care habits.',
  ],
  emotional: [
    'Create regular psychological safety check-ins to normalize emotional expression.',
    'Use the Emotional-Adaptive Workshop Guide to build emotional vocabulary and literacy.',
    'Offer optional resilience coaching for team members who score lowest in this dimension.',
  ],
  spiritual: [
    'Facilitate a values-alignment workshop to surface and celebrate shared team values.',
    'Incorporate mission and purpose reflection into quarterly team reviews.',
    'Use the Spiritual-Existential Workshop Guide to explore meaning and contribution.',
  ],
  agentic: [
    'Implement a structured goal-setting framework (e.g., OKRs) tied to resilience outcomes.',
    'Celebrate team and individual wins to reinforce a sense of agency and progress.',
    'Use the Agentic-Generative Workshop Guide to build initiative and self-efficacy.',
  ],
};

// ── Scoring Helpers ───────────────────────────────────────────────────────────

function getStrengthLabel(score) {
  if (score >= 70) return 'strong';
  if (score >= 40) return 'developing';
  return 'needs attention';
}

function sortDimsByScore(averages) {
  return [...DIMENSIONS].sort((a, b) => (averages[b] || 0) - (averages[a] || 0));
}

// ── Report Sections ───────────────────────────────────────────────────────────

function buildIntroduction(analytics, orgName) {
  const { memberCount, teamAverages } = analytics;
  const overall = teamAverages.overall || 0;
  const overallLabel = getStrengthLabel(overall);

  const sorted = sortDimsByScore(teamAverages);
  const topDim    = DIMENSION_LABELS[sorted[0]];
  const bottomDim = DIMENSION_LABELS[sorted[sorted.length - 1]];

  return {
    heading: 'Team Resilience Overview',
    text: `This report summarizes the resilience profile of ${orgName ? `the ${orgName} team` : 'your team'} ` +
      `based on responses from ${memberCount} member${memberCount !== 1 ? 's' : ''}. ` +
      `The team's overall resilience score is ${Math.round(overall)}%, placing it in the ` +
      `"${overallLabel}" range. ` +
      `${topDim} emerges as the team's greatest resilience asset, ` +
      `while ${bottomDim} represents the primary area for collective development. ` +
      `The insights below are intended to support data-driven team conversations, ` +
      `not to diagnose individual or collective wellbeing.`,
  };
}

function buildDimensionAnalysis(analytics) {
  const { teamAverages, distribution } = analytics;
  const sorted = sortDimsByScore(teamAverages);

  return sorted.map((dim) => {
    const score = teamAverages[dim] || 0;
    const label = DIMENSION_LABELS[dim];
    const dist  = distribution && distribution[dim];
    const isStrong = score >= 70;

    const distributionText = dist
      ? ` Within the team, ${dist.high}% score high, ${dist.medium}% medium, and ${dist.low}% low in this dimension.`
      : '';

    return {
      dimension:       dim,
      label,
      score:           Math.round(score),
      strengthLabel:   getStrengthLabel(score),
      description:     DIMENSION_DESCRIPTIONS[dim],
      analysis:        (isStrong ? DIMENSION_STRENGTHS_TEXT[dim] : DIMENSION_GROWTH_TEXT[dim]) + distributionText,
      recommendations: DIMENSION_RECOMMENDATIONS[dim],
    };
  });
}

function buildBenchmarkSummary(analytics) {
  const { benchmarks } = analytics;
  if (!benchmarks || benchmarks.length === 0) return null;

  const above = benchmarks.filter((b) => b.delta > 0);
  const below = benchmarks.filter((b) => b.delta < 0);

  const aboveText = above.length
    ? `Your team scores above industry average in ${above.map((b) => b.label).join(', ')}.`
    : '';
  const belowText = below.length
    ? `There is room to close the gap with industry peers in ${below.map((b) => b.label).join(', ')}.`
    : '';

  return {
    heading: 'Industry Benchmark Context',
    text: [aboveText, belowText].filter(Boolean).join(' '),
    items: benchmarks,
  };
}

function buildTrendSummary(analytics) {
  const { trend } = analytics;
  if (!trend || !trend.hasData) {
    return {
      heading: 'Trend Analysis',
      text: 'Trend data will be available after your team completes a second assessment cycle.',
    };
  }

  const improving = Object.entries(trend.delta)
    .filter(([, d]) => d > 0)
    .map(([k]) => DIMENSION_LABELS[k] || k);

  const declining = Object.entries(trend.delta)
    .filter(([, d]) => d < 0)
    .map(([k]) => DIMENSION_LABELS[k] || k);

  const overall = trend.delta.overall || 0;
  const direction = overall > 0 ? 'improved' : overall < 0 ? 'declined' : 'remained stable';

  return {
    heading: 'Trend Analysis',
    text: `Since the previous assessment cycle, the team's overall resilience has ${direction} ` +
      `by ${Math.abs(overall)} points. ` +
      (improving.length ? `Improvements are visible in ${improving.join(', ')}. ` : '') +
      (declining.length ? `Dimensions requiring attention include ${declining.join(', ')}.` : ''),
    delta: trend.delta,
  };
}

function buildRiskSummary(analytics) {
  const { atRisk } = analytics;
  if (!atRisk || atRisk.length === 0) {
    return {
      heading: 'Wellbeing Considerations',
      text: 'No team members have been flagged as potentially at risk at this threshold. Continue to monitor scores across assessment cycles.',
    };
  }

  return {
    heading: 'Wellbeing Considerations',
    text: `${atRisk.length} team member${atRisk.length !== 1 ? 's' : ''} scored below the risk threshold and may benefit from additional support. ` +
      'Consider reaching out individually or offering access to coaching resources. All identities are anonymised in this summary.',
    count: atRisk.length,
  };
}

// ── Master Report Generator ───────────────────────────────────────────────────

/**
 * Generate a full narrative team resilience report.
 *
 * @param {Object} analytics – Output from computeAdvancedAnalytics()
 * @param {Object} [meta]
 * @param {string} [meta.orgName]
 * @param {Object} [meta.settings]  – OrgSettings document
 * @returns {Object} Structured report with heading + text sections
 */
function generateTeamNarrativeReport(analytics, meta = {}) {
  const { orgName = 'Your Organization', settings = {} } = meta;

  return {
    title:     `${orgName} — Team Resilience Report`,
    generatedAt: new Date().toISOString(),
    memberCount: analytics.memberCount,
    overallScore: Math.round(analytics.teamAverages.overall || 0),
    sections: {
      introduction:     buildIntroduction(analytics, orgName),
      dimensionAnalysis: buildDimensionAnalysis(analytics),
      benchmarks:       buildBenchmarkSummary(analytics),
      trend:            buildTrendSummary(analytics),
      riskSummary:      buildRiskSummary(analytics),
    },
    branding: {
      logoUrl:      (settings.branding && settings.branding.logoUrl) || null,
      primaryColor: (settings.branding && settings.branding.primaryColor) || '#1a2e5a',
    },
  };
}

module.exports = {
  generateTeamNarrativeReport,
  buildIntroduction,
  buildDimensionAnalysis,
  buildBenchmarkSummary,
  buildTrendSummary,
  buildRiskSummary,
};
