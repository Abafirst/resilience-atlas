'use strict';

/**
 * TTF (Train the Facilitator) API routes.
 * Base: /api/ttf
 */

const express   = require('express');
const rateLimit = require('express-rate-limit');
const router    = express.Router();

const { authenticateJWT, optionalJWT } = require('../middleware/auth');
const ctrl = require('../controllers/ttfController');

// ── Rate limiting ─────────────────────────────────────────────────────────────

const standardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      60,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
});

const enrollLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many enrollment attempts. Please try again later.' },
});

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      120,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests.' },
});

// ── Simple admin guard ────────────────────────────────────────────────────────
// Checks that the user's email is in the TTF_ADMIN_EMAILS env var (comma-separated).
function requireTTFAdmin(req, res, next) {
  const adminEmails = (process.env.TTF_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  const userEmail   = (req.user?.email || '').toLowerCase();
  if (!userEmail || !adminEmails.includes(userEmail)) {
    return res.status(403).json({ error: 'TTF admin access required.' });
  }
  next();
}

// ── Public routes ─────────────────────────────────────────────────────────────

// Public credential verification
router.get('/verify/:credentialId', standardLimiter, ctrl.verifyCertificate);

// Module metadata (no auth required so marketing/landing page can show structure)
router.get('/modules', standardLimiter, optionalJWT, ctrl.getModules);

// ── Authenticated routes ──────────────────────────────────────────────────────

// Enrollment & payment
router.post('/enroll',          enrollLimiter,   authenticateJWT, ctrl.createEnrollment);
router.post('/payment-intent',  enrollLimiter,   authenticateJWT, ctrl.createPaymentIntent);
// Stripe webhook — uses raw body, no JWT
router.post('/payment-confirm', standardLimiter, ctrl.confirmPayment);

// Dashboard
router.get('/dashboard',        standardLimiter, authenticateJWT, ctrl.getDashboard);

// Module delivery
router.get('/module/:moduleNumber',                                       standardLimiter, authenticateJWT, ctrl.getModule);
router.post('/module/:moduleNumber/section/:sectionId/complete',          standardLimiter, authenticateJWT, ctrl.completeSection);
router.post('/module/:moduleNumber/quiz/submit',                          standardLimiter, authenticateJWT, ctrl.submitQuiz);

// Practicum
router.get('/practicum',                          standardLimiter, authenticateJWT, ctrl.getPracticum);
router.post('/practicum/submit',                  standardLimiter, authenticateJWT, ctrl.submitPracticum);

// Assessment
router.get('/assessment',                         standardLimiter, authenticateJWT, ctrl.getAssessment);
router.post('/assessment/submit-portfolio',       standardLimiter, authenticateJWT, ctrl.submitPortfolio);
router.post('/assessment/mark-personal-complete', standardLimiter, authenticateJWT, ctrl.markPersonalAssessmentComplete);

// Certificate
router.get('/certificate',                        standardLimiter, authenticateJWT, ctrl.getCertificate);

// ── Admin / Supervisor routes (require admin role) ────────────────────────────

router.get('/admin/cohorts',                      adminLimiter, authenticateJWT, requireTTFAdmin, ctrl.adminGetCohorts);
router.post('/admin/cohort',                      adminLimiter, authenticateJWT, requireTTFAdmin, ctrl.adminCreateCohort);
router.get('/admin/students',                     adminLimiter, authenticateJWT, requireTTFAdmin, ctrl.adminGetStudents);
router.get('/admin/practicum-queue',              adminLimiter, authenticateJWT, requireTTFAdmin, ctrl.adminPracticumQueue);
router.get('/admin/analytics',                    adminLimiter, authenticateJWT, requireTTFAdmin, ctrl.adminAnalytics);
router.put('/admin/enrollment/:enrollmentId',     adminLimiter, authenticateJWT, requireTTFAdmin, ctrl.adminUpdateEnrollment);
router.post('/practicum/:sessionId/review',       adminLimiter, authenticateJWT, requireTTFAdmin, ctrl.reviewPracticum);
router.post('/assessment/score',                  adminLimiter, authenticateJWT, requireTTFAdmin, ctrl.scoreAssessment);

module.exports = router;
