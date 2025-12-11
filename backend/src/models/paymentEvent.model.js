import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentEventSchema = new Schema(
  {
    payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true },

    eventType:            { type: String },  // payment_intent.succeeded...
    source:               { type: String },  // webhook, poll...
    eventIdFromProvider:  { type: String },
    payload:              { type: String },  // có thể lưu JSON stringify
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const PaymentEvent =
  mongoose.models.PaymentEvent ||
  mongoose.model("PaymentEvent", paymentEventSchema);
