"use client";

import Link from "next/link";
import Container from "../layout/Container";

const leftLocations = [
  { name: "CLB HAPPY Pickleball & Billard", country: "Vietnam", courts: 3 },
  { name: "HCMC Cultural Palace for Labors", country: "Vietnam", courts: 2 },
  { name: "Kỳ Hoà 2 Sport Club", country: "Vietnam", courts: 2 },
  { name: "PickleBall Vuon Lan", country: "Vietnam", courts: 4 },
  { name: "Rudai Pickleball Center", country: "Vietnam", courts: 6 },
  { name: "Thanh My Loi", country: "Vietnam", courts: 3 },
  {
    name: "VietNam Pickleball Hoàng Gia SaiGon 102",
    country: "Vietnam",
    courts: 2,
  },
];

const rightLocations = [
  {
    name: "Court One Club at New World Saigon Hotel",
    country: "Vietnam",
    courts: 4,
  },
  { name: "HitPark Pickleball", country: "Vietnam", courts: 2 },
  { name: "Phú Mỹ Hưng", country: "Vietnam", courts: 3 },
  {
    name: "PickoLand Thảo Điền Pickleball Club",
    country: "Vietnam",
    courts: 5,
  },
  { name: "Sân Cầu Lông Trần Não", country: "Vietnam", courts: 3 },
  {
    name: "Thu Thiem USC Q2 Basketball Tennis Court",
    country: "Vietnam",
    courts: 3,
  },
];

function LocationItem({ name, country, courts }) {
  return (
    <div className="flex flex-wrap items-baseline gap-1 text-sm text-slate-700">
      {/* Tên sân – clickable + hover đổi màu + gạch chân */}
      <Link
        href="#"
        className="
          text-[#25306b]
          hover:text-[#3b4bff]
          hover:underline
          underline-offset-[3px]
          font-medium
          transition-colors
          cursor-pointer
        "
      >
        {name}
      </Link>

      <span className="text-slate-400 px-1">|</span>
      <span className="text-slate-500">{country}</span>
      <span className="text-slate-400 px-1">|</span>
      <span className="text-slate-500">{courts} courts</span>
    </div>
  );
}

export default function AllLocationsSection() {
  return (
    <section className="bg-white">
      <Container className="py-12 md:py-16">
        <h2 className="text-xl md:text-2xl font-semibold text-[#25306b] mb-6">
          Tất cả địa điểm có sân Pickleball tại Hồ Chí Minh
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          <div className="space-y-2.5">
            {leftLocations.map((loc) => (
              <LocationItem key={loc.name} {...loc} />
            ))}
          </div>

          <div className="space-y-2.5">
            {rightLocations.map((loc) => (
              <LocationItem key={loc.name} {...loc} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
