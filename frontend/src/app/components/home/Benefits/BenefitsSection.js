// src/app/components/home/Benefits/BenefitsSection.js
"use client";

import Image from "next/image";
import Container from "../../layout/Container";

const benefits = [
  {
    id: 1,
    icon: "/icons/benefits/booking.png",
    title: "Đặt Lịch online",
    desc: "Lịch biểu rõ ràng, trực quan và dễ sử dụng",
  },
  {
    id: 2,
    icon: "/icons/benefits/rocket.png",
    title: "Nhanh Chóng và Hiệu Quả",
    desc: "Tìm sân, thấy slot trống ngay. Chọn giờ và thanh toán trong vài giây.",
  },
  {
    id: 3,
    icon: "/icons/benefits/gear.png",
    title: "Theo Dõi Lịch",
    desc: "Xem tất cả đơn (Sắp diễn ra / Đã hoàn thành / Đã huỷ).",
  },
];

export default function BenefitsSection() {
  return (
    <section className="bg-white">
      <Container className="py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 items-start text-center">
          {benefits.map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center gap-4 md:gap-5"
            >
              {/* Icon */}
              <div className="h-[120px] md:h-[140px] flex items-center justify-center">
                <div className="relative w-[110px] md:w-[130px] aspect-[1/1]">
                  <Image
                    src={item.icon}
                    alt={item.title}
                    fill
                    className="object-contain"
                    sizes="130px"
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg md:text-xl font-semibold tracking-tight">
                {item.title}
              </h3>

              {/* Description */}
              <p className="max-w-xs text-sm md:text-[15px] leading-relaxed text-neutral-700">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
