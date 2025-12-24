import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSchema = new Schema(
  {
    code: { type: String, required: true, unique: true },

    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    venue: { type: Schema.Types.ObjectId, ref: "Venue", required: true },
    status: { type: Schema.Types.ObjectId, ref: "BookingStatus", required: true },
    guestInfo: {
      fullName: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    isGuestBooking: {
      type: Boolean,
      default: false,
    },


    grossAmount: { type: Number },  // tổng trước giảm
    discount: { type: Number },  // tổng giảm
    totalAmount: { type: Number },  // phải trả
    addons: {
      items: [
        {
          addonId: { type: mongoose.Schema.Types.ObjectId, ref: "Addon" }, // hoặc String nếu bạn lưu id dạng string
          name: String,
          category: String,
          quantity: Number,
          unitPrice: Number,
          lineTotal: Number,
        },
      ],
      total: { type: Number, default: 0 },
    },

    paymentExpiresAt: { type: Date },

    note: { type: String },
  },
  { timestamps: true }
);

export const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
