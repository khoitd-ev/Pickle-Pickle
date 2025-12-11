import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingStatusSchema = new Schema(
  {
    code:        { type: String, required: true, unique: true },
    label:       { type: String, required: true },
    description: { type: String },
    isFinal:     { type: Boolean, default: false },
    isCancel:    { type: Boolean, default: false },
  },
  { timestamps: false }
);

export const BookingStatus =
  mongoose.models.BookingStatus ||
  mongoose.model("BookingStatus", bookingStatusSchema);
