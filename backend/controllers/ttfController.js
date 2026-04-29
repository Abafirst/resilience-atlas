'use strict';

const mongoose      = require('mongoose');
const crypto        = require('crypto');
const TTFEnrollment = require('../models/TTFEnrollment');
const TTFCohort     = require('../models/TTFCohort');
const TTFModuleContent = require('../models/TTFModuleContent');
const TTFCompetency = require('../models/TTFCompetency');
const logger        = require('../utils/logger');

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserId(req) {
  return req.user?.userId || req.user?.sub || req.user?.id || null;
}

function generateCredentialId() {
  const prefix = 'TTF';
  const random = crypto.randomBytes(5).toString('hex').toUpperCase();
  const year   = new Date().getFullYear();
  return `${prefix}-${year}-${random}`;
}

const MODULE_KEYS = ['module1','module2','module3','module4','module5','module6'];
const MODULE_PREREQS = {
  module1: [],
  module2: [1],
  module3: [1, 2],
  module4: [1, 2, 3],
  module5: [1, 2, 3, 4],
  module6: [1, 2, 3, 4, 5],
};

function moduleKeyToNumber(key) {
  return parseInt(key.replace('module', ''), 10);
}

function allPrereqsMet(moduleProgress, moduleNumber) {
  const prereqs = MODULE_PREREQS[`module${moduleNumber}`] || [];
  return prereqs.every(n => moduleProgress[`module${n}`]?.completed === true);
}

// ── Enrollment ────────────────────────────────────────────────────────────────

/**
 * POST /api/ttf/enroll
 * Creates or retrieves an enrollment record.
 * Stripe PaymentIntent creation happens client-side via /api/ttf/payment-intent.
 */
async function createEnrollment(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const {
      tier = 'professional',
      cohortId,
      userEmail = '',
      userName = '',
      userRole = '',
      organization = '',
      enrollmentReason = '',
    } = req.body;

    const validTiers = ['professional', 'group', 'enterprise'];
    if (!validTiers.includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier.' });
    }

    // Prevent duplicate enrollments that are paid or in-progress
    const existing = await TTFEnrollment.findOne({
      userId,
      status: { $nin: ['withdrawn'] },
      paymentStatus: { $in: ['paid', 'waived'] },
    }).lean();
    if (existing) {
      return res.status(409).json({ error: 'Active enrollment already exists.', enrollmentId: existing._id });
    }

    const enrollmentData = {
      userId,
      userEmail,
      userName,
      userRole,
      organization,
      enrollmentReason,
      tier,
      status: 'enrolled',
      paymentStatus: tier === 'enterprise' ? 'waived' : 'pending',
    };
    if (cohortId && mongoose.Types.ObjectId.isValid(cohortId)) {
      enrollmentData.cohortId = cohortId;
    }

    const enrollment = await TTFEnrollment.create(enrollmentData);

    // Add student to cohort
    if (enrollmentData.cohortId) {
      await TTFCohort.findByIdAndUpdate(
        enrollmentData.cohortId,
        { $addToSet: { enrolledStudents: userId } }
      );
    }

    logger.info('[TTF] Enrollment created', { userId, enrollmentId: enrollment._id });
    res.status(201).json({ enrollment });
  } catch (err) {
    logger.error('[TTF] createEnrollment error', { err: err.message });
    res.status(500).json({ error: 'Failed to create enrollment.' });
  }
}

/**
 * POST /api/ttf/payment-intent
 * Creates a Stripe PaymentIntent for TTF enrollment.
 */
