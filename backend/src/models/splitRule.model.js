import mongoose from "mongoose";
const { Schema } = mongoose;

const splitRuleSchema = new Schema(
  {
    venue:     { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    provider:  { type: String },
    platformSharePercent: { type: Number },   // decimal(5,2)
    effectiveFrom: { type: Date },
    effectiveTo:   { type: Date },
    note:      { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const SplitRule =
  mongoose.models.SplitRule || mongoose.model("SplitRule", splitRuleSchema);
