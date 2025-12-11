import mongoose from "mongoose";
const { Schema } = mongoose;

const venueHolidaySchema = new Schema(
  {
    venue: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    date:  { type: Date, required: true },
    reason:{ type: String },
  },
  { timestamps: true }
);

venueHolidaySchema.index({ venue: 1, date: 1 }, { unique: true });

export const VenueHoliday =
  mongoose.models.VenueHoliday ||
  mongoose.model("VenueHoliday", venueHolidaySchema);