async function createPaymentIntent(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const { enrollmentId, tier = 'professional' } = req.body;
    if (!enrollmentId || !mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ error: 'Valid enrollmentId required.' });
    }

    const TIER_PRICES = { professional: 49700, group: 199700 }; // cents
    const amount = TIER_PRICES[tier];
    if (!amount) return res.status(400).json({ error: 'Pricing not available for this tier.' });

    const stripe = require('../config/stripe');
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: { enrollmentId: enrollmentId.toString(), userId, tier },
    });

    await TTFEnrollment.findByIdAndUpdate(enrollmentId, {
      stripePaymentIntentId: paymentIntent.id,
      amountPaid: amount / 100,
    });

    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    logger.error('[TTF] createPaymentIntent error', { err: err.message });
    res.status(500).json({ error: 'Failed to create payment intent.' });
  }
}

/**
 * POST /api/ttf/payment-confirm
 * Stripe webhook — confirms payment and updates enrollment.
 */
async function confirmPayment(req, res) {
  try {
    const stripe = require('../config/stripe');
    const sig    = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_TTF || process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('[TTF] STRIPE_WEBHOOK_SECRET not configured.');
      return res.status(400).json({ error: 'Webhook secret not configured.' });
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const enrollmentId = pi.metadata?.enrollmentId;
      if (enrollmentId) {
        await TTFEnrollment.findByIdAndUpdate(enrollmentId, {
          paymentStatus: 'paid',
          status: 'in-progress',
        });
        logger.info('[TTF] Payment confirmed', { enrollmentId });
      }
    }

    res.json({ received: true });
  } catch (err) {
    logger.error('[TTF] confirmPayment error', { err: err.message });
    res.status(500).json({ error: 'Failed to process webhook.' });
  }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * GET /api/ttf/dashboard
 */
async function getDashboard(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const enrollment = await TTFEnrollment.findOne({
      userId,
      status: { $nin: ['withdrawn'] },
    }).lean();

    if (!enrollment) {
      return res.status(404).json({ error: 'No active TTF enrollment found.' });
    }

    let cohort = null;
    if (enrollment.cohortId) {
      cohort = await TTFCohort.findById(enrollment.cohortId).lean();
    }

    // Compute overall progress
    let completedModules = 0;
    for (const key of MODULE_KEYS) {
      if (enrollment.moduleProgress?.[key]?.completed) completedModules++;
    }

    const approvedPracticum = (enrollment.practicumSessions || []).filter(s => s.approved).length;

    res.json({
      enrollment,
      cohort,
      completedModules,
      totalModules: 6,
      approvedPracticum,
      requiredPracticum: 3,
    });
  } catch (err) {
    logger.error('[TTF] getDashboard error', { err: err.message });
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
}

// ── Modules ───────────────────────────────────────────────────────────────────

/**
 * GET /api/ttf/modules
 * Returns all module metadata (no full content).
 */
async function getModules(req, res) {
  try {
    const modules = await TTFModuleContent.find({}, {
      moduleNumber: 1, moduleName: 1, moduleDescription: 1,
      color: 1, bg: 1, estimatedDuration: 1, prerequisites: 1,
      'sections.sectionId': 1, 'sections.sectionTitle': 1,
      'sections.contentType': 1, 'sections.duration': 1,
    }).sort({ moduleNumber: 1 }).lean();
    res.json({ modules });
  } catch (err) {
    logger.error('[TTF] getModules error', { err: err.message });
    res.status(500).json({ error: 'Failed to load modules.' });
  }
}

/**
 * GET /api/ttf/module/:moduleNumber
 */
async function getModule(req, res) {
  try {
    const userId = getUserId(req);
    const moduleNumber = parseInt(req.params.moduleNumber, 10);
    if (!moduleNumber || moduleNumber < 1 || moduleNumber > 6) {
      return res.status(400).json({ error: 'Invalid module number.' });
    }

    const moduleContent = await TTFModuleContent.findOne({ moduleNumber }).lean();
    if (!moduleContent) return res.status(404).json({ error: 'Module not found.' });

    let userProgress = null;
    if (userId) {
      const enrollment = await TTFEnrollment.findOne(
        { userId, status: { $nin: ['withdrawn'] } },
        { moduleProgress: 1 }
      ).lean();
      if (enrollment) {
        userProgress = enrollment.moduleProgress?.[`module${moduleNumber}`] || {};
        // Check if module is accessible
        if (!allPrereqsMet(enrollment.moduleProgress || {}, moduleNumber)) {
          return res.status(403).json({
            error: 'Prerequisites not met.',
            prerequisitesRequired: MODULE_PREREQS[`module${moduleNumber}`],
          });
        }
      }
    }

    res.json({ module: moduleContent, userProgress });
  } catch (err) {
    logger.error('[TTF] getModule error', { err: err.message });
    res.status(500).json({ error: 'Failed to load module.' });
  }
}

