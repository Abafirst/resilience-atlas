const express = require('express');
const router = express.Router();
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/*
------------------------------------
GET Stripe publishable key
------------------------------------
*/
router.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

/*
------------------------------------
Create Stripe Checkout Session
------------------------------------
*/
router.post('/create-checkout-session', async (req, res) => {

  try {

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Resilience Atlas Assessment Report'
            },
            unit_amount: 2900
          },
          quantity: 1
        }
      ],

      mode: 'payment',

      success_url: 'http://localhost:3000/results.html',
      cancel_url: 'http://localhost:3000/quiz.html'

    });

    res.json({ id: session.id });

  } catch (error) {

    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Stripe session failed' });

  }

});

module.exports = router;

