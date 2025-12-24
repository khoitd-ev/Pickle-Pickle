"use client";

import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function resolveImageUrl(raw) {
  if (!raw) return "/courts/sample1.png";
  if (typeof raw !== "string") return "/courts/sample1.png";

  // ảnh từ backend: /uploads/...
  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }

  // ảnh trong public: /courts/..., /search/...
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
  } = court;

  const handleViewDetail = () => {
    if (!id) return;
    router.push(`/courts/${id}`);
  };

  const displayImage = resolveImageUrl(image);

  return (
    <article className="group flex gap-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md">
      {/* Ảnh sân */}
      <div className="relative h-[140px] w-[190px] overflow-hidden rounded-xl">
        <img
          src={displayImage}
          alt={name}
          className="h-full w-full object-cover"
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
                <img
                  src="/search/heartIcon.svg"
                  alt="Yêu thích"
                  className="h-4 w-4"
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
              <img
                src="/search/whatsappIcon.svg"
                alt="Phone"
                className="h-3 w-3"
              />
              <span>Liên hệ: {phone}</span>
            </div>

            <p className="text-[11px] text-zinc-600 leading-snug">
              {address}
            </p>

            {/* Thời gian + Giá */}
            <div className="mt-1 flex flex-wrap gap-3 text-[11px] font-medium text-zinc-800">
              <div className="inline-flex items-center gap-1">
                {/* dùng clockendIcon thay clockstartIcon */}
                <img
                  src="/search/clockendIcon.svg"
                  alt="Time"
                  className="h-3 w-3"
                />
                <span>{timeRange}</span>
              </div>
              <div className="inline-flex items-center gap-1">
                <img
                  src="/search/walletIcon.svg"
                  alt="Price"
                  className="h-3 w-3"
                />
                <span>Giá: {price}</span>
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
