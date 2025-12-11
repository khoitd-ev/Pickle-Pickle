// src/modules/addons/addon.service.js
import { Addon } from "../../models/addon.model.js";

export async function listAddonsService(filters = {}) {
  const { category, venueId } = filters;

  const query = { isActive: true };

  if (category) {
    query.category = category;
  }

  if (venueId) {
    query.venue = venueId;
  }

  const addons = await Addon.find(query)
    .sort({ category: 1, name: 1 })
    .lean();

  // Map về shape FE đang dùng: id, name, category, categoryLabel, price, image
  return addons.map((a) => ({
    id: a.code, // FE đang dùng code như id
    mongoId: a._id, // để sau này owner edit/delete sẽ xài
    name: a.name,
    category: a.category,
    categoryLabel: a.categoryLabel,
    price: a.price,
    image: a.imageUrl,
    description: a.description ?? "",
    venue: a.venue,
  }));
}

export async function getAddonByCodeService(code) {
  // Với /addons/:code mình vẫn cho lấy global theo code (không filter venue)
  const addon = await Addon.findOne({
    code,
    isActive: true,
  }).lean();

  if (!addon) return null;

  return {
    id: addon.code,
    mongoId: addon._id,
    name: addon.name,
    category: addon.category,
    categoryLabel: addon.categoryLabel,
    price: addon.price,
    image: addon.imageUrl,
    description: addon.description ?? "",
    venue: addon.venue,
  };
}
