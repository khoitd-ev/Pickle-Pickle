"use client";

import { useState, useEffect } from "react";
import BookingHistoryList from "../components/bookings/history/BookingHistoryList";
import Pagination from "../components/layout/Pagination";
import BookingHistoryFilter from "../components/bookings/history/BookingHistoryFilter";

const ITEMS_PER_PAGE = 7;
const API_HISTORY_LIMIT = 100;

// Mock data fallback
const MOCK_BOOKINGS = [
  {
    id: "BK-0001",
    courtName: "PickleLand Thảo Điền",
    courtCode: "TREASURE9",
    date: "20/10/2025",
    startTime: "7:00 AM",
    endTime: "9:00 AM",
    statusLabel: "Sắp diễn ra",
    rating: 4.2,
    reviews: 36,
    imageUrl: "/history/mock1.png",
    isFavorite: false,
    totalAmount: 480000, // mock để hiển thị trong hóa đơn
    _dateValue: new Date("2025-10-20").getTime(),
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;


function resolveImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";
  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`; // http://localhost:4000/api/uploads/...
  }
  return raw; // /courts/... trong public
}

function pickVenueAvatar(venue) {
  if (!venue) return "";

  // 1) avatarImage (đúng theo content model bạn đang dùng)
  if (venue.avatarImage) return venue.avatarImage;

  // 2) fallback qua images (primary -> first)
  const imgs = Array.isArray(venue.images) ? venue.images : [];
  const primary = imgs.find((x) => x?.isPrimary && x?.url)?.url;
  return primary || imgs[0]?.url || "";
}

// map 1 booking từ API -> card
function mapApiBookingToCard(b) {
  let startTime = "";
  let endTime = "";

  if (b.timeLabel && typeof b.timeLabel === "string") {
    const parts = b.timeLabel.split("-");
    if (parts.length === 2) {
      startTime = parts[0].trim();
      endTime = parts[1].trim();
    }
  }

  const dateObj = b.date
    ? new Date(b.date)
    : b.createdAt
      ? new Date(b.createdAt)
      : null;

  const internalId = b.id || b._id || null;

  const venueAvatarRaw = pickVenueAvatar(b?.venue);
  const venueAvatar = resolveImageUrl(venueAvatarRaw)

  return {
    // id dùng cho React key + so khớp trong FE
    id: internalId || b.code,
    // bookingId là id mongo để gọi /bookings/:bookingId
    bookingId: internalId,
    courtName: b.courtName || b.venueName || "Sân chưa rõ",
    courtCode: b.code || "",
    date: b.dateLabel || "",
    startTime,
    endTime,
    // thêm status để check hủy được hay không
    status: b.bookingStatus || b.status || "",
    statusLabel: b.bookingStatusLabel || b.paymentStatusLabel || "",
    rating: 4.5,
    reviews: 50,
    totalAmount: b.totalAmount ?? b.price ?? 0,
    _dateValue: dateObj ? dateObj.getTime() : 0,
    imageUrl: venueAvatar || "/history/mock1.png",
  };
}

/**
 * Gộp dữ liệu chi tiết booking từ API vào dữ liệu từ card
 * (BE mới không còn timeRange, chỉ dùng items + amount + status)
 */
function mergeDetailToBooking(detail, fallback) {
  if (!detail) return fallback;

  const amount = detail.amount || {};
  const status = detail.status || {};

  return {
    ...fallback,
    id: detail.id || fallback.id,
    code: detail.code || fallback.code,
    date: detail.dateLabel || fallback.date,

    status: status.code || fallback.status,
    statusLabel: status.label || fallback.statusLabel,

    totalAmount:
      typeof amount.totalAmount === "number"
        ? amount.totalAmount
        : fallback.totalAmount,

    venue: detail.venue || fallback.venue,
    items: detail.items || [],
    slotCount: typeof detail.slotCount === "number" ? detail.slotCount : undefined,
    addons: detail.addons || fallback.addons || { items: [], total: 0 },
    note: detail.note ?? fallback.note,


    payment: detail.payment || fallback.payment,
  };
}

/**
 * Popup hóa đơn / chi tiết đặt sân
 * - dùng list items từ API để show từng khung giờ
 * - dịch vụ thêm: 1 dòng text chung
 */
function InvoiceModal({ booking, loading, error, onClose }) {
  if (!booking) return null;

  const {
    id,
    code,
    date,
    statusLabel,
    totalAmount,
    items = [],
    venue,
    slotCount,
    note,
  } = booking;

  const addonsText =
    typeof note === "string" && note.toLowerCase().startsWith("addons:")
      ? note.replace(/^addons:\s*/i, "")
      : "";

  const hasAmount =
    typeof totalAmount === "number" &&
    Number.isFinite(totalAmount) &&
    totalAmount > 0;

  const hasItems = Array.isArray(items) && items.length > 0;
  const displayCode = code || id;
  const displaySlotCount =
    typeof slotCount === "number"
      ? slotCount
      : items.reduce(
        (sum, it) => sum + (it.slotEnd - it.slotStart + 1 || 0),
        0
      );
  const addons = booking?.addons || { items: [], total: 0 };
  const hasAddons = Array.isArray(addons.items) && addons.items.length > 0;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-semibold text-black">
            Chi tiết đặt sân
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#f3f3f3] flex items-center justify-center text-sm text-[#555] hover:bg-[#e5e5e5]"
          >
            ×
          </button>
        </div>

        {/* trạng thái load / lỗi */}
        {loading && (
          <p className="mb-2 text-xs text-[#999]">
            Đang tải chi tiết đặt sân...
          </p>
        )}
        {error && (
          <p className="mb-2 text-xs text-red-500">
            {error}
          </p>
        )}

        <div className="space-y-4 text-xs md:text-sm text-[#333]">
          {/* Mã & trạng thái */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] text-[#777]">Mã đặt sân</p>
              <p className="font-semibold text-black">{displayCode}</p>
            </div>

            {statusLabel && (
              <div className="text-right">
                <p className="text-[11px] text-[#777]">Trạng thái</p>
                <span className="inline-flex rounded-full bg-[#f0f0f0] px-3 py-1 text-[11px] font-medium text-[#444]">
                  {statusLabel}
                </span>
              </div>
            )}
          </div>

          {/* Thông tin địa điểm */}
          {(venue || date) && (
            <div className="rounded-xl bg-[#fafafa] border border-[#eee] px-3 py-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#777]">Địa điểm</p>
                  <p className="text-sm font-semibold text-black">
                    {venue?.name || "Sân Pickleball"}
                  </p>
                </div>
                {date && (
                  <div className="text-right">
                    <p className="text-[11px] text-[#777]">Ngày chơi</p>
                    <p className="text-sm font-medium text-black">{date}</p>
                  </div>
                )}
              </div>

              {venue?.address && (
                <p className="text-[11px] text-[#777]">{venue.address}</p>
              )}
              {venue?.phone && (
                <p className="text-[11px] text-[#777]">
                  Số điện thoại: {venue.phone}
                </p>
              )}

              {displaySlotCount > 0 && (
                <p className="text-[11px] text-[#777]">
                  Đặt {displaySlotCount} khung giờ (tổng cộng).
                </p>
              )}
            </div>
          )}

          {/* Danh sách khung giờ / sân */}
          {hasItems && (
            <div className="rounded-xl bg-[#fafafa] border border-[#eee] px-3 py-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-[#777]">Chi tiết sân</p>
              </div>

              <div className="space-y-1.5">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <div>
                      <p className="text-xs font-medium text-black">
                        {it.courtName || "Sân"}
                      </p>
                      <p className="text-[11px] text-[#777]">
                        {it.dateLabel || date} ·{" "}
                        {it.timeLabel ||
                          `${it.timeFrom || ""} - ${it.timeTo || ""}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-[#777]">
                        {it.slotEnd >= it.slotStart
                          ? `${it.slotEnd - it.slotStart + 1} giờ`
                          : null}
                      </p>
                      {it.lineAmount != null && (
                        <p className="text-sm font-semibold text-black">
                          {Number(it.lineAmount).toLocaleString("vi-VN")} VND
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dịch vụ thêm - addons */}
          <div className="rounded-xl bg-[#fafafa] border border-[#eee] px-3 py-2.5 space-y-1">
            <p className="text-[11px] text-[#777]">Dịch vụ thêm</p>

            {!hasAddons ? (
              addonsText ? (
                <p className="text-[11px] text-[#555]">{addonsText}</p>
              ) : (
                <p className="text-[11px] text-[#555]">Không có dịch vụ thêm.</p>
              )
            ) : (
              <div className="mt-1 space-y-1.5">
                {addons.items.map((a, idx) => {
                  const qty = Number(a.quantity || 0);
                  const unit = Number(a.unitPrice || 0);
                  const line =
                    a.lineTotal != null ? Number(a.lineTotal) : unit * qty;

                  return (
                    <div
                      key={a.addonId || a.id || `${a.name || "addon"}-${idx}`}
                      className="flex items-start justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-black">
                          {a.name || "Dịch vụ thêm"}
                        </p>
                        {a.category && (
                          <p className="text-[11px] text-[#777]">{a.category}</p>
                        )}
                        <p className="text-[11px] text-[#777]">
                          Số lượng: {qty}
                          {unit ? ` · Đơn giá: ${unit.toLocaleString("vi-VN")} VND` : ""}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-black">
                          {Number(line || 0).toLocaleString("vi-VN")} VND
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-[#eee] pt-2 flex items-center justify-between">
                  <span className="text-xs md:text-sm font-semibold">Tổng dịch vụ thêm</span>
                  <span className="text-xs md:text-sm font-semibold text-black">
                    {Number(addons.total || 0).toLocaleString("vi-VN")} VND
                  </span>
                </div>
              </div>
            )}
          </div>


          {/* Tổng thanh toán */}
          <div className="border-t border-[#eee] pt-3 space-y-1">
            <div className="flex items-center justify-between text-xs md:text-sm font-semibold mt-1">
              <span>Tổng thanh toán</span>
              <span className={hasAmount ? "text-emerald-600" : ""}>
                {hasAmount
                  ? `${totalAmount.toLocaleString("vi-VN")} VND`
                  : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Popup confirm hủy sân
 * - thêm props loading + error để hiển thị khi call API
 */
function CancelConfirmModal({ booking, loading, error, onConfirm, onClose }) {
  if (!booking) return null;

  const handleConfirm = () => {
    if (!loading && onConfirm) onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 md:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base md:text-lg font-semibold text-black">
          Xác nhận hủy sân
        </h2>

        <p className="mt-3 text-sm text-[#555]">
          Bạn có chắc chắn muốn hủy sân{" "}
          <span className="font-semibold text-black">
            {booking.courtName}
          </span>{" "}
          vào{" "}
          <span className="font-semibold text-black">{booking.date}</span> từ{" "}
          <span className="font-semibold text-black">
            {booking.startTime} - {booking.endTime}
          </span>
          ?
        </p>

        <p className="mt-2 text-[11px] text-[#999]">
          Sau này chúng ta có thể bổ sung thêm điều kiện hủy, phí phạt, v.v.
        </p>

        {error && (
          <p className="mt-2 text-[11px] text-red-500">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-full text-xs md:text-sm border border-[#d4d4d4] text-[#333] bg-white hover:bg-[#f5f5f5] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Giữ lại
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-full text-xs md:text-sm bg-[#e02424] text-white hover:bg-[#c81e1e] transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Đang hủy..." : "Xác nhận hủy"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingHistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [sort, setSort] = useState("oldest");
  const [bookings, setBookings] = useState(MOCK_BOOKINGS);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // state cho popup chi tiết
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // state cho popup hủy
  const [cancelBooking, setCancelBooking] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    if (!API_BASE) {
      console.error("NEXT_PUBLIC_API_BASE is not set");
      return;
    }

    let cancelled = false;

    async function fetchHistory() {
      try {
        setLoading(true);
        setAuthError("");

        //  LẤY TOKEN GIỐNG TRANG BOOKING
        // ưu tiên pptoken, fallback sang pp_token
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("pptoken") ||
            localStorage.getItem("pp_token")
            : null;

        console.log("[History] token =", token);

        if (!token) {
          console.log("[History] No token -> dùng MOCK_BOOKINGS");
          return;
        }

        const url = `${API_BASE}/bookings/history?page=1&limit=${API_HISTORY_LIMIT}`;
        console.log("[History] calling:", url);

        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok) {
          const msg = json?.message || `Error ${res.status}`;
          console.warn("[History] Error:", res.status, msg);

          if (res.status === 401) {
            setAuthError(
              (json && json.message) ||
              "Phiên đăng nhập đã hết hạn hoặc không hợp lệ."
            );
          }
          // Giữ mock
          return;
        }

        const wrapped = json?.data || json || {};
        const items = wrapped.items || wrapped.bookings || [];

        if (Array.isArray(items) && items.length > 0) {
          const mapped = items.map(mapApiBookingToCard);
          setBookings(mapped);
        } else {
          console.log("[History] API không trả booking nào, giữ mock");
        }
      } catch (err) {
        console.error("[History] Lỗi gọi /bookings/history:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  // sort theo lựa chọn
  const sortedBookings = [...bookings].sort((a, b) => {
    const av = a._dateValue || 0;
    const bv = b._dateValue || 0;
    if (sort === "newest") return bv - av;
    return av - bv;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(sortedBookings.length / ITEMS_PER_PAGE)
  );
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageData = sortedBookings.slice(startIndex, endIndex);

  // ===== HANDLER CHI TIẾT (có gọi API) =====
  const handleOpenDetail = async (booking) => {
    // cho popup hiện trước với dữ liệu tóm tắt, sau đó merge chi tiết
    setSelectedBooking(booking);
    setDetailError("");

    if (!API_BASE) return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("pptoken") || localStorage.getItem("pp_token")
        : null;

    if (!token) {
      console.warn("[History] handleOpenDetail: không có token, dùng mock");
      return;
    }

    const bookingId = booking.bookingId || booking.id;
    if (!bookingId) {
      console.warn("[History] handleOpenDetail: thiếu bookingId");
      return;
    }

    try {
      setDetailLoading(true);

      const url = `${API_BASE}/bookings/${bookingId}`;
      console.log("[History] detail calling:", url);

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message || `Error ${res.status}`;
        console.warn("[History] detail error:", res.status, msg);
        setDetailError(msg);
        return;
      }

      const data = json?.data || json;
      const merged = mergeDetailToBooking(data, booking);
      setSelectedBooking(merged);
    } catch (err) {
      console.error("[History] Lỗi gọi /bookings/:id:", err);
      setDetailError("Không thể tải chi tiết đặt sân. Vui lòng thử lại.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedBooking(null);
    setDetailError("");
    setDetailLoading(false);
  };

  // ===== HANDLER HỦY SÂN (có gọi API) =====
  const handleOpenCancel = (booking) => {
    setCancelBooking(booking);
    setCancelError("");
  };

  const handleCloseCancel = () => {
    setCancelBooking(null);
    setCancelError("");
    setCancelLoading(false);
  };

  const handleConfirmCancel = async () => {
    if (!cancelBooking) return;

    if (!API_BASE) {
      // fallback: nếu không có API base thì vẫn mock local hủy
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelBooking.id
            ? {
              ...b,
              status: "cancelled",
              statusLabel: "Đã hủy",
            }
            : b
        )
      );
      setCancelBooking(null);
      return;
    }

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("pptoken") || localStorage.getItem("pp_token")
        : null;

    if (!token) {
      setCancelError("Bạn cần đăng nhập để hủy đặt sân.");
      return;
    }

    const bookingId = cancelBooking.bookingId || cancelBooking.id;
    if (!bookingId) {
      setCancelError("Thiếu ID đặt sân, không thể hủy.");
      return;
    }

    try {
      setCancelLoading(true);
      setCancelError("");

      const url = `${API_BASE}/bookings/${bookingId}/cancel`;
      console.log("[History] cancel calling:", url);

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message || `Error ${res.status}`;
        console.warn("[History] cancel error:", res.status, msg);
        setCancelError(msg);
        return;
      }

      const data = json?.data || json;
      const status = data?.status || {};

      // update trạng thái trong list
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancelBooking.id
            ? {
              ...b,
              status: status.code || "cancelled",
              statusLabel: status.label || "Đã hủy",
            }
            : b
        )
      );

      setCancelBooking(null);
    } catch (err) {
      console.error("[History] Lỗi POST /bookings/:id/cancel:", err);
      setCancelError("Không thể hủy đặt sân. Vui lòng thử lại.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#f4f4f4]">
      <section className="max-w-[1120px] mx-auto pt-8 pb-16">
        <BookingHistoryFilter sort={sort} onChangeSort={setSort} />

        {authError && (
          <p className="mt-4 text-sm text-red-500">
            {authError} (đang hiển thị dữ liệu demo).
          </p>
        )}

        {loading ? (
          <div className="mt-8 text-sm text-[#666]">Đang tải lịch sử.</div>
        ) : (
          <BookingHistoryList
            bookings={pageData}
            onViewDetail={handleOpenDetail}
            onCancel={handleOpenCancel}
          />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </section>

      {/* Popup chi tiết / hóa đơn */}
      {selectedBooking && (
        <InvoiceModal
          booking={selectedBooking}
          loading={detailLoading}
          error={detailError}
          onClose={handleCloseDetail}
        />
      )}

      {/* Popup xác nhận hủy */}
      {cancelBooking && (
        <CancelConfirmModal
          booking={cancelBooking}
          loading={cancelLoading}
          error={cancelError}
          onConfirm={handleConfirmCancel}
          onClose={handleCloseCancel}
        />
      )}
    </main>
  );
}
