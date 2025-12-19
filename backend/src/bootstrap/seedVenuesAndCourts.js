// src/bootstrap/seedVenuesAndCourts.js
import { Venue } from "../models/venue.model.js";
import { Court } from "../models/court.model.js";
import { VenueOpenHour } from "../models/venueOpenHour.model.js";
import { PriceRule } from "../models/priceRule.model.js";
import { VenueHoliday } from "../models/venueHoliday.model.js";
import { BlackoutSlot } from "../models/blackoutSlot.model.js";
import { SplitRule } from "../models/splitRule.model.js";

const COMMON_DESCRIPTION =
  "PicklePickle là cụm sân pickleball với mặt sân cứng, vạch kẻ chuẩn thi đấu và hệ thống đèn chiếu sáng ban đêm. Phù hợp cho cả người chơi mới và những buổi đấu giao hữu.";

const COMMON_FEATURES_LEFT = [
  "Mặt sân cứng, độ nảy chuẩn thi đấu",
  "Nhiều sân ngoài trời, mái che một phần",
  "Hệ thống chiếu sáng thi đấu ban đêm",
];

const COMMON_FEATURES_RIGHT = [
  "Vạch kẻ cố định theo chuẩn Pickleball",
  "Lưới căng cố định, chiều cao tiêu chuẩn",
  "Khu vực non-volley zone (kitchen) rõ ràng",
];

const COMMON_AMENITIES_LEFT = [
  "Đồ ăn & nước uống ngay trong khu sân",
  "Phòng vệ sinh & phòng thay đồ sạch sẽ",
  "Khu vực nghỉ ngơi, ghế ngồi cho khán giả",
];

const COMMON_AMENITIES_RIGHT = [
  "Không gian phù hợp tổ chức giải, sự kiện nhỏ",
  "Bãi gửi xe máy ngay trước sân",
];

const COMMON_FEATURE_IMAGES = [
  "/courts/sample1.png",
  "/courts/sample2.png",
  "/courts/sample3.png",
  "/courts/sample1.png",
  "/courts/sample2.png",
];

const COMMON_AMENITY_IMAGES = Array(5).fill("/courts/mockupduplicate.png");

function buildCourtNames(count) {
  const n = Math.max(1, Number(count) || 1);
  return Array.from({ length: n }, (_, i) => `Sân ${i + 1}`);
}

/**
 * Tạo sẵn 3 cụm sân:
 *  - PicklePickle Thủ Đức
 *  - PicklePickle Quận 1
 *  - PicklePickle Quận 7
 *
 * ownerUser: user default có role OWNER để gán vào field manager.
 */
