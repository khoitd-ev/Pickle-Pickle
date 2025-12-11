import mongoose from "mongoose";
const { Schema } = mongoose;

const venueOpenHourSchema = new Schema(
  {
    venue:   { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    weekday: { type: Number, required: true },      // 0-6 hoặc 1-7
    timeFrom:{ type: String, required: true },      // "06:00"
    timeTo:  { type: String, required: true },      // "22:30"
  },
  { timestamps: true }
);

venueOpenHourSchema.index({ venue: 1, weekday: 1 }, { unique: false });

export const VenueOpenHour =
  mongoose.models.VenueOpenHour ||
  mongoose.model("VenueOpenHour", venueOpenHourSchema);
