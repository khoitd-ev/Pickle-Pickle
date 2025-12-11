// src/modules/search/search.service.js
import { Venue } from "../../models/venue.model.js";

const AREA_MAP = {
  // Trung tâm
  q1: "Quận 1",
  q3: "Quận 3",
  q4: "Quận 4",
  q5: "Quận 5",
  q6: "Quận 6",
  q7: "Quận 7",
  q8: "Quận 8",
  q10: "Quận 10",
  q11: "Quận 11",
  q12: "Quận 12",

  // Các quận khác
  binhtan: "Quận Bình Tân",
  binhthanh: "Quận Bình Thạnh",
  govap: "Quận Gò Vấp",
  phunhuan: "Quận Phú Nhuận",
  tanbinh: "Quận Tân Bình",
  tanphu: "Quận Tân Phú",

  // TP Thủ Đức + tương thích quận cũ
  thuduc: "Thủ Đức",

  // Huyện
  binhchanh: "Huyện Bình Chánh",
  cangio: "Huyện Cần Giờ",
  cuchi: "Huyện Củ Chi",
  hocmon: "Huyện Hóc Môn",
  nhabe: "Huyện Nhà Bè",

  // Một số key “dễ nhớ” tương thích với FE cũ
  quan1: "Quận 1",
  quan2: "Quận 2",
  quan7: "Quận 7",
};

export async function searchVenues({
  keyword,
  area,
  page = 1,
  limit = 8,
}) {
  // CHỈ LẤY SÂN ĐANG ACTIVE
  const filter = { isActive: true };

  if (keyword) {
    filter.name = { $regex: keyword, $options: "i" };
  }

  if (area) {
    // nếu FE gửi key (q1, quan7, ...) thì map sang tên quận;
    // nếu FE gửi thẳng "Quận 7" thì dùng luôn
    const mapped = AREA_MAP[area] || area;
    filter.district = mapped;
  }

  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 8;

  const [items, total, distinctDistricts] = await Promise.all([
    Venue.find(filter)
      .sort({ name: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Venue.countDocuments(filter),
    Venue.distinct("district", filter),
  ]);

  return {
    items,
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
    },
    meta: {
      areaCount: distinctDistricts.length,
    },
  };
}
