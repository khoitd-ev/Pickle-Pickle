import mongoose from "mongoose";
const { Schema } = mongoose;

const venueProviderAccountSchema = new Schema(
  {
    venue:      { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    provider:   { type: String, required: true },   // VNPay, MoMo...
    accountId:  { type: String, required: true },
    status:     { type: String },                   // ACTIVE, INACTIVE...
    kycStatus:  { type: String },                   // PENDING, VERIFIED...
  },
  { timestamps: true }
);

venueProviderAccountSchema.index({ venue: 1, provider: 1 }, { unique: true });

export const VenueProviderAccount =
  mongoose.models.VenueProviderAccount ||
  mongoose.model("VenueProviderAccount", venueProviderAccountSchema);
