import React, { useState, useEffect, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import Auth0LoginBar from './components/Auth0LoginBar.jsx';

export default function App() {
  const { isLoading, isAuthenticated, getAccessTokenSilently, logout, loginWithRedirect } = useAuth0();
  const [page, setPage] = useState('payment');
  const [paymentResult, setPaymentResult] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  // Guard against calling loginWithRedirect more than once per mount.
  const redirecting = useRef(false);

  // Redirect unauthenticated users directly to Auth0 Universal Login.
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !redirecting.current) {
      redirecting.current = true;
      loginWithRedirect();
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

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

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <span style={{ color: '#666', fontSize: 16 }}>Redirecting to login…</span>
      </div>
    );
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
