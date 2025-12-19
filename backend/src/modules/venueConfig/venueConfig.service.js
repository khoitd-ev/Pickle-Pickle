// backend/src/modules/venueConfig/venueConfig.service.js
import { Venue } from "../../models/venue.model.js";
import { VenueOpenHour } from "../../models/venueOpenHour.model.js";
import { PriceRule } from "../../models/priceRule.model.js";
import { HttpError } from "../../shared/errors/httpError.js";
import { Court } from "../../models/court.model.js";
/**
 * Đảm bảo venue thuộc về owner đang login
 */
async function assertOwnerVenue(ownerId, venueId) {
  const venue = await Venue.findOne({
    _id: venueId,
    manager: ownerId,
    isActive: true,
  }).lean();

  if (!venue) {
    throw new HttpError(404, "Không tìm thấy sân hoặc bạn không có quyền.");
  }

  return venue;
}


// Lấy giờ mở/đóng + priceRules cho 1 venue theo 1 ngày cụ thể
export async function getVenueConfigForDay(venueId, targetDate) {
  const d = typeof targetDate === "string" ? new Date(targetDate) : targetDate;

  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date in getVenueConfigForDay");
  }

  // JS day: 0 = CN ... 6 = Thứ 7
  const jsDay = d.getDay();
  const isoDay = jsDay === 0 ? 7 : jsDay; // 1 = T2 ... 7 = CN

  // ===== OPEN HOURS =====
  // OpenHour bạn đang lưu dạng { venue, weekday, timeFrom, timeTo } :contentReference[oaicite:3]{index=3}
  const oh = await VenueOpenHour.findOne({
    venue: venueId,
    weekday: isoDay,
  }).lean();

  const openTime = (oh?.timeFrom || "05:00").slice(0, 5);
  const closeTime = (oh?.timeTo || "22:00").slice(0, 5);

  // ===== PRICE RULES =====
  // PriceRule: { venue, dayOfWeekFrom, dayOfWeekTo, timeFrom, timeTo, fixedPricePerHour, walkinPricePerHour } :contentReference[oaicite:4]{index=4}
  const allRules = await PriceRule.find({ venue: venueId }).lean();

  // Lọc rule đúng ngày (dayOfWeekFrom/to bao trùm ngày hiện tại)
  const dayFilteredRules = allRules.filter((r) => {
    const from = typeof r.dayOfWeekFrom === "number" ? r.dayOfWeekFrom : 1;
    const to = typeof r.dayOfWeekTo === "number" ? r.dayOfWeekTo : 7;
    return from <= isoDay && isoDay <= to;
  });

  // Sort theo timeFrom tăng dần cho dễ match
  const priceRules = dayFilteredRules.sort((a, b) =>
    (a.timeFrom || "").localeCompare(b.timeFrom || "")
  );

  return { openTime, closeTime, priceRules };
}


/* ==================== OPEN HOURS ==================== */

/**
 * Lấy danh sách open-hours theo weekday cho 1 venue
 */
export async function getVenueOpenHours(ownerId, venueId) {
  await assertOwnerVenue(ownerId, venueId);

  const docs = await VenueOpenHour.find({ venue: venueId })
    .sort({ weekday: 1 })
    .lean();

  return docs;
}

/**
 * Thay thế toàn bộ cấu hình open-hours của 1 venue
 * body dạng: { items: [{ weekday, timeFrom, timeTo }, ...] }
 */
export async function upsertVenueOpenHours(ownerId, venueId, items) {
  await assertOwnerVenue(ownerId, venueId);

  // Xoá hết cấu hình cũ
  await VenueOpenHour.deleteMany({ venue: venueId });

  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const docs = items.map((it) => ({
    venue: venueId,
    weekday: it.weekday,
    timeFrom: it.timeFrom,
    timeTo: it.timeTo,
  }));

  const created = await VenueOpenHour.insertMany(docs);
  return created;
}

/* ==================== PRICE RULES ==================== */

/**
 * Lấy bảng giá theo khung giờ cho venue
 */
