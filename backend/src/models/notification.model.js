import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, required: true, index: true }, // BOOKING_CONFIRMED, REMINDER_30M, BOOKING_EXPIRED, NEW_BOOKING, VENUE_DISABLED...

    level: {
      type: String,
      enum: ["INFO", "WARNING", "CRITICAL"],
      default: "INFO",
      index: true,
    },

    title: { type: String, required: true },
    content: { type: String, required: true },

    // giữ kiểu string để khỏi đụng code cũ
    data: { type: String, default: "" }, // JSON.stringify({...})

    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },

    // chống spam / tạo trùng
    dedupeKey: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// unique theo user + dedupeKey (sparse để chỉ áp dụng khi có dedupeKey)
notificationSchema.index(
  { user: 1, dedupeKey: 1 },
  { unique: true, sparse: true }
);

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
