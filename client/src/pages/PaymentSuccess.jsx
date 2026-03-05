import React from 'react';

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' },
  card: { background: '#fff', borderRadius: 12, padding: 48, maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: 700, color: '#059669', marginBottom: 8 },
  subtitle: { color: '#666', marginBottom: 28, fontSize: 15, lineHeight: 1.5 },
  detail: { background: '#f9fafb', borderRadius: 8, padding: '14px 20px', marginBottom: 24, textAlign: 'left' },
  detailRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 },
  detailLabel: { color: '#666' },
  detailValue: { fontWeight: 600, color: '#333' },
  btnPrimary: { width: '100%', padding: '12px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 10 },
  btnSecondary: { width: '100%', padding: '12px', background: 'none', color: '#4f46e5', border: '1px solid #4f46e5', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
};

export default function PaymentSuccess({ result, onNewPayment, onLogout }) {
  const { paymentIntentId, amount, currency } = result || {};

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>✅</div>
        <h2 style={styles.title}>Payment Successful!</h2>
        <p style={styles.subtitle}>
          Thank you for your payment. Your Resilience Atlas report is being prepared and will be available shortly.
        </p>
        {result && (
          <div style={styles.detail}>
            {paymentIntentId && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Payment ID</span>
                <span style={styles.detailValue}>{paymentIntentId.slice(0, 18)}…</span>
              </div>
            )}
            {amount && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Amount paid</span>
                <span style={styles.detailValue}>{(currency || 'usd').toUpperCase()} {Number(amount).toFixed(2)}</span>
              </div>
            )}
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Status</span>
              <span style={{ ...styles.detailValue, color: '#059669' }}>Confirmed</span>
            </div>
          </div>
        )}
        <button style={styles.btnPrimary} onClick={onNewPayment}>Make Another Payment</button>
        <button style={styles.btnSecondary} onClick={onLogout}>Sign Out</button>
      </div>
    </div>
  );
}
