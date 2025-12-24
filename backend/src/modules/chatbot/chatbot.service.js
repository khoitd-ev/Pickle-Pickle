// backend/src/modules/chatbot/chatbot.service.js

import { searchVenues } from "../search/search.service.js";
import { getVenueAvailability } from "../bookings/booking.service.js";
import { getVenueConfigForDay } from "../venueConfig/venueConfig.service.js";

import {
    detectIntent,
    extractDistrict,
    extractHour,
    extractDateRange,
    formatDateYMD,
    formatHHMM,
    formatVND,
    extractTimeWindow,
} from "./nlp.js";

import { llmChat } from "./llmClient.js";

/**
 * ===========================
 * Performance knobs
 * ===========================
 * - Only 1 LLM call per message
 * - Plan JSON short
 * - Cache deterministic queries for 30s
 */
const CACHE_TTL_MS = 30_000;
const cache = new Map(); // key -> { at, value }

function cacheGet(key) {
    const it = cache.get(key);
    if (!it) return null;
    if (Date.now() - it.at > CACHE_TTL_MS) {
        cache.delete(key);
        return null;
    }
    return it.value;
}
function cacheSet(key, value) {
    cache.set(key, { at: Date.now(), value });
}

// ====== internal zone mapping for nearby suggestions ======
const DISTRICT_TO_ZONE = {
    "Quận 1": "central",
    "Quận 3": "central",
    "Quận 4": "central",
    "Quận 5": "central",
    "Quận 10": "central",
    "Quận 11": "central",
    "Quận Bình Thạnh": "central",
    "Quận Phú Nhuận": "central",

    "Thủ Đức": "east",
    "Quận 2": "east",
    "Quận 9": "east",

    "Quận Tân Bình": "west",
    "Quận Tân Phú": "west",
    "Quận Bình Tân": "west",
    "Quận 6": "west",
    "Quận 8": "west",

    "Quận 12": "northwest",
    "Quận Gò Vấp": "northwest",
    "Huyện Hóc Môn": "northwest",
    "Huyện Củ Chi": "northwest",

    "Huyện Bình Chánh": "southwest",
    "Quận 7": "south",
    "Huyện Nhà Bè": "south",
    "Huyện Cần Giờ": "south",
};

const ZONE_NEARBY = {
    central: ["east", "west", "south", "northwest", "southwest"],
    east: ["central", "northwest"],
    west: ["central", "southwest"],
    northwest: ["central", "east"],
    southwest: ["central", "west"],
    south: ["central"],
};

function uniqById(items) {
    const seen = new Set();
    const out = [];
    for (const it of items || []) {
        const id = String(it?._id || it?.id || "");
        if (!id || seen.has(id)) continue;
        seen.add(id);
        out.push(it);
    }
    return out;
}

function normNum(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
}

function minPrice(venue) {
    const rules = venue?.priceRules;
    if (Array.isArray(rules) && rules.length) {
        const prices = rules.map((r) => Number(r.price)).filter((x) => Number.isFinite(x) && x > 0);
        if (prices.length) return Math.min(...prices);
    }
    return normNum(venue?.basePricePerHour);
}

function toVenueLite(v) {
    return {
        venueId: String(v?._id || v?.id || ""),
        name: v?.name || "",
        district: v?.district || null,
        address: v?.address || null,
        basePricePerHour: normNum(v?.basePricePerHour),
        priceFrom: minPrice(v),
        openTime: v?.openTime || null,
        closeTime: v?.closeTime || null,
    };
}

function openHoursOf(v) {
    if (v.openTime && v.closeTime) return `${v.openTime}-${v.closeTime}`;
    return null;
}

function buildAreaCandidates(district) {
    if (!district) return [];
    const zone = DISTRICT_TO_ZONE[district];
    if (!zone) return [district];
    const zones = [zone, ...(ZONE_NEARBY[zone] || [])];
    const districts = Object.keys(DISTRICT_TO_ZONE).filter((d) => zones.includes(DISTRICT_TO_ZONE[d]));
    return [district, ...districts.filter((d) => d !== district)];
}

