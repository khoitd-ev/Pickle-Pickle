// backend/src/modules/venueContent/venueContent.service.js
import { Venue } from "../../models/venue.model.js";
import { assertOwnerVenue } from "../addons/ownerAddon.service.js";

/**
 * Chuẩn hoá dữ liệu Venue -> shape FE Owner/Admin ContentPage đang dùng
 */
function mapVenueToContent(venue) {
  return {
    // HERO
    heroTitle: venue.heroTitle || venue.name || "",
    heroSubtitle: venue.heroSubtitle || "",
    heroTagline: venue.heroTagline || "",

    heroPhone: venue.heroPhone || "",
    heroAddress: venue.heroAddress || "",
    avatarImage: venue.avatarImage || "",

    // OVERVIEW
    overviewTitle: venue.overviewTitle || "",
    overviewDescription: venue.overviewDescription || "",

    // HIGHLIGHT / AMENITY TEXT
    highlightTitle: venue.highlightTitle || "",
    highlightDescription: venue.highlightDescription || "",
    amenityTitle: venue.amenityTitle || "",
    amenityDescription: venue.amenityDescription || "",

    pricingTitle: venue.pricingTitle || "",
    pricingDescription: venue.pricingDescription || "",
    pricingNote: venue.pricingNote || "",

    // Ảnh hero: dùng mảng images (subdocument)
    heroImages: (venue.images || [])
      .map((img) =>
        typeof img === "string" ? img : img?.url || ""
      )
      .filter(Boolean),

    // Ảnh highlight / tiện ích
    highlightImages: (venue.featureImages || []).map(String),
    amenityImages: (venue.amenityImages || []).map(String),

    // Đặc điểm & tiện ích trái/phải cho overview
    featuresLeft: venue.featuresLeft || [],
    featuresRight: venue.featuresRight || [],
    amenitiesLeft: venue.amenitiesLeft || [],
    amenitiesRight: venue.amenitiesRight || [],
  };
}

/**
 * Helper dùng chung: apply payload từ FE vào document Venue
 * (owner & admin đều dùng chung logic này)
 */
