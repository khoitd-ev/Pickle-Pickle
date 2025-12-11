import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    code:      { type: String, required: true, unique: true },

    user:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    venue:     { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    status:    { type: Schema.Types.ObjectId, ref: "BookingStatus", required: true },

    grossAmount: { type: Number },  // tổng trước giảm
    discount:    { type: Number },  // tổng giảm
    totalAmount: { type: Number },  // phải trả
    paymentExpiresAt: { type: Date },

    note:      { type: String },
  },
  { timestamps: true }
);

export const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
