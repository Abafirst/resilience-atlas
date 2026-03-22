'use strict';

/**
 * teamsResourcePdfService.js
 * Generates real PDF content for each Teams resource using PDFKit.
 * Each resource maps to its description from the Teams content database.
 */

const PDFDocument = require('pdfkit');

// ─── Brand colours ──────────────────────────────────────────────────────────
const COLORS = {
    primary:   '#0f2942',
    accent:    '#4F46E5',
    text:      '#1e293b',
    muted:     '#475569',
    light:     '#f8fafc',
    border:    '#e2e8f0',
    white:     '#ffffff',
    dimension: {
        connection: '#3b82f6',
        thinking:   '#8b5cf6',
        action:     '#ef4444',
        feeling:    '#22c55e',
        hope:       '#f59e0b',
        meaning:    '#14b8a6',
        all:        '#64748b',
    },
};

const FONT_REGULAR = 'Helvetica';
const FONT_BOLD    = 'Helvetica-Bold';

// ─── Dimension metadata ──────────────────────────────────────────────────────
const DIMENSIONS = {
    connection: {
        label: 'Connection',
        color: COLORS.dimension.connection,
        tagline: 'Relational-Connective Resilience',
        description: 'The capacity to build and sustain meaningful relationships, foster trust, and create safe spaces for vulnerability and collaboration.',
        practices: [
            'Schedule regular one-on-one check-ins with each team member',
            'Use structured sharing prompts in meetings to deepen knowing',
            'Create rituals of acknowledgment and appreciation',
            'Practice active listening without advice-giving',
            'Map and strengthen your support network intentionally',
        ],
        discussion: [
            'What would make it easier for us to ask each other for help?',
            'Who on our team do you feel most connected to? What built that connection?',
            'What\'s one relationship within our team you\'d like to invest more in?',
            'What does psychological safety look and feel like in our team?',
            'When have you felt most supported by this team? What made that possible?',
        ],
        activities: [
            { name: 'Trust Circle Exercise', duration: '15 min', description: 'Structured sharing of personal insights to build connection.' },
            { name: 'Support Mapping', duration: '20 min', description: 'Visual mapping of support networks to identify gaps and strengths.' },
            { name: 'Peer Listening Pairs', duration: '25 min', description: 'Structured deep-listening practice to build empathy.' },
        ],
    },
    thinking: {
        label: 'Thinking',
        color: COLORS.dimension.thinking,
        tagline: 'Cognitive-Narrative Resilience',
        description: 'The ability to reframe challenges, challenge assumptions, use multiple perspectives, and create empowering narratives about adversity.',
        practices: [
            'Before big decisions, explicitly list your key assumptions',
            'Practice reframing setbacks using "What does this make possible?"',
            'Seek out perspectives that challenge your default view',
            'Create a "learning from failure" ritual in team meetings',
            'Use structured frameworks when approaching complex problems',
        ],
        discussion: [
            'What story does our team tell about itself when things get hard?',
            'What assumptions might be limiting how we see this challenge?',
            'Whose perspective are we missing in this conversation?',
            'What would a wise mentor say to us about our current situation?',
            'What\'s the most empowering way to frame what we\'re going through?',
        ],
        activities: [
            { name: 'Perspective Gallery Walk', duration: '25 min', description: 'Rotate through multiple lenses to expand thinking.' },
            { name: 'Assumption Audit', duration: '30 min', description: 'Surface and challenge hidden assumptions in team decisions.' },
            { name: 'Narrative Reframing Workshop', duration: '40 min', description: 'Transform limiting team stories into growth narratives.' },
        ],
    },
    action: {
        label: 'Action',
        color: COLORS.dimension.action,
        tagline: 'Agentic-Generative Resilience',
        description: 'The drive to take purposeful action, set meaningful goals, build momentum, and maintain agency in the face of obstacles.',
        practices: [
            'Break large goals into weekly action commitments',
            'Start each week by identifying one forward-moving action',
            'Build habit stacks by anchoring new practices to existing routines',
            'Use accountability pairs to maintain momentum',
            'Celebrate progress, not just outcomes',
        ],
        discussion: [
            'Where do we get stuck as a team? What tends to stall our momentum?',
            'What\'s one habit change that would make the biggest difference for us?',
            'How do we celebrate progress and wins as a team?',
            'When was a time we showed real agency despite obstacles? What made it possible?',
            'What systems or structures could help us stay accountable to our commitments?',
        ],
        activities: [
            { name: 'Goal-Setting Workshop', duration: '45 min', description: 'Set SMART goals and build team accountability structures.' },
            { name: 'Habit Stacking Lab', duration: '30 min', description: 'Design resilience-building daily habits together.' },
            { name: 'Action Planning Sprint', duration: '25 min', description: 'Translate insights into specific commitments with owners.' },
        ],
    },
    feeling: {
        label: 'Feeling',
        color: COLORS.dimension.feeling,
        tagline: 'Emotional-Adaptive Resilience',
        description: 'The capacity to recognize, process, and regulate emotions effectively, creating psychological safety and emotional intelligence in teams.',
        practices: [
            'Open meetings with a brief emotional check-in',
            'Name emotions accurately (distinguish frustration from fear)',
            'Practice co-regulation — be a calming presence for others',
            'Build a team stress protocol: what we do when things get hard',
            'Normalize the full emotional spectrum in team culture',
        ],
        discussion: [
            'How do we handle stress as a team? What helps? What doesn\'t?',
            'What emotions feel acceptable to show at work here? Which feel risky?',
            'What does it look like when we\'re emotionally at our best as a team?',
            'How do we know when someone needs support? How do we respond?',
            'What practices help you regulate when you\'re feeling overwhelmed?',
        ],
        activities: [
            { name: 'Emotional Weather Check', duration: '10 min', description: 'Brief check-in to surface team emotional climate.' },
            { name: 'Stress Protocol Design', duration: '35 min', description: 'Co-create team agreements for high-stress moments.' },
            { name: 'Empathy Mapping Exercise', duration: '30 min', description: 'Build understanding of how teammates experience challenge.' },
        ],
    },
    hope: {
        label: 'Hope',
        color: COLORS.dimension.hope,
        tagline: 'Spiritual-Reflective Resilience',
        description: 'The ability to clarify purpose, connect work to meaning, maintain optimism, and align personal and team values for sustainable motivation.',
        practices: [
            'Return to your "why" regularly in team meetings',
            'Align team goals explicitly with shared values',
            'Cultivate a practice of expressing and noticing gratitude',
            'Maintain a "wins archive" of team achievements',
            'Use future visioning to re-energize and orient the team',
        ],
        discussion: [
            'What\'s the purpose of our work beyond the immediate deliverables?',
            'When does this team feel most aligned with its values?',
            'What are we most proud of from the past year?',
            'What gives you hope about our team\'s future?',
            'How do we connect day-to-day work to the bigger picture?',
        ],
        activities: [
            { name: 'Values Alignment Exercise', duration: '40 min', description: 'Identify shared values and align them to team work.' },
            { name: 'Future Visioning', duration: '30 min', description: 'Build a shared vision of your team at its best.' },
            { name: 'Gratitude Circle', duration: '15 min', description: 'Structured appreciation practice to boost morale.' },
        ],
    },
    meaning: {
        label: 'Meaning',
        color: COLORS.dimension.meaning,
        tagline: 'Cognitive-Narrative Resilience',
        description: 'The capacity to find and create meaning in work, recognize individual strengths, and understand how personal contribution connects to something larger.',
        practices: [
            'Tell "why I am here" stories regularly in team meetings',
            'Map each person\'s unique strengths and how they serve the team',
            'Create rituals of contribution recognition',
            'Help each member find their "flow zone" within team work',
            'Connect individual work to organizational and community impact',
        ],
        discussion: [
            'What does this work mean to you beyond the job description?',
            'What are your top three strengths and how do you bring them to our team?',
            'When have you felt your contribution most mattered?',
            'What\'s a small way we could recognize each other\'s unique contributions more often?',
            'What legacy do you want this team to leave?',
        ],
        activities: [
            { name: 'Strengths Finder Workshop', duration: '45 min', description: 'Identify and celebrate each team member\'s unique strengths.' },
            { name: 'Contribution Mapping', duration: '30 min', description: 'Show how individual contributions connect to team purpose.' },
            { name: 'Story of Service', duration: '25 min', description: 'Share personal stories of meaningful contribution.' },
        ],
    },
};

