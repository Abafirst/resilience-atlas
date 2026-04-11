import { apiUrl } from './api/baseUrl.js';

const BASE = '/api';

export async function createPayment(token, amount, currency = 'usd', description = '') {
  const res = await fetch(apiUrl(`${BASE}/create-payment`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount, currency, description }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Payment creation failed');
  return res.json();
}