/**
 * POST /api/ttf/module/:moduleNumber/section/:sectionId/complete
 */
async function completeSection(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const moduleNumber = parseInt(req.params.moduleNumber, 10);
    const { sectionId } = req.params;

    const moduleContent = await TTFModuleContent.findOne({ moduleNumber }).lean();
    if (!moduleContent) return res.status(404).json({ error: 'Module not found.' });

    const sectionExists = moduleContent.sections.some(s => s.sectionId === sectionId);
    if (!sectionExists) return res.status(404).json({ error: 'Section not found.' });

    const enrollment = await TTFEnrollment.findOne({ userId, status: { $nin: ['withdrawn'] } });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });

    if (!allPrereqsMet(enrollment.moduleProgress || {}, moduleNumber)) {
      return res.status(403).json({ error: 'Module prerequisites not met.' });
    }

    const moduleKey = `module${moduleNumber}`;
    const currentProgress = enrollment.moduleProgress?.[moduleKey] || {};
    const completedSections = new Set(currentProgress.sectionsCompleted || []);
    completedSections.add(sectionId);

    const allSections = moduleContent.sections.map(s => s.sectionId);
    const moduleCompleted = allSections.every(id => completedSections.has(id));

    const updateKey = `moduleProgress.${moduleKey}`;
    await TTFEnrollment.findByIdAndUpdate(enrollment._id, {
      [`${updateKey}.sectionsCompleted`]: Array.from(completedSections),
      [`${updateKey}.completed`]: moduleCompleted,
      ...(moduleCompleted && !currentProgress.completed
        ? { [`${updateKey}.completedDate`]: new Date() }
        : {}),
      status: 'in-progress',
    });

    res.json({
      success: true,
      sectionCompleted: sectionId,
      moduleCompleted,
      completedSections: Array.from(completedSections),
    });
  } catch (err) {
    logger.error('[TTF] completeSection error', { err: err.message });
    res.status(500).json({ error: 'Failed to mark section complete.' });
  }
}

/**
 * POST /api/ttf/module/:moduleNumber/quiz/submit
 */
