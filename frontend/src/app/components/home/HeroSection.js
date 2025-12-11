// src/app/components/home/HeroSection.js
import Image from "next/image";
import Container from "../layout/Container";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-black text-white">
      <div className="relative h-[420px] md:h-[520px] lg:h-[580px] overflow-hidden">
        {/* Background image */}
        <Image
          src="/hero/hero-main.jpg" // Đổi lại nếu bạn đặt tên khác
          alt="Sân pickleball"
          fill
          priority
          className="object-cover"
        />

        {/* Overlay gradient để bên trái sáng, bên phải tối */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/25 to-black/80" />

        {/* Content */}
        <Container className="relative h-full flex items-center">
          <div className="max-w-xl space-y-4">
            <h1 className="font-pickle font-extrabold text-[32px] md:text-[44px] lg:text-[52px] leading-tight text-black">
              Đặt sân Pickleball
              <br />
              dễ dàng ở HCM
            </h1>

            <p className="text-sm md:text-base text-black/80 max-w-md">
              Chọn sân gần bạn, xem khung giờ trống, đặt sân chỉ trong vài chạm.
            </p>



            <Link
              href="/search"
              className="mt-6 inline-flex items-center justify-center px-8 py-3 bg-black text-white text-sm md:text-base font-semibold rounded-sm shadow-md transition hover:bg-zinc-900 hover:scale-[1.02] hover:shadow-lg"
            >
              Tìm kiếm ngay
            </Link>
          </div>
        </Container>
      </div>
    </section>
  );
}
