import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LandingPage from './pages/LandingPage.jsx';
import AssessmentHub from './pages/AssessmentHub.jsx';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import Auth0LoginBar from './components/Auth0LoginBar.jsx';

export default function App() {
  const { isLoading, isAuthenticated, getAccessTokenSilently, logout } = useAuth0();
  // Default to 'home' so authenticated users see the assessment hub first.
  // The payment page is only shown when the user explicitly requests the
  // full premium report — never as an automatic gate on login.
  const [page, setPage] = useState('home');
  const [paymentResult, setPaymentResult] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      getAccessTokenSilently()
        .then(token => setAccessToken(token))
        .catch((err) => {
          console.error('Failed to retrieve Auth0 access token:', err);
          setAccessToken('');
        });
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setPage('success');
  };

  // Show a loading spinner while Auth0 initialises.
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e' }}>
        <span style={{ color: '#a0aec0', fontSize: 16 }}>Loading…</span>
      </div>
    );
  }

  // Public landing page — shown to unauthenticated visitors.
  // Auth0 login is only triggered when the user clicks "Start Assessment".
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (page === 'success') {
    return (
      <>
        <Auth0LoginBar />
        <PaymentSuccess result={paymentResult} onNewPayment={() => setPage('home')} onLogout={handleLogout} />
      </>
    );
  }

  // Payment page — only shown when the user explicitly requests the full
  // premium report (e.g. by clicking "Unlock Full Report" on the hub page).
  if (page === 'payment') {
    return (
      <>
        <Auth0LoginBar />
        <Payment token={accessToken} onSuccess={handlePaymentSuccess} onLogout={handleLogout} />
      </>
    );
  }

  // Default: assessment hub — free quiz access + premium upgrade option.
  return (
    <AssessmentHub
      onUpgrade={() => setPage('payment')}
      onLogout={handleLogout}
    />
  );
}
