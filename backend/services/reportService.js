'use strict';

const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { generateReport } = require('../scoring');
const logger = require('../utils/logger');
const { DIMENSION_CONTENT, getScoreBand, calculatePercentile, getLevel } = require('../templates/dimensionContent');
const { assignArchetype, generateStressResponseProfile, generateRelationshipInsights } = require('../templates/archetypes');

/**
 * Build a deterministic SHA-256 hash from quiz scores.
 * Used to cache generated reports — identical scores reuse the same PDF/text.
 * @param {Object} scores - Output of calculateResilienceScores()
 * @returns {string} hex digest
 */
function buildResultsHash(scores) {
    const payload = JSON.stringify({
        overall: scores.overall,
        dominantType: scores.dominantType,
        categories: scores.categories,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Generate a human-readable narrative text from quiz scores.
 * @param {Object} scores - Output of calculateResilienceScores()
 * @returns {string} narrative report text
 */
function generateNarrativeReport(scores) {
    const report = generateReport(scores);

    const lines = [
        `The Resilience Atlas™ — Personal Report`,
        `=====================================`,
        ``,
        `Overall Resilience Score: ${report.overall}%`,
        `Level: ${report.level}`,
        `Dominant Type: ${report.dominantType}`,
        ``,
        `Summary`,
        `-------`,
        report.summary,
        ``,
        `Category Breakdown`,
        `------------------`,
    ];

    for (const [category, data] of Object.entries(report.categories)) {
        const label = category.charAt(0).toUpperCase() + category.slice(1);
        lines.push(`${label}: ${data.percentage}% — ${data.level}`);
        if (data.recommendation) {
            lines.push(`  ↳ ${data.recommendation}`);
        }
    }

    return lines.join('\n');
}

/**
 * Generate a PDF buffer from quiz scores.
 * @param {Object} scores - Output of calculateResilienceScores()
 * @param {string} username - The user's display name
 * @returns {Promise<Buffer>} PDF binary data
 */
function generatePDFReport(scores, username) {
    return new Promise((resolve, reject) => {
        try {
            const report = generateReport(scores);
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Title
            doc.fontSize(22).font('Helvetica-Bold').text('The Resilience Atlas\u2122', { align: 'center' });
            doc.fontSize(16).font('Helvetica').text('Personal Resilience Report', { align: 'center' });
            doc.moveDown();

            // User & score summary
            doc.fontSize(12).text(`Name: ${username || 'Participant'}`);
            doc.text(`Date: ${new Date().toLocaleDateString()}`);
            doc.moveDown();

            doc.fontSize(14).font('Helvetica-Bold').text(`Overall Score: ${report.overall}%`);
            doc.fontSize(12).font('Helvetica').text(`Level: ${report.level}`);
            doc.text(`Dominant Type: ${report.dominantType}`);
            doc.moveDown();

            // Summary
            doc.fontSize(13).font('Helvetica-Bold').text('Summary');
            doc.fontSize(11).font('Helvetica').text(report.summary, { lineGap: 4 });
            doc.moveDown();

            // Category breakdown
            doc.fontSize(13).font('Helvetica-Bold').text('Category Breakdown');
            doc.moveDown(0.5);

            for (const [category, data] of Object.entries(report.categories)) {
                const label = category.charAt(0).toUpperCase() + category.slice(1);
                doc.fontSize(11).font('Helvetica-Bold').text(`${label}: ${data.percentage}%  (${data.level})`);
                if (data.recommendation) {
                    doc.fontSize(10).font('Helvetica').text(`   ${data.recommendation}`, { lineGap: 2 });
                }
                doc.moveDown(0.3);
            }

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * Save a PDF buffer to storage and return a URL.
 * In production this would upload to S3/GCS. Here we store it as a
 * base64 data-URI so the system works without external file storage.
 * @param {Buffer} pdfBuffer
 * @param {string} userId
 * @param {string} hash
 * @returns {string} URL / data-URI for the PDF
 */
function savePDF(pdfBuffer, userId, hash) {
    // For a real production system, upload to S3 and return a signed URL.
    // For this implementation we return a base64 data-URI so the feature
    // works end-to-end without requiring external storage.
    const base64 = pdfBuffer.toString('base64');
    return `data:application/pdf;base64,${base64}`;
}

// ── Comprehensive report builder ──────────────────────────────────────────────

/**
 * Build a full dimension analysis entry for a single dimension.
 * @param {string} dimensionName
 * @param {{ raw: number, max: number, percentage: number }|number} scoreData
 * @returns {Object} rich dimension analysis
 */
function buildDimensionAnalysis(dimensionName, scoreData) {
    const pct = typeof scoreData === 'object' ? scoreData.percentage : scoreData;
    const content = DIMENSION_CONTENT[dimensionName];

    if (!content) {
        return {
            score: typeof scoreData === 'object' ? scoreData.raw : scoreData,
            percentage: pct,
            level: getLevel(pct),
            description: '',
            personalizedInsight: '',
            strengthsDemonstrated: [],
            growthOpportunities: [],
            dailyMicroPractice: '',
            weeklyProgression: [],
            realWorldApplication: '',
            benchmark: { percentile: 50, populationMean: 60, yourScore: pct },
        };
    }

    const band = getScoreBand(pct);
    const percentile = calculatePercentile(dimensionName, pct);

    return {
        score: typeof scoreData === 'object' ? scoreData.raw : scoreData,
        percentage: pct,
        level: getLevel(pct),
        description: content.description,
        personalizedInsight: content.insight[band],
        strengthsDemonstrated: content.strengths[band],
        growthOpportunities: content.growthOpportunities[band],
        dailyMicroPractice: content.microPractice,
        weeklyProgression: content.weeklyProgression,
        realWorldApplication: content.realWorldApplication,
        benchmark: {
            percentile,
            populationMean: content.benchmark.populationMean,
            yourScore: pct,
        },
    };
}

/**
 * Generate a 30-day action plan from the user's growth dimensions.
 * @param {Object} scores - { dimension: { percentage } }
 * @returns {Object} 30-day plan with 4 weekly entries
 */
function generate30DayPlan(scores) {
    const ranked = Object.entries(scores)
        .map(([dim, data]) => ({ dim, pct: typeof data === 'object' ? data.percentage : data }))
        .sort((a, b) => a.pct - b.pct);

    const growthDims = ranked.slice(0, 3).map((r) => r.dim);
    const content0 = DIMENSION_CONTENT[growthDims[0]];
    const content1 = DIMENSION_CONTENT[growthDims[1]];
    const content2 = DIMENSION_CONTENT[growthDims[2]];

    return {
        week1: {
            focus: content0 ? `Foundation: Building your ${content0.label} resilience` : 'Foundation building',
            exercises: content0 ? [content0.microPractice, content0.weeklyProgression[0]] : [],
            affirmation: 'I am actively building my resilience, one day at a time.',
        },
        week2: {
            focus: content1 ? `Deepening: Expanding your ${content1.label} capacity` : 'Integration',
            exercises: content1 ? [content1.microPractice, content1.weeklyProgression[1]] : [],
            affirmation: "Each challenge I face is strengthening me in ways I can't yet see.",
        },
        week3: {
            focus: content2 ? `Integration: Applying ${content2.label} skills in real life` : 'Real-world application',
            exercises: content2 ? [content2.microPractice, content2.weeklyProgression[2]] : [],
            affirmation: 'I trust my capacity to grow through discomfort.',
        },
        week4: {
            focus: 'Habit formation: Locking in your resilience practices',
            exercises: [
                'Review your wins from the past 3 weeks — write them down',
                'Choose one practice from weeks 1–3 to continue as a daily habit',
                'Retake the Resilience Atlas\u2122 assessment to measure your growth',
            ],
            affirmation: 'I am more resilient today than I was 30 days ago.',
        },
    };
}

/**
 * Generate a strength integration analysis (how top dimensions work together).
 * @param {Object} scores - { dimension: { percentage } }
 * @returns {Object} integration analysis
 */
function generateStrengthIntegration(scores) {
    const ranked = Object.entries(scores)
        .map(([dim, data]) => ({ dim, pct: typeof data === 'object' ? data.percentage : data }))
        .sort((a, b) => b.pct - a.pct);

    const top3 = ranked.slice(0, 3).map((r) => r.dim);
    const bottom2 = ranked.slice(-2).map((r) => r.dim);

    const top3Labels = top3.map((d) => (DIMENSION_CONTENT[d] ? DIMENSION_CONTENT[d].label : d));
    const bottom2Labels = bottom2.map((d) => (DIMENSION_CONTENT[d] ? DIMENSION_CONTENT[d].label : d));

    const combo = top3Labels.join(' + ');

    const synergies = [
        `Your ${top3Labels[0]} and ${top3Labels[1] || 'secondary'} strengths are complementary — together they may create a particularly robust resilience foundation in the areas where both dimensions are relevant.`,
        'Leveraging your top strengths intentionally — especially during adversity — can amplify their combined impact.',
        `Consider how your ${top3Labels[0]} strength can support the development of your lower-scoring dimensions.`,
    ];

    const gaps = bottom2Labels.map(
        (label) => `${label} represents a significant growth opportunity — investing in this dimension will create a more integrated and well-rounded resilience profile.`
    );

    return {
        topThreeCombo: combo,
        synergies,
        gaps,
        blueprint:
            `Your resilience blueprint is anchored in ${combo}. ` +
            `To reach your full resilience potential, deliberately developing ` +
            `${bottom2Labels.join(' and ')} will round out your profile significantly.`,
    };
}

/**
 * Generate an executive summary from overall scores and profile.
 * @param {number} overall
 * @param {string} dominantType
 * @param {string} archetypeName
 * @param {Object} dimensionAnalysis
 * @returns {string} narrative executive summary
 */
function generateExecutiveSummary(overall, dominantType, archetypeName, dimensionAnalysis) {
    const overallLevel = getLevel(overall);
    const levelLabels = {
        strong: 'strong and well-developed',
        solid: 'solid and growing',
        developing: 'actively developing',
        emerging: 'in early development with significant growth potential',
    };

    const dominantContent = DIMENSION_CONTENT[dominantType];
    const dominantLabel = dominantContent ? dominantContent.label : dominantType;

    const topDims = Object.entries(dimensionAnalysis)
        .sort((a, b) => b[1].percentage - a[1].percentage)
        .slice(0, 2)
        .map(([dim]) => (DIMENSION_CONTENT[dim] ? DIMENSION_CONTENT[dim].label : dim));

    return (
        `Your overall resilience score of ${overall}% reflects a ${levelLabels[overallLevel] || 'developing'} ` +
        `resilience foundation. Your profile archetype is ${archetypeName} \u2014 ` +
        `a designation reflecting your dominant strengths in ${topDims.join(' and ')}.\n\n` +
        `Your primary resilience anchor is ${dominantLabel}, which shapes how you naturally ` +
        `approach challenges, process adversity, and draw on your inner resources. This report ` +
        `provides a deep-dive into each of your six resilience dimensions, with personalised ` +
        `insights, actionable micro-practices, and a 30-day growth plan tailored to your ` +
        `unique profile.\n\n` +
        `This assessment is provided for personal growth and self-reflection. It is not a ` +
        `clinical assessment and does not constitute medical or psychological advice.`
    );
}

/**
 * Generate recommended resources based on the user's lowest-scoring dimensions.
 * @param {Object} scores - { dimension: { percentage } }
 * @returns {Object} resource recommendations
 */
function generateRecommendedResources(scores) {
    const ranked = Object.entries(scores)
        .map(([dim, data]) => ({ dim, pct: typeof data === 'object' ? data.percentage : data }))
        .sort((a, b) => a.pct - b.pct);

    const focusDims = ranked.slice(0, 2).map((r) => r.dim);

    const resourceMap = {
        'Cognitive-Narrative': {
            workshops: ['Narrative Therapy Foundations', 'Cognitive Reframing for Resilience'],
            videos: ['The Power of Story in Resilience (TED)', 'CBT-Based Cognitive Flexibility'],
            practices: ['Morning Pages journaling practice', 'The Byron Katie "Work" inquiry method'],
            readingMaterials: [
                "Man's Search for Meaning \u2014 Viktor Frankl",
                'Thinking, Fast and Slow \u2014 Daniel Kahneman',
                'The Narrative Therapy Workbook',
            ],
        },
        'Relational-Connective': {
            workshops: ['Nonviolent Communication (NVC)', 'Attachment and Relationships Workshop'],
            videos: ['The Power of Vulnerability \u2014 Bren\u00e9 Brown (TED)', 'Building Psychological Safety'],
            practices: ['Weekly intentional connection practice', 'Active listening exercises'],
            readingMaterials: [
                'Daring Greatly \u2014 Bren\u00e9 Brown',
                'Hold Me Tight \u2014 Sue Johnson',
                'The Gifts of Imperfection \u2014 Bren\u00e9 Brown',
            ],
        },
        'Agentic-Generative': {
            workshops: ['Self-Efficacy and Personal Agency', 'Goal-Setting and Achievement'],
            videos: ['The Power of Believing You Can Improve \u2014 Carol Dweck (TED)', 'Building Self-Efficacy'],
            practices: ['Daily "one thing" completion practice', 'Weekly goal review and reset'],
            readingMaterials: [
                'Mindset \u2014 Carol Dweck',
                'The War of Art \u2014 Steven Pressfield',
                'Atomic Habits \u2014 James Clear',
            ],
        },
        'Emotional-Adaptive': {
            workshops: ['Emotional Intelligence Foundations', 'RAIN Practice for Emotional Resilience'],
            videos: ['The Gift and Power of Emotional Courage \u2014 Susan David (TED)', 'Emotional Regulation Tools'],
            practices: ['RAIN emotional processing practice', 'Daily emotion naming practice'],
            readingMaterials: [
                'Emotional Agility \u2014 Susan David',
                'Atlas of the Heart \u2014 Bren\u00e9 Brown',
                'The Highly Sensitive Person \u2014 Elaine Aron',
            ],
        },
        'Spiritual-Reflective': {
            workshops: ['Values Clarification Workshop', 'Mindfulness and Purpose-Driven Living'],
            videos: ['How to Find Work You Love \u2014 Scott Dinsmore (TED)', 'Finding Meaning in Modern Life'],
            practices: ['Evening gratitude and reflection practice', 'Values alignment audit'],
            readingMaterials: [
                "Man's Search for Meaning \u2014 Viktor Frankl",
                'The Power of Now \u2014 Eckhart Tolle',
                'A New Earth \u2014 Eckhart Tolle',
            ],
        },
        'Somatic-Regulative': {
            workshops: ['Breathwork for Nervous System Regulation', 'Somatic Resilience Foundations'],
            videos: ['The Brain-Changing Benefits of Exercise (TED)', 'Breathwork for Stress and Anxiety'],
            practices: ['Daily 4-7-8 breathing practice', 'Morning body scan and movement'],
            readingMaterials: [
                'The Body Keeps the Score \u2014 Bessel van der Kolk',
                'Breath \u2014 James Nestor',
                'Why We Sleep \u2014 Matthew Walker',
            ],
        },
    };

    const workshops = [];
    const videos = [];
    const practices = [];
    const readingMaterials = [];

    for (const dim of focusDims) {
        const res = resourceMap[dim];
        if (res) {
            workshops.push(...res.workshops);
            videos.push(...res.videos);
            practices.push(...res.practices);
            readingMaterials.push(...res.readingMaterials);
        }
    }

    return {
        workshops: [...new Set(workshops)].slice(0, 4),
        videos: [...new Set(videos)].slice(0, 4),
        practices: [...new Set(practices)].slice(0, 4),
        readingMaterials: [...new Set(readingMaterials)].slice(0, 6),
    };
}

/**
 * Build the comprehensive report object from quiz result data.
 *
 * @param {Object} options
 * @param {string}  options.userId          - User identifier (or 'anonymous')
 * @param {number}  options.overall         - Overall resilience score (0–100)
 * @param {string}  options.dominantType    - Name of the dominant dimension
 * @param {Object}  options.scores          - { dimension: { raw, max, percentage } }
 * @param {string}  [options.resultsHash]   - SHA-256 hash of the results
 * @param {Date}    [options.assessmentDate] - Date of assessment
 * @returns {Object} Comprehensive report object
 */
function buildComprehensiveReport({ userId, overall, dominantType, scores, resultsHash, assessmentDate }) {
    // Build per-dimension analysis
    const dimensionAnalysis = {};
    for (const [dim, data] of Object.entries(scores)) {
        dimensionAnalysis[dim] = buildDimensionAnalysis(dim, data);
    }

    // Assign archetype
    const { archetype, topDimensions } = assignArchetype(scores);

    // Build stress response and relationship profiles
    const stressResponse = generateStressResponseProfile(scores, archetype);
    const relationshipInsights = generateRelationshipInsights(archetype);

    // Build integration analysis
    const strengthIntegration = generateStrengthIntegration(scores);

    // Build 30-day plan
    const thirtyDayPlan = generate30DayPlan(scores);

    // Build resource recommendations
    const recommendedResources = generateRecommendedResources(scores);

    // Build executive summary
    const executiveSummary = generateExecutiveSummary(overall, dominantType, archetype.name, dimensionAnalysis);

    return {
        userId: userId || 'anonymous',
        resultsHash: resultsHash || buildResultsHash({ overall, dominantType, categories: scores }),
        overall,
        dominantType,
        assessmentDate: assessmentDate || new Date(),
        executiveSummary,
        dimensionAnalysis,
        strengthIntegration,
        stressResponse,
        relationshipInsights,
        thirtyDayPlan,
        profileArchetype: archetype.name,
        profileDescription: archetype.description,
        topDimensions,
        recommendedResources,
        disclaimer:
            'This assessment provides insights for personal growth and self-reflection. ' +
            'It is not a clinical assessment and does not constitute medical or psychological advice.',
    };
}

module.exports = {
    buildResultsHash,
    generateNarrativeReport,
    generatePDFReport,
    savePDF,
    buildComprehensiveReport,
    buildDimensionAnalysis,
    generate30DayPlan,
    generateStrengthIntegration,
    generateExecutiveSummary,
    generateRecommendedResources,
};
