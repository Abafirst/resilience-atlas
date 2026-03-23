import React, { useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';
import Auth0LoginBar from './components/Auth0LoginBar.jsx';

const PAGES = { login: 'login', register: 'register', payment: 'payment', success: 'success' };

export default function App() {
  const [page, setPage] = useState(PAGES.login);
  const [token, setToken] = useState(localStorage.getItem('ra_token') || '');
  const [paymentResult, setPaymentResult] = useState(null);

  const handleLogin = (tok) => {
    // NOTE: localStorage is used for simplicity; consider httpOnly cookies in production
    // to reduce XSS exposure.
    localStorage.setItem('ra_token', tok);
    setToken(tok);
    setPage(PAGES.payment);
  };

  const handleLogout = () => {
    localStorage.removeItem('ra_token');
    setToken('');
    setPage(PAGES.login);
  };

  const handlePaymentSuccess = (result) => {
    setPaymentResult(result);
    setPage(PAGES.success);
  };

  if (page === PAGES.register) {
    return (
      <>
        <Auth0LoginBar />
        <Register onRegistered={() => setPage(PAGES.login)} onLogin={() => setPage(PAGES.login)} />
      </>
    );
  }
  if (page === PAGES.login || !token) {
    return (
      <>
        <Auth0LoginBar />
        <Login onLogin={handleLogin} onRegister={() => setPage(PAGES.register)} />
      </>
    );
  }
  if (page === PAGES.success) {
    return (
      <>
        <Auth0LoginBar />
        <PaymentSuccess result={paymentResult} onNewPayment={() => setPage(PAGES.payment)} onLogout={handleLogout} />
      </>
    );
  }
  return (
    <>
      <Auth0LoginBar />
      <Payment token={token} onSuccess={handlePaymentSuccess} onLogout={handleLogout} />
    </>
  );
}