export async function getVenuePriceRules(ownerId, venueId) {
  await assertOwnerVenue(ownerId, venueId);

  const rules = await PriceRule.find({ venue: venueId })
    .sort({ dayOfWeekFrom: 1, timeFrom: 1 })
    .lean();

  return rules;
}

/**
 * Thay thế toàn bộ bảng giá theo khung giờ
 * body dạng: { items: [{ dayLabel, dayOfWeekFrom, dayOfWeekTo, timeFrom, timeTo, fixedPricePerHour, walkinPricePerHour }, ...] }
 */
export async function upsertVenuePriceRules(ownerId, venueId, items) {
  await assertOwnerVenue(ownerId, venueId);

  await PriceRule.deleteMany({ venue: venueId });

  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const docs = items.map((r) => ({
    venue: venueId,
    dayLabel: r.dayLabel,
    dayOfWeekFrom: r.dayOfWeekFrom,
    dayOfWeekTo: r.dayOfWeekTo,
    timeFrom: r.timeFrom,
    timeTo: r.timeTo,
    fixedPricePerHour: r.fixedPricePerHour,
    walkinPricePerHour: r.walkinPricePerHour,
  }));

  const created = await PriceRule.insertMany(docs);
  return created;
}


// Chuẩn hoá số nguyên >= 1
function normalizeCourtsCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null;
  return n;
}

/**
 * Update Venue.courtsCount + sync Court theo Venue
 * - Không xoá cứng court dư (chỉ isActive=false) để tránh gãy booking cũ
 * - Court active luôn được rename thành: "Sân 1..Sân N"
 */
export async function updateVenueCourtsCount(ownerId, venueId, courtsCountRaw) {
  await assertOwnerVenue(ownerId, venueId);

  const courtsCount = normalizeCourtsCount(courtsCountRaw);
  if (courtsCount == null) {
    throw new HttpError(
      400,
      "Số lượng sân con không hợp lệ (phải là số nguyên >= 1)."
    );
  }

  // 1) Update Venue.courtsCount
  const venue = await Venue.findById(venueId);
  if (!venue) throw new HttpError(404, "Không tìm thấy sân.");
  venue.courtsCount = courtsCount;
  await venue.save();

  // 2) Sync Court
  const courts = await Court.find({ venue: venueId }).sort({ createdAt: 1 }).exec();

  const active = courts.filter((c) => c.isActive !== false);
  const inactive = courts.filter((c) => c.isActive === false);

  // Nếu active > courtsCount => deactivate phần dư
  if (active.length > courtsCount) {
    const toDeactivate = active.slice(courtsCount);
    await Court.updateMany(
      { _id: { $in: toDeactivate.map((c) => c._id) } },
      { $set: { isActive: false } }
    );
  }

  // Nếu active < courtsCount => bật lại inactive trước, thiếu thì tạo mới
  if (active.length < courtsCount) {
    const need = courtsCount - active.length;

    const canReactivate = inactive.slice(0, need);
    if (canReactivate.length > 0) {
      await Court.updateMany(
        { _id: { $in: canReactivate.map((c) => c._id) } },
        { $set: { isActive: true } }
      );
    }

    const stillNeed = need - canReactivate.length;
    if (stillNeed > 0) {
      const currentActiveCount = await Court.countDocuments({
        venue: venueId,
        isActive: true,
      });

      const newDocs = [];
      for (let i = 1; i <= stillNeed; i++) {
        newDocs.push({
          venue: venueId,
          name: `Sân ${currentActiveCount + i}`,
          isActive: true,
        });
      }
      await Court.insertMany(newDocs);
    }
  }

  // 3) Rename tất cả court active => "Sân 1..Sân N"
  const finalActive = await Court.find({ venue: venueId, isActive: true })
    .sort({ createdAt: 1 })
    .exec();

  const bulk = finalActive.map((c, idx) => ({
    updateOne: {
      filter: { _id: c._id },
      update: { $set: { name: `Sân ${idx + 1}` } },
    },
  }));

  if (bulk.length > 0) await Court.bulkWrite(bulk);

  return { courtsCount };
}
