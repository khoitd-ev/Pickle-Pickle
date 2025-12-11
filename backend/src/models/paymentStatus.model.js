import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentStatusSchema = new Schema(
  {
    code:        { type: String, required: true, unique: true },
    label:       { type: String, required: true },
    description: { type: String },
    isSuccess:   { type: Boolean, default: false },
    isFinal:     { type: Boolean, default: false },
  },
  { timestamps: false }
);

export const PaymentStatus =
  mongoose.models.PaymentStatus ||
  mongoose.model("PaymentStatus", paymentStatusSchema);
