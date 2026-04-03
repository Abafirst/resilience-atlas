'use strict';

/**
 * assessmentAccessControl.js — Utility functions for per-assessment PDF access.
 *
 * Access model:
 *   - Taking the assessment:  FREE for all users.
 *   - Viewing brief results:  FREE for all users.
 *   - Downloading the PDF:    Requires a paid unlock:
 *       Atlas Starter  ($9.99)  → unlocks ONE specific assessment's PDF (permanent).
 *       Atlas Navigator($49.99) → unlocks ALL assessments' PDFs (permanent, lifetime).
 *   - Re-downloading:         Always free for previously unlocked reports.
 *
 * Unlock status is determined by checking the `Purchase` collection:
 *   - Navigator/Premium/Teams tiers → blanket (all-assessment) access.
 *   - Atlas Starter → per-assessment access via `assessmentData` hash match.
 */

const crypto    = require('crypto');
const Purchase  = require('../models/Purchase');
const User      = require('../models/User');
const logger    = require('../utils/logger');

/**
 * Tiers that grant blanket (all-assessment) PDF access.
 * Any completed purchase in one of these tiers means the user can download
 * PDFs for every assessment they have taken.
 */
const BLANKET_ACCESS_TIERS = new Set([
    'atlas-navigator',
    'atlas-premium',
    'starter',
    'pro',
    'enterprise',
]);

/**
 * Build the same deterministic MD5 hash used by /api/report/generate to
 * identify a specific assessment attempt.
 *
 * @param {string|number} overall
 * @param {string}        dominantType
 * @param {string}        scoresJson  JSON-stringified scores object
 * @returns {string} 32-character hex hash
 */
function buildAssessmentHash(overall, dominantType, scoresJson) {
    return crypto
        .createHash('md5')
        .update(`${overall}|${dominantType || ''}|${scoresJson}`)
        .digest('hex');
}

/**
 * Brief results are always free — every user can view them.
 * @returns {boolean}
 */
function canViewBriefResults() {
    return true;
}

/**
 * Check whether an email address can download the PDF for a specific assessment.
 *
 * @param {string} email         Normalised (lowercase, trimmed) user email.
 * @param {string} assessmentHash  MD5 hash of the assessment (from buildAssessmentHash).
 * @returns {Promise<{ allowed: boolean, reason: string, unlockOptions: Array }>}
 */
async function canDownloadReport(email, assessmentHash) {
    const unlockOptions = getUnlockOptions();

    try {
        const cleanEmail = String(email || '').toLowerCase().trim();
        if (!cleanEmail) {
            return { allowed: false, reason: 'Email required', unlockOptions };
        }

        // Fetch all completed purchases for this email.
        const purchases = await Purchase.find({
            email:  cleanEmail,
            status: 'completed',
        }).lean();

        // 1. Navigator / blanket-access tiers → allow everything.
        const hasBlanketAccess = purchases.some((p) => BLANKET_ACCESS_TIERS.has(p.tier));
        if (hasBlanketAccess) {
            return { allowed: true, reason: 'atlas-navigator', unlockOptions: [] };
        }

        // 2. Atlas Starter → per-assessment hash match.
        if (assessmentHash) {
            const isUnlocked = purchases.some((p) => {
                if (p.tier !== 'atlas-starter') return false;
                if (!p.assessmentData || !p.assessmentData.scores) return false;
                const pHash = buildAssessmentHash(
                    String(p.assessmentData.overall),
                    p.assessmentData.dominantType || '',
                    JSON.stringify(p.assessmentData.scores)
                );
                return pHash === assessmentHash;
            });
            if (isUnlocked) {
                return { allowed: true, reason: 'atlas-starter', unlockOptions: [] };
            }
        }

        // 3. Fallback: check User model flags (admin grants / migrations).
        try {
            const user = await User.findOne({ email: cleanEmail })
                .select('purchasedDeepReport atlasPremium')
                .lean();
            if (user && (user.purchasedDeepReport || user.atlasPremium)) {
                return { allowed: true, reason: 'user-flag', unlockOptions: [] };
            }
        } catch (userErr) {
            logger.warn('[assessmentAccessControl] User fallback check failed:', userErr.message);
        }

        return { allowed: false, reason: 'no-purchase', unlockOptions };
    } catch (err) {
        logger.error('[assessmentAccessControl] canDownloadReport error:', err.message);
        throw err;
    }
}

/**
 * Returns the available unlock options for any assessment.
 * These are presented to the user after they view their brief results.
 *
 * @returns {Array<{ tier: string, price: number, label: string, type: string, description: string }>}
 */
function getUnlockOptions() {
    return [
        {
            tier:        'atlas-starter',
            price:       999,  // $9.99 in cents
            label:       'Atlas Starter — $9.99',
            type:        'single-report',
            description: 'Unlock this report only. Pay $9.99 for each new report you want to download.',
        },
        {
            tier:        'atlas-navigator',
            price:       4999, // $49.99 in cents
            label:       'Atlas Navigator — $49.99',
            type:        'unlimited',
            description: 'Lifetime access. Unlock unlimited reports and gamification with a one-time $49.99 payment.',
        },
    ];
}

/**
 * Check whether an email address holds an Atlas Navigator (blanket) purchase.
 *
 * @param {string} email
 * @returns {Promise<boolean>}
 */
async function hasUnlimitedAccess(email) {
    try {
        const cleanEmail = String(email || '').toLowerCase().trim();
        if (!cleanEmail) return false;
        const purchase = await Purchase.findOne({
            email:  cleanEmail,
            tier:   { $in: [...BLANKET_ACCESS_TIERS] },
            status: 'completed',
        });
        return Boolean(purchase);
    } catch (err) {
        logger.error('[assessmentAccessControl] hasUnlimitedAccess error:', err.message);
        return false;
    }
}

/**
 * Return the list of assessment hashes that a Starter user has unlocked.
 * Navigator users have blanket access so this list is not meaningful for them.
 *
 * @param {string} email
 * @returns {Promise<string[]>} Array of assessment MD5 hashes.
 */
async function getUnlockedReportHashes(email) {
    try {
        const cleanEmail = String(email || '').toLowerCase().trim();
        if (!cleanEmail) return [];

        const purchases = await Purchase.find({
            email:  cleanEmail,
            tier:   'atlas-starter',
            status: 'completed',
        }).lean();

        return purchases
            .filter((p) => p.assessmentData && p.assessmentData.scores)
            .map((p) =>
                buildAssessmentHash(
                    String(p.assessmentData.overall),
                    p.assessmentData.dominantType || '',
                    JSON.stringify(p.assessmentData.scores)
                )
            );
    } catch (err) {
        logger.error('[assessmentAccessControl] getUnlockedReportHashes error:', err.message);
        return [];
    }
}

module.exports = {
    canViewBriefResults,
    canDownloadReport,
    getUnlockOptions,
    hasUnlimitedAccess,
    getUnlockedReportHashes,
    buildAssessmentHash,
    BLANKET_ACCESS_TIERS,
};
