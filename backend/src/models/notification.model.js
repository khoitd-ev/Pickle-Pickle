import mongoose from "mongoose";
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    user:   { type: Schema.Types.ObjectId, ref: "User", required: true }, // người nhận
    type:   { type: String, required: true }, // NEW_BOOKING, PAYMENT_SUCCESS,...
    title:  { type: String, required: true },
    content:{ type: String, required: true },
    data:   { type: String },       // JSON string nếu cần

    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);
