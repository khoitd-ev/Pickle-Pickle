import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    nickname: { type: String, trim: true, default: "" },
    gender: {
      type: String,
      enum: ["unknown", "male", "female", "other"],
      default: "unknown",
    },
    birthday: { type: Date, default: null },
    address: { type: String, trim: true, default: "" },

    isActive: { type: Boolean, default: true },

    // Mật khẩu hash
    passwordHash: {
      type: String,
      required: true,
    },

    // Xác thực email
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationCode: {
      type: String,
      default: null,
    },
    emailVerificationExpiresAt: {
      type: Date,
      default: null,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },

    // Đánh dấu admin gốc (leader) – chỉ có ý nghĩa khi user có role ADMIN
    isAdminLeader: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Có quyền quản lý admin (truy cập màn hình quản lý admin)
    canManageAdmins: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);