async function submitQuiz(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const moduleNumber = parseInt(req.params.moduleNumber, 10);
    const { sectionId, answers } = req.body; // answers: { questionId: selectedAnswer }

    if (!sectionId || !answers || typeof answers !== 'object') {
      return res.status(400).json({ error: 'sectionId and answers required.' });
    }

    const moduleContent = await TTFModuleContent.findOne({ moduleNumber }).lean();
    if (!moduleContent) return res.status(404).json({ error: 'Module not found.' });

    const section = moduleContent.sections.find(s => s.sectionId === sectionId);
    if (!section || section.contentType !== 'quiz') {
      return res.status(400).json({ error: 'Section is not a quiz.' });
    }

    const quiz = section.quiz;
    const results = [];
    let correct = 0;

    for (const q of quiz.questions) {
      const userAnswer = answers[q.questionId];
      const isCorrect  = userAnswer === q.correctAnswer;
      if (isCorrect) correct++;
      results.push({
        questionId:     q.questionId,
        correct:        isCorrect,
        correctAnswer:  q.correctAnswer,
        userAnswer,
        explanation:    q.explanation,
      });
    }

    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= (quiz.passingScore || 80);

    // If passed, mark the section complete
    if (passed) {
      const enrollment = await TTFEnrollment.findOne({ userId, status: { $nin: ['withdrawn'] } });
      if (enrollment && allPrereqsMet(enrollment.moduleProgress || {}, moduleNumber)) {
        const moduleKey = `module${moduleNumber}`;
        const currentProgress = enrollment.moduleProgress?.[moduleKey] || {};
        const completedSections = new Set(currentProgress.sectionsCompleted || []);
        completedSections.add(sectionId);

        const allSections = moduleContent.sections.map(s => s.sectionId);
        const moduleCompleted = allSections.every(id => completedSections.has(id));

        await TTFEnrollment.findByIdAndUpdate(enrollment._id, {
          [`moduleProgress.${moduleKey}.sectionsCompleted`]: Array.from(completedSections),
          [`moduleProgress.${moduleKey}.completed`]: moduleCompleted,
          [`moduleProgress.${moduleKey}.score`]: score,
          ...(moduleCompleted && !currentProgress.completed
            ? { [`moduleProgress.${moduleKey}.completedDate`]: new Date() }
            : {}),
        });
      }
    }

    res.json({ score, passed, passingScore: quiz.passingScore || 80, results });
  } catch (err) {
    logger.error('[TTF] submitQuiz error', { err: err.message });
    res.status(500).json({ error: 'Failed to submit quiz.' });
  }
}

// ── Practicum ─────────────────────────────────────────────────────────────────

/**
 * GET /api/ttf/practicum
 */
async function getPracticum(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const enrollment = await TTFEnrollment.findOne(
      { userId, status: { $nin: ['withdrawn'] } },
      { practicumSessions: 1, moduleProgress: 1 }
    ).lean();

    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });

    res.json({ practicumSessions: enrollment.practicumSessions || [] });
  } catch (err) {
    logger.error('[TTF] getPracticum error', { err: err.message });
    res.status(500).json({ error: 'Failed to load practicum.' });
  }
}

/**
 * POST /api/ttf/practicum/submit
 */
async function submitPracticum(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const {
      sessionNumber,
      videoUrl = '',
      reflectionNotes = '',
      protocol = '',
    } = req.body;

    const num = parseInt(sessionNumber, 10);
    if (!num || num < 1 || num > 10) {
      return res.status(400).json({ error: 'Valid sessionNumber (1-10) required.' });
    }
    if (!videoUrl && !reflectionNotes) {
      return res.status(400).json({ error: 'videoUrl or reflectionNotes required.' });
    }

    const enrollment = await TTFEnrollment.findOne({ userId, status: { $nin: ['withdrawn'] } });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });

    // Check module 5 is completed
    if (!enrollment.moduleProgress?.module5?.completed) {
      return res.status(403).json({ error: 'Module 5 must be completed before submitting practicum.' });
    }

    // Prevent duplicate submission for the same session number
    const alreadySubmitted = (enrollment.practicumSessions || []).some(
      s => s.sessionNumber === num
    );
    if (alreadySubmitted) {
      return res.status(409).json({ error: `Session ${num} already submitted.` });
    }

    const session = {
      sessionNumber: num,
      videoUrl,
      reflectionNotes,
      protocol,
      submittedDate: new Date(),
      approved: false,
    };

    await TTFEnrollment.findByIdAndUpdate(enrollment._id, {
      $push: { practicumSessions: session },
    });

    logger.info('[TTF] Practicum submitted', { userId, sessionNumber: num });
    res.status(201).json({ success: true, session });
  } catch (err) {
    logger.error('[TTF] submitPracticum error', { err: err.message });
    res.status(500).json({ error: 'Failed to submit practicum.' });
  }
}

/**
 * POST /api/ttf/practicum/:sessionId/review  [Admin only]
 */
