const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    phone: String,
    amountKES: Number,

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },

    externalReference: {
      type: String,
      required: true,
      unique: true
    },

    checkoutRequestID: String,
    mpesaReceipt: String,
    resultDesc: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
