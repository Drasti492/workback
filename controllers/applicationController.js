const Application = require("../models/Application");
const Payment = require("../models/Payment");

exports.submitApplication = async (req, res) => {
  try {
    const {
      paymentId,
      country,
      job,
      fullName,
      age,
      gender,
      residenceCountry,
      email,
      phone,
      educationLevel,
      experienceYears,
      languages,
      notes
    } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    // 1️⃣ Verify payment from DB (SOURCE OF TRUTH)
    const payment = await Payment.findById(paymentId);
    if (!payment || payment.status !== "success") {
      return res.status(403).json({
        message: "Payment not completed or invalid"
      });
    }

    //  Prevent duplicate submissions
    const existing = await Application.findOne({ payment: payment._id });
    if (existing) {
      return res.status(409).json({
        message: "Application already submitted for this payment"
      });
    }

    // Create application
    const application = await Application.create({
      payment: payment._id,
      country,
      job,
      fullName,
      age,
      gender,
      residenceCountry,
      email,
      phone,
      educationLevel,
      experienceYears,
      languages,
      notes
    });

    return res.status(201).json({
      message: "Application received successfully",
      applicationId: application._id
    });

  } catch (error) {
    console.error("Application submission error:", error);
    return res.status(500).json({
      message: "Server error while submitting application"
    });
  }
};
