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
    const images = Array.isArray(v.images) ? v.images : [];

    const primaryImageDoc =
      images.find((img) => img.isPrimary) || images[0];

    // Ưu tiên avatarImage, sau đó tới ảnh primary, cuối cùng là mock
    const rawImage =
      v.avatarImage ||
      primaryImageDoc?.url ||
      "/courts/sample1.png";

    // Ưu tiên heroPhone / heroAddress nếu có
    const phone = v.heroPhone || v.phone || "";
    const address = v.heroAddress || v.address || "";

    // Lấy giờ mở / đóng nếu BE có trả về, fallback mặc định
    const openTimeRaw = v.openTime || v.openHour || "05:00";
    const closeTimeRaw = v.closeTime || v.closeHour || "23:00";

    const openTime = (openTimeRaw || "").slice(0, 5);
    const closeTime = (closeTimeRaw || "").slice(0, 5);

    const timeRange = `${openTime}–${closeTime}`;

    const basePrice =
      typeof v.basePricePerHour === "number"
        ? v.basePricePerHour
        : 0;

    const price =
      basePrice > 0
        ? `${basePrice.toLocaleString("vi-VN")}đ/giờ`
        : "";

    return {
      id: v.id || v._id,
      name: v.name,
      rating: v.rating ?? 4.5,
      reviews: v.reviewCount ?? 0,
      phone,
      address,
      timeRange,
      price,
      image: rawImage,
    };
  });

  const mid = Math.ceil(mappedCourts.length / 2);
  const leftColumn = mappedCourts.slice(0, mid);
  const rightColumn = mappedCourts.slice(mid);

  return (
    <div>
      {loading && (
        <p className="mb-2 text-sm text-zinc-500">
          Đang tải danh sách sân...
        </p>
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
