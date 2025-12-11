// src/modules/courts/court.service.js
import mongoose from "mongoose";
import { Venue } from "../../models/venue.model.js";
import { PriceRule } from "../../models/priceRule.model.js";

export async function getVenueDetail(venueId) {
  console.log("[getVenueDetail] venueId =", venueId);

  // 1. Validate ObjectId
  if (!mongoose.isValidObjectId(venueId)) {
    console.log("[getVenueDetail] invalid ObjectId");
    return null;
  }

  // 2. Log tổng số venue & venue này
  const total = await Venue.countDocuments();
  console.log("[getVenueDetail] total venues =", total);

  const venue = await Venue.findById(venueId).lean();
  console.log("[getVenueDetail] venue =", venue && venue.name);

  if (!venue) return null;

  // ---- HERO data (ưu tiên content đã cấu hình) ----
  const heroImages =
    (venue.images || [])
      .map((img) =>
        typeof img === "string" ? img : img?.url || ""
      )
      .filter(Boolean) || [];

  const court = {
    id: venue._id.toString(),
    // heroTitle > name
    name: venue.heroTitle || venue.name || "",
    // heroAddress > address gốc
    address: venue.heroAddress || venue.address || "",
    // heroPhone > phone gốc
    phone: venue.heroPhone || venue.phone || "Đang cập nhật",
    // heroSubtitle > overviewDescription > description gốc
    description:
      venue.heroSubtitle ||
      venue.overviewDescription ||
      venue.description ||
      "",
    heroImages:
      heroImages.length > 0
        ? heroImages
        : [
            "/courts/sample1.png",
            "/courts/sample2.png",
            "/courts/sample3.png",
          ],
  };

  // ---- OVERVIEW (đặc điểm & tiện ích) ----
  const featureImages = (venue.featureImages || [])
    .map((u) => String(u))
    .filter(Boolean);

  const amenityImages = (venue.amenityImages || [])
    .map((u) => String(u))
    .filter(Boolean);

  const overview = {
    // tiêu đề chính section overview
    title:
      venue.overviewTitle ||
      venue.highlightTitle ||
      "5 Sân Pickleball Chuyên Dụng",
    // tiêu đề cột trái/phải (có thể tuỳ biến sau này)
    featureTitle: venue.highlightTitle || "Bề mặt & Tính năng",
    amenityTitle: venue.amenityTitle || "Tiện ích",

    featureLeft: venue.featuresLeft || [],
    featureRight: venue.featuresRight || [],
    amenitiesLeft: venue.amenitiesLeft || [],
    amenitiesRight: venue.amenitiesRight || [],

    featureImages,
    amenityImages,
    logoSrc: "/courts/Logo.svg",
  };

  // ---- PRICING – group giống format CourtPricingSection ----
  const priceRules = await PriceRule.find({ venue: venueId })
    .sort({ dayOfWeekFrom: 1, timeFrom: 1 })
    .lean();

  const grouped = {};
  for (const r of priceRules) {
    if (!grouped[r.dayLabel]) grouped[r.dayLabel] = [];
    grouped[r.dayLabel].push({
      time: `${r.timeFrom.replace(":00", "h")} - ${r.timeTo.replace(
        ":00",
        "h"
      )}`,
      fixed: `${r.fixedPricePerHour.toLocaleString("vi-VN")}đ/h`,
      walkin: `${r.walkinPricePerHour.toLocaleString("vi-VN")}đ/h`,
    });
  }

  const pricing = {
    title:
      venue.pricingTitle ||
      `Bảng giá sân ${venue.name || venue.heroTitle || ""}`,
    rows: Object.entries(grouped).map(([day, slots]) => ({
      day,
      slots,
    })),
  };

  return { court, overview, pricing };
}
