const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true //  cannot submit twice
    },

    country: String,
    job: String,

    fullName: String,
    age: Number,
    gender: String,
    residenceCountry: String,
    email: String,
    phone: String,

    languages: [String],

    documents: {
      portrait: String,
      nationalId: String,
      passport: String,
      resume: String
    },

    status: {
      type: String,
      enum: ["received", "under_review"],
      default: "received"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
