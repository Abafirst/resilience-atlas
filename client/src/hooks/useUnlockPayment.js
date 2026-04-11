import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement } from '@stripe/react-stripe-js';
import { apiUrl } from '../api/baseUrl.js';

/** Placeholder key used in development environments without real Stripe credentials. */
const STRIPE_PLACEHOLDER_KEY = 'pk_test_placeholder';

/**
 * useUnlockPayment — manages the inline Stripe payment flow for unlocking a
 * PDF report from the UnlockReportModal.
 *
 * Flow:
 *   1. Call selectTier(tier) to create a Stripe payment intent and receive a
 *      client secret.
 *   2. The component mounts a <CardElement> inside a Stripe <Elements> provider
 *      using the clientSecret.
 *   3. Call confirmPayment(stripe, elements, assessmentData) once the user
 *      submits their card details.
 *   4. On success, onUnlockSuccess() is invoked.
 *
 * @param {object} options
 * @param {object|null} options.results        — assessment results object
 * @param {function}    options.onUnlockSuccess — called after confirmed payment
 */
export function useUnlockPayment({ results, onUnlockSuccess }) {
    const [stripePromise, setStripePromise] = useState(null);
    const [stripeLoadError, setStripeLoadError] = useState('');

    // ── Payment-intent state ─────────────────────────────────────────────────
    const [selectedTier, setSelectedTier]     = useState(null);
    const [clientSecret, setClientSecret]     = useState(null);
    const [paymentIntentId, setPaymentIntentId] = useState(null);
    const [loading, setLoading]               = useState(false);
    const [error, setError]                   = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // ── Load Stripe publishable key once ─────────────────────────────────────
    useEffect(() => {
        fetch(apiUrl('/config'))
            .then((r) => r.json())
            .then(({ stripePublishableKey }) => {
                if (!stripePublishableKey || stripePublishableKey === STRIPE_PLACEHOLDER_KEY) {
                    setStripeLoadError('Payment system is not configured. Please contact support.');
                    return;
                }
                setStripePromise(loadStripe(stripePublishableKey));
            })
            .catch(() => {
                setStripeLoadError('Unable to load payment configuration. Please try again later.');
            });
    }, []);

    // ── Step 1: Select tier and create payment intent ─────────────────────────
    const selectTier = useCallback(async (tier) => {
        setError('');
        setLoading(true);
        setSelectedTier(tier);
        try {
            const email = (results && results.email) || localStorage.getItem('resilience_email') || '';
            if (!email) {
                throw new Error('Email not found. Please complete the assessment first.');
            }

            const body = {
                tier,
                email,
                ...(results && {
                    overall:     results.overall,
                    dominantType: results.dominantType,
                    scores:      results.scores,
                }),
            };

            const res  = await fetch('/api/assessment/unlock-payment', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok || data.error) throw new Error(data.error || 'Failed to create payment.');

            setClientSecret(data.clientSecret);
            setPaymentIntentId(data.paymentIntentId);
        } catch (err) {
            setError(err.message || 'Could not start payment. Please try again.');
            setSelectedTier(null);
        } finally {
            setLoading(false);
        }
    }, [results]);

    // ── Step 2: Confirm payment with Stripe card element ─────────────────────
    const confirmPayment = useCallback(async (stripe, elements) => {
        if (!stripe || !elements || !clientSecret) return;
        setError('');
        setLoading(true);
        try {
            const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: { card: elements.getElement(CardElement) },
            });
            if (stripeError) throw new Error(stripeError.message);

            // Notify backend to mark purchase as completed.
            const email = (results && results.email) || localStorage.getItem('resilience_email') || '';
            const confirmBody = {
                paymentIntentId,
                email,
                tier: selectedTier,
                ...(results && {
                    overall:     results.overall,
                    dominantType: results.dominantType,
                    scores:      results.scores,
                }),
            };
            const confirmRes  = await fetch('/api/assessment/unlock-payment/confirm', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(confirmBody),
            });
            const confirmData = await confirmRes.json();
            if (!confirmRes.ok || confirmData.error) {
                throw new Error(confirmData.error || 'Payment recorded but unlock failed. Please contact support.');
            }

            setPaymentSuccess(true);
            if (onUnlockSuccess) onUnlockSuccess(selectedTier);
        } catch (err) {
            setError(err.message || 'Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [clientSecret, paymentIntentId, selectedTier, results, onUnlockSuccess]);

    // ── Reset state (call when modal closes) ─────────────────────────────────
    const reset = useCallback(() => {
        setSelectedTier(null);
        setClientSecret(null);
        setPaymentIntentId(null);
        setLoading(false);
        setError('');
        setPaymentSuccess(false);
    }, []);

    /** Go back to tier selection from the payment form. */
    const backToTiers = useCallback(() => {
        setSelectedTier(null);
        setClientSecret(null);
        setPaymentIntentId(null);
        setError('');
    }, []);

    return {
        stripePromise,
        stripeLoadError,
        selectedTier,
        clientSecret,
        loading,
        error,
        paymentSuccess,
        selectTier,
        confirmPayment,
        reset,
        backToTiers,
    };
}
