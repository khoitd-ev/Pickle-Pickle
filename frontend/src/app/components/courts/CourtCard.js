"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

function resolveImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";
  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }
  return raw;
}

export default function CourtCard({ court }) {
  const router = useRouter();
  const {
    id,
    name,
    rating,
    reviews,
    phone,
    address,
    timeRange,
    price,
    image,
  } = court || {};

  const handleViewDetail = () => {
    if (!id) return;
    router.push(`/courts/${id}`);
  };

  // ===== Logic hiển thị (fallback từ dữ liệu thật) =====
  const displayImage =
    resolveImageUrl(image) || "/courts/sample1.png";

  const displayPhone = phone || "Đang cập nhật";
  const displayAddress = address || "Địa chỉ đang cập nhật";
  const displayTimeRange = timeRange || "05:00–23:00";
  const displayPrice =
    price && price.length > 0 ? price : "Giá đang cập nhật";

  return (
    <article className="group flex gap-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
      {/* Ảnh sân */}
      <div className="relative h-[140px] w-[190px] overflow-hidden rounded-xl">
        <Image
          src={displayImage}
          alt={name}
          fill
          className="object-cover"
          sizes="190px"
        />
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 flex-col justify-between">
        {/* Hàng trên: title + rating */}
        <div>
          <div className="flex items-start justify-between gap-3">
            {/* Tên sân + tim */}
            <div className="flex items-center gap-2">
              <h3 className="text-base md:text-lg font-semibold text-zinc-900">
                {name}
              </h3>
              <button
                type="button"
                className="mt-[2px] rounded-full p-1 hover:bg-zinc-200"
              >
                <Image
                  src="/search/heartIcon.svg"
                  alt="Yêu thích"
                  width={16}
                  height={16}
                />
              </button>
            </div>

            {/* Rating */}
            <div className="flex flex-col items-end gap-1">
              <div className="inline-flex items-center gap-1 rounded-full bg-zinc-300 px-2.5 py-0.5">
                <span className="text-xs font-semibold text-zinc-900">
                  {rating}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500">{reviews} reviews</p>
            </div>
          </div>

          {/* Sao đánh giá (dòng text) */}
          <p className="mt-1 text-xs text-zinc-600">★★★★☆</p>

          {/* Liên hệ + địa chỉ */}
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-medium text-zinc-800">
              <Image
                src="/search/whatsappIcon.svg"
                alt="Phone"
                width={12}
                height={12}
              />
              <span>Liên hệ: {displayPhone}</span>
            </div>

            <p className="text-[11px] text-zinc-600 leading-snug">
              {displayAddress}
            </p>

            {/* Thời gian + Giá */}
            <div className="mt-1 flex flex-wrap gap-3 text-[11px] font-medium text-zinc-800">
              <div className="inline-flex items-center gap-1">
                {/* dùng clockendIcon thay clockstartIcon */}
                <Image
                  src="/search/clockendIcon.svg"
                  alt="Time"
                  width={12}
                  height={12}
                />
                <span>{displayTimeRange}</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <Image
                  src="/search/walletIcon.svg"
                  alt="Price"
                  width={12}
                  height={12}
                />
                <span>Giá: {displayPrice}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hàng dưới: nút hành động */}
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={handleViewDetail}
            className="rounded-md bg-zinc-300 px-4 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-zinc-400"
          >
            Xem chi tiết
          </button>

          <button
            type="button"
            className="rounded-md border border-zinc-300 bg-zinc-100 px-4 py-1.5 text-xs text-zinc-700 transition hover:bg-zinc-200"
          >
            Yêu thích
          </button>
        </div>
      </div>
    </article>
  );
}