async function reviewPracticum(req, res) {
  try {
    const { sessionId } = req.params;
    const { supervisorFeedback = '', approved = false, needsRevision = false } = req.body;

    const enrollment = await TTFEnrollment.findOne({
      'practicumSessions._id': new mongoose.Types.ObjectId(sessionId),
    });
    if (!enrollment) return res.status(404).json({ error: 'Session not found.' });

    await TTFEnrollment.findOneAndUpdate(
      { 'practicumSessions._id': new mongoose.Types.ObjectId(sessionId) },
      {
        $set: {
          'practicumSessions.$.supervisorFeedback': supervisorFeedback,
          'practicumSessions.$.approved': approved,
          'practicumSessions.$.needsRevision': needsRevision,
          'practicumSessions.$.supervisorId': getUserId(req),
        },
      }
    );

    logger.info('[TTF] Practicum reviewed', { sessionId, approved });
    res.json({ success: true });
  } catch (err) {
    logger.error('[TTF] reviewPracticum error', { err: err.message });
    res.status(500).json({ error: 'Failed to submit review.' });
  }
}

// ── Assessment ────────────────────────────────────────────────────────────────

/**
 * GET /api/ttf/assessment
 */
async function getAssessment(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const enrollment = await TTFEnrollment.findOne(
      { userId, status: { $nin: ['withdrawn'] } },
      { competencyAssessment: 1, moduleProgress: 1, practicumSessions: 1, personalAssessmentCompleted: 1 }
    ).lean();
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });

    const competencies = await TTFCompetency.find().sort({ orderIndex: 1 }).lean();

    const allModulesDone = MODULE_KEYS.every(k => enrollment.moduleProgress?.[k]?.completed);
    const approvedPracticum = (enrollment.practicumSessions || []).filter(s => s.approved).length;
    const prereqsMet = allModulesDone &&
                       enrollment.personalAssessmentCompleted &&
                       approvedPracticum >= 3;

    res.json({
      assessment: enrollment.competencyAssessment || {},
      competencies,
      prereqsMet,
      prereqDetail: {
        allModulesDone,
        personalAssessmentCompleted: enrollment.personalAssessmentCompleted,
        approvedPracticum,
      },
    });
  } catch (err) {
    logger.error('[TTF] getAssessment error', { err: err.message });
    res.status(500).json({ error: 'Failed to load assessment.' });
  }
}

/**
 * POST /api/ttf/assessment/submit-portfolio
 */
async function submitPortfolio(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const { portfolioUrls = [] } = req.body;
    if (!Array.isArray(portfolioUrls) || portfolioUrls.length === 0) {
      return res.status(400).json({ error: 'portfolioUrls array required.' });
    }
    // Validate each URL is a string with an expected HTTPS URL shape
    const safeUrls = portfolioUrls
      .filter(u => typeof u === 'string')
      .map(u => u.slice(0, 2048))
      .filter(u => /^https:\/\//i.test(u));
    if (safeUrls.length === 0) {
      return res.status(400).json({ error: 'At least one valid HTTPS URL is required.' });
    }

    const enrollment = await TTFEnrollment.findOne({ userId, status: { $nin: ['withdrawn'] } });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });

    await TTFEnrollment.findByIdAndUpdate(enrollment._id, {
      'competencyAssessment.portfolioUrls': safeUrls,
    });

    logger.info('[TTF] Portfolio submitted', { userId });
    res.json({ success: true });
  } catch (err) {
    logger.error('[TTF] submitPortfolio error', { err: err.message });
    res.status(500).json({ error: 'Failed to submit portfolio.' });
  }
}

/**
 * POST /api/ttf/assessment/score  [Admin/Assessor only]
 * Body: { userId, scores: { competencyId: score }, feedback }
 */
