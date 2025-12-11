import mongoose from "mongoose";
const { Schema } = mongoose;

const userRoleSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
  },
  { timestamps: true }
);

userRoleSchema.index({ user: 1, role: 1 }, { unique: true });

export const UserRole =
  mongoose.models.UserRole || mongoose.model("UserRole", userRoleSchema);
