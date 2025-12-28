const Application = require("../models/Application");
const Payment = require("../models/Payment");

exports.submitApplication = async (req, res) => {
  const { paymentId, country, job } = req.body;

  const payment = await Payment.findById(paymentId);
  if (!payment || payment.status !== "success") {
    return res.status(403).json({
      message: "Payment not completed"
    });
  }

  const app = await Application.create({
    payment: payment._id,
    country,
    job,
    ...req.body
  });

  res.json({
    message: "Application received. We will contact you via email.",
    applicationId: app._id
  });
};
