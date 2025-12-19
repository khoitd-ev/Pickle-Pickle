import { Booking } from "../models/booking.model.js";
import { BookingStatus } from "../models/bookingStatus.model.js";
import { Venue } from "../models/venue.model.js";
import { createNotification } from "../modules/notifications/notification.service.js";

export function startBookingExpirationJob() {
  const intervalMs = 60 * 1000;

  setInterval(async () => {
    try {
      const now = new Date();

      const pendingStatus = await BookingStatus.findOne({ code: "PENDING_PAYMENT" }).lean();
      const cancelledStatus = await BookingStatus.findOne({ code: "CANCELLED" }).lean();

      if (!pendingStatus || !cancelledStatus) return;

      // 1) lấy danh sách expired bookings
      const expired = await Booking.find({
        status: pendingStatus._id,
        paymentExpiresAt: { $lte: now },
      })
        .select("_id code user venue")
        .lean();

      if (!expired.length) return;

      // 2) update status -> CANCELLED
      await Booking.updateMany(
        { _id: { $in: expired.map((b) => b._id) } },
        { $set: { status: cancelledStatus._id } }
      );

      // 3) notify customer
      const venueIds = [...new Set(expired.map((b) => String(b.venue)))];
      const venues = await Venue.find({ _id: { $in: venueIds } }).select("_id name").lean();
      const venueMap = new Map(venues.map((v) => [String(v._id), v.name]));

      for (const b of expired) {
        await createNotification({
          userId: b.user,
          type: "BOOKING_EXPIRED",
          level: "WARNING",
          title: "Đơn đặt sân đã hết hạn thanh toán",
          content: `Đơn ${b.code}${venueMap.get(String(b.venue)) ? ` tại "${venueMap.get(String(b.venue))}"` : ""} đã quá 15 phút chưa thanh toán nên đã bị huỷ.`,
          data: { bookingId: String(b._id), bookingCode: b.code, route: "/history" },
          dedupeKey: `BOOKING_EXPIRED:${b._id}`,
        });
      }

      console.log(`[bookingExpirationJob] cancelled ${expired.length} expired bookings`);
    } catch (err) {
      console.error("[bookingExpirationJob] error:", err);
    }
  }, intervalMs);
}