export async function ensureVenuesAndCourts(ownerUser) {
  const existingVenueCount = await Venue.countDocuments();

  if (existingVenueCount > 0) {
    // Nếu đã có venue rồi nhưng chưa có manager thì patch cho gọn
    if (ownerUser) {
      await Venue.updateMany(
        { manager: { $exists: false } },
        { $set: { manager: ownerUser._id, isActive: true } }
      );
      console.log(
        " Existing venues updated: set manager to default owner and isActive=true"
      );
    } else {
      console.log(" Venues already exist, skip seeding venues & related data");
    }
    return;
  }

  console.log(" Seeding venues, courts, open hours, price rules...");

  
  const venueSeeds = [
    {
      name: "PicklePickle Thủ Đức",
      district: "Thủ Đức",
      address: "123 Võ Văn Ngân, Thủ Đức, TP.HCM",
      latitude: 10.851,
      longitude: 106.754,
      heroTagline: "Cụm 4 sân Pickleball ngoài trời tại trung tâm Thủ Đức",
      phone: "0909 123 456",
      basePricePerHour: 80000,
      courtsCount: 4,
      images: ["/courts/sample1.png", "/courts/sample2.png", "/courts/sample3.png"],
    },
    {
      name: "PicklePickle Quận 1",
      district: "Quận 1",
      address: "45 Lê Lợi, Quận 1, TP.HCM",
      latitude: 10.775,
      longitude: 106.7,
      heroTagline: "Cụm 3 sân Pickleball ngay trung tâm Quận 1",
      phone: "0909 234 567",
      basePricePerHour: 90000,
      courtsCount: 3,
      images: ["/courts/sample2.png", "/courts/sample3.png", "/courts/sample1.png"],
    },
    {
      name: "PicklePickle Quận 7",
      district: "Quận 7",
      address: "88 Nguyễn Thị Thập, Quận 7, TP.HCM",
      latitude: 10.737,
      longitude: 106.719,
      heroTagline: "Cụm 4 sân Pickleball tại khu Nam Sài Gòn",
      phone: "0909 345 678",
      basePricePerHour: 100000,
      courtsCount: 4,
      images: ["/courts/sample2.png", "/courts/sample1.png", "/courts/sample3.png"],
    },
  ];

  for (const v of venueSeeds) {
    const courtsCount = Math.max(1, Number(v.courtsCount) || 1);

    // 1) Venue
    const venue = await Venue.create({
      name: v.name,
      district: v.district,
      address: v.address,
      latitude: v.latitude,
      longitude: v.longitude,
      timeZone: "Asia/Ho_Chi_Minh",
      slotMinutes: 60,
      isActive: true,

      // lưu courtsCount vào Venue
      courtsCount,

      // GÁN CHỦ SÂN MẶC ĐỊNH
      manager: ownerUser ? ownerUser._id : undefined,

      phone: v.phone,
      heroTagline: v.heroTagline,
      description: COMMON_DESCRIPTION,

      basePricePerHour: v.basePricePerHour,
      currency: "VND",

      featuresLeft: COMMON_FEATURES_LEFT,
      featuresRight: COMMON_FEATURES_RIGHT,
      amenitiesLeft: COMMON_AMENITIES_LEFT,
      amenitiesRight: COMMON_AMENITIES_RIGHT,
      featureImages: COMMON_FEATURE_IMAGES,
      amenityImages: COMMON_AMENITY_IMAGES,

      images: (v.images || []).map((url, idx) => ({
        url,
        isPrimary: idx === 0,
        sortOrder: idx,
      })),
    });

    console.log(`  -> Created venue: ${venue.name}`);

    // 2) Courts: tạo theo courtsCount => "Sân 1..n"
    const courtNames = buildCourtNames(courtsCount);
    const courtDocs = [];

    for (const courtName of courtNames) {
      const court = await Court.create({
        venue: venue._id,
        name: courtName,
        surface: "Hard court",
        isActive: true,
      });
      courtDocs.push(court);
    }

    // 3) Open hours: T2–CN, 05:00–23:00
    for (let weekday = 1; weekday <= 7; weekday++) {
      await VenueOpenHour.create({
        venue: venue._id,
        weekday,
        timeFrom: "05:00",
        timeTo: "23:00",
      });
    }

    // 4) Price rules
    const base = v.basePricePerHour;

    await PriceRule.insertMany([
      {
        venue: venue._id,
        dayLabel: "T2 - CN",
        dayOfWeekFrom: 1,
        dayOfWeekTo: 5,
        timeFrom: "06:00",
        timeTo: "22:00",
        fixedPricePerHour: base,
        walkinPricePerHour: base + 30000,
      },
    ]);

    // 5) Holiday demo
    await VenueHoliday.create({
      venue: venue._id,
      date: new Date("2025-01-01T00:00:00.000Z"),
      reason: "Nghỉ lễ Tết Dương lịch ",
    });

    // 6) Blackout slot demo
    const firstCourt = courtDocs[0];
    if (firstCourt) {
      await BlackoutSlot.create({
        venue: venue._id,
        court: firstCourt._id,
        date: new Date("2025-01-05T00:00:00.000Z"),
        slotStart: 8,
        slotEnd: 9,
        reason: "Bảo trì mặt sân ",
      });
    }

    // 7) Split rule
    await SplitRule.create({
      venue: venue._id,
      provider: "DEFAULT",
      platformSharePercent: 10,
      effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
      effectiveTo: null,
      note: " 10% cho nền tảng, 90% cho chủ sân",
    });
  }

  console.log(" Default venues & related data ensured");
}
