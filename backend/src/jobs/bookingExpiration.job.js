// src/jobs/bookingExpiration.job.js
import { Booking } from "../models/booking.model.js";
import { BookingStatus } from "../models/bookingStatus.model.js";

export function startBookingExpirationJob() {
  const intervalMs = 60 * 1000; // chạy mỗi 1 phút

  setInterval(async () => {
    try {
      const now = new Date();

      const pendingStatus = await BookingStatus.findOne({
        code: "PENDING_PAYMENT",
      });
      const cancelledStatus = await BookingStatus.findOne({
        code: "CANCELLED",
      });

      if (!pendingStatus || !cancelledStatus) return;

      const result = await Booking.updateMany(
        {
          status: pendingStatus._id,
          paymentExpiresAt: { $lte: now },
        },
        { $set: { status: cancelledStatus._id } }
      );

      if (result.modifiedCount) {
        console.log(
          `[bookingExpirationJob] cancelled ${result.modifiedCount} expired bookings`
        );
      }
    } catch (err) {
      console.error("[bookingExpirationJob] error:", err);
    }
  }, intervalMs);
}
