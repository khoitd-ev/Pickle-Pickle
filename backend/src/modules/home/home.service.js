// backend/src/modules/home/home.service.js
import { Venue } from "../../models/venue.model.js";
import { Booking } from "../../models/booking.model.js";

function cityToRegex(city) {
  if (!city) return null;
  return new RegExp(city, "i");
}

function resolveVenueAvatar(venue) {
  if (!venue) return "";

  // 1) avatarImage
  if (typeof venue.avatarImage === "string" && venue.avatarImage.trim() !== "") {
    return venue.avatarImage.trim();
  }

  // 2) images primary
  if (Array.isArray(venue.images) && venue.images.length > 0) {
    const primary = venue.images.find((img) => img?.isPrimary && img?.url);
    if (primary?.url) return primary.url;
    // fallback: first image if exists
    if (venue.images[0]?.url) return venue.images[0].url;
  }

  // 3) featureImages[0]
  if (Array.isArray(venue.featureImages) && venue.featureImages.length > 0) {
    const first = venue.featureImages[0];
    if (typeof first === "string" && first.trim() !== "") return first.trim();
  }

  return "";
}

export async function getHomeLocations({ limit = 14 } = {}) {
  const venues = await Venue.find({ isActive: true })
    .select("_id name address courtsCount")
    .sort({ name: 1 })
    .limit(Math.max(1, Number(limit) || 14))
    .lean();

  return venues.map((v) => ({
    id: String(v._id),
    name: v.name || "",
    address: v.address || "",
    courtsCount: Number(v.courtsCount) || 0,
  }));
}

export async function getTopBookedVenues({ city, limit = 8 }) {
  const rx = cityToRegex(city);

  const pipeline = [
    { $match: { venue: { $ne: null } } },
    { $group: { _id: "$venue", bookingsCount: { $sum: 1 } } },
    {
      $lookup: {
        from: "venues",
        localField: "_id",
        foreignField: "_id",
        as: "venue",
      },
    },
    { $unwind: "$venue" },
    { $match: { "venue.isActive": true } },
  ];

  if (rx) pipeline.push({ $match: { "venue.address": rx } });

  pipeline.push(
    { $sort: { bookingsCount: -1 } },
    { $limit: Math.max(1, Number(limit) || 8) },
    // IMPORTANT: phải lấy thêm featureImages/images để fallback avatar
    {
      $project: {
        _id: 0,
        id: { $toString: "$venue._id" },
        name: "$venue.name",
        courtsCount: "$venue.courtsCount",
        avatarImage: "$venue.avatarImage",
        featureImages: "$venue.featureImages",
        images: "$venue.images",
        bookingsCount: 1,
      },
    }
  );

  // 1) Thử lấy top-booked trước
  const booked = await Booking.aggregate(pipeline);

  if (Array.isArray(booked) && booked.length > 0) {
    return booked.map((v) => ({
      id: v.id,
      name: v.name || "",
      courtsCount: Number(v.courtsCount) || 0,
      avatarImage: resolveVenueAvatar(v),
      bookingsCount: Number(v.bookingsCount) || 0,
    }));
  }

  // 2) FALLBACK: không có booking => lấy 10 venue mắc nhất
  const fallbackLimit = 10;
  const q = { isActive: true };
  if (rx) q.address = rx;

  const pricey = await Venue.find(q)
    .select("_id name courtsCount avatarImage basePricePerHour featureImages images")
    .sort({ basePricePerHour: -1, name: 1 })
    .limit(fallbackLimit)
    .lean();

  return (pricey || []).map((v) => ({
    id: String(v._id),
    name: v.name || "",
    courtsCount: Number(v.courtsCount) || 0,
    avatarImage: resolveVenueAvatar(v),
    bookingsCount: 0,
  }));
}
