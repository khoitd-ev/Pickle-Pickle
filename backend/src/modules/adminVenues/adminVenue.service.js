// backend/src/modules/adminVenues/adminVenue.service.js
import { Venue } from "../../models/venue.model.js";
import { Court } from "../../models/court.model.js";
import { VenueOpenHour } from "../../models/venueOpenHour.model.js";
import { PriceRule } from "../../models/priceRule.model.js";
import { HttpError } from "../../shared/errors/httpError.js";
import { assertAdminManager } from "../../modules/users/user.service.js";
import { createNotification } from "../notifications/notification.service.js";



function mapVenue(v) {
  return {
    id: v._id.toString(),
    name: v.name,
    district: v.district,
    address: v.address,
    avatarImage: v.avatarImage || "",
    managerId: v.manager ? v.manager._id.toString() : null,
    managerName:
      v.manager?.fullName || v.manager?.email || "",
    status: v.isActive ? "ACTIVE" : "INACTIVE",
    courtsCount: typeof v.courtsCount === "number" ? v.courtsCount : 1,

    basePricePerHour: v.basePricePerHour || 0,
    currency: v.currency || "VND",
    images: Array.isArray(v.images)
      ? v.images.map((img) => ({
        url: img.url,
        isPrimary: !!img.isPrimary,
        sortOrder: img.sortOrder ?? 0,
      }))
      : [],
    createdAt: v.createdAt,
  };
}

export async function listVenuesService(adminId, query = {}) {
  await assertAdminManager(adminId);

  const venues = await Venue.find({})
    .populate("manager", "fullName")
    .sort({ createdAt: -1 })
    .lean();

  const venueIds = venues.map((v) => v._id);

  // 1) Lấy open hours của tất cả venue
  const openHoursDocs = await VenueOpenHour.find({ venue: { $in: venueIds } })
    .sort({ venue: 1, timeFrom: 1 })
    .lean();

  // Map: venueId -> { openTime, closeTime }
  const openHourMap = new Map();
  for (const h of openHoursDocs) {
    const key = h.venue.toString();
    const from = (h.timeFrom || "05:00").slice(0, 5);
    const to = (h.timeTo || "22:00").slice(0, 5);

    if (!openHourMap.has(key)) {
      openHourMap.set(key, { openTime: from, closeTime: to });
      continue;
    }
    const cur = openHourMap.get(key);
    if (from < cur.openTime) cur.openTime = from;
    if (to > cur.closeTime) cur.closeTime = to;
    openHourMap.set(key, cur);
  }

  // 2) Lấy price rules của tất cả venue, sort để lấy rule "đầu tiên theo giờ bắt đầu"
  const priceRulesDocs = await PriceRule.find({ venue: { $in: venueIds } })
    .sort({ venue: 1, dayOfWeekFrom: 1, timeFrom: 1 })
    .lean();

  // Map: venueId -> first rule (shape UI)
  const firstRuleMap = new Map();
  for (const r of priceRulesDocs) {
    const key = r.venue.toString();
    if (firstRuleMap.has(key)) continue;

    const price =
      typeof r.fixedPricePerHour === "number"
        ? r.fixedPricePerHour
        : typeof r.walkinPricePerHour === "number"
          ? r.walkinPricePerHour
          : 0;

    firstRuleMap.set(key, {
      id: r._id.toString(),
      startTime: (r.timeFrom || "").slice(0, 5),
      endTime: (r.timeTo || "").slice(0, 5),
      price,
    });
  }

  // 3) Trả list venues đã "hydrate" sẵn open/close + priceRules[0]
  return venues.map((v) => {
    const dto = mapVenue(v);
    const key = v._id.toString();

    const oh = openHourMap.get(key);
    dto.openTime = oh?.openTime || "05:00";
    dto.closeTime = oh?.closeTime || "22:00";

    const firstRule = firstRuleMap.get(key);
    dto.priceRules = firstRule ? [firstRule] : [];


    dto.firstPricePerHour = firstRule?.price || 0;

    return dto;
  });
}



export async function createVenueService(adminId, payload) {
  await assertAdminManager(adminId);

  const {
    name,
    district,
    address,
    managerId,
    basePricePerHour = 0,
    images = [],
    avatarImage,
    priceRules = [],
    courtsCount = 1,
  } = payload;

  if (!name) throw new HttpError(400, "Tên sân là bắt buộc");
  if (!managerId) throw new HttpError(400, "Chủ sân (owner) là bắt buộc");

  const doc = await Venue.create({
    name,
    district: district || "",
    address: address || "",
    manager: managerId,
    latitude: null,
    longitude: null,
    timeZone: "Asia/Ho_Chi_Minh",
    slotMinutes: 60,
    isActive: true,
    courtsCount: Number(courtsCount) || 1,
    basePricePerHour,
    currency: "VND",
    images: Array.isArray(images)
      ? images.map((url, idx) =>
        typeof url === "string"
          ? { url, isPrimary: idx === 0, sortOrder: idx }
          : {
            url: url.url,
            isPrimary: !!url.isPrimary,
            sortOrder: url.sortOrder ?? idx,
          }
      )
      : [],
    avatarImage: avatarImage || "",
    priceRules,
  });
  const count = Math.max(1, Number(courtsCount) || 1);

  await Court.insertMany(
    Array.from({ length: count }, (_, i) => ({
      venue: doc._id,
      name: `Sân ${i + 1}`,
      surface: "Hard court",
      isActive: true,
    }))
  );

  return mapVenue(doc.toObject());
}