async function scoreAssessment(req, res) {
  try {
    const { targetUserId, scores, feedback = '' } = req.body;
    if (!targetUserId || !scores) {
      return res.status(400).json({ error: 'targetUserId and scores required.' });
    }
    // Validate targetUserId is a valid ObjectId to prevent NoSQL injection
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ error: 'Invalid targetUserId.' });
    }
    // Sanitize feedback to a plain string
    const safeFeedback = typeof feedback === 'string' ? feedback.slice(0, 2000) : '';

    const values = Object.values(scores).map(Number).filter(v => !isNaN(v));
    if (values.length === 0) return res.status(400).json({ error: 'Scores required.' });

    const average = values.reduce((a, b) => a + b, 0) / values.length;
    const overallScore = Math.round((average / 4) * 100); // convert 1-4 scale to 0-100
    const passed = average >= 3.0; // ≥85% on a 1-4 scale

    let targetObjectId;
    try {
      targetObjectId = new mongoose.Types.ObjectId(targetUserId);
    } catch {
      return res.status(400).json({ error: 'Invalid targetUserId format.' });
    }

    const enrollment = await TTFEnrollment.findOne({
      userId: targetObjectId,
      status: { $nin: ['withdrawn'] },
    });
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });

    await TTFEnrollment.findByIdAndUpdate(enrollment._id, {
      'competencyAssessment.completed':    true,
      'competencyAssessment.completedDate': new Date(),
      'competencyAssessment.score':        overallScore,
      'competencyAssessment.assessorId':   getUserId(req),
      'competencyAssessment.feedback':     safeFeedback,
    });

    let certData = null;
    if (passed) {
      certData = await issueCertification(enrollment._id);
    }

    logger.info('[TTF] Assessment scored', { targetUserId, overallScore, passed });
    res.json({ success: true, overallScore, passed, certification: certData });
  } catch (err) {
    logger.error('[TTF] scoreAssessment error', { err: err.message });
    res.status(500).json({ error: 'Failed to score assessment.' });
  }
}

// ── Certification ─────────────────────────────────────────────────────────────

async function issueCertification(enrollmentId) {
  const credentialId = generateCredentialId();
  const now = new Date();
  const expiry = new Date(now);
  expiry.setFullYear(expiry.getFullYear() + 1);

  await TTFEnrollment.findByIdAndUpdate(enrollmentId, {
    certificationIssued:     true,
    certificationIssuedDate: now,
    certificationExpiryDate: expiry,
    credentialId,
    status: 'certified',
  });

  return { credentialId, issuedDate: now, expiryDate: expiry };
}

/**
 * GET /api/ttf/certificate
 */
async function getCertificate(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    const enrollment = await TTFEnrollment.findOne(
      { userId, certificationIssued: true },
      {
        userName: 1, credentialId: 1,
        certificationIssuedDate: 1, certificationExpiryDate: 1, status: 1,
      }
    ).lean();

    if (!enrollment) return res.status(404).json({ error: 'No certification found.' });

    res.json({ certificate: enrollment });
  } catch (err) {
    logger.error('[TTF] getCertificate error', { err: err.message });
    res.status(500).json({ error: 'Failed to load certificate.' });
  }
}

/**
 * GET /api/ttf/verify/:credentialId  (public)
 */
