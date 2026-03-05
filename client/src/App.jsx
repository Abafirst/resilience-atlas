import React, { useState } from 'react';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Payment from './pages/Payment.jsx';
import PaymentSuccess from './pages/PaymentSuccess.jsx';

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
    return <Register onRegistered={() => setPage(PAGES.login)} onLogin={() => setPage(PAGES.login)} />;
  }
  if (page === PAGES.login || !token) {
    return <Login onLogin={handleLogin} onRegister={() => setPage(PAGES.register)} />;
  }
  if (page === PAGES.success) {
    return <PaymentSuccess result={paymentResult} onNewPayment={() => setPage(PAGES.payment)} onLogout={handleLogout} />;
  }
  return <Payment token={token} onSuccess={handlePaymentSuccess} onLogout={handleLogout} />;
}