// ─── Helper drawing functions ─────────────────────────────────────────────────

function drawHeader(doc, title, subtitle, color) {
    // Background
    doc.rect(0, 0, doc.page.width, 90).fill(color || COLORS.primary);

    // Title
    doc.fillColor(COLORS.white)
       .font(FONT_BOLD)
       .fontSize(18)
       .text(title, 40, 25, { width: doc.page.width - 80 });

    if (subtitle) {
        doc.fillColor('rgba(255,255,255,0.8)')
           .font(FONT_REGULAR)
           .fontSize(10)
           .text(subtitle, 40, 52, { width: doc.page.width - 80 });
    }

    // Branding
    doc.fillColor('rgba(255,255,255,0.5)')
       .font(FONT_REGULAR)
       .fontSize(8)
       .text('The Resilience Atlas™ — Teams Resource Library', 40, 72, {
           width: doc.page.width - 80,
           align: 'right',
       });
}

function drawFooter(doc) {
    const y = doc.page.height - 35;
    doc.rect(0, y, doc.page.width, 35).fill('#f1f5f9');
    doc.fillColor(COLORS.muted)
       .font(FONT_REGULAR)
       .fontSize(7)
       .text(
           '© 2026 The Resilience Atlas™  |  theresilienceatlas.com  |  Teams Package — Confidential',
           40, y + 12,
           { width: doc.page.width - 80, align: 'center' }
       );
}

function sectionHeading(doc, text, y, color) {
    doc.rect(40, y, doc.page.width - 80, 26).fill((color || COLORS.accent) + '18');
    doc.fillColor(color || COLORS.accent)
       .font(FONT_BOLD)
       .fontSize(11)
       .text(text, 50, y + 7, { width: doc.page.width - 100 });
    return y + 34;
}

function bulletList(doc, items, y, indent) {
    const x = indent || 55;
    items.forEach((item) => {
        doc.fillColor(COLORS.accent).font(FONT_BOLD).fontSize(11).text('•', x, y, { continued: true });
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
           .text('  ' + item, { width: doc.page.width - x - 40 });
        y = doc.y + 3;
    });
    return y;
}

function numberedList(doc, items, y, indent) {
    const x = indent || 55;
    items.forEach((item, i) => {
        doc.fillColor(COLORS.accent).font(FONT_BOLD).fontSize(9.5)
           .text((i + 1) + '.', x, y, { width: 18, continued: true });
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
           .text('  ' + item, { width: doc.page.width - x - 45 });
        y = doc.y + 3;
    });
    return y;
}

// ─── Resource generators ──────────────────────────────────────────────────────

/**
 * Generate a Workshop Guide PDF for a given dimension.
 * @param {string} dim  - 'connection' | 'thinking' | 'action' | 'feeling' | 'hope' | 'meaning'
 */
function generateWorkshopGuide(doc, dim) {
    const d = DIMENSIONS[dim];
    if (!d) throw new Error('Unknown dimension: ' + dim);

    drawHeader(doc, d.label + ' Dimension Workshop Guide', d.tagline, d.color);

    let y = 108;

    // Intro
    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text(d.description, 40, y, { width: doc.page.width - 80 });
    y = doc.y + 18;

    // Key Practices
    y = sectionHeading(doc, '🔑  Key Practices for ' + d.label + ' Resilience', y, d.color);
    y = bulletList(doc, d.practices, y + 4);
    y += 14;

    // Discussion Prompts
    y = sectionHeading(doc, '💬  Discussion Prompts', y, d.color);
    y = numberedList(doc, d.discussion, y + 4);
    y += 14;

    // Activities
    y = sectionHeading(doc, '🎯  Suggested Activities', y, d.color);
    d.activities.forEach((act) => {
        doc.fillColor(COLORS.text).font(FONT_BOLD).fontSize(9.5)
           .text(act.name + '  ', 55, y, { continued: true });
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(9)
           .text('(' + act.duration + ')', { lineBreak: false });
        y = doc.y + 2;
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(9)
           .text(act.description, 68, y, { width: doc.page.width - 108 });
        y = doc.y + 8;
    });
    y += 10;

    // Facilitator Tips
    y = sectionHeading(doc, '📋  Facilitator Tips', y, d.color);
    const tips = [
        'Always open with a grounding moment or brief check-in (2–3 minutes).',
        'Model the behavior you want — be the first to share vulnerably.',
        'Protect quiet voices. Invite, never force, participation.',
        'Watch the energy. If the group drags, shorten an activity; if engaged, go deeper.',
        'Close every session with a specific commitment: "One thing I will do this week…"',
    ];
    y = bulletList(doc, tips, y + 4);
    y += 14;

    // Reflection Questions
    y = sectionHeading(doc, '🪞  Closing Reflection', y, d.color);
    const reflections = [
        'What was the most valuable insight from today\'s session?',
        'What one thing will you do differently this week?',
        'What support do you need from the team to follow through?',
    ];
    y = numberedList(doc, reflections, y + 4);

    drawFooter(doc);
}

