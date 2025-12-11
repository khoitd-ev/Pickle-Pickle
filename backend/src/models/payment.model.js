import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSchema = new Schema(
  {
    booking:   { type: Schema.Types.ObjectId, ref: "Booking", required: true },

    provider:          { type: String }, // VNPay, MoMo...
    providerPaymentId: { type: String },
    orderId:           { type: String },

    amount:   { type: Number },
    currency: { type: String, default: "VND" },

    status:   { type: Schema.Types.ObjectId, ref: "PaymentStatus", required: true },
  },
  { timestamps: true }
);

export const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
