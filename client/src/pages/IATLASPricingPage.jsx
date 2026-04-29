/**
 * IATLASPricingPage.jsx
 * Public pricing page showing all 6 IATLAS subscription tiers.
 *
 * Routes: /pricing  and  /iatlas/pricing
 */

import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNavigate } from 'react-router-dom';
import SiteHeader from '../components/SiteHeader.jsx';

const IATLAS_TIERS = [
  {
    id: 'individual',
    name: 'Individual',
    price: '$19.99',
    period: '/month',
    description: 'Perfect for personal resilience development',
    features: [
      'Personal resilience assessments',
      'Basic progress tracking',
      'Individual practice pathways',
      'Mobile app access',
    ],
    cta: 'Get Started',
    ctaUrl: '/iatlas/subscribe?tier=individual',
    highlighted: false,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$39.99',
    period: '/month',
    description: "Support your whole family's resilience journey",
    features: [
      'Up to 5 family member profiles',
      'Family progress dashboard',
      'Age-appropriate content',
      'Shared family practices',
    ],
    cta: 'Get Started',
    ctaUrl: '/iatlas/subscribe?tier=family',
    highlighted: false,
  },
  {
    id: 'complete',
    name: 'Complete',
    price: '$99.99',
    period: '/month',
    description: 'Full curriculum access + advanced analytics',
    features: [
      'Everything in Family',
      'Full curriculum access',
      'Advanced progress analytics',
      'Priority support',
      'Downloadable resources',
    ],
    cta: 'Get Started',
    ctaUrl: '/iatlas/subscribe?tier=complete',
    highlighted: false,
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    price: '$149',
    period: '/month',
    description: 'Clinical tools for solo practitioners',
    features: [
      'Clinical assessments & session plans',
      'Client resources & worksheets',
      'Progress & outcome reports',
      'Individual practice management',
      'Professional development content',
    ],
    cta: 'Get Started',
    ctaUrl: '/iatlas/subscribe?tier=practitioner',
    highlighted: false,
  },
  {
    id: 'practice',
    name: 'Practice',
    price: '$399',
    period: '/month',
    description: 'Multi-practitioner group management',
    features: [
      'Everything in Practitioner',
      'Multi-practitioner access (5–25 seats)',
      'Team collaboration tools',
      'Group practice dashboard',
      'Role-based permissions',
      'Team analytics',
    ],
    cta: 'Start Setup',
    ctaUrl: '/iatlas/practice/setup',
    highlighted: true,
    badge: 'POPULAR',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Contact Us',
    period: '',
    description: 'Custom solutions for large organizations',
    features: [
      'Everything in Practice',
      'Unlimited practitioners',
      'Custom onboarding',
      'Dedicated support',
      'Custom integrations',
      'SSO/SAML',
    ],
    cta: 'Contact Sales',
    ctaUrl: 'mailto:hello@theresilienceatlas.com?subject=Enterprise%20Inquiry',
    highlighted: false,
  },
];

const FAQS = [
  {
    q: "What's the difference between Practitioner and Practice tiers?",
    a: "Practitioner is designed for solo clinicians managing their own clients. Practice adds multi-practitioner seats (5–25), team collaboration tools, a group practice dashboard, role-based permissions, and team analytics — everything a group practice needs.",
  },
  {
    q: 'Can I upgrade or downgrade my plan?',
    a: 'Yes. You can upgrade at any time and will be charged a prorated amount. Downgrades take effect at the end of your current billing period. If your seat usage exceeds the lower plan limit, you will need to remove members before downgrading.',
  },
  {
    q: 'Do you offer a free trial?',
    a: 'We offer a 14-day free trial on Individual and Family plans. Practitioner and Practice plans include a 7-day trial. No credit card required to start.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex, Discover) via Stripe. ACH bank transfers are available for annual Practice and Enterprise plans.',
  },
];

export default function IATLASPricingPage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();

  function handleCta(tier) {
    if (tier.id === 'enterprise') {
      window.location.href = tier.ctaUrl;
      return;
    }
    if (!isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: tier.ctaUrl } });
      return;
    }
    navigate(tier.ctaUrl);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SiteHeader activePage="pricing" />

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '4rem 1.5rem 2rem', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#1a1a2e', marginBottom: 12 }}>
          IATLAS Plans &amp; Pricing
        </h1>
        <p style={{ fontSize: 17, color: '#6b7280', lineHeight: 1.6 }}>
          From personal resilience journeys to full clinical practice management.
          Choose the plan that fits your needs.
        </p>
      </section>

      {/* Pricing grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '1rem 1.5rem 4rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
        }}>
          {IATLAS_TIERS.map(tier => (
            <div
              key={tier.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '2rem',
                boxShadow: tier.highlighted
                  ? '0 8px 40px rgba(102,126,234,0.25)'
                  : '0 2px 16px rgba(0,0,0,0.07)',
                border: tier.highlighted ? '2px solid #667eea' : '1.5px solid #e5e7eb',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {tier.badge && (
                <span style={{
                  position: 'absolute',
                  top: -13,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  borderRadius: 99,
                  padding: '3px 14px',
                  whiteSpace: 'nowrap',
                }}>
                  {tier.badge}
                </span>
              )}

              <div style={{ marginBottom: 'auto' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>
                  {tier.name}
                </h2>
                <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{tier.description}</p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                  <span style={{ fontSize: tier.price === 'Contact Us' ? 22 : 32, fontWeight: 800, color: tier.highlighted ? '#667eea' : '#1a1a2e' }}>
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span style={{ fontSize: 14, color: '#9ca3af' }}>{tier.period}</span>
                  )}
                </div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tier.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: '#374151' }}>
                      <span style={{ color: '#10b981', fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleCta(tier)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 10,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 700,
                  background: tier.highlighted
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : tier.id === 'enterprise' ? '#374151' : '#4f46e5',
                  color: '#fff',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 1.5rem 5rem' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', textAlign: 'center', marginBottom: 32 }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {FAQS.map(({ q, a }) => (
            <div
              key={q}
              style={{
                background: '#fff',
                borderRadius: 12,
                padding: '1.5rem',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb',
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{q}</h3>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.65, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