function generateTeamResilienceSnapshot(doc) {
    drawHeader(doc, 'Team Resilience Snapshot Template', 'Pre/Post Assessment Profile', COLORS.primary);

    let y = 108;

    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text(
           'Use this template to capture your team\'s resilience profile before and after a program. ' +
           'The snapshot helps teams see growth over time and identify priority areas.',
           40, y, { width: doc.page.width - 80 }
       );
    y = doc.y + 18;

    // Team info fields
    y = sectionHeading(doc, '📋  Team Information', y);
    const fields = ['Team Name:', 'Facilitator:', 'Assessment Date:', 'Program Phase:  □ Pre   □ Mid   □ Post'];
    fields.forEach((f) => {
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5).text(f, 55, y);
        doc.moveTo(160, y + 11).lineTo(doc.page.width - 40, y + 11).stroke(COLORS.border);
        y = doc.y + 8;
    });
    y += 10;

    // Dimension scores table
    y = sectionHeading(doc, '📊  Dimension Score Summary', y);
    y += 6;
    const dims = Object.entries(DIMENSIONS);
    dims.forEach(([key, d]) => {
        doc.rect(40, y, 8, 8).fill(d.color);
        doc.fillColor(COLORS.text).font(FONT_BOLD).fontSize(9)
           .text(d.label, 55, y + 1, { width: 120 });
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(8)
           .text(d.tagline, 180, y + 2, { width: 150 });
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(8)
           .text('Pre: ___  /10     Post: ___  /10     Δ  ___', doc.page.width - 200, y + 1, { width: 180 });
        doc.moveTo(40, y + 16).lineTo(doc.page.width - 40, y + 16).stroke(COLORS.border);
        y += 22;
    });
    y += 10;

    // Strengths & Growth
    y = sectionHeading(doc, '🌟  Top 3 Team Strengths', y);
    for (let i = 1; i <= 3; i++) {
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5).text(i + '.', 55, y);
        doc.moveTo(68, y + 11).lineTo(doc.page.width - 40, y + 11).stroke(COLORS.border);
        y += 20;
    }
    y += 8;

    y = sectionHeading(doc, '🎯  Top 3 Growth Priorities', y);
    for (let i = 1; i <= 3; i++) {
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5).text(i + '.', 55, y);
        doc.moveTo(68, y + 11).lineTo(doc.page.width - 40, y + 11).stroke(COLORS.border);
        y += 20;
    }
    y += 8;

    // Commitments
    y = sectionHeading(doc, '✅  Key Commitments for Next 30 Days', y);
    for (let i = 0; i < 3; i++) {
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(8)
           .text('Owner: ________________    By: ________________    Action:', 55, y);
        y = doc.y + 3;
        doc.moveTo(55, y + 6).lineTo(doc.page.width - 40, y + 6).stroke(COLORS.border);
        y += 18;
    }

    drawFooter(doc);
}

function generateHabitTracker(doc) {
    drawHeader(doc, '30-Day Team Habit Tracker', 'Action Dimension — Individual & Team Resilience Habits', COLORS.dimension.action);

    let y = 108;

    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text(
           'Track daily resilience habits for 30 days. Check the box when you complete each habit. ' +
           'Celebrate streaks of 7, 14, 21, and 30 days!',
           40, y, { width: doc.page.width - 80 }
       );
    y = doc.y + 16;

    // Habit selection
    y = sectionHeading(doc, '🎯  My Habits for This Month', y, COLORS.dimension.action);
    const habitLabels = ['Habit 1:', 'Habit 2:', 'Habit 3:'];
    habitLabels.forEach((h) => {
        doc.fillColor(COLORS.text).font(FONT_BOLD).fontSize(9.5).text(h, 55, y);
        doc.moveTo(105, y + 11).lineTo(doc.page.width - 40, y + 11).stroke(COLORS.border);
        y += 20;
    });
    y += 10;

    // Calendar grid
    y = sectionHeading(doc, '📅  30-Day Tracking Grid', y, COLORS.dimension.action);
    y += 8;

    const boxSize = 22;
    const cols = 10;
    const startX = 45;
    for (let day = 1; day <= 30; day++) {
        const col = (day - 1) % cols;
        const row = Math.floor((day - 1) / cols);
        const x = startX + col * (boxSize + 4);
        const boxY = y + row * (boxSize + 4);

        doc.rect(x, boxY, boxSize, boxSize).stroke(COLORS.border);
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(7)
           .text(String(day), x + 8, boxY + 4, { width: boxSize - 6 });

        // Milestone markers
        if (day === 7 || day === 14 || day === 21 || day === 30) {
            doc.fillColor(COLORS.dimension.action).font(FONT_BOLD).fontSize(6)
               .text('🌟', x + 2, boxY + boxSize + 1, { width: boxSize });
        }
    }
    y += 3 * (boxSize + 4) + 24;

    // Reflection prompts
    y = sectionHeading(doc, '🪞  Weekly Reflection Prompts', y, COLORS.dimension.action);
    const prompts = [
        'Week 1: What\'s making this habit easier or harder than expected?',
        'Week 2: What have you noticed about your energy or resilience this week?',
        'Week 3: How are your habits affecting your work relationships?',
        'Week 4: What would you keep, change, or add for next month?',
    ];
    prompts.forEach((p) => {
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9).text(p, 55, y);
        doc.moveTo(55, y + 16).lineTo(doc.page.width - 40, y + 16).stroke(COLORS.border);
        y += 25;
    });

    drawFooter(doc);
}

function generateActionPlanningWorksheet(doc) {
    drawHeader(doc, 'Team Action Planning Worksheet', 'Translating Insights into Committed Actions', COLORS.primary);

    let y = 108;

    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text(
           'Use this worksheet after every team resilience session to capture insights and convert them ' +
           'into specific, owned actions. Review progress at the next session.',
           40, y, { width: doc.page.width - 80 }
       );
    y = doc.y + 18;

    // Session info
    y = sectionHeading(doc, '📋  Session Information', y);
    ['Session Date:', 'Dimension Focus:', 'Facilitator:', 'Attendees:'].forEach((label) => {
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5).text(label, 55, y);
        doc.moveTo(145, y + 11).lineTo(doc.page.width - 40, y + 11).stroke(COLORS.border);
        y += 20;
    });
    y += 8;

    // Key insights
    y = sectionHeading(doc, '💡  Key Insights from This Session', y);
    doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(8.5)
       .text('What did we learn? What shifted? What surprised us?', 55, y + 4);
    y = doc.y + 6;
    for (let i = 0; i < 4; i++) {
        doc.moveTo(55, y + 10).lineTo(doc.page.width - 40, y + 10).stroke(COLORS.border);
        y += 18;
    }
    y += 10;

    // Action items table
    y = sectionHeading(doc, '✅  Action Items', y);
    y += 6;
    // Table header
    doc.rect(40, y, doc.page.width - 80, 18).fill(COLORS.accent + '22');
    const colX = [45, 190, 320, 420];
    const headers = ['Action / Commitment', 'Owner', 'Due Date', 'Status'];
    headers.forEach((h, i) => {
        doc.fillColor(COLORS.accent).font(FONT_BOLD).fontSize(8.5)
           .text(h, colX[i], y + 4, { width: 135 });
    });
    y += 22;
    for (let row = 0; row < 6; row++) {
        doc.moveTo(40, y + 18).lineTo(doc.page.width - 40, y + 18).stroke(COLORS.border);
        [40, 185, 315, 415, doc.page.width - 40].forEach((x) => {
            doc.moveTo(x, y).lineTo(x, y + 18).stroke(COLORS.border);
        });
        y += 20;
    }
    y += 10;

    // Follow-up
    y = sectionHeading(doc, '📅  Next Session Planning', y);
    ['Next session date:', 'Topic / dimension focus:', 'Pre-work for team members:'].forEach((label) => {
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5).text(label, 55, y);
        doc.moveTo(195, y + 11).lineTo(doc.page.width - 40, y + 11).stroke(COLORS.border);
        y += 20;
    });

    drawFooter(doc);
}

