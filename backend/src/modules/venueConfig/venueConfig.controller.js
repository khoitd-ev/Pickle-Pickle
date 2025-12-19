// backend/src/modules/venueConfig/venueConfig.controller.js
import {
  getVenueOpenHours,
  upsertVenueOpenHours,
  getVenuePriceRules,
  upsertVenuePriceRules,
  updateVenueCourtsCount,
} from "./venueConfig.service.js";
import { Venue } from "../../models/venue.model.js";

// ===== OPEN HOURS =====
export async function handleGetOpenHours(req, reply) {
  const ownerId = req.user.id;
  const { venueId } = req.params;

  const data = await getVenueOpenHours(ownerId, venueId);
  return reply.send(data);
}

export async function handleUpsertOpenHours(req, reply) {
  const ownerId = req.user.id;
  const { venueId } = req.params;
  const payload = req.body; // { dayOfWeekFrom, dayOfWeekTo, openTime, closeTime }

  const updated = await upsertVenueOpenHours(ownerId, venueId, payload);
  return reply.send(updated);
}

// ===== PRICE RULES =====
export async function handleGetPriceRules(req, reply) {
  const ownerId = req.user.id;
  const { venueId } = req.params;

  const rules = await getVenuePriceRules(ownerId, venueId);
  return reply.send(rules);
}

export async function handleUpsertPriceRules(req, reply) {
  const ownerId = req.user.id;
  const { venueId } = req.params;
  const items = req.body; // array các rule

  const saved = await upsertVenuePriceRules(ownerId, venueId, items);
  return reply.send(saved);
}

// ===== CONFIG GỘP (openHours + priceRules) =====

// GET /owner/venues/:venueId/config
export async function handleGetConfig(req, reply) {
  const ownerId = req.user.id;
  const { venueId } = req.params;

  const [openHoursDocs, priceRuleDocs, venue] = await Promise.all([
    getVenueOpenHours(ownerId, venueId),
    getVenuePriceRules(ownerId, venueId),
    Venue.findById(venueId).select("courtsCount").lean(),
  ]);

  // ===== Gộp openTime / closeTime cho UI =====
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
    closeTime = (sortedTo[sortedTo.length - 1].timeTo || "22:00").slice(0, 5);
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

  return reply.send({
    courtsCount: venue?.courtsCount ?? 1,
    openTime,
    closeTime,
    priceRules: uiPriceRules,
  });
}

// PUT /owner/venues/:venueId/config
// Body UI gửi: { openTime, closeTime, priceRules: [{ startTime, endTime, price }] }
export async function handleUpsertConfig(req, reply) {
  const ownerId = req.user.id;
  const { venueId } = req.params;

  const { courtsCount, openTime, closeTime, priceRules } = req.body || {};

  // ===== 0) Lưu courtsCount (nếu có gửi) =====
  if (courtsCount !== undefined && courtsCount !== null) {
    await updateVenueCourtsCount(ownerId, venueId, courtsCount);
  }

  // ===== 1) Lưu open hours cho cả tuần =====
  let savedOpenHours;

  if (openTime && closeTime) {
    const items = [];
    for (let weekday = 1; weekday <= 7; weekday += 1) {
      items.push({
        weekday,
        timeFrom: openTime,
        timeTo: closeTime,
      });
    }

    savedOpenHours = await upsertVenueOpenHours(ownerId, venueId, items);
  } else {
    savedOpenHours = await getVenueOpenHours(ownerId, venueId);
  }

  // ===== 2) Lưu bảng giá từ cấu trúc đơn giản =====
  let savedPriceRulesDocs;

  if (Array.isArray(priceRules)) {
    const items = priceRules.map((r) => {
      const price =
        r.price === "" || r.price === null || r.price === undefined
          ? 0
          : Number(r.price) || 0;

      return {
        dayLabel: "Cả tuần",
        dayOfWeekFrom: 1,
        dayOfWeekTo: 7,
        timeFrom: r.startTime,
        timeTo: r.endTime,
        fixedPricePerHour: price,
        walkinPricePerHour: price,
      };
    });

    savedPriceRulesDocs = await upsertVenuePriceRules(ownerId, venueId, items);
  } else {
    savedPriceRulesDocs = await getVenuePriceRules(ownerId, venueId);
  }

  // ===== 3) Chuẩn hoá lại data trả về cho đúng shape UI đang dùng =====
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
    closeTimeResp = (sortedTo[sortedTo.length - 1].timeTo || "22:00").slice(0, 5);
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

  // Lấy courtsCount mới nhất để trả về FE
  const venue = await Venue.findById(venueId).select("courtsCount").lean();

  return reply.send({
    courtsCount: venue?.courtsCount ?? 1,
    openTime: openTimeResp,
    closeTime: closeTimeResp,
    priceRules: uiPriceRules,
  });
}


