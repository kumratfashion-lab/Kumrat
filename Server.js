import express from "express";
import Stripe from "stripe";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const stripe = new Stripe("sk_live_Oab7WPW4IRwKFxM6Ei1PUtKP00HRL74cA1"); // Live Key

app.use(cors());
app.use(express.json());

// Google Apps Script URL (Customer Sheet)
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxjb3LGryvLBz6Y-FL28Z8SMKUNRrBQ3MCyj8QwfJdVfSSHIHy8byB4gqSLVApJvGMg/exec";

// Checkout session create route
app.post("/submit-order", async (req, res) => {
  try {
    const { product, customer } = req.body;

    // 1️⃣ Add timestamp
    const timestamp = new Date().toISOString();
    const payload = { timestamp, ...customer };

    // 2️⃣ Log order to Google Sheet
    try {
      await fetch(SHEET_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (sheetErr) {
      console.error("Sheet logging failed:", sheetErr);
    }

    // 3️⃣ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: product.name },
            unit_amount: parseFloat(product.price) * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://www.kumratfashion.com/p/success.html",
      cancel_url: "https://www.kumratfashion.com/p/cancel.html",
    });

    // 4️⃣ Return session URL as JSON
    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