function generateDiscussionPromptSheets(doc) {
    const dims = Object.entries(DIMENSIONS);

    dims.forEach(([key, d], idx) => {
        if (idx > 0) doc.addPage();

        drawHeader(doc, d.label + ' Discussion Prompts', d.tagline, d.color);

        let y = 108;

        // Warm-up prompts
        y = sectionHeading(doc, '🌡️  Warm-Up Prompts (Low Risk)', y, d.color);
        const warmUp = d.discussion.slice(0, 2);
        y = numberedList(doc, warmUp, y + 4);
        y += 12;

        // Explore prompts
        y = sectionHeading(doc, '🔍  Explore Prompts (Medium Depth)', y, d.color);
        const explore = d.discussion.slice(2, 4);
        y = numberedList(doc, explore, y + 4);
        y += 12;

        // Deepen prompts
        y = sectionHeading(doc, '🌊  Deepen Prompts (High Trust Required)', y, d.color);
        const deepen = d.discussion.slice(4);
        y = numberedList(doc, deepen, y + 4);
        y += 16;

        // Safety reminder
        doc.rect(40, y, doc.page.width - 80, 50)
           .fill(d.color + '12');
        doc.fillColor(d.color).font(FONT_BOLD).fontSize(9)
           .text('🛡️  Psychological Safety Reminder', 52, y + 8);
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(8.5)
           .text(
               'Always obtain group consent before moving to deeper prompts. ' +
               'Normalize opting out: "Feel free to pass." Watch for discomfort and adjust.',
               52, y + 22, { width: doc.page.width - 104 }
           );

        drawFooter(doc);
    });
}

function generateReflectionJournal(doc) {
    drawHeader(doc, 'Individual Reflection Journal', 'Personal Resilience Growth — Teams Program', COLORS.primary);

    const dims = Object.entries(DIMENSIONS);
    let y = 108;

    // Intro page content
    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text(
           'This journal is your personal space to reflect on your resilience journey during the team program. ' +
           'Use the guided prompts after each session to capture insights, track growth, and set intentions.',
           40, y, { width: doc.page.width - 80 }
       );
    y = doc.y + 18;

    // Weekly check-in template
    y = sectionHeading(doc, '📅  Weekly Check-In Template', y);
    const weeklyItems = [
        'This week I felt most resilient when:',
        'A challenge I navigated this week:',
        'What helped me through:',
        'One thing I\'m grateful for:',
        'My resilience intention for next week:',
    ];
    weeklyItems.forEach((item) => {
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9).text(item, 55, y);
        y = doc.y + 4;
        doc.moveTo(55, y + 8).lineTo(doc.page.width - 40, y + 8).stroke(COLORS.border);
        doc.moveTo(55, y + 18).lineTo(doc.page.width - 40, y + 18).stroke(COLORS.border);
        y += 26;
    });
    y += 10;

    // Dimension reflection pages (one per dimension, abbreviated)
    dims.slice(0, 3).forEach(([key, d]) => {
        doc.addPage();
        drawHeader(doc, d.label + ' Dimension — Personal Reflection', d.tagline, d.color);
        y = 108;

        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5).text(d.description, 40, y, { width: doc.page.width - 80 });
        y = doc.y + 16;

        y = sectionHeading(doc, '🪞  Reflection Questions', y, d.color);
        y = numberedList(doc, d.discussion, y + 4);
        y += 14;

        y = sectionHeading(doc, '✍️  My Notes', y, d.color);
        for (let i = 0; i < 8; i++) {
            doc.moveTo(55, y + 14).lineTo(doc.page.width - 40, y + 14).stroke(COLORS.border);
            y += 20;
        }

        y = sectionHeading(doc, '🎯  My Commitment for This Dimension', y + 6, d.color);
        doc.moveTo(55, y + 14).lineTo(doc.page.width - 40, y + 14).stroke(COLORS.border);
        doc.moveTo(55, y + 28).lineTo(doc.page.width - 40, y + 28).stroke(COLORS.border);

        drawFooter(doc);
    });

    // Remaining dimensions
    dims.slice(3).forEach(([key, d]) => {
        doc.addPage();
        drawHeader(doc, d.label + ' Dimension — Personal Reflection', d.tagline, d.color);
        y = 108;

        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5).text(d.description, 40, y, { width: doc.page.width - 80 });
        y = doc.y + 16;

        y = sectionHeading(doc, '🪞  Reflection Questions', y, d.color);
        y = numberedList(doc, d.discussion, y + 4);
        y += 14;

        y = sectionHeading(doc, '✍️  My Notes', y, d.color);
        for (let i = 0; i < 8; i++) {
            doc.moveTo(55, y + 14).lineTo(doc.page.width - 40, y + 14).stroke(COLORS.border);
            y += 20;
        }

        y = sectionHeading(doc, '🎯  My Commitment for This Dimension', y + 6, d.color);
        doc.moveTo(55, y + 14).lineTo(doc.page.width - 40, y + 14).stroke(COLORS.border);
        doc.moveTo(55, y + 28).lineTo(doc.page.width - 40, y + 28).stroke(COLORS.border);

        drawFooter(doc);
    });
}

function generatePsychSafetyChecklist(doc) {
    drawHeader(doc, 'Psychological Safety Checklist', 'Feeling Dimension — Pre-Workshop Facilitator Guide', COLORS.dimension.feeling);

    let y = 108;

    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text(
           'Use this checklist before every team resilience session to assess and strengthen psychological safety. ' +
           'Psychological safety is the foundation that makes all other resilience work possible.',
           40, y, { width: doc.page.width - 80 }
       );
    y = doc.y + 18;

    const sections = [
        {
            title: '🏠  Environment Check (Pre-Session)',
            items: [
                '□  Private, distraction-free space confirmed (or breakout rooms set for virtual)',
                '□  Team notified of session agenda and voluntary nature of sharing',
                '□  Ground rules from previous sessions reviewed/updated',
                '□  Materials and activities prepared and tested',
                '□  You (facilitator) are centered and present — take 5 min before starting',
            ],
        },
        {
            title: '🤝  Relationship Check',
            items: [
                '□  Any unresolved tension between team members that needs addressing first?',
                '□  Is there a dominant voice/personality that may need gentle redirection?',
                '□  Are any team members particularly vulnerable today (personal challenges)?',
                '□  Do all participants understand the confidentiality norms?',
                '□  Has the team agreed on "pass" as an acceptable response?',
            ],
        },
        {
            title: '⚠️  Warning Signs to Watch For',
            items: [
                '□  Sarcasm or minimizing of others\' contributions → Pause and redirect',
                '□  Visible discomfort or withdrawal → Check in privately at break',
                '□  Topic avoidance or constant deflection → Acknowledge without pushing',
                '□  Two or three people dominating → Use structured sharing rounds',
                '□  Group energy dropping sharply → Take a break or switch activity',
            ],
        },
        {
            title: '🛠️  Quick Interventions',
            items: [
                'Energy low: "Let\'s take a 3-minute stretch break."',
                'Someone shuts down: "It\'s completely fine to observe today."',
                'Conflict arises: "I want to hear both perspectives. Can we pause and take turns?"',
                'Off-topic: "That\'s important — let\'s put it on our parking lot and return to it."',
                'Oversharing: "Thank you for sharing that. Let\'s hold it with care and move forward."',
            ],
        },
    ];

    sections.forEach((section) => {
        y = sectionHeading(doc, section.title, y, COLORS.dimension.feeling);
        section.items.forEach((item) => {
            doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9)
               .text(item, 55, y + 4, { width: doc.page.width - 95 });
            y = doc.y + 5;
        });
        y += 10;
    });

    drawFooter(doc);
}

