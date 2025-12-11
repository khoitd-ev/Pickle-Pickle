// backend/src/models/priceRule.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const priceRuleSchema = new Schema(
  {
    venue: { type: Schema.Types.ObjectId, ref: "Venue", required: true },

    // Nhãn hiển thị trong bảng giá: "T2 - T6", "T2 - CN", "T7 - CN"
    dayLabel:      { type: String, required: true },

    // Khoảng áp dụng theo thứ trong tuần (1 = Monday, 7 = Sunday)
    dayOfWeekFrom: { type: Number }, // optional
    dayOfWeekTo:   { type: Number },

    // Khung giờ
    timeFrom: { type: String, required: true }, // "05:00"
    timeTo:   { type: String, required: true }, // "09:00"

    // Giá
    fixedPricePerHour:  { type: Number, required: true }, // đặt trước
    walkinPricePerHour: { type: Number, required: true }, // vãng lai
  },
  { timestamps: true }
);

export const PriceRule =
  mongoose.models.PriceRule || mongoose.model("PriceRule", priceRuleSchema);
