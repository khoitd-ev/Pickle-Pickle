import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSlotSchema = new Schema(
  {
    booking:   { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    court:     { type: Schema.Types.ObjectId, ref: "Court", required: true },
    date:      { type: Date, required: true },
    slotIndex: { type: Number, required: true },
  },
  { timestamps: false }
);

bookingSlotSchema.index({ court: 1, date: 1, slotIndex: 1 }, { unique: true });

export const BookingSlot =
  mongoose.models.BookingSlot ||
  mongoose.model("BookingSlot", bookingSlotSchema);
