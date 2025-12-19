// backend/src/modules/bookings/booking.service.js
import { Booking } from "../../models/booking.model.js";
import { BookingItem } from "../../models/bookingItem.model.js";
import { BookingSlot } from "../../models/bookingSlot.model.js";
import { BookingStatus } from "../../models/bookingStatus.model.js";
import { Court } from "../../models/court.model.js";
import { Venue } from "../../models/venue.model.js";
import { VenueOpenHour } from "../../models/venueOpenHour.model.js";
import { VenueHoliday } from "../../models/venueHoliday.model.js";
import { BlackoutSlot } from "../../models/blackoutSlot.model.js";
import { Payment } from "../../models/payment.model.js";
import { getVenueConfigForDay } from "../venueConfig/venueConfig.service.js";
import { PriceRule } from "../../models/priceRule.model.js";
import mongoose from "mongoose";


const BASE_OPEN_HOUR = 5;   // 05:00 
// const BASE_CLOSE_HOUR = 22; //

function parseHour(str) {
  // "17:00" -> 17
  if (!str) return null;
  const [h] = str.split(":");
  const n = Number(h);
  return Number.isNaN(n) ? null : n;
}

function isHourInRange(hour, from, to) {
  // from/to là "HH:MM"
  const hFrom = parseHour(from);
  const hTo = parseHour(to);
  if (hFrom === null || hTo === null) return false;
  return hour >= hFrom && hour < hTo;
}

// ================== Helpers ==================

function generateBookingCode() {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `BK${datePart}-${randomPart}`;
}

// slotIndices -> nhóm các đoạn liên tiếp [start, end]
function groupContinuousSlots(slotIndices) {
  const sorted = [...new Set(slotIndices)].sort((a, b) => a - b);
  if (sorted.length === 0) return [];

  const segments = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
    } else {
      segments.push({ start, end: prev });
      start = cur;
      prev = cur;
    }
  }
  segments.push({ start, end: prev });
  return segments;
}

function timeStrToMinutes(str) {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}


// Lấy [minStartHour, maxEndHour] từ danh sách priceRules trong ngày
function getHoursRangeFromPriceRules(priceRules) {
  if (!Array.isArray(priceRules) || priceRules.length === 0) {
    return null;
  }

  let minFromHour = 23;
  let maxToHour = 0;

  for (const r of priceRules) {
    if (!r.timeFrom || !r.timeTo) continue;

    const fromH = parseInt(r.timeFrom.slice(0, 2), 10);
    const toH = parseInt(r.timeTo.slice(0, 2), 10);

    if (!Number.isNaN(fromH)) {
      minFromHour = Math.min(minFromHour, fromH);
    }
    if (!Number.isNaN(toH)) {
      maxToHour = Math.max(maxToHour, toH);
    }
  }

  if (maxToHour <= minFromHour) return null;
  return { minFromHour, maxToHour };
}

// Lấy pricePerHour cho 1 slot theo danh sách priceRules
function getPriceForSlotFromRules(priceRules, hour, bookingType = "online") {
  if (!Array.isArray(priceRules) || priceRules.length === 0) return null;

  const hhmm = `${String(hour).padStart(2, "0")}:00`;

  const rule = priceRules.find((r) => {
    if (!r.timeFrom || !r.timeTo) return false;
    const from = r.timeFrom.slice(0, 5);
    const to = r.timeTo.slice(0, 5);
    return from <= hhmm && hhmm < to;
  });

  if (!rule) return null;

  // Online booking: ưu tiên fixedPricePerHour
  if (bookingType === "walkin") {
    if (typeof rule.walkinPricePerHour === "number") return rule.walkinPricePerHour;
    if (typeof rule.fixedPricePerHour === "number") return rule.fixedPricePerHour;
  } else {
    if (typeof rule.fixedPricePerHour === "number") return rule.fixedPricePerHour;
    if (typeof rule.walkinPricePerHour === "number") return rule.walkinPricePerHour;
  }

  return null;
}


// Rule mock giá (giống FE): slotIndex = giờ (05–22)
function getPricePerHourFromSlotIndex(slotIndex) {
  const hour = slotIndex;
  if (hour >= 5 && hour < 9) return 100000;
  if (hour >= 9 && hour < 16) return 120000;
  if (hour >= 16 && hour < 23) return 150000;
  return 120000;
}

// ================== Error custom ==================

