const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_API_KEY);

router.post('/checkout', async (req, res) => {
    const { success_url, cancel_url } = req.body;
    const priceId = process.env.STRIPE_ONE_TIME_PRICE_ID;

    // Guard clause for missing STRIPE_ONE_TIME_PRICE_ID
    if (!priceId) {
        return res.status(500).json({ error: 'Missing STRIPE_ONE_TIME_PRICE_ID' });
    }

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'payment',
            success_url,
            cancel_url,
        });

        return res.json({ id: session.id });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;