const express = require("express");
const router = express.Router();
const axios = require("axios");
const Payment = require("../models/Payment");

const PAYHERO_BASE = "https://backend.payhero.co.ke/api/v2";
const PAYHERO_API_KEY = process.env.PAYHERO_API_KEY;

/**
 * Initiate STK Push
 */
router.post("/stk-push", async (req, res) => {
  try {
    const { phone, amountKES } = req.body;

    if (!phone || !amountKES) {
      return res.status(400).json({ message: "Phone and amount required" });
    }

    const payment = await Payment.create({
      phone,
      amount: amountKES,
      status: "pending"
    });

    const response = await axios.post(
      `${PAYHERO_BASE}/stk/push`,
      {
        phone_number: phone,
        amount: amountKES,
        callback_url: `${process.env.BASE_URL}/api/payments/callback`,
        external_reference: payment._id.toString()
      },
      {
        headers: {
          Authorization: `Bearer ${PAYHERO_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    payment.externalReference = payment._id.toString();
    payment.checkoutRequestID = response.data?.CheckoutRequestID;
    await payment.save();

    res.json({ paymentId: payment._id });
  } catch (err) {
    console.error("STK error:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to initiate payment" });
  }
});

/**
 * PayHero Callback
 */
router.post("/callback", async (req, res) => {
  try {
    const payload = req.body?.response;
    if (!payload) return res.sendStatus(400);

    const payment = await Payment.findOne({
      externalReference: payload.ExternalReference
    });

    if (!payment) return res.sendStatus(404);

    payment.checkoutRequestID = payload.CheckoutRequestID;
    payment.resultDesc = payload.ResultDesc;
    payment.status = payload.ResultCode === 0 ? "success" : "failed";
    payment.mpesaReceipt = payload.MpesaReceiptNumber || null;

    await payment.save();
    res.sendStatus(200);
  } catch (err) {
    console.error("Callback error:", err.message);
    res.sendStatus(500);
  }
});

/**
 * Payment Status Polling
 */
router.get("/status/:id", async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ status: "not_found" });
    }
    res.json({ status: payment.status });
  } catch {
    res.status(500).json({ status: "error" });
  }
});

module.exports = router;
