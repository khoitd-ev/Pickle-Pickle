// backend/src/modules/chatbot/nlp.js

function stripDiacritics(s = "") {
  return String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Tách chữ-số: "quan10" => "quan 10", "q10" => "q 10"
function splitAlphaNum(s = "") {
  return String(s)
    .replace(/([a-zA-Z])(\d)/g, "$1 $2")
    .replace(/(\d)([a-zA-Z])/g, "$1 $2");
}

function norm(s = "") {
  return splitAlphaNum(stripDiacritics(String(s)))
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function formatDateYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatHHMM({ hour, minute }) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute || 0).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatVND(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return null;
  return new Intl.NumberFormat("vi-VN").format(x);
}

// ===== District =====
const DISTRICT_ALIASES = [
  { canon: "Thủ Đức", keys: ["thu duc", "tp thu duc", "thuduc"] },
  ...Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return { canon: `Quận ${n}`, keys: [`quan ${n}`, `q${n}`, `q ${n}`, `quận ${n}`] };
  }),
  { canon: "Quận Bình Thạnh", keys: ["binh thanh", "quan binh thanh", "quận bình thạnh"] },
  { canon: "Quận Phú Nhuận", keys: ["phu nhuan", "quan phu nhuan", "quận phú nhuận"] },
  { canon: "Quận Gò Vấp", keys: ["go vap", "quan go vap", "quận gò vấp"] },
  { canon: "Quận Tân Bình", keys: ["tan binh", "quan tan binh", "quận tân bình"] },
  { canon: "Quận Tân Phú", keys: ["tan phu", "quan tan phu", "quận tân phú"] },
  { canon: "Quận Bình Tân", keys: ["binh tan", "quan binh tan", "quận bình tân"] },
];

export function extractDistrict(text) {
  const t = norm(text);

  // 1) Ưu tiên bắt quận số theo regex boundary để tránh "quan 1" dính "quan 10"
  // Bắt: "Quận 10", "quan10", "quan 10", "q10", "q 10", "q.10", "q. 10"
  const mNum = t.match(/\b(?:quan|quận|q)\.?\s*(\d{1,2})\b/);
  if (mNum) {
    const n = Number(mNum[1]);
    if (n >= 1 && n <= 12) return `Quận ${n}`;
  }

  // 2) Match các khu vực dạng chữ (Thủ Đức, Bình Thạnh, Gò Vấp...)
  // Dùng boundary để không dính substring bậy bạ
  for (const it of DISTRICT_ALIASES) {
    // bỏ qua "Quận 1..12" vì đã xử lý ở bước (1)
    if (/^Quận \d+$/.test(it.canon)) continue;

    for (const k of it.keys) {
      const kk = norm(k);
      // match theo ranh giới token: (^|[^a-z0-9]) kk ($|[^a-z0-9])
      const re = new RegExp(`(^|[^a-z0-9])${kk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`, "i");
      if (re.test(t)) return it.canon;
    }
  }

  // 3) Giữ lại đoạn cũ của bạn (Q.10 / q. 10) nhưng thực ra bước (1) đã cover rồi
  const m = t.match(/\bq\.?\s*(\d{1,2})\b/);
  if (m) {
    const n = Number(m[1]);
    if (n >= 1 && n <= 12) return `Quận ${n}`;
  }

  return null;
}


// ===== Time =====
export function extractHour(text) {
  const t = norm(text);

  // 19:00 / 19.00
  const m1 = t.match(/\b([01]?\d|2[0-3])\s*[:.]\s*([0-5]\d)\b/);
  if (m1) return { hour: Number(m1[1]), minute: Number(m1[2]) };

  // 20h / 20h30 / 20 giờ
  const m2 = t.match(
    /\b([01]?\d|2[0-3])\s*(?:h|gio|giờ)\s*([0-5]\d)?\s*(sang|sáng|chieu|chiều|toi|tối|dem|đêm)?\b/
  );
  if (m2) {
    let hour = Number(m2[1]);
    const minute = m2[2] ? Number(m2[2]) : 0;
    const mer = m2[3] || "";
    if (/(chieu|chiều|toi|tối|dem|đêm)/.test(mer) && hour >= 1 && hour <= 11) hour += 12;
    return { hour, minute };
  }

  // 5 chiều / 8 tối
  const m3 = t.match(/\b([01]?\d|2[0-3])\s*(sang|sáng|chieu|chiều|toi|tối|dem|đêm)\b/);
  if (m3) {
    let hour = Number(m3[1]);
    const mer = m3[2] || "";
    if (/(chieu|chiều|toi|tối|dem|đêm)/.test(mer) && hour >= 1 && hour <= 11) hour += 12;
    return { hour, minute: 0 };
  }

  return null;
}