export async function updateVenueService(adminId, venueId, payload) {
  await assertAdminManager(adminId);

  const {
    name,
    district,
    address,
    managerId,
    status,
    courtsCount,
    avatarImage,
    basePricePerHour,
    images,
    priceRules,
  } = payload;

  const update = {};

  if (name !== undefined) update.name = name;
  if (district !== undefined) update.district = district;
  if (address !== undefined) update.address = address;
  if (managerId !== undefined) update.manager = managerId;

  if (basePricePerHour !== undefined) {
    update.basePricePerHour = Number(basePricePerHour) || 0;
  }

  if (status) {
    update.isActive = status.toUpperCase() === "ACTIVE";
  }

  if (images !== undefined) {
    update.images = Array.isArray(images)
      ? images.map((url, idx) =>
        typeof url === "string"
          ? { url, isPrimary: idx === 0, sortOrder: idx }
          : {
            url: url.url,
            isPrimary: !!url.isPrimary,
            sortOrder: url.sortOrder ?? idx,
          }
      )
      : [];
  }

  if (avatarImage !== undefined) update.avatarImage = avatarImage;
  if (priceRules !== undefined) update.priceRules = priceRules;

  // ====== courtsCount: lưu vào Venue + sync Court ======
  let targetCourtsCount = null;
  if (courtsCount !== undefined) {
    targetCourtsCount = Math.max(1, Number(courtsCount) || 1);
    update.courtsCount = targetCourtsCount;
  }

  const doc = await Venue.findByIdAndUpdate(venueId, update, { new: true })
    .populate("manager", "fullName email")
    .lean();

  if (!doc) throw new HttpError(404, "Không tìm thấy sân");

  // Sync courts sau khi update venue
  if (targetCourtsCount !== null) {
    const courts = await Court.find({ venue: venueId })
      .sort({ createdAt: 1 })
      .lean();

    const activeCourts = courts.filter((c) => c.isActive !== false);
    const activeCount = activeCourts.length;

    if (targetCourtsCount > activeCount) {
      const more = targetCourtsCount - activeCount;
      await Court.insertMany(
        Array.from({ length: more }, (_, i) => ({
          venue: venueId,
          name: `Sân ${activeCount + i + 1}`,
          surface: "Hard court",
          isActive: true,
        }))
      );
    } else if (targetCourtsCount < activeCount) {
      // không hard delete để tránh mất liên kết booking -> disable từ cuối
      const toDisable = activeCourts.slice(targetCourtsCount).map((c) => c._id);
      await Court.updateMany(
        { _id: { $in: toDisable } },
        { $set: { isActive: false } }
      );
    }
  }

  return mapVenue(doc);
}


/**
 * "Xoá" sân: chỉ set isActive = false.
 * (Có thể thêm logic xoá court/openHours/priceRules nếu muốn)
 */
export async function deleteVenueService(adminId, venueId) {
  await assertAdminManager(adminId);

  const venue = await Venue.findByIdAndUpdate(
    venueId,
    { isActive: false },
    { new: true }
  )
    .select("_id name manager isActive")
    .lean();

  if (!venue) throw new HttpError(404, "Không tìm thấy sân");

  // notify owner
  if (venue.manager) {
    await createNotification({
      userId: venue.manager,
      type: "VENUE_DISABLED",
      level: "CRITICAL",
      title: "Sân bị vô hiệu hóa",
      content: `Sân "${venue.name}" đã bị vô hiệu hóa.`,
      data: { venueId: String(venue._id), route: "/owner/bookings" },
      // dedupeKey có time để nếu bật/tắt nhiều lần vẫn có noti mới
      dedupeKey: `VENUE_DISABLED:${venue._id}:${Date.now()}`,
    });
  }

  return { success: true };
}




// =============== CONFIG (openTime / closeTime / priceRules) ===============

