const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true
    },

    amountKES: {
      type: Number,
      required: true
    },

    externalReference: {
      type: String,
      required: true,
      unique: true
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },

    checkoutRequestID: String,
    mpesaReceipt: String,
    resultDesc: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