async function verifyCertificate(req, res) {
  try {
    const { credentialId } = req.params;
    if (!credentialId || !/^TTF-\d{4}-[A-F0-9]{10}$/.test(credentialId)) {
      return res.status(400).json({ error: 'Invalid credential ID format.' });
    }

    const enrollment = await TTFEnrollment.findOne(
      { credentialId },
      { userName: 1, credentialId: 1, certificationIssuedDate: 1, certificationExpiryDate: 1, status: 1 }
    ).lean();

    if (!enrollment) {
      return res.status(404).json({ valid: false, error: 'Credential not found.' });
    }

    const now = new Date();
    const isActive = enrollment.certificationExpiryDate > now && enrollment.status === 'certified';

    res.json({
      valid: true,
      active: isActive,
      holder: enrollment.userName || 'TTF Certified Facilitator',
      credentialId: enrollment.credentialId,
      issuedDate:   enrollment.certificationIssuedDate,
      expiryDate:   enrollment.certificationExpiryDate,
      status:       isActive ? 'Active' : 'Expired',
    });
  } catch (err) {
    logger.error('[TTF] verifyCertificate error', { err: err.message });
    res.status(500).json({ error: 'Failed to verify credential.' });
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/ttf/admin/cohorts
 */
async function adminGetCohorts(req, res) {
  try {
    const cohorts = await TTFCohort.find().sort({ startDate: -1 }).lean();
    const counts = await TTFEnrollment.aggregate([
      { $group: { _id: '$cohortId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    for (const c of counts) {
      if (c._id) countMap[c._id.toString()] = c.count;
    }
    const result = cohorts.map(c => ({
      ...c,
      enrollmentCount: countMap[c._id.toString()] || 0,
    }));
    res.json({ cohorts: result });
  } catch (err) {
    logger.error('[TTF] adminGetCohorts error', { err: err.message });
    res.status(500).json({ error: 'Failed to load cohorts.' });
  }
}

/**
 * POST /api/ttf/admin/cohort
 */
async function adminCreateCohort(req, res) {
  try {
    const { cohortName, startDate, endDate, maxCapacity = 30, facilitatorId, description } = req.body;
    if (!cohortName || !startDate || !endDate) {
      return res.status(400).json({ error: 'cohortName, startDate, endDate required.' });
    }
    const cohort = await TTFCohort.create({
      cohortName,
      startDate: new Date(startDate),
      endDate:   new Date(endDate),
      maxCapacity,
      facilitatorId: facilitatorId || null,
      description: description || '',
    });
    res.status(201).json({ cohort });
  } catch (err) {
    logger.error('[TTF] adminCreateCohort error', { err: err.message });
    res.status(500).json({ error: 'Failed to create cohort.' });
  }
}

/**
 * GET /api/ttf/admin/students
 */
async function adminGetStudents(req, res) {
  try {
    const page     = Math.max(1, parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(100, parseInt(req.query.pageSize, 10) || 20);
    const skip     = (page - 1) * pageSize;

    const ALLOWED_STATUSES = ['enrolled', 'in-progress', 'certified', 'expired', 'withdrawn'];
    const statusFilter   = (req.query.status && ALLOWED_STATUSES.includes(req.query.status))
      ? req.query.status : null;
    const cohortIdFilter = (req.query.cohortId && mongoose.Types.ObjectId.isValid(req.query.cohortId))
      ? new mongoose.Types.ObjectId(req.query.cohortId) : null;

    // Build a static query — no user-controlled keys, only validated values
    const baseQuery = { status: { $nin: ['withdrawn'] } };
    if (statusFilter)   baseQuery.status    = statusFilter;
    if (cohortIdFilter) baseQuery.cohortId  = cohortIdFilter;

    const [enrollments, total] = await Promise.all([
      TTFEnrollment.find(baseQuery)
        .sort({ enrollmentDate: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
      TTFEnrollment.countDocuments(baseQuery),
    ]);

    res.json({ enrollments, total, page, pageSize });
  } catch (err) {
    logger.error('[TTF] adminGetStudents error', { err: err.message });
    res.status(500).json({ error: 'Failed to load students.' });
  }
}

/**
 * GET /api/ttf/admin/practicum-queue
 */
async function adminPracticumQueue(req, res) {
  try {
    const enrollments = await TTFEnrollment.find(
      { 'practicumSessions.approved': false, 'practicumSessions.needsRevision': false },
      { userId: 1, userName: 1, userEmail: 1, practicumSessions: 1 }
    ).lean();

    const queue = [];
    for (const e of enrollments) {
      for (const s of e.practicumSessions || []) {
        if (!s.approved && !s.needsRevision) {
          queue.push({ enrollmentId: e._id, userId: e.userId, userName: e.userName, userEmail: e.userEmail, session: s });
        }
      }
    }

    res.json({ queue });
  } catch (err) {
    logger.error('[TTF] adminPracticumQueue error', { err: err.message });
    res.status(500).json({ error: 'Failed to load practicum queue.' });
  }
}

/**
 * GET /api/ttf/admin/analytics
 */
async function adminAnalytics(req, res) {
  try {
    const [total, certified, inProgress, enrolled] = await Promise.all([
      TTFEnrollment.countDocuments(),
      TTFEnrollment.countDocuments({ status: 'certified' }),
      TTFEnrollment.countDocuments({ status: 'in-progress' }),
      TTFEnrollment.countDocuments({ status: 'enrolled' }),
    ]);

    const completionRate = total > 0 ? Math.round((certified / total) * 100) : 0;

    res.json({ total, certified, inProgress, enrolled, completionRate });
  } catch (err) {
    logger.error('[TTF] adminAnalytics error', { err: err.message });
    res.status(500).json({ error: 'Failed to load analytics.' });
  }
}

/**
 * PUT /api/ttf/admin/enrollment/:enrollmentId
 * Generic admin override of enrollment fields.
 */
async function adminUpdateEnrollment(req, res) {
  try {
    const { enrollmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(enrollmentId)) {
      return res.status(400).json({ error: 'Invalid enrollmentId.' });
    }
    const ALLOWED = ['status', 'paymentStatus', 'personalAssessmentCompleted', 'cohortId'];
    const ALLOWED_STATUS_VALUES = ['enrolled', 'in-progress', 'certified', 'expired', 'withdrawn'];
    const ALLOWED_PAYMENT_VALUES = ['pending', 'paid', 'refunded', 'waived'];
    const update = {};
    for (const field of ALLOWED) {
      if (req.body[field] !== undefined) {
        if (field === 'status' && !ALLOWED_STATUS_VALUES.includes(req.body[field])) continue;
        if (field === 'paymentStatus' && !ALLOWED_PAYMENT_VALUES.includes(req.body[field])) continue;
        if (field === 'personalAssessmentCompleted') {
          update[field] = !!req.body[field];
          continue;
        }
        if (field === 'cohortId') {
          if (!mongoose.Types.ObjectId.isValid(req.body[field])) continue;
          update[field] = new mongoose.Types.ObjectId(req.body[field]);
          continue;
        }
        update[field] = req.body[field];
      }
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }
    const updated = await TTFEnrollment.findByIdAndUpdate(enrollmentId, update, { new: true }).lean();
    res.json({ enrollment: updated });
  } catch (err) {
    logger.error('[TTF] adminUpdateEnrollment error', { err: err.message });
    res.status(500).json({ error: 'Failed to update enrollment.' });
  }
}

/**
 * POST /api/ttf/assessment/mark-personal-complete
 * Called when the user completes the personal resilience assessment (from /quiz).
 */
async function markPersonalAssessmentComplete(req, res) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Not authenticated.' });

    await TTFEnrollment.findOneAndUpdate(
      { userId, status: { $nin: ['withdrawn'] } },
      { personalAssessmentCompleted: true }
    );
    res.json({ success: true });
  } catch (err) {
    logger.error('[TTF] markPersonalAssessmentComplete error', { err: err.message });
    res.status(500).json({ error: 'Failed to update assessment status.' });
  }
}

module.exports = {
  createEnrollment,
  createPaymentIntent,
  confirmPayment,
  getDashboard,
  getModules,
  getModule,
  completeSection,
  submitQuiz,
  getPracticum,
  submitPracticum,
  reviewPracticum,
  getAssessment,
  submitPortfolio,
  scoreAssessment,
  getCertificate,
  verifyCertificate,
  adminGetCohorts,
  adminCreateCohort,
  adminGetStudents,
  adminPracticumQueue,
  adminAnalytics,
  adminUpdateEnrollment,
  markPersonalAssessmentComplete,
};