function applyContentPayloadToVenue(venue, payload = {}) {
  const {
    heroTitle,
    heroSubtitle,
    heroTagline,
    heroPhone,
    heroAddress,
    avatarImage,
    overviewTitle,
    overviewDescription,
    highlightTitle,
    highlightDescription,
    amenityTitle,
    amenityDescription,
    pricingTitle,
    pricingDescription,
    pricingNote,
    heroImages,
    highlightImages,
    amenityImages,
    // FE gửi theo kiểu featuresLeft/...:
    featuresLeft,
    featuresRight,
    amenitiesLeft,
    amenitiesRight,
    // fallback nếu sau này có chỗ gửi leftFeatures/...:
    leftFeatures,
    rightFeatures,
    leftAmenities,
    rightAmenities,
  } = payload || {};

  // --- Gán các field text (nếu FE gửi) ---
  if (heroTitle != null) venue.heroTitle = String(heroTitle);
  if (heroSubtitle != null) venue.heroSubtitle = String(heroSubtitle);
  if (heroTagline != null) venue.heroTagline = String(heroTagline);
  if (heroPhone != null) venue.heroPhone = String(heroPhone);
  if (heroAddress != null) venue.heroAddress = String(heroAddress);
  if (avatarImage != null) venue.avatarImage = String(avatarImage);

  if (overviewTitle != null) venue.overviewTitle = String(overviewTitle);
  if (overviewDescription != null) {
    venue.overviewDescription = String(overviewDescription);
  }

  if (highlightTitle != null) venue.highlightTitle = String(highlightTitle);
  if (highlightDescription != null) {
    venue.highlightDescription = String(highlightDescription);
  }

  if (amenityTitle != null) venue.amenityTitle = String(amenityTitle);
  if (amenityDescription != null) {
    venue.amenityDescription = String(amenityDescription);
  }

  if (pricingTitle != null) venue.pricingTitle = String(pricingTitle);
  if (pricingDescription != null) {
    venue.pricingDescription = String(pricingDescription);
  }
  if (pricingNote != null) venue.pricingNote = String(pricingNote);

  // --- List ảnh + list đặc điểm/tiện ích ---

  // heroImages: array<string> -> array subdocument { url, isPrimary, sortOrder }
  if (Array.isArray(heroImages)) {
    venue.images = heroImages
      .map((u, index) => ({
        url: String(u),
        isPrimary: index === 0,
        sortOrder: index,
      }))
      .filter((img) => !!img.url);
  }

  // highlight / amenity images: vẫn là array<string>
  if (Array.isArray(highlightImages)) {
    venue.featureImages = highlightImages
      .map((u) => String(u))
      .filter(Boolean);
  }

  if (Array.isArray(amenityImages)) {
    venue.amenityImages = amenityImages
      .map((u) => String(u))
      .filter(Boolean);
  }

  // features / amenities trái phải
  // Chọn nguồn dữ liệu ưu tiên: featuresLeft (FE) > leftFeatures (legacy)
  const _featuresLeft = Array.isArray(featuresLeft)
    ? featuresLeft
    : Array.isArray(leftFeatures)
    ? leftFeatures
    : null;

  const _featuresRight = Array.isArray(featuresRight)
    ? featuresRight
    : Array.isArray(rightFeatures)
    ? rightFeatures
    : null;

  const _amenitiesLeft = Array.isArray(amenitiesLeft)
    ? amenitiesLeft
    : Array.isArray(leftAmenities)
    ? leftAmenities
    : null;

  const _amenitiesRight = Array.isArray(amenitiesRight)
    ? amenitiesRight
    : Array.isArray(rightAmenities)
    ? rightAmenities
    : null;

  if (_featuresLeft) {
    venue.featuresLeft = _featuresLeft.map((t) => String(t).trim());
  }

  if (_featuresRight) {
    venue.featuresRight = _featuresRight.map((t) => String(t).trim());
  }

  if (_amenitiesLeft) {
    venue.amenitiesLeft = _amenitiesLeft.map((t) => String(t).trim());
  }

  if (_amenitiesRight) {
    venue.amenitiesRight = _amenitiesRight.map((t) => String(t).trim());
  }
}

/**
 * GET content cho OWNER theo venue
 */
export async function getOwnerVenueContent(ownerId, venueId) {
  const venue = await assertOwnerVenue(ownerId, venueId); // đã check quyền + findOne().lean()
  return mapVenueToContent(venue);
}

/**
 * PUT content từ FE -> update vào Venue (OWNER)
 */
export async function updateOwnerVenueContent(ownerId, venueId, payload) {
  // Check quyền + lấy Venue (không .lean để có document)
  const venueLean = await assertOwnerVenue(ownerId, venueId);
  const venue = await Venue.findById(venueLean._id);

  if (!venue) {
    const err = new Error("Không tìm thấy sân.");
    err.statusCode = 404;
    throw err;
  }

  applyContentPayloadToVenue(venue, payload);
  await venue.save();

  // Trả về content đã chuẩn hoá cho FE
  return mapVenueToContent(venue.toObject());
}

/**
 * GET content cho ADMIN (không ràng buộc manager)
 */
export async function getAdminVenueContent(venueId) {
  const venue = await Venue.findById(venueId).lean();

  if (!venue) {
    const err = new Error("Không tìm thấy sân.");
    err.statusCode = 404;
    throw err;
  }

  return mapVenueToContent(venue);
}

/**
 * PUT content từ FE -> update vào Venue (ADMIN)
 */
export async function updateAdminVenueContent(venueId, payload) {
  const venue = await Venue.findById(venueId);

  if (!venue) {
    const err = new Error("Không tìm thấy sân.");
    err.statusCode = 404;
    throw err;
  }

  applyContentPayloadToVenue(venue, payload);
  await venue.save();

  return mapVenueToContent(venue.toObject());
}
