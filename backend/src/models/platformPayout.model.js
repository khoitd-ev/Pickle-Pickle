// backend/src/models/platformPayout.model.js
import mongoose from "mongoose";

const platformPayoutSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // PO2025-12-001
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },
    periodFrom: { type: Date, required: true }, // ngày bắt đầu kỳ thanh toán
    periodTo: { type: Date, required: true },   // ngày kết thúc kỳ thanh toán
    amount: { type: Number, required: true },   // số tiền chủ sân phải trả cho nền tảng
    status: {
      type: String,
      enum: ["PENDING", "PAID", "CANCELLED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const PlatformPayout = mongoose.model(
  "PlatformPayout",
  platformPayoutSchema
);
