const express = require("express");
const router = express.Router();
const axios = require("axios");
const Payment = require("../models/Payment");

// PayHero constants
const PAYHERO_ENDPOINT = "https://backend.payhero.co.ke/api/v2/payments";

/**
 * 1️⃣ INITIATE STK PUSH
 */
router.post("/stk-push", async (req, res) => {
  try {
    const { phone, amountKES } = req.body;

    if (!phone || !amountKES) {
      return res.status(400).json({ message: "Phone and amount required" });
    }

    // ✅ create payment FIRST
    const payment = await Payment.create({
      phone,
      amountKES,
      externalReference: `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: "pending"
    });

    // ✅ PayHero request (CONFIRMED WORKING FORMAT)
    const response = await axios.post(
      PAYHERO_ENDPOINT,
      {
        amount: amountKES,
        phone_number: phone,
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference: payment.externalReference,
        callback_url: process.env.PAYHERO_CALLBACK_URL
      },
      {
        headers: {
          Authorization: `Basic ${process.env.PAYHERO_BASIC_AUTH}`,
          "Content-Type": "application/json"
        }
      }
    );

    // Save CheckoutRequestID if provided
    payment.checkoutRequestID = response.data?.CheckoutRequestID || null;
    await payment.save();

    res.json({
      paymentId: payment._id
    });

  } catch (err) {
    console.error("❌ STK PUSH ERROR:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to initiate payment" });
  }
});

/**
 * 2️⃣ PAYHERO CALLBACK (THE HEART)
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

    if (payload.ResultCode === 0) {
      payment.status = "success";
      payment.mpesaReceipt = payload.MpesaReceiptNumber || null;
    } else {
      payment.status = "failed";
    }

    await payment.save();
    res.sendStatus(200);

  } catch (err) {
    console.error(" CALLBACK ERROR:", err.message);
    res.sendStatus(500);
  }
});

/**
 * PAYMENT STATUS POLLING
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