export class SlotConflictError extends Error {
  constructor(message = "Some slots are already taken", conflicts = []) {
    super(message);
    this.name = "SlotConflictError";
    this.conflicts = conflicts; // [{ courtId, slotIndex }]
  }
}

// ================== Service: tạo booking ==================

export async function createBookingFromSlots(payload) {
  const { userId, venueId, date, courts, discount = 0, note, addonsTotal = 0, addons } = payload;

  if (!userId) throw new Error("userId is required");
  if (!venueId) throw new Error("venueId is required");
  if (!date) throw new Error("date is required");
  if (!Array.isArray(courts) || courts.length === 0) {
    throw new Error("courts array is required");
  }

  const bookingDate = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(bookingDate.getTime())) {
    throw new Error("Invalid date format, expected YYYY-MM-DD");
  }

  // Check venue
  const venue = await Venue.findById(venueId);
  if (!venue) throw new Error("Venue not found");

  // Check courts thuộc venue
  const courtIds = courts.map((c) => c.courtId);
  const courtDocs = await Court.find({ _id: { $in: courtIds }, venue: venueId });
  if (courtDocs.length !== courtIds.length) {
    throw new Error("Some courts do not belong to the venue");
  }

  // Lấy status PENDING
  const pendingStatus = await BookingStatus.findOne({ code: "PENDING" });
  if (!pendingStatus) {
    throw new Error("BookingStatus with code PENDING not found");
  }

  const bookingCode = generateBookingCode();

  // 1) Tạo booking header
  const booking = await Booking.create({
    code: bookingCode,
    user: userId,
    venue: venueId,
    status: pendingStatus._id,
    grossAmount: 0,
    discount: discount || 0,
    totalAmount: 0,
    note: note || "",
  });

  // 2) Tạo BookingSlot cho từng slot
  const bookingSlotsDocs = [];
  for (const c of courts) {
    const { courtId, slotIndices } = c;
    if (!Array.isArray(slotIndices) || slotIndices.length === 0) continue;

    for (const slotIndex of slotIndices) {
      bookingSlotsDocs.push({
        booking: booking._id,
        court: courtId,
        date: bookingDate,
        slotIndex,
      });
    }
  }

  try {
    await BookingSlot.insertMany(bookingSlotsDocs, { ordered: true });
  } catch (err) {
    if (err && err.code === 11000) {
      const conflictConditions = bookingSlotsDocs.map((doc) => ({
        court: doc.court,
        date: doc.date,
        slotIndex: doc.slotIndex,
      }));

      const existing = await BookingSlot.find({
        $or: conflictConditions,
      }).lean();

      await BookingSlot.deleteMany({ booking: booking._id });
      await Booking.deleteOne({ _id: booking._id });

      const conflicts = existing.map((s) => ({
        courtId: s.court.toString(),
        slotIndex: s.slotIndex,
      }));

      throw new SlotConflictError(
        "Một hoặc nhiều khung giờ bạn chọn đã có người giữ chỗ.",
        conflicts
      );
    }

    await BookingSlot.deleteMany({ booking: booking._id });
    await Booking.deleteOne({ _id: booking._id });
    throw err;
  }

  // 3) BookingItem: gom theo court + segment liên tiếp (NHƯNG tách theo GIÁ)
  let grossAmount = 0;
  const bookingItemsDocs = [];

  // === Lấy PriceRule theo ngày giống availability ===
  const weekday = bookingDate.getDay(); // 0..6
  const isoDay = weekday === 0 ? 7 : weekday; // 1..7

  const priceRulesForDay = await PriceRule.find({
    venue: venueId,
    dayOfWeekFrom: { $lte: isoDay },
    dayOfWeekTo: { $gte: isoDay },
  }).lean();

  // Helper: giá cho 1 slotIndex (slotIndex ở đây chính là "giờ" 05..22)
  const getPriceForSlotIndex = (slotIndex) => {
    let p = getPriceForSlotFromRules(priceRulesForDay, slotIndex, "online");
    if (p == null) p = getPricePerHourFromSlotIndex(slotIndex); // fallback mock
    return p;
  };

  // Helper: group liên tiếp + cùng giá => booking item
  function groupContinuousSamePrice(slotIndices) {
    const sorted = [...new Set(slotIndices)].sort((a, b) => a - b);
    if (sorted.length === 0) return [];

    const groups = [];
    let start = sorted[0];
    let prev = sorted[0];
    let curPrice = getPriceForSlotIndex(start);

    for (let i = 1; i < sorted.length; i++) {
      const idx = sorted[i];
      const price = getPriceForSlotIndex(idx);

      const isContinuous = idx === prev + 1;
      const samePrice = price === curPrice;

      if (isContinuous && samePrice) {
        prev = idx;
      } else {
        groups.push({ start, end: prev, unitPrice: curPrice });
        start = idx;
        prev = idx;
        curPrice = price;
      }
    }

    groups.push({ start, end: prev, unitPrice: curPrice });
    return groups;
  }

  for (const c of courts) {
    const { courtId, slotIndices } = c;
    if (!Array.isArray(slotIndices) || slotIndices.length === 0) continue;

    const segments = groupContinuousSamePrice(slotIndices);

    for (const seg of segments) {
      const hoursCount = seg.end - seg.start + 1;
      const pricePerHour = seg.unitPrice;
      const lineAmount = pricePerHour * hoursCount;

      bookingItemsDocs.push({
        booking: booking._id,
        court: courtId,
        date: bookingDate,
        slotStart: seg.start,
        slotEnd: seg.end,
        unitPrice: pricePerHour,
        lineAmount,
      });

      grossAmount += lineAmount;
    }
  }

  if (bookingItemsDocs.length > 0) {
    await BookingItem.insertMany(bookingItemsDocs);
  }

  // 4) Update tiền trên Booking (CỘNG addonsTotal)
  const addonsItems = Array.isArray(addons?.items) ? addons.items : [];
  const addonsTotalNumber =
    Number(addons?.total ?? addonsTotal) || 0;

  const extra = addonsTotalNumber;
  const finalGross = grossAmount + extra;
  const finalDiscount = discount || 0;
  const finalTotal = finalGross - finalDiscount;

  booking.grossAmount = finalGross;
  booking.discount = finalDiscount;
  booking.totalAmount = finalTotal;
  booking.addons = {
    items: addonsItems,
    total: addonsTotalNumber,
  };
  await booking.save();
  const bookingItems = await BookingItem.find({ booking: booking._id })
    .populate("court")
    .lean();

  return {
    booking,
    items: bookingItems,
  };
}


