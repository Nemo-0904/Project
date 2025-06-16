// backend/routes/checkout.js

const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
require('dotenv').config();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/checkout/create-session
router.post('/create-checkout-session', async (req, res) => {
  const { cartItems } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: cartItems.map(item => ({
        price_data: {
          currency: 'inr',
          product_data: {
            name: item.title,
          },
          unit_amount: item.price * 100, // price in paisa
        },
        quantity: item.quantity,
      })),
success_url: 'http://127.0.0.1:5500/success.html',
cancel_url: 'http://127.0.0.1:5500/cancel.html',

    });

    res.json({ id: session.id });


    
} catch (err) { // Changed 'error' to 'err'
    console.error("Stripe Error:", err);
    res.status(500).json({ error: err.message });
}
});

module.exports = router;