// ===== Date Range =====
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const WEEKDAY_ALIASES = [
  { dow: 1, keys: ["thu 2", "thứ 2", "t2"] },
  { dow: 2, keys: ["thu 3", "thứ 3", "t3"] },
  { dow: 3, keys: ["thu 4", "thứ 4", "t4"] },
  { dow: 4, keys: ["thu 5", "thứ 5", "t5", "thu nam", "thứ năm"] },
  { dow: 5, keys: ["thu 6", "thứ 6", "t6", "thu sau", "thứ sáu"] },
  { dow: 6, keys: ["thu 7", "thứ 7", "t7", "thu bay", "thứ bảy"] },
  { dow: 0, keys: ["cn", "chu nhat", "chủ nhật"] },
];

function extractWeekday(text) {
  const t = norm(text);
  for (const it of WEEKDAY_ALIASES) {
    for (const k of it.keys) if (t.includes(norm(k))) return it.dow;
  }
  return null;
}
function getTargetWeekdayDate(now, targetDow) {
  const today = startOfDay(now);
  const curDow = today.getDay();
  const delta = (targetDow - curDow + 7) % 7;
  return addDays(today, delta);
}
function thisWeekSaturdayAndSunday(now) {
  const today = startOfDay(now);
  const dow = today.getDay();
  const deltaToSat = (6 - dow + 7) % 7;
  const sat = addDays(today, deltaToSat);
  const sun = addDays(sat, 1);
  return { sat, sun };
}

export function extractDateRange(text, now = new Date()) {
  const t = norm(text);
  const today = startOfDay(now);

  if (/\b(hom nay|hôm nay|toi nay|tối nay)\b/.test(t)) {
    return { kind: "single", start: today, label: "hôm nay" };
  }
  if (/\b(ngay mai|mai)\b/.test(t)) {
    return { kind: "single", start: addDays(today, 1), label: "ngày mai" };
  }
  if (/\b(cuoi tuan|cuối tuần)\b/.test(t)) {
    const { sat, sun } = thisWeekSaturdayAndSunday(today);
    return { kind: "range", start: sat, end: sun, label: "cuối tuần" };
  }

  const wd = extractWeekday(t);
  if (wd !== null) {
    const d = getTargetWeekdayDate(today, wd);
    return { kind: "single", start: d, label: "trong tuần" };
  }

  return null;
}

// ===== Intent =====
export function detectIntent(text) {
  const t = norm(text);

  if (/(^|\b)(hi|hello|xin chao|chao|chào)(\b|$)/.test(t)) return "greeting";

  // NEW: đổi khu vực / quay lại khu vực khác
  if (/(quay lai|quay lại|doi qua|đổi qua|chuyen sang|chuyển sang|qua\b|về\b).*(quan|q\b|thu duc|binh thanh|phu nhuan|go vap|tan binh|tan phu)/.test(t)) {
    return "switch_area";
  }

  if (/(mo cua|dong cua|gio mo|gio dong|mở cửa|đóng cửa|giờ mở|giờ đóng)/.test(t)) return "open_hours";
  if (/(con san|còn sân|con cho|còn chỗ|khung gio|khung giờ|available|trong|trống)/.test(t)) return "availability";
  if (/(gia re|giá rẻ|rẻ nhất|giá tốt|gia tot|giá thấp|rẻ)/.test(t)) return "cheap";
  if (/(goi y|gợi ý|recommend|de xuat|đề xuất|gan|gần|quanh)/.test(t)) return "recommend";

  return "fallback";
}

// ===== Time Window (NEW - bổ sung, không thay thế) =====
// Chuẩn hóa các cụm mơ hồ: sáng / chiều / tối / sau giờ làm / 7–8h

export function extractTimeWindow(text) {
  const t = norm(text);

  // "7–8h", "7-8h", "7 tới 8"
  let m = t.match(/\b([01]?\d|2[0-3])\s*(?:-|–|toi|tới)\s*([01]?\d|2[0-3])h?\b/);
  if (m) {
    let start = Number(m[1]);
    let end = Number(m[2]);

    // nếu có "tối" → +12
    if (/toi|tối|chieu|chiều/.test(t)) {
      if (start < 12) start += 12;
      if (end < 12) end += 12;
    }

    return [start, end];
  }

  // buổi sáng
  if (/buoi sang|sang som|sáng/.test(t)) return [5, 10];

  // buổi chiều
  if (/buoi chieu|chiều/.test(t)) return [13, 17];

  // chiều tối / sau giờ làm / buổi tối
  if (/chieu toi|sau gio lam|buoi toi|tối/.test(t)) return [17, 21];

  return null;
}
