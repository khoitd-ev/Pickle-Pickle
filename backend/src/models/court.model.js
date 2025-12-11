import mongoose from "mongoose";
const { Schema } = mongoose;

const courtSchema = new Schema(
  {
    venue:    { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    name:     { type: String },
    surface:  { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Court =
  mongoose.models.Court || mongoose.model("Court", courtSchema);
