/**
 * IATLASPricingPage.jsx
 * Public pricing page listing all IATLAS subscription tiers.
 * Route: /pricing
 */

import React, { useState } from 'react';
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
    comingSoon: false,
    features: [
      'Personal resilience assessments',
      'Basic progress tracking',
      'Individual practice pathways',
      'Mobile app access (beta)',
    ],
    cta: 'Get Started',
    ctaUrl: '/iatlas/subscribe?tier=individual',
    highlighted: false,
    badge: null,
  },
  {
    id: 'family',
    name: 'Family',
    price: '$39.99',
    period: '/month',
    description: 'Support your whole family\'s resilience journey',
    comingSoon: false,
    features: [
      'Up to 5 family member profiles',
      'Family progress dashboard',
      'Age-appropriate content (96+ activities)',
      'Shared family practices (18 challenges)',
    ],
    cta: 'Get Started',
    ctaUrl: '/iatlas/subscribe?tier=family',
    highlighted: false,
    badge: null,
  },
  {
    id: 'complete',
    name: 'Complete',
    price: '$99.99',
    period: '/month',
    description: 'Full curriculum access + advanced analytics',
    comingSoon: true,
    features: [
      'Everything in Family',
      'Full curriculum access (49 modules)',
      'Advanced progress analytics ✓',
      'Priority support (launching Q3 2026)',
      'Downloadable resources (launching Q3 2026)',
    ],
    cta: 'Join Waitlist',
    ctaUrl: '/iatlas/waitlist?tier=complete',
    highlighted: false,
    badge: 'COMING SOON',
  },
  {
    id: 'practitioner',
    name: 'Practitioner',
    price: '$149',
    period: '/month',
    description: 'Clinical tools for solo practitioners',
    comingSoon: true,
    features: [
      'Clinical assessments & session plans ✓',
      'ABA Protocol Library ✓',
      'Client resources (launching Q3 2026)',
      'Progress & outcome reports ✓',
      'Professional development content ✓',
    ],
    cta: 'Join Waitlist',
    ctaUrl: '/iatlas/waitlist?tier=practitioner',
    highlighted: false,
    badge: 'COMING SOON',
  },
  {
    id: 'practice',
    name: 'Practice',
    price: '$399',
    period: '/month',
    description: 'Multi-practitioner group management',
    comingSoon: true,
    features: [
      'Everything in Practitioner',
      'Multi-practitioner access (5–25 seats)',
      'Team collaboration tools',
      'Group practice dashboard',
      'Role-based permissions',
      'Team analytics',
    ],
    cta: 'Join Waitlist',
    ctaUrl: '/iatlas/waitlist?tier=practice',
    highlighted: false,
    badge: 'COMING SOON',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Contact Us',
    period: '',
    description: 'Custom solutions for large organizations',
    comingSoon: false,
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
    badge: null,
  },
];

const FAQS = [
  {
    q: 'What\'s the difference between Practitioner and Practice?',
    a: 'The Practitioner tier is for solo clinicians managing their own clients. The Practice tier adds multi-seat access so you can invite your entire team (5, 10, or 25 seats), share a practice dashboard, and manage roles across all practitioners in one account.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Yes. You can upgrade or downgrade at any time from your Billing page. Upgrades take effect immediately with prorated charges. Downgrades take effect at the end of your current billing period.',
  },
  {
    q: 'How does billing work for the Practice tier?',
    a: 'Practice subscriptions are billed monthly. Your seat limit is fixed at the plan level (5, 10, or 25 practitioners). You can upgrade to a higher seat tier at any time. All billing is handled securely through Stripe.',
  },
  {
    q: 'Is there a free trial?',
    a: 'We offer a limited free tier for individual use. Practice and Practitioner tiers start with a paid subscription. Contact us at hello@theresilienceatlas.com if you\'d like to arrange a demo before subscribing.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your data is retained for 90 days after cancellation so you can export it. After 90 days, data is permanently deleted per our Privacy Policy. Contact support to request a full data export before cancelling.',
  },
];

