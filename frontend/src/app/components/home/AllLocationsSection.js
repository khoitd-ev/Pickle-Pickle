"use client";

import Link from "next/link";
import Container from "../layout/Container";
import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

// ===== MOCK (GIỮ NGUYÊN LIST, CHỈ ĐỔI FIELD country -> address để đúng format) =====
const leftLocations = [
  { name: "CLB HAPPY Pickleball & Billard", address: "Hồ Chí Minh", courts: 3 },
  { name: "HCMC Cultural Palace for Labors", address: "Hồ Chí Minh", courts: 2 },
  { name: "Kỳ Hoà 2 Sport Club", address: "Hồ Chí Minh", courts: 2 },
  { name: "PickleBall Vuon Lan", address: "Hồ Chí Minh", courts: 4 },
  { name: "Rudai Pickleball Center", address: "Hồ Chí Minh", courts: 6 },
  { name: "Thanh My Loi", address: "Hồ Chí Minh", courts: 3 },
  {
    name: "VietNam Pickleball Hoàng Gia SaiGon 102",
    address: "Hồ Chí Minh",
    courts: 2,
  },
];

const rightLocations = [
  {
    name: "Court One Club at New World Saigon Hotel",
    address: "Hồ Chí Minh",
    courts: 4,
  },
  { name: "HitPark Pickleball", address: "Hồ Chí Minh", courts: 2 },
  { name: "Phú Mỹ Hưng", address: "Hồ Chí Minh", courts: 3 },
  {
    name: "PickoLand Thảo Điền Pickleball Club",
    address: "Hồ Chí Minh",
    courts: 5,
  },
  { name: "Sân Cầu Lông Trần Não", address: "Hồ Chí Minh", courts: 3 },
  {
    name: "Thu Thiem USC Q2 Basketball Tennis Court",
    address: "Hồ Chí Minh",
    courts: 3,
  },
];

const MOCK_LOCATIONS = [...leftLocations, ...rightLocations];

function LocationItem({ id, name, address, courts }) {
  const href = id ? `/courts/${id}` : "#";

  return (
    <div className="flex flex-wrap items-baseline gap-1 text-sm text-slate-700">
      <Link
        href={href}
        aria-disabled={!id}
        onClick={(e) => {
          if (!id) e.preventDefault();
        }}
        className="text-[#25306b] hover:text-[#3b4bff] hover:underline underline-offset-[3px] font-medium transition-colors cursor-pointer"
      >
        {name}
      </Link>

      <span className="text-slate-400 px-1">|</span>
      <span className="text-slate-500">{address}</span>
      <span className="text-slate-400 px-1">|</span>
      <span className="text-slate-500">{courts} courts</span>
    </div>
  );
}


export default function AllLocationsSection() {
  const [locations, setLocations] = useState(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // API: /api/public/home/locations
        const url = `${API_BASE}/public/home/locations?limit=14`;

        const res = await fetch(url);
        const json = await res.json();
        const items = json?.items || [];

        if (!mounted) return;

        if (Array.isArray(items) && items.length > 0) {
          setLocations(
            items.map((v) => ({
              id: v.id || v._id, // <<< thêm dòng này
              name: v.name,
              address: v.address || "—",
              courts: Number(v.courtsCount ?? 0),
            }))
          );

        }
      } catch (e) {
        console.error("AllLocationsSection fetch failed:", e);
        // giữ mock
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const list = locations && locations.length > 0 ? locations : MOCK_LOCATIONS;

  const { left, right } = useMemo(() => {
    const mid = Math.ceil(list.length / 2);
    return { left: list.slice(0, mid), right: list.slice(mid) };
  }, [list]);

  return (
    <section className="bg-white">
      <Container className="py-12 md:py-16">
        <h2 className="text-xl md:text-2xl font-semibold text-[#25306b] mb-6">
          Tất cả địa điểm có sân Pickleball tại Hồ Chí Minh
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          <div className="space-y-2.5">
            {left.map((loc) => (
              <LocationItem key={loc.name} {...loc} />
            ))}
          </div>

          <div className="space-y-2.5">
            {right.map((loc) => (
              <LocationItem key={loc.name} {...loc} />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
