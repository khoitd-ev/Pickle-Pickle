import mongoose from "mongoose";
const { Schema } = mongoose;

const roleSchema = new Schema(
  {
    code: { type: String, required: true, unique: true }, // USER, OWNER, ADMIN
    name: { type: String },
  },
  { timestamps: false }
);

export const Role =
  mongoose.models.Role || mongoose.model("Role", roleSchema);
