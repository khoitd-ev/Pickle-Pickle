"use client";

import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function resolveImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";
  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }
  return raw;
}


export default function CourtOverviewSection({ overview }) {
  const {
    featureLeft = [
      "Mặt sân cứng, độ nảy chuẩn thi đấu",
      "5 sân ngoài trời, mái che một phần",
      "Hệ thống chiếu sáng thi đấu ban đêm",
    ],
    featureRight = [
      "Vạch kẻ cố định theo chuẩn Pickleball",
      "Lưới căng cố định, chiều cao tiêu chuẩn",
      "Khu vực non-volley zone (kitchen) rõ ràng",
    ],
    amenitiesLeft = [
      "Đồ ăn & nước uống ngay trong khu compound",
      "Phòng vệ sinh & phòng thay đồ sạch sẽ",
      "Cửa hàng dụng cụ & phụ kiện Pickleball",
      "Khu vực nghỉ ngơi, ghế ngồi cho khán giả",
    ],
    amenitiesRight = [
      "Hệ thống đèn thi đấu ban đêm",
      "Không gian phù hợp tổ chức giải, sự kiện",
      "Bãi gửi xe xung quanh khu vực sân",
    ],
    featureImages = Array(5).fill("/courts/mockupduplicate.png"),
    amenityImages = Array(5).fill("/courts/mockupduplicate.png"),
    logoSrc = "/courts/Logo.svg",
  } = overview || {};

  return (
    <section className="mt-6 border-t border-dashed border-zinc-200 pt-8">
      {/* 5 Sân Pickleball Chuyên Dụng */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl md:text-2xl font-semibold text-zinc-900">
            5 Sân Pickleball Chuyên Dụng
          </h2>
          <Image
            src={logoSrc}
            alt="Logo"
            width={80}
            height={80}
            className="shrink-0"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 text-sm text-zinc-800">
          <div>
            <h3 className="mb-1 text-sm font-semibold text-zinc-900">
              Bề mặt &amp; Tính năng
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {featureLeft.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-semibold text-zinc-900">
              Lưới &amp; Vạch
            </h3>
            <ul className="list-disc list-inside space-y-1">
              {featureRight.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {featureImages.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="relative w-full overflow-hidden rounded-lg aspect-[3/4]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(src)}
                alt="Feature"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

      </div>

      {/* Tiện ích */}
      <div className="mt-8 space-y-4">
        <h3 className="text-base md:text-lg font-semibold text-zinc-900">
          Tiện ích
        </h3>

        <div className="grid gap-6 md:grid-cols-2 text-sm text-zinc-800">
          <div>
            <ul className="list-disc list-inside space-y-1">
              {amenitiesLeft.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <ul className="list-disc list-inside space-y-1">
              {amenitiesRight.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {amenityImages.map((src, idx) => (
            <div
              key={`${src}-${idx}`}
              className="relative w-full overflow-hidden rounded-lg aspect-[3/4]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImageUrl(src)}
                alt="Amenity"
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