// ================== Service: availability venue ==================


// Input: { venueId, dateStr: "YYYY-MM-DD" }
export async function getVenueAvailability({ venueId, dateStr }) {
  if (!venueId) throw new Error("venueId is required");
  if (!dateStr) throw new Error("date is required (YYYY-MM-DD)");

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date format, expected YYYY-MM-DD");
  }

  const venue = await Venue.findById(venueId).lean();
  if (!venue) throw new Error("Venue not found");

  // 0) Lấy courts; nếu seed mới chỉ có courtsCount mà chưa có Court docs -> auto create
  let courts = await Court.find({ venue: venueId, isActive: true })
    .sort({ name: 1 })
    .lean();

  if (!courts || courts.length === 0) {
    const count = Math.max(1, Number(venue.courtsCount || 1));

    // Tạo courts theo chuẩn "Sân 1..n"
    await Court.insertMany(
      Array.from({ length: count }, (_, i) => ({
        venue: venue._id,
        name: `Sân ${i + 1}`,
        surface: "Hard court",
        isActive: true,
      }))
    );

    courts = await Court.find({ venue: venueId, isActive: true })
      .sort({ name: 1 })
      .lean();
  }

  // Nếu vẫn không có court (trường hợp dữ liệu venue hỏng)
  if (!courts || courts.length === 0) {
    return {
      venueId,
      date: dateStr,
      slotMinutes: venue.slotMinutes || 60,
      openTime: null,
      closeTime: null,
      courts: [],
    };
  }

  // JS day: 0 = CN, 1 = T2, ..., 6 = T7
  const weekday = date.getDay();
  const isoDay = weekday === 0 ? 7 : weekday; // 1..7

  // 1) Kiểm tra ngày nghỉ
  const holiday = await VenueHoliday.findOne({ venue: venueId, date }).lean();
  if (holiday) {
    return {
      venueId,
      date: dateStr,
      slotMinutes: venue.slotMinutes || 60,
      openTime: null,
      closeTime: null,
      isHoliday: true,
      holidayReason: holiday.reason || null,
      courts: courts.map((c) => ({
        courtId: c._id.toString(),
        courtName: c.name,
        slots: [],
      })),
    };
  }

  // 2) Lấy giờ mở cửa theo weekday (config open hours)
  // ✅ dùng isoDay (1..7) để match data open hours thường config theo 1..7
  let openHour = await VenueOpenHour.findOne({
    venue: venueId,
    weekday: isoDay,
  }).lean();

  if (!openHour) {
    // Fallback nếu chưa config open hours
    openHour = {
      timeFrom: "05:00",
      timeTo: "22:00",
    };
  }

  let baseStartHour = parseInt(openHour.timeFrom.slice(0, 2), 10);
  let baseEndHourExclusive = parseInt(openHour.timeTo.slice(0, 2), 10); // exclusive

  if (
    Number.isNaN(baseStartHour) ||
    Number.isNaN(baseEndHourExclusive) ||
    baseEndHourExclusive <= baseStartHour
  ) {
    throw new Error("Invalid open hour config for venue");
  }

  // 3) Lấy PriceRule theo ngày
  const priceRulesForDay = await PriceRule.find({
    venue: venueId,
    dayOfWeekFrom: { $lte: isoDay },
    dayOfWeekTo: { $gte: isoDay },
  }).lean();

  const rangeFromRules = getHoursRangeFromPriceRules(priceRulesForDay);
  if (rangeFromRules) {
    const { minFromHour, maxToHour } = rangeFromRules;
    baseStartHour = Math.max(baseStartHour, minFromHour);
    baseEndHourExclusive = Math.min(baseEndHourExclusive, maxToHour);
  }

  if (baseEndHourExclusive <= baseStartHour) {
    return {
      venueId,
      date: dateStr,
      slotMinutes: venue.slotMinutes || 60,
      openTime: null,
      closeTime: null,
      isHoliday: false,
      holidayReason: null,
      courts: courts.map((c) => ({
        courtId: c._id.toString(),
        courtName: c.name,
        slots: [],
      })),
    };
  }

  const firstSlotIndex = baseStartHour;
  const lastSlotIndex = baseEndHourExclusive - 1;
  const slotMinutes = venue.slotMinutes || 60;

  const courtIds = courts.map((c) => c._id);

  // 4) Lấy bookingSlots + blackout trong ngày
  const bookingSlots = await BookingSlot.find({
    court: { $in: courtIds },
    date,
    slotIndex: { $gte: firstSlotIndex, $lte: lastSlotIndex },
  }).lean();

  const bookedSet = new Set(
    bookingSlots.map((s) => `${s.court.toString()}#${s.slotIndex}`)
  );

  const blackouts = await BlackoutSlot.find({
    court: { $in: courtIds },
    date,
  }).lean();

  const blackoutSet = new Set();
  for (const b of blackouts) {
    for (let idx = b.slotStart; idx < b.slotEnd; idx += 1) {
      blackoutSet.add(`${b.court.toString()}#${idx}`);
    }
  }

  // 5) Build slots cho từng court
  const courtsWithSlots = courts.map((c) => {
    const slots = [];

    for (let idx = firstSlotIndex; idx <= lastSlotIndex; idx += 1) {
      const startMin = idx * 60;
      const endMin = startMin + slotMinutes;

      const key = `${c._id.toString()}#${idx}`;
      let status = "available";
      if (bookedSet.has(key)) status = "booked";
      if (blackoutSet.has(key)) status = "blackout";

      let pricePerHour = getPriceForSlotFromRules(priceRulesForDay, idx, "online");
      if (pricePerHour == null) {
        pricePerHour = getPricePerHourFromSlotIndex(idx);
      }

      slots.push({
        slotIndex: idx,
        timeFrom: minutesToTimeStr(startMin),
        timeTo: minutesToTimeStr(endMin),
        status,
        pricePerHour,
      });
    }

    return {
      courtId: c._id.toString(),
      courtName: c.name,
      slots,
    };
  });

  return {
    venueId,
    date: dateStr,
    slotMinutes,
    weekday, 
    openTime: minutesToTimeStr(baseStartHour * 60),
    closeTime: minutesToTimeStr(baseEndHourExclusive * 60),
    isHoliday: false,
    holidayReason: null,
    courts: courtsWithSlots,
  };
}



