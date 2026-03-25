import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LandingPage from './pages/LandingPage.jsx';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import Auth0LoginBar from './components/Auth0LoginBar.jsx';

export default function App() {
  const { isLoading, isAuthenticated, getAccessTokenSilently, logout } = useAuth0();
  const [page, setPage] = useState('payment');
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
        <PaymentSuccess result={paymentResult} onNewPayment={() => setPage('payment')} onLogout={handleLogout} />
      </>
    );
  }

  return (
    <>
      <Auth0LoginBar />
      <Payment token={accessToken} onSuccess={handlePaymentSuccess} onLogout={handleLogout} />
    </>
  );
}
