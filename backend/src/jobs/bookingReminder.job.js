import { Booking } from "../models/booking.model.js";
import { BookingStatus } from "../models/bookingStatus.model.js";
import { BookingItem } from "../models/bookingItem.model.js";
import { Venue } from "../models/venue.model.js";
import { createNotification } from "../modules/notifications/notification.service.js";

function buildStartAt(dateObj, slotStart) {
  // slotStart đang là số (giờ) theo code của bạn
  const d = new Date(dateObj);
  d.setHours(Number(slotStart) || 0, 0, 0, 0);
  return d;
}

export function startBookingReminderJob() {
  const intervalMs = 60 * 1000;

  setInterval(async () => {
    try {
      const now = new Date();

      const confirmedStatus = await BookingStatus.findOne({ code: "CONFIRMED" }).lean();
      if (!confirmedStatus) return;

      // chỉ quét hôm nay + ngày mai để nhẹ DB
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      const to = new Date(from);
      to.setDate(to.getDate() + 2);

      // lấy booking items trong 2 ngày này
      const items = await BookingItem.find({ date: { $gte: from, $lt: to } })
        .select("booking venue date slotStart")
        .lean();

      if (!items.length) return;

      // map booking -> slot sớm nhất (để noti 1 lần / booking)
      const earliest = new Map();
      for (const it of items) {
        const k = String(it.booking);
        const startAt = buildStartAt(it.date, it.slotStart);
        const cur = earliest.get(k);
        if (!cur || startAt < cur.startAt) {
          earliest.set(k, {
            bookingId: k,
            venueId: String(it.venue),
            date: it.date,
            slotStart: it.slotStart,
            startAt,
          });
        }
      }

      const bookingIds = Array.from(earliest.values()).map((x) => x.bookingId);

      const bookings = await Booking.find({
        _id: { $in: bookingIds },
        status: confirmedStatus._id,
      })
        .select("_id code user venue")
        .lean();

      const bookingMap = new Map(bookings.map((b) => [String(b._id), b]));
      const venueIds = [...new Set(Array.from(earliest.values()).map((x) => x.venueId))];
      const venues = await Venue.find({ _id: { $in: venueIds } }).select("_id name").lean();
      const venueMap = new Map(venues.map((v) => [String(v._id), v.name]));

      for (const row of earliest.values()) {
        const b = bookingMap.get(row.bookingId);
        if (!b) continue;

        const remindAt = new Date(row.startAt.getTime() - 30 * 60 * 1000);
        const diff = now.getTime() - remindAt.getTime();

        // cửa sổ 70s để không miss do interval
        if (diff < 0 || diff > 70 * 1000) continue;

        const hh = String(Number(row.slotStart)).padStart(2, "0");
        const dateStr = new Date(row.date).toISOString().slice(0, 10);

        await createNotification({
          userId: b.user,
          type: "REMINDER_30M",
          level: "WARNING",
          title: "Sắp đến giờ chơi",
          content: `Còn 30 phút nữa đến giờ sân bạn đã đặt (${venueMap.get(row.venueId) ? `"${venueMap.get(row.venueId)}" - ` : ""}${dateStr} ${hh}:00).`,
          data: { bookingId: String(b._id), bookingCode: b.code, route: "/history" },
          dedupeKey: `REMINDER_30M:${b._id}`,
        });
      }
    } catch (e) {
      console.error("[bookingReminderJob] error:", e);
    }
  }, intervalMs);
}