function generateKickoffScript(doc) {
    drawHeader(doc, 'Team Kickoff Script', 'Word-for-Word Guide for Your First Session', COLORS.primary);

    let y = 108;

    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text(
           'This script gives you exact language for opening your first team resilience session. ' +
           'Adapt it to your style — the key is setting the tone of safety, curiosity, and intention.',
           40, y, { width: doc.page.width - 80 }
       );
    y = doc.y + 18;

    const scriptSections = [
        {
            title: '🚀  Opening (2 minutes)',
            script: '"Welcome, everyone. I\'m really glad we\'re here together today. This session is part of our team\'s commitment to building something really important — resilience. Not just individual resilience, but our capacity as a team to face challenges, learn, and grow together."',
        },
        {
            title: '🌐  Frame the Work (3 minutes)',
            script: '"The Resilience Atlas helps us understand resilience through six dimensions — Connection, Thinking, Action, Feeling, Hope, and Meaning. You\'ve already taken the individual assessment. Today we start using those insights as a team. We\'ll look at our collective strengths and the areas where we have the most to gain."',
        },
        {
            title: '🛡️  Set Ground Rules (3 minutes)',
            script: '"Before we dive in, let\'s agree on a few norms that make this work well: First, everything shared here stays here — what happens in this room is confidential. Second, participation is always optional — you can pass on any prompt. Third, we\'re here to learn, not to evaluate. There are no right answers. Can everyone agree to those?"',
        },
        {
            title: '🎯  First Activity: Check-In (5 minutes)',
            script: '"Let\'s start with a simple check-in. On a scale of 1-10, how are you showing up today — and share one word that describes your current state. I\'ll go first..." [Model it.] "...Now let\'s go around the room."',
        },
        {
            title: '📋  Transition to Content (1 minute)',
            script: '"Thank you for that honesty. Now let\'s look at what the data tells us about our team\'s resilience profile. I want you to approach this with curiosity rather than judgment — this is a starting point, not a verdict."',
        },
    ];

    scriptSections.forEach((section) => {
        y = sectionHeading(doc, section.title, y);
        doc.rect(46, y + 4, 3, null);
        doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9)
           .text(section.script, 55, y + 4, { width: doc.page.width - 95 });
        y = doc.y + 14;
    });

    // Closing notes
    y = sectionHeading(doc, '💡  Facilitator Notes', y);
    const notes = [
        'Speak slowly — you\'re setting the tone, not delivering information.',
        'Make eye contact with as many people as possible during the opening.',
        'If you sense tension or resistance, acknowledge it: "I know this might feel unusual."',
        'The check-in round is critical — it gets everyone speaking early and signals safety.',
    ];
    y = bulletList(doc, notes, y + 4);

    drawFooter(doc);
}

function generateValuesCards(doc) {
    drawHeader(doc, 'Values Cards Set (50 Cards)', 'Hope Dimension — Values Alignment Activity', COLORS.dimension.hope);

    let y = 108;
    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text('Print, cut, and use these 50 values cards for the Values Alignment Exercise. Works for individuals and teams.', 40, y, { width: doc.page.width - 80 });
    y = doc.y + 16;

    const values = [
        'Authenticity', 'Achievement', 'Adventure', 'Authority', 'Autonomy',
        'Balance', 'Boldness', 'Compassion', 'Challenge', 'Citizenship',
        'Community', 'Competency', 'Contribution', 'Creativity', 'Curiosity',
        'Determination', 'Fairness', 'Faith', 'Fame', 'Friendships',
        'Fun', 'Growth', 'Happiness', 'Honesty', 'Humor',
        'Influence', 'Inner Harmony', 'Justice', 'Kindness', 'Knowledge',
        'Leadership', 'Learning', 'Love', 'Loyalty', 'Meaningful Work',
        'Openness', 'Optimism', 'Peace', 'Pleasure', 'Poise',
        'Popularity', 'Recognition', 'Religion', 'Reputation', 'Respect',
        'Responsibility', 'Security', 'Self-Respect', 'Service', 'Wisdom',
    ];

    const cols = 5;
    const cardW = (doc.page.width - 80) / cols - 4;
    const cardH = 36;
    let col = 0;
    let startX = 40;

    values.forEach((val, i) => {
        const x = startX + col * (cardW + 4);
        doc.rect(x, y, cardW, cardH).fill(COLORS.dimension.hope + '15').stroke(COLORS.dimension.hope + '60');
        doc.fillColor(COLORS.dimension.hope).font(FONT_BOLD).fontSize(8)
           .text(val, x + 4, y + 10, { width: cardW - 8, align: 'center' });
        col++;
        if (col >= cols) {
            col = 0;
            y += cardH + 4;
        }
    });

    drawFooter(doc);
}

