'use strict';

/**
 * iatlas-roadmap.js — IATLAS Developmental Roadmap routes.
 *
 * Endpoints:
 *   GET /api/iatlas/roadmap/printable.pdf
 *       — Generate and stream a printable PDF overview of the
 *         IATLAS Developmental Roadmap (ages 5–18).
 */

const express     = require('express');
const router      = express.Router();
const PDFDocument = require('pdfkit');
const rateLimit   = require('express-rate-limit');
const logger      = require('../utils/logger');

// ── Rate limiter ──────────────────────────────────────────────────────────────
const roadmapLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Developmental milestones (mirrors client/src/data/iatlas/developmentalRoadmap.js) ──
const DEVELOPMENTAL_MILESTONES = {
  'ages-5-7': {
    label: 'Foundation Trail (Ages 5-7)',
    color: '#10b981',
    overview: 'Building basic resilience skills through play, exploration, and simple challenges.',
    dimensions: {
      'agentic-generative':   { title: 'I Can Try!',             description: 'Simple choices, trying new things, "I can do it" mindset' },
      'somatic-regulative':   { title: 'My Body, My Friend',     description: 'Body awareness, simple movement, energy recognition' },
      'cognitive-narrative':  { title: 'Problem-Solving Play',   description: 'Concrete thinking, simple puzzles, cause-and-effect' },
      'relational-connective':{ title: 'Sharing & Friends',      description: 'Turn-taking, cooperation, simple empathy' },
      'emotional-adaptive':   { title: 'Feeling Faces',          description: 'Naming emotions, simple coping strategies' },
      'spiritual-existential':{ title: 'Wonder & Curiosity',     description: 'Exploring nature, asking "why?", simple gratitude' },
    },
  },
  'ages-8-10': {
    label: 'Building Path (Ages 8-10)',
    color: '#3b82f6',
    overview: 'Developing more complex resilience skills with guided challenges and goal-setting.',
    dimensions: {
      'agentic-generative':   { title: 'Goal Getter',            description: 'Setting small goals, planning, persisting through challenges' },
      'somatic-regulative':   { title: 'Breathwork Basics',      description: 'Intentional breathing, recognizing stress signals, grounding' },
      'cognitive-narrative':  { title: 'Critical Thinker',       description: 'Problem-solving strategies, flexible thinking, planning' },
      'relational-connective':{ title: 'Friendship Skills',      description: 'Teamwork, listening, conflict resolution basics' },
      'emotional-adaptive':   { title: 'Emotion Regulation',     description: 'Coping strategies, emotional vocabulary, self-soothing' },
      'spiritual-existential':{ title: 'Values Explorer',        description: 'What matters to me, fairness, belonging' },
    },
  },
  'ages-11-14': {
    label: 'Explorer Trail (Ages 11-14)',
    color: '#8b5cf6',
    overview: 'Navigating independence, identity, and deeper emotional complexity with advanced strategies.',
    dimensions: {
      'agentic-generative':   { title: 'Independence Builder',   description: 'Self-direction, decision-making, owning choices' },
      'somatic-regulative':   { title: 'Mind-Body Connection',   description: 'Advanced regulation, body-emotion link, stress awareness' },
      'cognitive-narrative':  { title: 'Abstract Reasoning',     description: 'Complex problem-solving, reframing, metacognition' },
      'relational-connective':{ title: 'Conflict Resolution',    description: 'Healthy boundaries, peer navigation, assertiveness' },
      'emotional-adaptive':   { title: 'Stress Management',      description: 'Advanced coping, emotional complexity, resilience' },
      'spiritual-existential':{ title: 'Identity & Meaning',     description: 'Who am I? What matters? Purpose exploration' },
    },
  },
  'ages-15-18': {
    label: 'Mastery Summit (Ages 15-18)',
    color: '#f59e0b',
    overview: 'Mastering resilience skills for life transitions, leadership, and complex challenges.',
    dimensions: {
      'agentic-generative':   { title: 'Leadership & Agency',    description: 'Self-authorship, leadership, life direction' },
      'somatic-regulative':   { title: 'Advanced Regulation',    description: 'Mastery of somatic tools, teaching others' },
      'cognitive-narrative':  { title: 'Complex Problem-Solving',description: 'Strategic thinking, systems thinking, creativity' },
      'relational-connective':{ title: 'Healthy Relationships',  description: 'Mature relationships, interdependence, communication' },
      'emotional-adaptive':   { title: 'Resilience Strategies',  description: 'Mastery of emotional resilience, supporting others' },
      'spiritual-existential':{ title: 'Life Philosophy',        description: 'Purpose, worldview, existential questions' },
    },
  },
};

// ── GET /api/iatlas/roadmap/printable.pdf ─────────────────────────────────────
router.get('/printable.pdf', roadmapLimiter, (req, res) => {
  try {
    const doc = new PDFDocument({
      margin: 40,
      size: 'LETTER',
      layout: 'landscape',
      info: {
        Title: 'IATLAS Developmental Roadmap',
        Author: 'Resilience Atlas',
        Subject: 'Resilience Skills Across Ages 5–18',
      },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="IATLAS-Developmental-Roadmap.pdf"',
    );

    doc.pipe(res);

    // ── Title ──────────────────────────────────────────────────────────────
    doc
      .fontSize(20)
      .fillColor('#1e293b')
      .text('IATLAS Developmental Roadmap', { align: 'center' })
      .moveDown(0.2);

    doc
      .fontSize(10)
      .fillColor('#64748b')
      .text('Resilience Skills Across Ages 5–18  ·  IATLAS Kids Curriculum', {
        align: 'center',
      })
      .moveDown(1.5);

    // ── Age group sections ─────────────────────────────────────────────────
    Object.values(DEVELOPMENTAL_MILESTONES).forEach((milestone, idx) => {

      // Section header
      doc
        .fontSize(13)
        .fillColor(milestone.color)
        .text(milestone.label, { continued: false });

      doc
        .fontSize(8.5)
        .fillColor('#475569')
        .text(milestone.overview, { indent: 10 })
        .moveDown(0.4);

      // Dimension rows
      Object.values(milestone.dimensions).forEach(dim => {
        doc
          .fontSize(9)
          .fillColor('#1e293b')
          .text(`• ${dim.title}`, { indent: 16, continued: true })
          .fillColor('#64748b')
          .text(` — ${dim.description}`, { continued: false });
      });

      if (idx < Object.keys(DEVELOPMENTAL_MILESTONES).length - 1) {
        doc.moveDown(1);
      }
    });

    // ── Footer ─────────────────────────────────────────────────────────────
    doc
      .moveDown(1.5)
      .fontSize(7.5)
      .fillColor('#94a3b8')
      .text(
        `Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · IATLAS is a completion-based skills curriculum. Progress is measured by activities completed, badges earned, and quests finished.`,
        { align: 'center' },
      );

    doc.end();
  } catch (err) {
    logger.error('Error generating roadmap PDF:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate roadmap PDF' });
    }
  }
});

module.exports = router;