async function fetchVenuesByAreas(areas, limitEach = 10, districtCanon = null) {
    // 1) thử theo area như hiện tại
    const batches = await Promise.all(
        areas.map(async (a) => {
            const res = await searchVenues({ keyword: "", area: a, page: 1, limit: limitEach });
            return res?.items || [];
        })
    );

    let items = uniqById(batches.flat());

    // 2) nếu có districtCanon mà chưa có item nào match district -> fallback keyword search
    if (districtCanon) {
        const hasExact = items.some((v) => matchDistrictLoose(v, districtCanon));

        if (!hasExact) {
            const kws = [];
            const t = normTextLocal(districtCanon); // "quan 10" / "thu duc"...
            kws.push(districtCanon);

            // thêm vài biến thể phổ biến: "Q10", "quan10"
            const m = t.match(/\bquan\s+(\d{1,2})\b/);
            if (m) {
                const n = m[1];
                kws.push(`Q${n}`);
                kws.push(`Q ${n}`);
                kws.push(`quan ${n}`);
                kws.push(`quan${n}`);
                kws.push(`quận ${n}`);
            }

            const kwResList = await Promise.all(
                kws.map(async (kw) => {
                    try {
                        const res = await searchVenues({ keyword: kw, page: 1, limit: 50 });
                        return res?.items || [];
                    } catch {
                        return [];
                    }
                })
            );

            const kwItems = uniqById(kwResList.flat());

            // lọc local theo district/address
            const exactByKw = kwItems.filter((v) => matchDistrictLoose(v, districtCanon));

            items = uniqById([...items, ...exactByKw]);
        }
    }

    return items;
}


function nearbyDistricts(district) {
    const zone = DISTRICT_TO_ZONE[district];
    if (!zone) return [];
    const nearZones = ZONE_NEARBY[zone] || [];
    return Object.keys(DISTRICT_TO_ZONE)
        .filter((d) => nearZones.includes(DISTRICT_TO_ZONE[d]))
        .slice(0, 4);
}

// ===== Availability helpers =====
function slotMatchesHour(slot, hour) {
    if (!slot) return false;
    if (typeof slot.slotIndex === "number") return slot.slotIndex === hour;
    const tf = (slot.timeFrom || slot.startTime || "").slice(0, 5);
    if (tf) return tf.startsWith(String(hour).padStart(2, "0"));
    return false;
}
function slotIsAvailable(slot) {
    const st = String(slot?.status || "").toLowerCase();
    return st === "available" || st === "free" || st === "open";
}

// scan popular hours if user didn't specify time
const POPULAR_HOURS = [17, 18, 19, 20, 21];

/**
 * ===========================
 * Answer Plan
 * (không chứa CTA / đặt sân / giữ chỗ)
 * ===========================
 */
function planAskDistrict() {
    return {
        type: "ASK_CLARIFY",
        missing: ["district"],
        question: "Bạn đang ở khu vực nào (VD: Thủ Đức, Quận 2, Quận 9) để mình gợi ý đúng gần bạn?",
    };
}



// ===== LLM composer (polish only, NO extra questions unless missing slots) =====
const COMPOSER_SYSTEM = `
Bạn là trợ lý PicklePickle, Một nền tảng đặt sân pickleball. Trả lời tiếng Việt tự nhiên, thân thiện.
Bạn CHỈ được dựa trên PLAN_JSON. Không được bịa tên sân, địa chỉ, giá, giờ mở cửa, số sân trống.

Quy tắc bắt buộc:
- Không được gợi ý "đặt sân", "giữ chỗ", "thêm lịch", "thanh toán", "đăng nhập", "mở rộng tính năng".
- Không hỏi thêm câu mới, TRỪ khi PLAN_JSON.type="ASK_CLARIFY" (thiếu khu vực/thiếu giờ).
- Trả lời ngắn gọn đúng trọng tâm, 2–6 dòng là đủ, dùng "mình" để chỉ bạn và "bạn" để chỉ khách hàng.

Format:
- Nếu có list venues: mỗi venue 1 dòng: "Tên — Quận/Huyện — Địa chỉ — từ {giá}/giờ" (giá/giờ có thể thiếu).
- Nếu availability: nêu rõ ngày (hoặc cuối tuần), và liệt kê các khung giờ còn trống (nếu có).
- Nếu không có sân đúng khu vực: nói rõ, rồi gợi ý 2–3 khu vực gần đó (nếu PLAN_JSON có).
`.trim();

