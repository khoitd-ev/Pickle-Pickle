import mongoose from "mongoose";
const { Schema } = mongoose;

const blackoutSlotSchema = new Schema(
  {
    venue:     { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    court:     { type: Schema.Types.ObjectId, ref: "Court", required: true },
    date:      { type: Date, required: true },
    slotStart: { type: Number, required: true },  // index
    slotEnd:   { type: Number, required: true },
    reason:    { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

blackoutSlotSchema.index(
  { court: 1, date: 1, slotStart: 1, slotEnd: 1 },
  { unique: true }
);

export const BlackoutSlot =
  mongoose.models.BlackoutSlot ||
  mongoose.model("BlackoutSlot", blackoutSlotSchema);