function generateStrengthsCards(doc) {
    drawHeader(doc, 'Strengths Cards Set (40 Cards)', 'Meaning Dimension — Strengths Finder Activity', COLORS.dimension.meaning);

    let y = 108;
    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text('40 printable strengths cards for the Strengths Finder Workshop. Each card includes a brief description.', 40, y, { width: doc.page.width - 80 });
    y = doc.y + 16;

    const strengths = [
        { name: 'Achiever', desc: 'Constant drive to accomplish more.' },
        { name: 'Activator', desc: 'Turns thoughts into action quickly.' },
        { name: 'Adaptability', desc: 'Flexible; responds well to change.' },
        { name: 'Analytical', desc: 'Logical, data-driven thinking.' },
        { name: 'Arranger', desc: 'Coordinates for maximum productivity.' },
        { name: 'Belief', desc: 'Strong values that guide everything.' },
        { name: 'Command', desc: 'Takes charge in challenging situations.' },
        { name: 'Communication', desc: 'Explains and connects through words.' },
        { name: 'Competition', desc: 'Motivated by comparison and winning.' },
        { name: 'Connectedness', desc: 'Sees links between all things.' },
        { name: 'Consistency', desc: 'Values fairness and equal treatment.' },
        { name: 'Context', desc: 'Learns from the past to guide present.' },
        { name: 'Deliberative', desc: 'Careful, thorough decision-making.' },
        { name: 'Developer', desc: 'Sees potential in everyone.' },
        { name: 'Discipline', desc: 'Creates order through structure.' },
        { name: 'Empathy', desc: 'Senses others\' feelings and perspectives.' },
        { name: 'Focus', desc: 'Sets clear priorities; eliminates distractions.' },
        { name: 'Futuristic', desc: 'Inspired by what could be.' },
        { name: 'Harmony', desc: 'Seeks consensus and agreement.' },
        { name: 'Ideation', desc: 'Fascinated by ideas and connections.' },
        { name: 'Includer', desc: 'Expands the circle; accepts all.' },
        { name: 'Individualization', desc: 'Recognizes each person\'s uniqueness.' },
        { name: 'Input', desc: 'Craves information and collects it.' },
        { name: 'Intellection', desc: 'Enjoys deep intellectual discussion.' },
        { name: 'Learner', desc: 'Loves the process of learning.' },
        { name: 'Maximizer', desc: 'Transforms strength into excellence.' },
        { name: 'Positivity', desc: 'Infectious enthusiasm and energy.' },
        { name: 'Relator', desc: 'Enjoys close, deep relationships.' },
        { name: 'Responsibility', desc: 'Takes ownership psychologically.' },
        { name: 'Restorative', desc: 'Loves solving difficult problems.' },
        { name: 'Self-Assurance', desc: 'Confidence in ability and judgment.' },
        { name: 'Significance', desc: 'Wants to be seen and recognized.' },
        { name: 'Strategic', desc: 'Finds alternative paths to goals.' },
        { name: 'Woo', desc: 'Wins others over; loves meeting people.' },
        { name: 'Courage', desc: 'Acts despite fear or uncertainty.' },
        { name: 'Curiosity', desc: 'Explores with openness and wonder.' },
        { name: 'Humor', desc: 'Lightens the load through laughter.' },
        { name: 'Integrity', desc: 'Aligns actions with values always.' },
        { name: 'Patience', desc: 'Waits and persists without frustration.' },
        { name: 'Vision', desc: 'Sees the big picture clearly.' },
    ];

    const cols = 4;
    const cardW = (doc.page.width - 80) / cols - 4;
    const cardH = 42;
    let col = 0;

    strengths.forEach((s) => {
        const x = 40 + col * (cardW + 4);
        doc.rect(x, y, cardW, cardH).fill(COLORS.dimension.meaning + '15').stroke(COLORS.dimension.meaning + '60');
        doc.fillColor(COLORS.dimension.meaning).font(FONT_BOLD).fontSize(8.5)
           .text(s.name, x + 4, y + 6, { width: cardW - 8, align: 'center' });
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(7)
           .text(s.desc, x + 4, y + 20, { width: cardW - 8, align: 'center' });
        col++;
        if (col >= cols) {
            col = 0;
            y += cardH + 4;
        }
    });

    drawFooter(doc);
}

function generateSMARTGoalWorksheet(doc) {
    drawHeader(doc, 'SMART Goal Worksheet', 'Action Dimension — Individual & Team Goal Setting', COLORS.dimension.action);

    let y = 108;

    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text('Use this worksheet to set SMART goals tied to your resilience growth. Include team goals and individual commitments.', 40, y, { width: doc.page.width - 80 });
    y = doc.y + 16;

    // SMART framework explanation
    const smartItems = [
        { letter: 'S', word: 'Specific', desc: 'What exactly will you do or achieve?' },
        { letter: 'M', word: 'Measurable', desc: 'How will you know when you\'ve succeeded?' },
        { letter: 'A', word: 'Achievable', desc: 'Is this realistic given your current resources?' },
        { letter: 'R', word: 'Relevant', desc: 'How does this connect to your resilience dimension?' },
        { letter: 'T', word: 'Time-bound', desc: 'What is your specific deadline or timeframe?' },
    ];

    y = sectionHeading(doc, '📖  The SMART Framework', y, COLORS.dimension.action);
    smartItems.forEach((item) => {
        doc.rect(55, y, 20, 20).fill(COLORS.dimension.action);
        doc.fillColor(COLORS.white).font(FONT_BOLD).fontSize(12).text(item.letter, 55, y + 3, { width: 20, align: 'center' });
        doc.fillColor(COLORS.text).font(FONT_BOLD).fontSize(9.5).text(item.word + ':', 82, y + 2, { continued: true });
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(9).text('  ' + item.desc);
        y = doc.y + 4;
    });
    y += 14;

    // Goal template (x2)
    for (let goalNum = 1; goalNum <= 2; goalNum++) {
        y = sectionHeading(doc, `🎯  Goal ${goalNum}`, y, COLORS.dimension.action);
        const goalFields = ['My Goal:', 'Why it Matters:', 'Specific Actions:', 'Measure of Success:', 'Due Date:'];
        goalFields.forEach((f) => {
            doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5).text(f, 55, y);
            doc.moveTo(150, y + 11).lineTo(doc.page.width - 40, y + 11).stroke(COLORS.border);
            y += 20;
        });

        // Accountability partner
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(8.5)
           .text('Accountability Partner:', 55, y);
        doc.moveTo(180, y + 11).lineTo(doc.page.width - 40, y + 11).stroke(COLORS.border);
        y += 24;
    }

    drawFooter(doc);
}

function generateFacilitatorTroubleshootingGuide(doc) {
    drawHeader(doc, 'Facilitator Troubleshooting Guide', 'Handling Common Facilitation Challenges', COLORS.primary);

    let y = 108;

    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
       .text('This guide helps facilitators navigate the most common challenges in team resilience sessions. Keep it nearby during your workshops.', 40, y, { width: doc.page.width - 80 });
    y = doc.y + 16;

    const challenges = [
        {
            title: '🧱  Resistant Participants',
            solutions: [
                'Name it lightly: "I notice some hesitation — that\'s completely normal."',
                'Make participation optional: "You can observe today and engage when it feels right."',
                'Connect to their interests: "How does [topic] relate to your current challenges?"',
                'Don\'t force eye contact or call on resisters — let them come to you.',
            ],
        },
        {
            title: '📢  Dominant Voices',
            solutions: [
                'Use structured rounds: "We\'ll go around and each person shares 1 minute."',
                'Acknowledge then redirect: "Thanks — let\'s hear from someone who hasn\'t spoken yet."',
                'Set norms early: "We want all voices in the room today."',
                'Physical cues: move toward quieter participants when you want to invite them in.',
            ],
        },
        {
            title: '😢  Emotional Moments',
            solutions: [
                'Pause and hold space: "Take the time you need — there\'s no rush here."',
                'Normalize emotion: "It makes sense that this brings up feelings."',
                'Don\'t fix it: resist the urge to make the emotion go away quickly.',
                'Offer a break: "We can take 5 minutes if you\'d like."',
                'Follow up privately: check in with the person after the session.',
            ],
        },
        {
            title: '⏱️  Time Management',
            solutions: [
                'Announce time remaining: "We have 5 minutes left in this discussion."',
                'Use a visible timer during activities.',
                'Have a short and long version of each activity ready.',
                'Park off-topic discussions: "Great point — let\'s put that on the parking lot."',
                'Cut content, not connection: if running behind, drop an activity, never the debrief.',
            ],
        },
        {
            title: '😴  Low Energy / Disengagement',
            solutions: [
                'Call a 3-minute movement break.',
                'Switch to a pair or small group format.',
                'Ask: "What would make this more useful for you right now?"',
                'Try a physical activity: stand up, move around, use space differently.',
            ],
        },
    ];

    challenges.forEach((challenge) => {
        y = sectionHeading(doc, challenge.title, y);
        y = bulletList(doc, challenge.solutions, y + 4);
        y += 10;
    });

    drawFooter(doc);
}