async function polishReply({ message, plan, fallback }) {
    const enabled = String(process.env.CHATBOT_USE_LLM || "") === "1";
    const baseUrl = process.env.LLM_BASE_URL;
    if (!enabled || !baseUrl) return fallback;

    const user = `
USER_MESSAGE: ${String(message || "")}

PLAN_JSON:
${JSON.stringify(plan, null, 2)}

Hãy viết câu trả lời cuối cùng cho user.
`.trim();

    const out = await llmChat({
        baseUrl,
        system: COMPOSER_SYSTEM,
        user,
        temperature: 0.3,
        max_tokens: 220,
    });

    return out || fallback;
}

/**
 * ===========================
 * Build Answer Plan (deterministic)
 * ===========================
 */
async function buildAnswerPlan({ message, context }) {
    const intent = detectIntent(message);

    const district = extractDistrict(message) || context?.district || null;

    const hourObj = extractHour(message);
    const timeWindow = extractTimeWindow(message);

    let timeHHMM = null;
    let hoursToCheck = [];

    if (hourObj?.range) {
        // "7–8h"
        for (let h = hourObj.range[0]; h <= hourObj.range[1]; h++) {
            hoursToCheck.push(h);
        }
    } else if (hourObj?.hour != null) {
        // "20h", "19:30"
        timeHHMM = formatHHMM({ hour: hourObj.hour, minute: hourObj.minute || 0 });
        hoursToCheck = [hourObj.hour];
    } else if (timeWindow) {
        // "chiều tối", "buổi sáng"
        for (let h = timeWindow[0]; h <= timeWindow[1]; h++) {
            hoursToCheck.push(h);
        }
    } else {
        hoursToCheck = POPULAR_HOURS;
        timeHHMM = context?.timeHHMM || null;
    }


    const dr = extractDateRange(message);
    const dateRange = dr || { kind: "single", start: new Date(), label: "hôm nay" };

    // session state update
    const nextState = {
        ...(context || {}),
        district: district || context?.district || null,
        timeHHMM: timeHHMM || context?.timeHHMM || null,
        dateYMD: dateRange.kind === "single" ? formatDateYMD(dateRange.start) : context?.dateYMD || null,
        lastIntent: intent,
    };

    // Greeting
    if (intent === "greeting") {
        const plan = {
            type: "GREETING",
            session: { district: district || null },
        };
        const fallback = district
            ? `Chào bạn! Bạn đang ở ${district} đúng không? Bạn muốn mình gợi ý sân gần bạn hay tìm sân giá tốt?`
            : `Chào bạn! Mình là trợ lý PicklePickle. Bạn đang ở khu vực nào để mình gợi ý sân gần bạn?`;
        return { plan, fallback, nextState };
    }

    // Need district for most intents
    if (!district) {
        const plan = planAskDistrict();
        return { plan, fallback: plan.question, nextState };
    }

    // === venues pool (cached) ===
    const poolKey = `venues:${district}`;
    let venuesLite = cacheGet(poolKey);

    if (!venuesLite) {
        const areas = buildAreaCandidates(district).slice(0, 6);
        let raw = await fetchVenuesByAreas(areas, 10);


        const hasExactDistrict = raw.some(
            v => String(v?.district || "").trim() === district
        );

        if (!hasExactDistrict) {
            // fetch rộng toàn TP.HCM (không area)
            const fallbackRes = await searchVenues({
                keyword: "",
                page: 1,
                limit: 50,
            });

            const fallbackItems = fallbackRes?.items || [];

            const localExact = fallbackItems.filter(
                v => String(v?.district || "").trim() === district
            );

            raw = uniqById([...raw, ...localExact]);
        }

        venuesLite = raw.map(toVenueLite);
        cacheSet(poolKey, venuesLite);

    }

    const exact = venuesLite.filter((v) => sameDistrict(v.district, district));
    const nearList = nearbyDistricts(district);

    // Recommend/Cheap/Fallback -> list venues
    if (intent === "recommend" || intent === "cheap" || intent === "fallback") {
        const wantsCheap = intent === "cheap" || /(giá tốt|giá rẻ|rẻ nhất|giá thấp|rẻ)/i.test(String(message));

        const sorted = wantsCheap
            ? [...venuesLite].sort((a, b) => (a.priceFrom ?? 1e18) - (b.priceFrom ?? 1e18))
            : [...venuesLite];

        const primary = exact.length
            ? sorted.filter((v) => sameDistrict(v.district, district))
            : [];
        const secondary = exact.length
            ? sorted.filter((v) => !sameDistrict(v.district, district))
            : sorted;

        const picks = (primary.length ? primary : secondary).slice(0, 3);

        if (!picks.length) {
            const plan = {
                type: "NO_RESULT",
                intent,
                district,
                nearbyDistricts: nearList,
                venues: [],
            };
            const fallback = nearList.length
                ? `Mình chưa thấy sân ở ${district}. Gần đó bạn có thể xem ở ${nearList.join(", ")}.`
                : `Mình chưa thấy sân ở ${district}.`;
            return { plan, fallback, nextState };
        }

        const plan = {
            type: "LIST_VENUES",
            intent: wantsCheap ? "cheap" : "recommend",
            district,
            exactMatchFound: exact.length > 0,
            nearbyDistricts: exact.length ? [] : nearList,
            venues: picks.map((v) => ({
                name: v.name,
                district: v.district,
                address: v.address,
                priceFrom: v.priceFrom,
                openHours: openHoursOf(v),
            })),
        };

        // fallback (if LLM off)
        const lines = plan.venues.map((x) => {
            const price = x.priceFrom ? ` — từ ${formatVND(x.priceFrom)}đ/giờ` : "";
            const addr = x.address ? ` — ${x.address}` : "";
            return `• ${x.name} — ${x.district || ""}${addr}${price}`;
        });

        const hint = plan.exactMatchFound
            ? ""
            : (plan.nearbyDistricts?.length ? `\n(Gần ${district}: ${plan.nearbyDistricts.join(", ")})` : "");

        const fallback = `${wantsCheap ? `Một vài sân giá tốt quanh ${district}:` : `Một vài sân quanh ${district}:`}\n${lines.join(
            "\n"
        )}${hint}`.trim();

        return { plan, fallback, nextState };
    }

    // Open hours
    if (intent === "open_hours") {
        const picks = (exact.length ? exact : venuesLite).slice(0, 3);
        const dateYMD = formatDateYMD(dateRange.start);

        const venues = await Promise.all(
            picks.map(async (v) => {
                let openHours = openHoursOf(v);
                try {
                    const cfg = await getVenueConfigForDay({ venueId: v.venueId, dateStr: dateYMD });
                    if (cfg?.openTime || cfg?.closeTime) {
                        openHours = `${cfg.openTime || v.openTime || "05:00"}-${cfg.closeTime || v.closeTime || "22:00"}`;
                    }
                } catch { }
                return {
                    name: v.name,
                    district: v.district,
                    address: v.address,
                    openHours,
                };
            })
        );

        const plan = {
            type: "OPEN_HOURS",
            district,
            date:
                dateRange.kind === "range"
                    ? { kind: "range", startYMD: formatDateYMD(dateRange.start), endYMD: formatDateYMD(dateRange.end) }
                    : { kind: "single", dateYMD },
            venues,
        };

        const fallbackLines = venues.map(
            (x) => `• ${x.name} — ${x.district || ""}${x.address ? ` — ${x.address}` : ""}${x.openHours ? ` — ${x.openHours}` : ""}`
        );

        const fallback =
            dateRange.kind === "range"
                ? `Giờ mở cửa tham khảo (cuối tuần) quanh ${district}:\n${fallbackLines.join("\n")}`
                : `Giờ mở cửa tham khảo (hôm nay) quanh ${district}:\n${fallbackLines.join("\n")}`;

        return { plan, fallback, nextState };
    }

    // Availability
    if (intent === "availability") {
        // Nếu user KHÔNG nói giờ:
        // -> không hỏi lại, tự scan POPULAR_HOURS và trả danh sách slot trống.
        // Nếu user nói giờ rồi -> check đúng giờ đó.
        const picks = (exact.length ? exact : venuesLite).slice(0, 3);

        const range =
            dateRange.kind === "range"
                ? { kind: "range", startYMD: formatDateYMD(dateRange.start), endYMD: formatDateYMD(dateRange.end) }
                : { kind: "single", dateYMD: formatDateYMD(dateRange.start) };


        const datesToCheck = range.kind === "range" ? [range.startYMD, range.endYMD] : [range.dateYMD];

        async function getAvailCached(venueId, dateYMD) {
            const k = `avail:${venueId}:${dateYMD}`;
            const v = cacheGet(k);
            if (v) return v;
            const data = await getVenueAvailability({ venueId, dateStr: dateYMD });
            cacheSet(k, data);
            return data;
        }

        const venues = [];

        for (const v of picks) {
            let error = false;
            const perDate = [];

            for (const dateYMD of datesToCheck) {
                try {
                    const avail = await getAvailCached(v.venueId, dateYMD);
                    const courts = Array.isArray(avail?.courts) ? avail.courts : [];

                    const freeByHour = {};
                    for (const h of hoursToCheck) freeByHour[h] = 0;

                    for (const c of courts) {
                        const slots = Array.isArray(c?.slots) ? c.slots : [];
                        for (const h of hoursToCheck) {
                            const s = slots.find((x) => slotMatchesHour(x, h));
                            if (s && slotIsAvailable(s)) freeByHour[h] += 1;
                        }
                    }

                    const availableSlots = Object.entries(freeByHour)
                        .filter(([, free]) => free > 0)
                        .map(([h]) => `${String(h).padStart(2, "0")}:00`)
                        .slice(0, 5);

                    perDate.push({
                        dateYMD,
                        availableSlots,
                        freeCourtsAtTime: timeHHMM ? (freeByHour[Number(String(timeHHMM).slice(0, 2))] || 0) : null,
                    });
                } catch {
                    error = true;
                    perDate.push({ dateYMD, availableSlots: [], freeCourtsAtTime: null });
                }
            }

            venues.push({
                name: v.name,
                district: v.district,
                address: v.address,
                openHours: openHoursOf(v),
                error,
                perDate,
            });
        }

        // Nếu user thực sự hỏi "còn trống không" mà không giờ, mình không hỏi lại.
        // Chỉ hỏi lại giờ khi backend không scan được slot nào và message yêu cầu giờ rất cụ thể? -> bỏ luôn theo yêu cầu của bạn.
        const plan = {
            type: "AVAILABILITY",
            district,
            date: range,
            requestedTimeHHMM: timeHHMM || null,
            scannedHours: timeHHMM
                ? null
                : hoursToCheck.map(h => `${String(h).padStart(2, "0")}:00`),

            venues,
        };

        const fallback = timeHHMM
            ? `Mình đã check khung ${timeHHMM} ở ${district}.`
            : `Mình đã check các khung giờ phổ biến ở ${district}.`;

        return { plan, fallback, nextState };
    }

    // default
    const plan = {
        type: "FALLBACK",
        district,
    };
    const fallback = `Bạn muốn hỏi về sân gần ${district}, giá rẻ, giờ mở cửa hay khung giờ trống?`;
    return { plan, fallback, nextState };
}