// GET config cho admin
export async function getVenueConfigForAdmin(adminId, venueId) {
  await assertAdminManager(adminId);

  const [openHoursDocs, priceRuleDocs] = await Promise.all([
    VenueOpenHour.find({ venue: venueId }).sort({ weekday: 1 }).lean(),
    PriceRule.find({ venue: venueId })
      .sort({ dayOfWeekFrom: 1, timeFrom: 1 })
      .lean(),
  ]);

  // ===== Gộp openTime / closeTime =====
  let openTime = "05:00";
  let closeTime = "22:00";

  if (Array.isArray(openHoursDocs) && openHoursDocs.length > 0) {
    const sortedFrom = [...openHoursDocs].sort((a, b) =>
      a.timeFrom.localeCompare(b.timeFrom)
    );
    const sortedTo = [...openHoursDocs].sort((a, b) =>
      a.timeTo.localeCompare(b.timeTo)
    );

    openTime = (sortedFrom[0].timeFrom || "05:00").slice(0, 5);
    closeTime = (
      sortedTo[sortedTo.length - 1].timeTo || "22:00"
    ).slice(0, 5);
  }

  // ===== Map PriceRule -> shape đơn giản cho UI =====
  const uiPriceRules = Array.isArray(priceRuleDocs)
    ? priceRuleDocs.map((r) => ({
      id: r._id.toString(),
      startTime: (r.timeFrom || "").slice(0, 5),
      endTime: (r.timeTo || "").slice(0, 5),
      price:
        typeof r.fixedPricePerHour === "number"
          ? r.fixedPricePerHour
          : typeof r.walkinPricePerHour === "number"
            ? r.walkinPricePerHour
            : 0,
    }))
    : [];

  return {
    openTime,
    closeTime,
    priceRules: uiPriceRules,
  };
}

// PUT config cho admin
// payload: { openTime, closeTime, priceRules: [{ startTime, endTime, price }] }
export async function upsertVenueConfigForAdmin(adminId, venueId, payload) {
  await assertAdminManager(adminId);

  const { openTime, closeTime, priceRules } = payload || {};

  // ===== 1) Lưu open-hours =====
  let savedOpenHours;

  if (openTime && closeTime) {
    const items = [];
    for (let weekday = 1; weekday <= 7; weekday += 1) {
      items.push({
        venue: venueId,
        weekday,
        timeFrom: openTime,
        timeTo: closeTime,
      });
    }

    await VenueOpenHour.deleteMany({ venue: venueId });
    savedOpenHours = await VenueOpenHour.insertMany(items);
  } else {
    savedOpenHours = await VenueOpenHour.find({ venue: venueId })
      .sort({ weekday: 1 })
      .lean();
  }

  // ===== 2) Lưu price-rules =====
  let savedPriceRulesDocs;

  if (Array.isArray(priceRules)) {
    await PriceRule.deleteMany({ venue: venueId });

    const items = priceRules.map((r) => {
      const price =
        r.price === "" || r.price === null || r.price === undefined
          ? 0
          : Number(r.price) || 0;

      return {
        venue: venueId,
        dayLabel: "T2 - CN", // đơn giản: áp dụng cả tuần, giống logic owner
        dayOfWeekFrom: 1,
        dayOfWeekTo: 7,
        timeFrom: r.startTime || openTime || "05:00",
        timeTo: r.endTime || closeTime || "22:00",
        fixedPricePerHour: price,
        walkinPricePerHour: price,
      };
    });

    savedPriceRulesDocs = await PriceRule.insertMany(items);
  } else {
    savedPriceRulesDocs = await PriceRule.find({ venue: venueId })
      .sort({ dayOfWeekFrom: 1, timeFrom: 1 })
      .lean();
  }

  // ===== 3) Chuẩn hoá data trả về lại cho UI =====
  let openTimeResp = openTime;
  let closeTimeResp = closeTime;

  if ((!openTimeResp || !closeTimeResp) && savedOpenHours?.length) {
    const sortedFrom = [...savedOpenHours].sort((a, b) =>
      a.timeFrom.localeCompare(b.timeFrom)
    );
    const sortedTo = [...savedOpenHours].sort((a, b) =>
      a.timeTo.localeCompare(b.timeTo)
    );

    openTimeResp = (sortedFrom[0].timeFrom || "05:00").slice(0, 5);
    closeTimeResp = (
      sortedTo[sortedTo.length - 1].timeTo || "22:00"
    ).slice(0, 5);
  }

  const uiPriceRules = Array.isArray(savedPriceRulesDocs)
    ? savedPriceRulesDocs.map((r) => ({
      id: r._id.toString(),
      startTime: (r.timeFrom || "").slice(0, 5),
      endTime: (r.timeTo || "").slice(0, 5),
      price:
        typeof r.fixedPricePerHour === "number"
          ? r.fixedPricePerHour
          : typeof r.walkinPricePerHour === "number"
            ? r.walkinPricePerHour
            : 0,
    }))
    : [];

  return {
    openTime: openTimeResp,
    closeTime: closeTimeResp,
    priceRules: uiPriceRules,
  };
}
