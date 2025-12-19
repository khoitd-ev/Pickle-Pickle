import mongoose from "mongoose";
const { Schema } = mongoose;

const addonSchema = new Schema(
  {

    code: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // equipment | drink | support | other
    category: {
      type: String,
      required: true,
      enum: ["equipment", "drink", "support", "other"],
    },


    categoryLabel: {
      type: String,
      required: true,
      trim: true,
    },

    // Giá theo đơn vị VND
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Đường dẫn ảnh (relative path trong /public/booking hoặc /uploads/...)
    imageUrl: {
      type: String,
      required: true,
      trim: true,
    },

    // MỖI PHỤ KIỆN GẮN VỚI 1 SÂN
    venue: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
      index: true,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Tìm kiếm danh sách: theo category + isActive
addonSchema.index({ category: 1, isActive: 1 });
// Đảm bảo cùng một sân không bị trùng code
addonSchema.index({ venue: 1, code: 1 }, { unique: true });
// Tiện filter theo sân
addonSchema.index({ venue: 1, isActive: 1 });

export const Addon =
  mongoose.models.Addon || mongoose.model("Addon", addonSchema);
