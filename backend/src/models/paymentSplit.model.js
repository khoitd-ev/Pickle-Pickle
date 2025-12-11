import mongoose from "mongoose";
const { Schema } = mongoose;

const paymentSplitSchema = new Schema(
  {
    payment:  { type: Schema.Types.ObjectId, ref: "Payment", required: true },
    destType: { type: String },  // VENUE, PLATFORM...
    destAccountId:     { type: String },
    providerTransferId:{ type: String },
    amount:            { type: Number },
    feeAmount:         { type: Number },
    status:            { type: String },
  },
  { timestamps: true }
);

export const PaymentSplit =
  mongoose.models.PaymentSplit ||
  mongoose.model("PaymentSplit", paymentSplitSchema);
