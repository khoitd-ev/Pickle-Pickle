"use client";

import CourtCard from "../courts/CourtCard";
import Pagination from "../layout/Pagination";

export default function SearchResultsGrid({
  venues,
  currentPage,
  totalPages,
  onPageChange,
  loading,
}) {
  // Map venue -> court object cho CourtCard
  const mappedCourts = (venues ?? []).map((v) => {
    const avatar = v.avatarImageUrl || v.avatarImage || "";
    const primaryImage =
      (v.images || []).find((img) => img.isPrimary) ||
      (v.images || [])[0];

    // ---- PHONE: ưu tiên heroPhone -> phone ----
    const phone = v.heroPhone || v.phone || "";

    // ---- ADDRESS: ưu tiên heroAddress -> address ----
    const address = v.heroAddress || v.address || "";

    // ---- TIME RANGE: nếu API đã bơm openTime/closeTime thì dùng, không thì fallback ----
    let timeRange = "05:00–23:00";
    if (v.openTime || v.closeTime) {
      const open = v.openTime || "05:00";
      const close = v.closeTime || "23:00";
      timeRange = `${open}–${close}`;
    }

    // ---- PRICE: dùng giá index đầu tiên trong cấu hình giá theo khung giờ (nếu có) ----
    let configFirstPrice = null;

    if (Array.isArray(v.priceRules) && v.priceRules.length > 0) {
      // sort theo thời gian bắt đầu nếu có trường timeFrom / startTime
      const sortedRules = [...v.priceRules].sort((a, b) => {
        const aTime = a.timeFrom || a.startTime || "";
        const bTime = b.timeFrom || b.startTime || "";
        return aTime.localeCompare(bTime);
      });

      const firstRule = sortedRules[0];

      // cố gắng lấy fixedPricePerHour trước, rồi đến walkinPricePerHour, rồi price
      const p =
        typeof firstRule.fixedPricePerHour === "number"
          ? firstRule.fixedPricePerHour
          : typeof firstRule.walkinPricePerHour === "number"
          ? firstRule.walkinPricePerHour
          : typeof firstRule.price === "number"
          ? firstRule.price
          : null;

      if (typeof p === "number") {
        configFirstPrice = p;
      }
    }

    // fallback: nếu chưa có cấu hình priceRules thì dùng basePricePerHour từ Venue
    const basePrice =
      typeof v.basePricePerHour === "number" ? v.basePricePerHour : null;

    const finalPrice =
      typeof configFirstPrice === "number" ? configFirstPrice : basePrice;

    const price =
      typeof finalPrice === "number" && finalPrice > 0
        ? `${finalPrice.toLocaleString("vi-VN")}đ/giờ`
        : "";

    return {
      id: v._id,
      name: v.name,
      rating: v.rating ?? 4.5,
      reviews: v.reviewCount ?? 0,
      phone,
      address,
      timeRange,
      price,
      image: avatar || primaryImage?.url || "/courts/sample1.png",
    };
  });

  const mid = Math.ceil(mappedCourts.length / 2);
  const leftColumn = mappedCourts.slice(0, mid);
  const rightColumn = mappedCourts.slice(mid);

  return (
    <div>
      {loading && (
        <p className="mb-2 text-sm text-zinc-500">Đang tải danh sách sân...</p>
      )}

      {/* GRID 2 CỘT */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border-2 border-dashed border-purple-200 p-3">
          <div className="space-y-3">
            {leftColumn.map((court) => (
              <CourtCard key={court.id} court={court} />
            ))}
            {!loading &&
              leftColumn.length === 0 &&
              rightColumn.length === 0 && (
                <p className="text-xs text-zinc-500">
                  Không tìm thấy sân phù hợp.
                </p>
              )}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-purple-200 p-3">
          <div className="space-y-3">
            {rightColumn.map((court) => (
              <CourtCard key={court.id} court={court} />
            ))}
          </div>
        </div>
      </div>

      {/* PAGINATION */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