/**
 * ===========================
 * Public handler
 * ===========================
 */
export async function handleChatbotMessage({ message, context }) {
    const ctx = context && typeof context === "object" ? context : {};

    const { plan, fallback, nextState } = await buildAnswerPlan({ message, context: ctx });

    // 1 LLM call (polish)
    const reply = await polishReply({ message, plan, fallback });

    return { reply, context: nextState };
}




function normalizeDistrict(s = "") {
    return String(s)
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function sameDistrict(a, b) {
    if (!a || !b) return false;
    return normalizeDistrict(a) === normalizeDistrict(b);
}
function stripDiacriticsLocal(s = "") {
    return String(s)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
}

function normTextLocal(s = "") {
    return stripDiacriticsLocal(String(s))
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

// match "Quận 10" bằng district hoặc address (Q10/quan10/(Quan 10)...)
function matchDistrictLoose(venue, districtCanon) {
    const d = normTextLocal(venue?.district || "");
    const a = normTextLocal(venue?.address || "");

    const target = normTextLocal(districtCanon); // "quan 10"
    if (!target) return false;

    if (d === target) return true;
    if (d.includes(target)) return true;

    // address variants: "q10", "q 10", "(quan 10)", "quan10"
    const targetNum = (target.match(/\bquan\s+(\d{1,2})\b/) || [])[1];
    if (targetNum) {
        const rx = new RegExp(`\\b(q\\s*\\.?\\s*${targetNum}|quan\\s*${targetNum}|quan${targetNum})\\b`, "i");
        return rx.test(a) || rx.test(d);
    }

    // named district like "binh thanh"
    return a.includes(target);
}
