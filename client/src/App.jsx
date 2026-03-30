import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LandingPage from './pages/LandingPage.jsx';
import AssessmentHub from './pages/AssessmentHub.jsx';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import Auth0LoginBar from './components/Auth0LoginBar.jsx';

// Evaluated once at module load time — never changes during a session.
const CURRENT_PATH = window.location.pathname.replace(/\/$/, '');
const IS_RESULTS_ROUTE = CURRENT_PATH === '/results';

/**
 * AuthenticatedApp — rendered only when the user is authenticated and we are
 * NOT on the /results route.  Keeping hooks in their own component avoids a
 * Rules-of-Hooks violation that would arise from hoisting them above the
 * early return inside App.
 */
function AuthenticatedApp({ user, getAccessTokenSilently, logout }) {
  const [page, setPage] = useState('home');
  const [paymentResult, setPaymentResult] = useState(null);
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    getAccessTokenSilently()
      .then(token => setAccessToken(token))
      .catch((err) => {
        console.error('Failed to retrieve Auth0 access token:', err);
        setAccessToken('');
      });
  }, [getAccessTokenSilently]);

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setPage('success');
  };

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
      userEmail={user?.email}
      onUpgrade={() => setPage('payment')}
      onLogout={handleLogout}
    />
  );
}

export default function App() {
  const { isLoading, isAuthenticated, user, getAccessTokenSilently, logout } = useAuth0();

  // Results page is always accessible regardless of auth state.
  if (IS_RESULTS_ROUTE) {
    return <ResultsPage />;
  }

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

  // Default: assessment hub — free quiz access + premium upgrade option.
  return (
    <AuthenticatedApp
      user={user}
      getAccessTokenSilently={getAccessTokenSilently}
      logout={logout}
    />
  );
}
