import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPayment } from '../api.js';

const styles = {
  container: { minHeight: '100vh', background: '#f5f7fa', padding: '40px 20px' },
  header: { maxWidth: 560, margin: '0 auto 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 22, fontWeight: 700, color: '#1a1a2e' },
  logout: { background: 'none', border: '1px solid #ddd', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', color: '#666', fontSize: 14 },
  card: { background: '#fff', borderRadius: 12, padding: 40, maxWidth: 560, margin: '0 auto', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  title: { fontSize: 24, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 },
  subtitle: { color: '#666', marginBottom: 28, fontSize: 14 },
  label: { display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 13, color: '#444' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginBottom: 16, outline: 'none' },
  select: { width: '100%', padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: 15, marginBottom: 16, background: '#fff' },
  cardBox: { border: '1px solid #ddd', borderRadius: 8, padding: '12px 14px', marginBottom: 24 },
  btn: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  error: { color: '#dc2626', fontSize: 13, marginBottom: 12, padding: '8px 12px', background: '#fef2f2', borderRadius: 6 },
  divider: { borderBottom: '1px solid #f0f0f0', margin: '20px 0' },
  summary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  summaryLabel: { color: '#666', fontSize: 15 },
  summaryValue: { fontWeight: 700, fontSize: 20, color: '#1a1a2e' },
  badge: { display: 'inline-block', background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontSize: 12, marginLeft: 8 },
};

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: { fontSize: '15px', color: '#333', '::placeholder': { color: '#aaa' } },
    invalid: { color: '#dc2626' },
  },
};

function CheckoutForm({ token, amount, currency, description, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setError('');
    setLoading(true);
    try {
      const { clientSecret, paymentIntentId } = await createPayment(token, amount, currency, description);
      const cardEl = elements.getElement(CardElement);
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardEl },
      });
      if (stripeError) throw new Error(stripeError.message);
      onSuccess({ paymentIntentId, paymentIntent, amount, currency });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label style={styles.label}>Card Details</label>
      <div style={styles.cardBox}>
        <CardElement options={CARD_ELEMENT_OPTIONS} />
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.summary}>
        <span style={styles.summaryLabel}>Total</span>
        <span style={styles.summaryValue}>
          {currency.toUpperCase()} {Number(amount).toFixed(2)}
          <span style={styles.badge}>Secure</span>
        </span>
      </div>
      <button
        style={{ ...styles.btn, ...((!stripe || loading) ? styles.btnDisabled : {}) }}
        type="submit"
        disabled={!stripe || loading}
      >
        {loading ? 'Processing…' : `Pay ${currency.toUpperCase()} ${Number(amount).toFixed(2)}`}
      </button>
    </form>
  );
}

export default function Payment({ token, onSuccess, onLogout }) {
  const [amount, setAmount] = useState('49.99');
  const [currency, setCurrency] = useState('usd');
  const [description, setDescription] = useState('Resilience Atlas Premium Report');
  const [step, setStep] = useState('form');
  const [stripePromise, setStripePromise] = useState(null);
  const [stripeError, setStripeError] = useState('');

  useEffect(() => {
    fetch('/config')
      .then(r => r.json())
      .then(({ stripePublishableKey }) => {
        if (!stripePublishableKey || stripePublishableKey === 'pk_test_placeholder') {
          setStripeError('Payment system is not configured. Please contact support.');
          return;
        }
        setStripePromise(loadStripe(stripePublishableKey));
      })
      .catch(() => setStripeError('Unable to load payment configuration. Please try again later.'));
  }, []);

  const handleProceed = (e) => {
    e.preventDefault();
    setStep('pay');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.brand}>Resilience Atlas</span>
        <button style={styles.logout} onClick={onLogout}>Sign out</button>
      </div>
      <div style={styles.card}>
        <h2 style={styles.title}>Complete Your Payment</h2>
        <p style={styles.subtitle}>Unlock your full Digital Resilience Assessment Report</p>
        <div style={styles.divider} />
        {stripeError ? (
          <div style={{ ...styles.error, fontSize: 15, padding: '14px 16px' }}>{stripeError}</div>
        ) : step === 'form' ? (
          <form onSubmit={handleProceed}>
            <label style={styles.label}>Amount (USD)</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              max="10000"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
            <label style={styles.label}>Currency</label>
            <select style={styles.select} value={currency} onChange={e => setCurrency(e.target.value)}>
              <option value="usd">USD – US Dollar</option>
              <option value="eur">EUR – Euro</option>
              <option value="gbp">GBP – British Pound</option>
              <option value="cad">CAD – Canadian Dollar</option>
            </select>
            <label style={styles.label}>Description</label>
            <input
              style={styles.input}
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div style={styles.divider} />
            <div style={styles.summary}>
              <span style={styles.summaryLabel}>Total due</span>
              <span style={styles.summaryValue}>
                {currency.toUpperCase()} {Number(amount || 0).toFixed(2)}
              </span>
            </div>
            <button style={styles.btn} type="submit">Continue to Payment</button>
          </form>
        ) : (
          <Elements stripe={stripePromise}>
            <CheckoutForm
              token={token}
              amount={amount}
              currency={currency}
              description={description}
              onSuccess={onSuccess}
            />
          </Elements>
        )}      </div>
    </div>
  );
}
