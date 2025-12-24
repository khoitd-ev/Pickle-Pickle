"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";

import BookingInfoSection from "../../../../components/courts/booking/BookingInfoSection";
import BookingInfoGuestSection from "../../../../components/courts/booking/BookingInfoGuestSection";
import AddonsSection from "../../../../components/courts/booking/AddonsSection";

// Fallback nếu chưa fetch được từ API
const FALLBACK_VENUE = {
  name: "PicklePickle Quận 1",
  address: "45 Lê Lợi, Quận 1, TP.HCM",
};

const USER_STORAGE_KEY = "pp_user";
const TOKEN_STORAGE_KEYS = ["pp_token"];
const PAYMENT_DRAFT_KEY = "pp_booking_payment_draft";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export default function CourtBookingAddonsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const courtId = params?.courtId;
  const dateFromQuery = searchParams.get("date"); // "24/11/2025"
  const slotsRaw = searchParams.get("slots"); // "Sân 2-13:00,Sân 2-14:00,..."

  const [venueName, setVenueName] = useState(FALLBACK_VENUE.name);
  const [venueAddress, setVenueAddress] = useState(FALLBACK_VENUE.address);

  const [currentUser, setCurrentUser] = useState(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  // guestInfo chuẩn theo backend: fullName/phone/email
  const [guestInfo, setGuestInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [draftFromStorage, setDraftFromStorage] = useState(null);

  //  source-of-truth cho flow (đừng dựa token/localStorage)
  const isGuestFlow = !!draftFromStorage?.isGuest;

  // addonsSummary chuẩn hóa: { items: [], total: number }
  const [addonsSummary, setAddonsSummary] = useState({
    items: [],
    total: 0,
  });

  const handleAddonsChange = useCallback((next) => {
    const items = next?.items || [];
    const total = Number(next?.total ?? next?.addonsTotal ?? 0) || 0;
    setAddonsSummary({ items, total });
  }, []);

  /* ===================== LẤY THÔNG TIN SÂN ===================== */
  useEffect(() => {
    if (!courtId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/venues/${courtId}/detail`);
        if (!res.ok) return;

        const json = await res.json();
        const court = json.data?.court || json.data;

        if (!court || cancelled) return;

        setVenueName(court.name || FALLBACK_VENUE.name);
        setVenueAddress(court.address || FALLBACK_VENUE.address);
      } catch (err) {
        console.error("fetch venue detail error", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courtId]);

  /* ===================== LOAD DRAFT ===================== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(PAYMENT_DRAFT_KEY);
    if (!raw) return;

    try {
      const d = JSON.parse(raw);
      setDraftFromStorage(d);

      // Restore addons nếu draft đã có
      if (d?.addons?.items?.length || typeof d?.addons?.total === "number") {
        setAddonsSummary({
          items: d.addons?.items || [],
          total: Number(d.addons?.total || 0),
        });
      }

      //  Restore guestInfo nếu đang flow guest
      if (d?.isGuest && d?.guestInfo) {
        setGuestInfo({
          fullName: d.guestInfo.fullName || "",
          email: d.guestInfo.email || "",
          phone: d.guestInfo.phone || "",
        });
      }
    } catch (err) {
      console.error("Cannot parse payment draft", err);
    }
  }, []);

  /* ===================== CHECK LOGIN TỪ LOCALSTORAGE ===================== */
  // NOTE: vẫn check để show info user, nhưng UI guest/user phải dựa draft.isGuest
  useEffect(() => {
    if (typeof window === "undefined") return;

    let parsedUser = null;

    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    if (rawUser) {
      try {
        parsedUser = JSON.parse(rawUser);
      } catch (err) {
        console.error("Cannot parse pp_user", err);
      }
    }

    let hasToken = false;
    for (const key of TOKEN_STORAGE_KEYS) {
      if (localStorage.getItem(key)) {
        hasToken = true;
        break;
      }
    }

    if (parsedUser || hasToken) {
      setIsAuth(true);
      setCurrentUser(parsedUser || {});
      // KHÔNG auto-fill guestInfo từ user nếu đang guest flow
      // (guest flow bắt user nhập tay)
    } else {
      setIsAuth(false);
      setCurrentUser(null);
    }

    setLoadingUser(false);
  }, [isGuestFlow]);

  /* ===================== PRICING DETAILS ===================== */
  // Ưu tiên lấy pricing từ draft (đúng theo giá API ở booking page),
  // fallback sang parse slotsRaw nếu draft thiếu.
  const fallbackPricing = buildPricingDetails(slotsRaw);

  const pricingDetails = Array.isArray(draftFromStorage?.courtPricingDetails)
    ? draftFromStorage.courtPricingDetails
    : fallbackPricing.pricingDetails;

  const totalCourtPrice =
    typeof draftFromStorage?.courtTotal === "number" && draftFromStorage.courtTotal >= 0
      ? draftFromStorage.courtTotal
      : fallbackPricing.totalCourtPrice;

  const handleEdit = () => {
    router.push(`/courts/${courtId}/booking`);
  };

  const displayDate =
    dateFromQuery || draftFromStorage?.displayDate || new Date().toLocaleDateString("vi-VN");

  const bookingInfoCommon = {
    courtName: venueName,
    courtAddress: venueAddress,
    // NOTE: guest flow thì phoneNumber lấy từ guestInfo.phone
    phoneNumber: isGuestFlow
      ? guestInfo.phone || ""
      : currentUser?.phone || currentUser?.phoneNumber || "",
    date: displayDate,
    pricingDetails,
    totalCourtPrice,
    onEdit: handleEdit,
  };

  const handleGuestInfoChange = (next) => setGuestInfo(next);

  const handleContinue = () => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(PAYMENT_DRAFT_KEY);
    if (!raw) {
      alert("Không tìm thấy thông tin đặt sân. Vui lòng đặt sân lại.");
      router.push(`/courts/${courtId}/booking`);
      return;
    }

    let existingDraft;
    try {
      existingDraft = JSON.parse(raw);
    } catch (err) {
      console.error("Cannot parse payment draft", err);
      alert("Thông tin đặt sân bị lỗi. Vui lòng đặt lại sân.");
      localStorage.removeItem(PAYMENT_DRAFT_KEY);
      router.push(`/courts/${courtId}/booking`);
      return;
    }

    const isGuest = !!existingDraft?.isGuest;

    //  validate guest
    if (isGuest) {
      if (!guestInfo.fullName?.trim() || !guestInfo.phone?.trim()) {
        alert("Vui lòng nhập Họ tên và Số điện thoại.");
        return;
      }
    }

    // Chuẩn hóa addonsSummary về {items,total}
    const normalizedAddons = {
      items: addonsSummary?.items || [],
      total: Number(addonsSummary?.total || 0),
    };

    //  giữ lại customer object cho legacy UI (nếu payment đang dùng)
    const customer = !isGuest && isAuth && currentUser
      ? {
          type: "user",
          name:
            currentUser.fullName ||
            currentUser.name ||
            currentUser.username ||
            currentUser.email ||
            "Khách hàng",
          email: currentUser.email || "",
          phone: currentUser.phone || currentUser.phoneNumber || currentUser.mobile || "",
        }
      : {
          type: "guest",
          name: guestInfo.fullName || "",
          email: guestInfo.email || "",
          phone: guestInfo.phone || "",
        };

    const updatedDraft = {
      ...existingDraft, // giữ venueId/date/courtsPayload/courtTotal...

      courtId,
      displayDate,
      courtName: venueName,
      courtAddress: venueAddress,
      courtPricingDetails: pricingDetails,
      courtTotal: totalCourtPrice,
      addons: normalizedAddons,

      //  canonical fields cho payment
      isGuest,
      guestInfo: isGuest
        ? {
            fullName: guestInfo.fullName,
            phone: guestInfo.phone,
            email: guestInfo.email || "",
          }
        : null,

      //  legacy (nếu payment/summary đang xài)
      customer,
    };

    localStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(updatedDraft));
    router.push(`/courts/${courtId}/booking/payment`);
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-4 py-10 space-y-10">
        {/* SECTION 1: Info + chi tiết giá */}
        {loadingUser ? (
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-6 md:px-10 md:py-8">
            <p className="text-sm text-zinc-500">Đang tải thông tin khách hàng...</p>
          </div>
        ) : isGuestFlow ? (
          <BookingInfoGuestSection
            guestInfo={guestInfo}
            onChangeGuestInfo={handleGuestInfoChange}
            {...bookingInfoCommon}
          />
        ) : (
          <BookingInfoSection
            user={{
              name:
                currentUser?.fullName ||
                currentUser?.name ||
                currentUser?.username ||
                currentUser?.email ||
                "Khách hàng",
              email: currentUser?.email || "",
              avatarUrl: currentUser?.avatarUrl || currentUser?.avatar || "/courts/Logo.svg",
            }}
            {...bookingInfoCommon}
          />
        )}

        {/* SECTION 2: Dịch vụ thêm */}
        <AddonsSection venueId={courtId} onChange={handleAddonsChange} />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleContinue}
            className="mt-4 rounded-md bg-black px-8 py-2.5 text-sm md:text-base font-semibold text-white shadow-sm hover:bg-zinc-800"
          >
            Tiếp tục
          </button>
        </div>
      </section>
    </main>
  );
}

/* ===================== Fallback Helpers (chỉ dùng nếu draft thiếu) ===================== */

function buildPricingDetails(slotsRaw) {
  if (!slotsRaw) {
    return { pricingDetails: [], totalCourtPrice: 0 };
  }

  const items = slotsRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [courtLabel, timeStr] = part.split("-");
      const hour = parseInt(timeStr.slice(0, 2), 10);
      return { courtLabel, hour };
    });

  if (!items.length) {
    return { pricingDetails: [], totalCourtPrice: 0 };
  }

  const byCourt = {};
  for (const item of items) {
    if (!byCourt[item.courtLabel]) byCourt[item.courtLabel] = [];
    byCourt[item.courtLabel].push(item.hour);
  }

  const pricingDetails = [];
  let totalCourtPrice = 0;

  const pad = (h) => h.toString().padStart(2, "0") + ":00";

  Object.entries(byCourt).forEach(([courtLabel, hoursArr]) => {
    const sorted = [...hoursArr].sort((a, b) => a - b);

    let start = sorted[0];
    let prev = sorted[0];

    const flushSegment = (segmentStart, segmentEnd) => {
      const hoursCount = segmentEnd - segmentStart + 1;
      // fallback giá demo
      const pricePerHour = getPriceForHour(segmentStart);
      const totalPrice = pricePerHour * hoursCount;
      totalCourtPrice += totalPrice;

      pricingDetails.push({
        id: `${courtLabel}-${segmentStart}`,
        courtLabel,
        timeRange: `${pad(segmentStart)} - ${pad(segmentEnd + 1)}`,
        totalPrice,
      });
    };

    for (let i = 1; i < sorted.length; i++) {
      const h = sorted[i];
      if (h === prev + 1) {
        prev = h;
        continue;
      }
      flushSegment(start, prev);
      start = h;
      prev = h;
    }
    flushSegment(start, prev);
  });

  return { pricingDetails, totalCourtPrice };
}

// fallback giá demo (chỉ dùng khi draft thiếu pricing)
function getPriceForHour(hour) {
  // ví dụ: giờ cao điểm đắt hơn
  if (hour >= 17 && hour <= 21) return 150000;
  return 100000;
}
