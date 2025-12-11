// src/bootstrap/seedAddons.js
import { Addon } from "../models/addon.model.js";
import { Venue } from "../models/venue.model.js";

export async function ensureAddons() {
  const existing = await Addon.countDocuments();
  if (existing > 0) {
    console.log(`Addons already exist (${existing}), skip seeding.`);
    return;
  }

  const venues = await Venue.find().lean();
  if (!venues.length) {
    console.log("No venues found, skip seeding addons.");
    return;
  }

  console.log(" Seeding default addons for each venue...");

  const now = new Date();

  const baseAddons = [
    {
      code: "balls",
      name: "Bóng Pickleball (3 quả)",
      category: "equipment",
      categoryLabel: "Dụng cụ",
      price: 280000,
      imageUrl: "/booking/pickleballIcon.svg",
      description: "Combo 3 quả bóng Pickleball chuẩn thi đấu.",
      isActive: true,
    },
    {
      code: "racket-rent",
      name: "Thuê vợt Pickleball",
      category: "equipment",
      categoryLabel: "Dụng cụ",
      price: 50000,
      imageUrl: "/booking/racketIcon.svg",
      description: "Thuê vợt Pickleball cho mỗi buổi chơi.",
      isActive: true,
    },
    {
      code: "water",
      name: "Nước suối",
      category: "drink",
      categoryLabel: "Đồ uống",
      price: 10000,
      imageUrl: "/booking/water.svg",
      description: "Chai nước suối 500ml.",
      isActive: true,
    },
    {
      code: "revive",
      name: "Nước khoáng",
      category: "drink",
      categoryLabel: "Đồ uống",
      price: 20000,
      imageUrl: "/booking/revive.svg",
      description: "Nước khoáng bù khoáng sau khi vận động.",
      isActive: true,
    },
    {
      code: "wet-tissue",
      name: "Khăn ướt",
      category: "support",
      categoryLabel: "Phụ trợ",
      price: 5000,
      imageUrl: "/booking/khanuotIcon.svg",
      description: "Gói khăn ướt tiện dụng.",
      isActive: true,
    },
    {
      code: "wristband",
      name: "Băng cổ tay",
      category: "support",
      categoryLabel: "Phụ trợ",
      price: 35000,
      imageUrl: "/booking/bangcotayIcon.svg",
      description: "Băng cổ tay thấm mồ hôi hỗ trợ chơi thể thao.",
      isActive: true,
    },
  ];

  for (const venue of venues) {
    const docs = baseAddons.map((a) => ({
      ...a,
      venue: venue._id,
      createdAt: now,
      updatedAt: now,
    }));

    await Addon.insertMany(docs);
    console.log(`  -> Seeded addons for venue: ${venue.name}`);
  }

  console.log(" Seeded addons for all venues successfully.");
}
