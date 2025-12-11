import mongoose from "mongoose";
const { Schema } = mongoose;

const invoiceSchema = new Schema(
  {
    payment: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true },

    number:   { type: String, unique: true },
    fileUrl:  { type: String },
    issuedAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Invoice =
  mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