// Visual resources (simplified infographic-style PDFs)
function generateVisualResource(doc, item) {
    const color = item.color || COLORS.accent;
    drawHeader(doc, item.title, item.subtitle || 'Teams Visual Resource', color);

    let y = 108;

    // Description
    doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(10)
       .text(item.description, 40, y, { width: doc.page.width - 80 });
    y = doc.y + 20;

    // Main content
    if (item.content) {
        item.content.forEach((block) => {
            if (block.heading) {
                y = sectionHeading(doc, block.heading, y, color);
                y += 4;
            }
            if (block.text) {
                doc.fillColor(COLORS.text).font(FONT_REGULAR).fontSize(9.5)
                   .text(block.text, 50, y, { width: doc.page.width - 90 });
                y = doc.y + 10;
            }
            if (block.items) {
                y = bulletList(doc, block.items, y);
                y += 10;
            }
            if (block.numberedItems) {
                y = numberedList(doc, block.numberedItems, y);
                y += 10;
            }
            if (block.table) {
                block.table.forEach((row) => {
                    const colW = (doc.page.width - 80) / row.length;
                    row.forEach((cell, ci) => {
                        const cellX = 40 + ci * colW;
                        if (ci === 0) doc.rect(cellX, y, colW, 22).fill(color + '18');
                        doc.fillColor(ci === 0 ? color : COLORS.text)
                           .font(ci === 0 ? FONT_BOLD : FONT_REGULAR)
                           .fontSize(8.5)
                           .text(cell, cellX + 5, y + 6, { width: colW - 10 });
                    });
                    doc.moveTo(40, y + 22).lineTo(doc.page.width - 40, y + 22).stroke(COLORS.border);
                    y += 24;
                });
                y += 8;
            }
        });
    }

    // Print info
    if (item.printSize) {
        doc.rect(40, doc.page.height - 80, doc.page.width - 80, 28).fill(COLORS.light);
        doc.fillColor(COLORS.muted).font(FONT_REGULAR).fontSize(8)
           .text('📐 Print Size: ' + item.printSize + '    📁 Format: PDF    🖨️ Print at full size for best results',
               50, doc.page.height - 70, { width: doc.page.width - 100 });
    }

    drawFooter(doc);
}

// ─── Resource metadata for visual resources ───────────────────────────────────

const VISUAL_CONTENT = {
    'vis-001': {
        title: 'Six Dimensions Overview Card Set',
        subtitle: 'Reference Cards — All Six Dimensions',
        color: COLORS.accent,
        description: 'Six-card set, one per dimension. Each card includes the dimension icon, name, tagline, key behaviors, and sample practices. Print-ready at 4"×6".',
        printSize: '4"×6" (per card)',
        content: Object.entries(DIMENSIONS).map(([key, d]) => ({
            heading: `${d.label} — ${d.tagline}`,
            text: d.description,
            items: d.practices.slice(0, 3),
        })),
    },
    'vis-002': {
        title: 'Team Resilience Radar Interpretation Guide',
        subtitle: 'Infographic — Reading Your Team Radar Chart',
        color: COLORS.primary,
        description: 'Visual guide to reading and interpreting team radar charts. Shows what each section means, common profiles, and how to identify growth priorities.',
        printSize: '8.5"×11"',
        content: [
            {
                heading: '📡  How to Read a Team Radar Chart',
                text: 'The radar chart shows your team\'s average score (1-10) across all six resilience dimensions. Each "spoke" of the radar represents one dimension.',
                items: [
                    'Scores 7-10: Team strength — leverage these in your work and support others through them',
                    'Scores 4-6: Developing — areas with potential; focus facilitation here',
                    'Scores 1-3: Growth edge — prioritize structured activities and practice here',
                ],
            },
            {
                heading: '🔍  Common Team Profiles',
                items: [
                    'The Connector: High Connection, lower Action — great culture, may need accountability structures',
                    'The Driver: High Action, lower Feeling — gets things done, may miss emotional needs',
                    'The Dreamer: High Hope, lower Thinking — inspired vision, may need pragmatic frameworks',
                    'The Balanced Team: Scores within 2 points across all dimensions — rare but powerful',
                ],
            },
            {
                heading: '🎯  Using the Chart for Planning',
                numberedItems: [
                    'Identify the two lowest-scoring dimensions — these are your primary focus areas',
                    'Identify the two highest-scoring dimensions — use these as strengths to build from',
                    'Plan workshops that address low-scoring areas while celebrating high-scoring ones',
                    'Re-assess after 90 days to measure growth and adjust your program',
                ],
            },
        ],
    },
    'vis-003': {
        title: 'Team Building Timeline — 6-Month Plan',
        subtitle: 'Planning Timeline — Month-by-Month Program Map',
        color: COLORS.primary,
        description: 'Month-by-month workshop sequence with activities mapped to dimensions. Shows progression from awareness to practice to integration.',
        printSize: '11"×17"',
        content: [
            {
                heading: '📅  6-Month Program Timeline',
                table: [
                    ['Month', 'Focus', 'Key Activities', 'Outcome'],
                    ['Month 1', 'Foundation', 'Assessment + Kickoff + Trust Circle', 'Team baseline, shared language'],
                    ['Month 2', 'Connection', 'Support Mapping, Peer Listening', 'Deeper trust, open communication'],
                    ['Month 3', 'Thinking & Feeling', 'Assumption Audit, Stress Protocol', 'Reframing capacity, emotional safety'],
                    ['Month 4', 'Action & Hope', 'Goal Setting, Values Alignment', 'Momentum, shared direction'],
                    ['Month 5', 'Meaning & Integration', 'Strengths Finder, Team Story', 'Identity, contribution clarity'],
                    ['Month 6', 'Review & Future', 'Re-assessment, Commitment Ceremony', 'Measured growth, continued practice'],
                ],
            },
            {
                heading: '📝  Implementation Notes',
                items: [
                    'Schedule monthly 90-min sessions for best results',
                    'Add brief (15-min) check-ins between full sessions',
                    'Distribute individual reflection journals at Month 1',
                    'Mid-program re-assessment recommended at Month 3',
                ],
            },
        ],
    },
    'vis-004': {
        title: 'Dimension Spectrum Infographic',
        subtitle: 'Infographic — From Low to High on Each Dimension',
        color: COLORS.accent,
        description: 'Visual spectrum showing each dimension from low to high. Illustrates development trajectory, common patterns, and key turning points.',
        printSize: '8.5"×11"',
        content: Object.entries(DIMENSIONS).map(([key, d]) => ({
            heading: `${d.label} Spectrum`,
            table: [
                ['Low (1-3)', 'Developing (4-6)', 'Strong (7-10)'],
                [`Isolated, avoidant (${d.label})`, `Building capacity, inconsistent`, `Thriving, leads others`],
            ],
        })).slice(0, 4),
    },
    'vis-005': {
        title: 'Team Resilience Development Pathway',
        subtitle: 'Development Map — 6-Month Progression',
        color: COLORS.primary,
        description: '6-month progression map with activities, expected outcomes, measurement points, and wins at each stage.',
        printSize: '11"×17"',
        content: [
            {
                heading: '🗺️  The Development Pathway',
                numberedItems: [
                    'Awareness Phase (Month 1-2): Assessment, shared language, trust building',
                    'Understanding Phase (Month 2-3): Dimension deep-dives, safety practices',
                    'Practice Phase (Month 3-4): Habit building, accountability structures',
                    'Integration Phase (Month 4-5): Cross-dimension connections, leadership',
                    'Sustainment Phase (Month 5-6): Culture embedding, future planning',
                ],
            },
            {
                heading: '🏆  Milestones to Celebrate',
                items: [
                    'First vulnerable share in a group setting',
                    'First time team uses resilience language in a real challenge',
                    'Any dimension score increasing 2+ points on re-assessment',
                    'A team member facilitating a session or activity independently',
                ],
            },
        ],
    },
    'vis-006': {
        title: 'Activity Selection Matrix',
        subtitle: 'Decision Matrix — Choose the Right Activity',
        color: COLORS.accent,
        description: 'Visual grid to choose the right activity for your team\'s needs. Organized by time available, group size, and learning objective.',
        printSize: '8.5"×11"',
        content: [
            {
                heading: '⏱️  By Time Available',
                table: [
                    ['Time', 'Recommended Activities', 'Dimension'],
                    ['10-15 min', 'Trust Circle, Emotional Weather Check, Gratitude Circle', 'Connection, Feeling, Hope'],
                    ['20-30 min', 'Support Mapping, Perspective Gallery, Future Visioning', 'Connection, Thinking, Hope'],
                    ['30-45 min', 'Assumption Audit, Goal Setting, Strengths Finder', 'Thinking, Action, Meaning'],
                    ['45-60 min', 'Narrative Reframing, Values Alignment, Story of Service', 'Thinking, Hope, Meaning'],
                ],
            },
        ],
    },
};

