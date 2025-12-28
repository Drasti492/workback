const axios = require("axios");
const Payment = require("../models/Payment");

exports.initiateSTK = async (req, res) => {
  const { phone } = req.body;

  const payment = await Payment.create({
    phone,
    amountKES: 1500,
    externalReference: Date.now().toString(),
    status: "pending"
  });

  await axios.post(
    "https://backend.payhero.co.ke/api/v2/payments",
    {
      amount: 1500,
      phone_number: phone,
      channel_id: process.env.PAYHERO_CHANNEL_ID,
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

  res.json({
    paymentId: payment._id,
    reference: payment.externalReference
  });
};