export default function IATLASPricingPage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  function handleCtaClick(e, tier) {
    // Coming-soon tiers always route to the waitlist — never to Stripe checkout
    if (tier.comingSoon) {
      e.preventDefault();
      navigate(tier.ctaUrl);
      return;
    }
    if (!isAuthenticated && tier.id !== 'enterprise') {
      e.preventDefault();
      loginWithRedirect({ appState: { returnTo: tier.ctaUrl } });
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <SiteHeader activePage="pricing" />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a2e5a 0%, #4f46e5 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '4rem 1.5rem 3rem',
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a5b4fc', marginBottom: 12 }}>
          IATLAS Subscription Plans
        </p>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 800, margin: '0 0 .75rem', lineHeight: 1.15 }}>
          Choose the Plan That Fits Your Practice
        </h1>
        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.8)', maxWidth: 560, margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
          From personal resilience journeys to full group practice management — IATLAS has a plan for every stage.
        </p>
        <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 18px', fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>
          🎉 Launch offer: Use code <strong>LAUNCH50</strong> for 50% off your first month
        </div>
      </section>

      {/* Pricing Grid */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start',
        }}>
          {IATLAS_TIERS.map(tier => (
            <div
              key={tier.id}
              style={{
                background: '#fff',
                borderRadius: 16,
                padding: '2rem',
                boxShadow: tier.highlighted
                  ? '0 8px 40px rgba(79,70,229,0.18)'
                  : '0 2px 12px rgba(0,0,0,0.07)',
                border: tier.highlighted ? '2px solid #4f46e5' : tier.comingSoon ? '1px dashed #c7d2fe' : '1px solid #e5e7eb',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                opacity: tier.comingSoon ? 0.92 : 1,
              }}
            >
              {/* Badge */}
              {tier.badge && (
                <div style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: tier.comingSoon ? '#f59e0b' : '#4f46e5',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  padding: '4px 14px',
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                }}>
                  {tier.badge}
                </div>
              )}

              {/* Tier name */}
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', margin: '0 0 .25rem' }}>
                {tier.name}
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
                {tier.description}
              </p>

              {/* Price */}
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: tier.highlighted ? '#4f46e5' : '#1e293b' }}>
                  {tier.price}
                </span>
                {tier.period && (
                  <span style={{ fontSize: 16, color: '#64748b', marginLeft: 4 }}>
                    {tier.period}
                  </span>
                )}
              </div>

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.75rem', flex: 1 }}>
                {tier.features.map((feature, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, fontSize: 14, color: '#374151' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <a
                href={tier.ctaUrl}
                onClick={e => handleCtaClick(e, tier)}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '13px 20px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 15,
                  textDecoration: 'none',
                  background: tier.comingSoon
                    ? '#f59e0b'
                    : tier.highlighted
                      ? '#4f46e5'
                      : '#f1f5f9',
                  color: tier.comingSoon
                    ? '#fff'
                    : tier.highlighted
                      ? '#fff'
                      : '#374151',
                  border: tier.comingSoon
                    ? 'none'
                    : tier.highlighted
                      ? 'none'
                      : '1px solid #e2e8f0',
                  transition: 'background 0.15s',
                }}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ maxWidth: 760, margin: '0 auto', padding: '1rem 1.5rem 4rem' }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#1e293b', textAlign: 'center', marginBottom: '2rem' }}>
          Frequently Asked Questions
        </h2>

        {FAQS.map((faq, i) => (
          <div
            key={i}
            style={{
              borderBottom: '1px solid #e5e7eb',
              marginBottom: 4,
            }}
          >
            <button
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '1rem 0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                fontSize: 15,
                fontWeight: 600,
                color: '#1e293b',
              }}
              aria-expanded={openFaq === i}
            >
              {faq.q}
              <span style={{ fontSize: 20, color: '#6b7280', flexShrink: 0 }}>
                {openFaq === i ? '−' : '+'}
              </span>
            </button>
            {openFaq === i && (
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.65, paddingBottom: '1rem', margin: 0 }}>
                {faq.a}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Footer CTA */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '3rem 1.5rem',
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
          Ready to Get Started?
        </h2>
        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 24 }}>
          Join hundreds of practitioners using IATLAS to build resilience every day.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a
            href="/iatlas/subscribe?tier=family"
            onClick={e => {
              if (!isAuthenticated) {
                e.preventDefault();
                loginWithRedirect({ appState: { returnTo: '/iatlas/subscribe?tier=family' } });
              }
            }}
            style={{
              background: '#fff',
              color: '#667eea',
              padding: '12px 28px',
              borderRadius: 8,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            Start with Family →
          </a>
          <a
            href="mailto:hello@theresilienceatlas.com?subject=IATLAS%20Pricing%20Question"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: 'none',
              border: '2px solid rgba(255,255,255,0.4)',
            }}
          >
            Contact Sales
          </a>
        </div>
      </section>
    </div>
  );
}