// Workshop posters for each dimension
['connection', 'thinking', 'action', 'feeling', 'hope', 'meaning'].forEach((dim, i) => {
    const d = DIMENSIONS[dim];
    VISUAL_CONTENT[`vis-${String(7 + i).padStart(3, '0')}`] = {
        title: d.label + ' Dimension Workshop Poster',
        subtitle: 'Workshop Poster — ' + d.tagline,
        color: d.color,
        description: `Large-format poster for the ${d.label} dimension. Includes motivational messaging, key concepts, and discussion starters.`,
        printSize: '18"×24"',
        content: [
            {
                heading: `🏷️  About ${d.label} Resilience`,
                text: d.description,
            },
            {
                heading: '🔑  Key Practices',
                items: d.practices,
            },
            {
                heading: '💬  Discussion Starters',
                items: d.discussion.slice(0, 3),
            },
            {
                heading: '🎯  Activities',
                items: d.activities.map((a) => `${a.name} (${a.duration}) — ${a.description}`),
            },
        ],
    };
});

VISUAL_CONTENT['vis-013'] = {
    title: 'Team Resilience Culture Poster',
    subtitle: 'Culture Poster — All Six Dimensions',
    color: COLORS.primary,
    description: 'All six dimensions in one integrated visual. Shows how dimensions interact, team culture elements, and shared language.',
    printSize: '24"×36"',
    content: [
        {
            heading: '🌐  The Six Dimensions of Team Resilience',
            items: Object.entries(DIMENSIONS).map(([k, d]) => `${d.label}: ${d.description}`),
        },
        {
            heading: '🤝  How Dimensions Work Together',
            text: 'Strong teams don\'t develop dimensions in isolation. Each dimension reinforces and amplifies the others. Connection creates safety for Feeling. Thinking enables Action. Hope sustains Meaning.',
        },
    ],
};

VISUAL_CONTENT['vis-014'] = {
    title: 'Quick Reference Cards (6-Card Set)',
    subtitle: 'Quick Reference — One Card per Dimension',
    color: COLORS.accent,
    description: 'Pocket-sized reference cards for facilitators and team members. Key practices, prompts, and guidance for daily leadership.',
    printSize: '3"×5" (per card)',
    content: Object.entries(DIMENSIONS).map(([k, d]) => ({
        heading: `${d.label} Quick Reference`,
        items: [
            ...d.practices.slice(0, 2).map((p) => 'Practice: ' + p),
            ...d.discussion.slice(0, 2).map((q) => 'Prompt: ' + q),
        ],
    })),
};

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Generate a PDF stream for the given resource ID.
 * @param {string} resourceId - e.g. 'hand-001', 'vis-002'
 * @returns {PDFDocument} PDFKit document (call .pipe() then .end())
 */
function generateResourcePdf(resourceId) {
    const doc = new PDFDocument({ size: 'LETTER', margin: 0, bufferPages: true });

    if (resourceId === 'hand-001') { generateWorkshopGuide(doc, 'connection'); }
    else if (resourceId === 'hand-002') { generateWorkshopGuide(doc, 'thinking'); }
    else if (resourceId === 'hand-003') { generateWorkshopGuide(doc, 'action'); }
    else if (resourceId === 'hand-004') { generateWorkshopGuide(doc, 'feeling'); }
    else if (resourceId === 'hand-005') { generateWorkshopGuide(doc, 'hope'); }
    else if (resourceId === 'hand-006') { generateWorkshopGuide(doc, 'meaning'); }
    else if (resourceId === 'hand-007') { generateTeamResilienceSnapshot(doc); }
    else if (resourceId === 'hand-008') { generateHabitTracker(doc); }
    else if (resourceId === 'hand-009') { generateActionPlanningWorksheet(doc); }
    else if (resourceId === 'hand-010') { generateDiscussionPromptSheets(doc); }
    else if (resourceId === 'hand-011') { generateReflectionJournal(doc); }
    else if (resourceId === 'hand-012') { generatePsychSafetyChecklist(doc); }
    else if (resourceId === 'hand-013') { generateKickoffScript(doc); }
    else if (resourceId === 'hand-014') { generateValuesCards(doc); }
    else if (resourceId === 'hand-015') { generateStrengthsCards(doc); }
    else if (resourceId === 'hand-016') { generateSMARTGoalWorksheet(doc); }
    else if (resourceId === 'hand-017') { generateFacilitatorTroubleshootingGuide(doc); }
    else if (VISUAL_CONTENT[resourceId]) {
        generateVisualResource(doc, VISUAL_CONTENT[resourceId]);
    } else {
        throw new Error('Unknown resource ID: ' + resourceId);
    }

    doc.end();
    return doc;
}

/**
 * List of all valid resource IDs.
 */
const ALL_RESOURCE_IDS = [
    'hand-001', 'hand-002', 'hand-003', 'hand-004', 'hand-005', 'hand-006',
    'hand-007', 'hand-008', 'hand-009', 'hand-010', 'hand-011', 'hand-012',
    'hand-013', 'hand-014', 'hand-015', 'hand-016', 'hand-017',
    'vis-001', 'vis-002', 'vis-003', 'vis-004', 'vis-005', 'vis-006',
    'vis-007', 'vis-008', 'vis-009', 'vis-010', 'vis-011', 'vis-012',
    'vis-013', 'vis-014',
];

module.exports = { generateResourcePdf, ALL_RESOURCE_IDS };