// ================== Service: lịch sử user ==================

export async function getUserBookingHistory({
  userId,
  page = 1,
  limit = 5,
  statusCodes,
}) {
  const query = { user: userId };

  if (Array.isArray(statusCodes) && statusCodes.length > 0) {
    const statusDocs = await BookingStatus.find({
      code: { $in: statusCodes },
    })
      .select("_id")
      .lean();

    if (statusDocs.length > 0) {
      query.status = { $in: statusDocs.map((s) => s._id) };
    }
  }

  const pageNumber = Number(page) > 0 ? Number(page) : 1;
  const pageSize = Number(limit) > 0 ? Number(limit) : 5;

  const [total, bookings] = await Promise.all([
    Booking.countDocuments(query),
    Booking.find(query)
      .populate("venue", "name address avatarImage images")
      .populate("status", "code label isFinal isCancel")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),
  ]);

  if (bookings.length === 0) {
    return {
      page: pageNumber,
      limit: pageSize,
      total,
      items: [],
    };
  }

  const bookingIds = bookings.map((b) => b._id);

  const [bookingItems, payments] = await Promise.all([
    BookingItem.find({ booking: { $in: bookingIds } })
      .populate("court", "name")
      .lean(),
    Payment.find({ booking: { $in: bookingIds } })
      .populate("status", "code label isSuccess")
      .lean(),
  ]);

  const itemsByBooking = new Map();
  for (const item of bookingItems) {
    const key = item.booking.toString();
    if (!itemsByBooking.has(key)) itemsByBooking.set(key, []);
    itemsByBooking.get(key).push(item);
  }

  const paymentsByBooking = new Map();
  for (const p of payments) {
    const key = p.booking.toString();
    if (!paymentsByBooking.has(key)) paymentsByBooking.set(key, []);
    paymentsByBooking.get(key).push(p);
  }

  function slotIndexToTime(slotIndex) {
    const h = Number(slotIndex);
    if (Number.isNaN(h)) return "";
    return `${String(h).padStart(2, "0")}:00`;
  }


  const items = bookings.map((b) => {
    const bookingId = b._id.toString();
    const bi = itemsByBooking.get(bookingId) || [];
    const firstItem = bi[0] || null;

    let date = null;
    let slotStart = null;
    let slotEnd = null;
    let courtName = null;

    if (firstItem) {
      date = firstItem.date;
      slotStart = firstItem.slotStart;
      slotEnd = firstItem.slotEnd;
      courtName = firstItem.court?.name || null;
    }

    const paymentList = paymentsByBooking.get(bookingId) || [];
    const successPayment = paymentList.find((p) => p.status?.isSuccess);
    const primaryPayment = successPayment || paymentList[0];

    const paymentStatusLabel =
      primaryPayment?.status?.label || "Chưa thanh toán";
    const paymentStatusCode = primaryPayment?.status?.code || "UNPAID";
    const paymentMethod = primaryPayment?.provider || null;

    let dateLabel = "";
    let timeLabel = "";

    if (date instanceof Date) {
      const d = date;
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      dateLabel = `${dd}/${mm}/${yyyy}`;
    }

    if (slotStart != null && slotEnd != null) {
      const from = slotIndexToTime(slotStart);
      const to = slotIndexToTime(slotEnd + 1);
      timeLabel = `${from} - ${to}`;
    }

    return {
      id: bookingId,
      code: b.code,
      venueName: b.venue?.name || "",
      venueAddress: b.venue?.address || "",
      courtName: courtName || "Sân chưa rõ",
      venue: b.venue
        ? {
          id: b.venue._id?.toString(),
          name: b.venue.name || "",
          address: b.venue.address || "",
          avatarImage: b.venue.avatarImage || "",
          images: Array.isArray(b.venue.images) ? b.venue.images : [],
        }
        : null,

      date,
      dateLabel,
      timeLabel,

      bookingStatusCode: b.status?.code || "",
      bookingStatusLabel: b.status?.label || "",
      bookingIsFinal: !!b.status?.isFinal,
      bookingIsCancel: !!b.status?.isCancel,

      paymentStatusCode,
      paymentStatusLabel,
      paymentMethod,

      totalAmount: b.totalAmount || 0,
      createdAt: b.createdAt,
    };
  });

  return {
    page: pageNumber,
    limit: pageSize,
    total,
    items,
  };
}

