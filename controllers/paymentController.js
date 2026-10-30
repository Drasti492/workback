
const axios = require("axios");
const Payment = require("../models/Payment");

exports.initiateSTK = async (req, res) => {
  let payment;

  try {
    const { phone } = req.body;

    const CHANNEL_ID = process.env.PAYHERO_CHANNEL_ID;
    const BASIC_AUTH = process.env.PAYHERO_BASIC_AUTH;
    const CALLBACK_URL = process.env.PAYHERO_CALLBACK_URL;

    // Check configuration
    if (!CHANNEL_ID || !BASIC_AUTH || !CALLBACK_URL) {
      console.error("PAYHERO CONFIGURATION MISSING:", {
        channelConfigured: !!CHANNEL_ID,
        authConfigured: !!BASIC_AUTH,
        callbackConfigured: !!CALLBACK_URL
      });

      return res.status(500).json({
        success: false,
        message: "Payment configuration is incomplete."
      });
    }

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required."
      });
    }

    // Log the channel being used
    console.log("PAYHERO CHANNEL IN USE:", CHANNEL_ID);

    payment = await Payment.create({
      phone,
      amountKES: 1500,
      externalReference: Date.now().toString(),
      status: "pending"
    });

    const response = await axios.post(
      "https://backend.payhero.co.ke/api/v2/payments",
      {
        amount: 1500,
        phone_number: phone,
        channel_id: Number(CHANNEL_ID),
        provider: "m-pesa",
        external_reference: payment.externalReference,
        callback_url: CALLBACK_URL
      },
      {
        headers: {
          Authorization: `Basic ${BASIC_AUTH}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    console.log("PAYHERO RESPONSE:", response.data);

    return res.json({
      success: true,
      paymentId: payment._id,
      reference: payment.externalReference
    });

  } catch (error) {
    console.error("STK PUSH ERROR:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    if (payment) {
      await Payment.updateOne(
        { _id: payment._id },
        { $set: { status: "failed" } }
      ).catch(err => console.error("PAYMENT UPDATE ERROR:", err.message));
    }

    return res.status(500).json({
      success: false,
      message: "Unable to initiate payment. Please try again."
    });
  }
};
