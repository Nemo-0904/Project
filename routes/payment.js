// backend/routes/payment.js
const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const dotenv = require("dotenv");

dotenv.config();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/payment/create-checkout-session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { cartItems } = req.body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ message: "Invalid cart items." });
    }

    const line_items = cartItems.map((item) => {
      if (!item.title || isNaN(item.price) || !item.quantity) {
        throw new Error("Invalid item data");
      }

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: item.title,
          },
          unit_amount: Math.round(item.price * 100), // ₹ to paise
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: "http://127.0.0.1:5500/success.html",
      cancel_url: "http://127.0.0.1:5500/cancel.html",
      
      
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Stripe Error:", error.message);
    res.status(500).json({ message: error.message || "Server error" });
  }
});

module.exports = router;
