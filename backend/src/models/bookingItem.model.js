import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingItemSchema = new Schema(
  {
    booking:  { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    court:    { type: Schema.Types.ObjectId, ref: "Court", required: true },

    date:     { type: Date, required: true },
    slotStart:{ type: Number, required: true },
    slotEnd:  { type: Number, required: true },

    unitPrice:  { type: Number },
    lineAmount: { type: Number },
  },
  { timestamps: false }
);

bookingItemSchema.index({ booking: 1 });

export const BookingItem =
  mongoose.models.BookingItem ||
  mongoose.model("BookingItem", bookingItemSchema);