export async function getUserBookingDetail({ userId, bookingId }) {
  if (!userId) {
    const err = new Error("userId is required");
    err.statusCode = 401;
    throw err;
  }

  if (!bookingId) {
    const err = new Error("bookingId is required");
    err.statusCode = 400;
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    const err = new Error("Invalid bookingId");
    err.statusCode = 400;
    throw err;
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
  })
    .populate("venue", "name address phone heroAddress heroPhone")
    .populate("status", "code label isFinal isCancel")
    .lean();

  if (!booking) {
    const err = new Error("Booking not found");
    err.statusCode = 404;
    throw err;
  }

  const items = await BookingItem.find({ booking: booking._id })
    .populate("court", "name")
    .sort({ date: 1, slotStart: 1 })
    .lean();

  const payments = await Payment.find({ booking: booking._id })
    .populate("status", "code label isSuccess isFinal")
    .sort({ createdAt: 1 })
    .lean();

  // === helper: convert slotIndex -> HH:MM ===
  function slotIndexToTimeLabel(slotIndex) {
    const h = Number(slotIndex);
    if (Number.isNaN(h)) return "";
    return `${String(h).padStart(2, "0")}:00`;
  }


  // === build từng dòng khung giờ / sân ===
  const lineItems = items.map((it, idx) => {
    const date = new Date(it.date);
    const dateLabel = date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const timeFrom = slotIndexToTimeLabel(it.slotStart);
    const timeTo = slotIndexToTimeLabel(it.slotEnd + 1);

    return {
      id: it._id.toString(),
      index: idx + 1,
      courtName: it.court?.name || "Sân",
      note: booking.note || "",
      date: it.date,
      dateLabel,
      slotStart: it.slotStart,
      slotEnd: it.slotEnd,
      timeFrom,
      timeTo,
      timeLabel: `${timeFrom} - ${timeTo}`,
      unitPrice: it.unitPrice ?? null,
      lineAmount: it.lineAmount ?? null,
    };
  });

  // === dateLabel chung cho cả đơn (lấy theo booking.date hoặc item đầu) ===
  let mainDateLabel = "";
  if (booking.date) {
    const d = new Date(booking.date);
    if (!Number.isNaN(d.getTime())) {
      mainDateLabel = d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  } else if (items.length > 0) {
    const d = new Date(items[0].date);
    if (!Number.isNaN(d.getTime())) {
      mainDateLabel = d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  }

  // tổng số slot (để FE muốn ghi "2 khung giờ" thì chỉ cần dựa vào đây)
  const slotCount = items.reduce(
    (sum, it) => sum + (it.slotEnd - it.slotStart + 1),
    0
  );

  const lastPayment = payments.length ? payments[payments.length - 1] : null;

  return {
    id: booking._id.toString(),
    code: booking.code,
    createdAt: booking.createdAt,

    // ngày hiển thị chính (FE show ở header)
    dateLabel: mainDateLabel,

    // không trả timeRange gộp nữa, FE dùng items để hiển thị từng khung giờ
    slotCount,

    venue: {
      id: booking.venue?._id?.toString(),
      name: booking.venue?.name || "",
      address:
        booking.venue?.heroAddress ||
        booking.venue?.address ||
        "",
      phone: booking.venue?.heroPhone || booking.venue?.phone || "",
    },

    status: {
      code: booking.status?.code,
      label: booking.status?.label,
      isFinal: booking.status?.isFinal ?? false,
      isCancel: booking.status?.isCancel ?? false,
    },

    amount: {
      grossAmount: booking.grossAmount ?? 0,
      discount: booking.discount ?? 0,
      totalAmount: booking.totalAmount ?? 0,
    },

    // danh sách chi tiết khung giờ
    items: lineItems,

    // payment cuối cùng (nếu có)
    payment: lastPayment
      ? {
        provider: lastPayment.provider,
        amount: lastPayment.amount,
        currency: lastPayment.currency,
        statusCode: lastPayment.status?.code,
        statusLabel: lastPayment.status?.label,
        isSuccess: lastPayment.status?.isSuccess ?? false,
        isFinal: lastPayment.status?.isFinal ?? false,
        createdAt: lastPayment.createdAt,
      }
      : null,

    addons: booking.addons || { items: [], total: 0 },
  };
}


// ================== Service: owner daily overview ==================


export async function getOwnerDailyOverview({ ownerId, dateStr, venueId }) {
  if (!ownerId) {
    const err = new Error("ownerId is required");
    err.statusCode = 401;
    throw err;
  }

  if (!dateStr) {
    const err = new Error("Query param 'date' (YYYY-MM-DD) is required");
    err.statusCode = 400;
    throw err;
  }

  const bookingDate = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(bookingDate.getTime())) {
    const err = new Error("Invalid date format, expected YYYY-MM-DD");
    err.statusCode = 400;
    throw err;
  }

  let venue;
  if (venueId) {
    venue = await Venue.findOne({
      _id: venueId,
      manager: ownerId,
      isActive: true,
    }).lean();
  } else {
    venue = await Venue.findOne({
      manager: ownerId,
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .lean();
  }

  if (!venue) {
    return {
      venue: null,
      date: dateStr,
      availability: null,
      bookings: [],
    };
  }

  const availability = await getVenueAvailability({
    venueId: venue._id,
    dateStr,
  });

  const courtIds = (availability.courts || []).map((c) => c.courtId);
  if (!courtIds.length) {
    return {
      venue: {
        id: venue._id.toString(),
        name: venue.name,
        address: venue.address,
      },
      date: dateStr,
      availability,
      bookings: [],
    };
  }

  const bookingItems = await BookingItem.find({
    court: { $in: courtIds },
    date: bookingDate,
  })
    .populate({
      path: "booking",
      populate: [
        { path: "status", select: "code label isFinal isCancel" },
        { path: "user", select: "fullName name phoneNumber phone" },
      ],
    })
    .populate("court", "name")
    .lean();

  function slotIndexToTime(idx) {
    const hh = String(idx).padStart(2, "0");
    return `${hh}:00`;
  }

  const rows = bookingItems.map((item) => {
    const booking = item.booking || {};
    const user = booking.user || {};
    const statusDoc = booking.status || {};
    const court = item.court || {};

    const slotStart = item.slotStart;
    const slotEnd = item.slotEnd;

    const startTime = slotIndexToTime(slotStart);
    const endTime = slotIndexToTime(slotEnd + 1);

    // ================== PHÂN LOẠI STATUS ==================
    // Ưu tiên: cancelled > completed > pending
    let normalizedStatus = "pending";

    // ngày + giờ hiện tại (server)
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const currentHour = now.getHours();

    // slot index ở đây chính là giờ thực tế (06,07,...)
    const startHour = slotStart;
    const endHour = slotEnd + 1; // vì hiển thị đến HH+1:00

    if (statusDoc.isCancel) {
      // 1) ĐÃ HỦY: luôn ưu tiên hiển thị "Đã huỷ"
      normalizedStatus = "cancelled";
    } else if (statusDoc.isFinal) {
      // 2) Các trạng thái final như COMPLETED / NO_SHOW
      normalizedStatus = "completed";
    } else {
      // 3) Các trạng thái chưa final (PENDING, CONFIRMED, ...)
      //    -> dựa vào ngày + giờ để quyết định pending / completed

      if (dateStr < todayStr) {
        // Ngày đã qua
        normalizedStatus = "completed";
      } else if (dateStr > todayStr) {
        // Ngày tương lai
        normalizedStatus = "pending";
      } else {
        // Cùng ngày hôm nay
        if (currentHour >= endHour) {
          // Qua giờ đặt sân -> Đã xong
          normalizedStatus = "completed";
        } else {
          // Chưa đến giờ / đang trong khung giờ -> vẫn coi là "Đã đặt"
          normalizedStatus = "pending";
        }
      }
    }


    return {
      id: item._id.toString(),
      code: booking.code,
      courtId: court._id?.toString(),
      courtName: court.name || "Sân",
      customerName: user.fullName || user.name || "Khách",
      phone: user.phoneNumber || user.phone || "",
      startTime,
      endTime,
      slotStartIndex: slotStart,
      slotEndIndex: slotEnd,
      slotsCount: 1,
      statusCode: statusDoc.code,
      statusLabel: statusDoc.label,
      status: normalizedStatus,
      bookedAt: dateStr,
    };
  });

  return {
    venue: {
      id: venue._id.toString(),
      name: venue.name,
      address: venue.address,
    },
    date: dateStr,
    availability,
    bookings: rows,
  };
}

// ================== Service: admin daily overview ==================

export async function getAdminDailyOverview({ dateStr, venueId }) {
  if (!dateStr) {
    const err = new Error("Query param 'date' (YYYY-MM-DD) is required");
    err.statusCode = 400;
    throw err;
  }

  const bookingDate = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(bookingDate.getTime())) {
    const err = new Error("Invalid date format, expected YYYY-MM-DD");
    err.statusCode = 400;
    throw err;
  }

  // KHÁC SO VỚI OWNER: KHÔNG FILTER THEO manager (ownerId)
  let venue;
  if (venueId) {
    // Admin được xem bất kỳ venue nào
    venue = await Venue.findOne({
      _id: venueId,
      isActive: true,
    }).lean();
  } else {
    // Nếu không truyền venueId thì lấy venue đầu tiên còn active
    venue = await Venue.findOne({
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .lean();
  }

  if (!venue) {
    return {
      venue: null,
      date: dateStr,
      availability: null,
      bookings: [],
    };
  }

  const availability = await getVenueAvailability({
    venueId: venue._id,
    dateStr,
  });

  const courtIds = (availability.courts || []).map((c) => c.courtId);
  if (!courtIds.length) {
    return {
      venue: {
        id: venue._id.toString(),
        name: venue.name,
        address: venue.address,
      },
      date: dateStr,
      availability,
      bookings: [],
    };
  }

  const bookingItems = await BookingItem.find({
    court: { $in: courtIds },
    date: bookingDate,
  })
    .populate({
      path: "booking",
      populate: [
        { path: "status", select: "code label isFinal isCancel" },
        { path: "user", select: "fullName name phoneNumber phone" },
      ],
    })
    .populate("court", "name")
    .lean();

  function slotIndexToTime(idx) {
    const hh = String(idx).padStart(2, "0");
    return `${hh}:00`;
  }

  const rows = bookingItems.map((item) => {
    const booking = item.booking || {};
    const user = booking.user || {};
    const statusDoc = booking.status || {};
    const court = item.court || {};

    const slotStart = item.slotStart;
    const slotEnd = item.slotEnd;

    const startTime = slotIndexToTime(slotStart);
    const endTime = slotIndexToTime(slotEnd + 1);

    // Ưu tiên: cancelled > completed > pending
    let normalizedStatus = "pending";

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // "YYYY-MM-DD"
    const currentHour = now.getHours();

    const startHour = slotStart;
    const endHour = slotEnd + 1;

    if (statusDoc.isCancel) {
      normalizedStatus = "cancelled";
    } else if (statusDoc.isFinal) {
      normalizedStatus = "completed";
    } else {
      if (dateStr < todayStr) {
        normalizedStatus = "completed";
      } else if (dateStr > todayStr) {
        normalizedStatus = "pending";
      } else {
        if (currentHour >= endHour) {
          normalizedStatus = "completed";
        } else {
          normalizedStatus = "pending";
        }
      }
    }

    return {
      id: item._id.toString(),
      code: booking.code,
      courtId: court._id?.toString(),
      courtName: court.name || "Sân",
      customerName: user.fullName || user.name || "Khách",
      phone: user.phoneNumber || user.phone || "",
      startTime,
      endTime,
      slotStartIndex: slotStart,
      slotEndIndex: slotEnd,
      slotsCount: 1,
      statusCode: statusDoc.code,
      statusLabel: statusDoc.label,
      status: normalizedStatus,
      bookedAt: dateStr,
    };
  });

  return {
    venue: {
      id: venue._id.toString(),
      name: venue.name,
      address: venue.address,
    },
    date: dateStr,
    availability,
    bookings: rows,
  };
}


async function getBookingStatusId(code) {
  const status = await BookingStatus.findOne({ code }).lean();
  if (!status) {
    const err = new Error(`BookingStatus with code=${code} not found`);
    err.statusCode = 500;
    throw err;
  }
  return status._id;
}



export async function cancelUserBooking({ userId, bookingId }) {
  if (!userId) {
    const err = new Error("userId is required");
    err.statusCode = 401;
    throw err;
  }

  if (!bookingId) {
    const err = new Error("bookingId is required");
    err.statusCode = 400;
    throw err;
  }

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    const err = new Error("Invalid bookingId");
    err.statusCode = 400;
    throw err;
  }

  const booking = await Booking.findOne({
    _id: bookingId,
    user: userId,
  }).populate("status", "code label isFinal isCancel");

  if (!booking) {
    const err = new Error("Booking not found");
    err.statusCode = 404;
    throw err;
  }

  const currentStatus = booking.status;

  // Đã hủy rồi
  if (currentStatus?.isCancel) {
    const err = new Error("Đơn đặt sân đã được hủy trước đó.");
    err.statusCode = 400;
    throw err;
  }

  // Đơn đã hoàn tất / trạng thái cuối không phải hủy => không cho hủy nữa
  if (currentStatus?.isFinal && !currentStatus?.isCancel) {
    const err = new Error("Không thể hủy đơn ở trạng thái hiện tại.");
    err.statusCode = 400;
    throw err;
  }

  const cancelledStatusId = await getBookingStatusId("CANCELLED");

  booking.status = cancelledStatusId;
  await booking.save();

  await booking.populate("status", "code label isFinal isCancel");

  return {
    id: booking._id.toString(),
    code: booking.code,
    status: {
      code: booking.status.code,
      label: booking.status.label,
      isFinal: booking.status.isFinal,
      isCancel: booking.status.isCancel,
    },
  };
}
