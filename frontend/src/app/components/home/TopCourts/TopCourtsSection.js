"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CourtCard from "./CourtCard";
import Container from "../../layout/Container";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

// ===== MOCK GIỮ NGUYÊN =====
const courts = [
  {
    id: 1,
    name: "HCMC Cultural Palace for Labors",
    image: "/icons/courts/HCMC.png",
    courts: 2,
    permLines: true,
    permNets: true,
    portableNets: false,
  },
  {
    id: 2,
    name: "Kỳ Hoà 2 Sport Club",
    image: "/icons/courts/kyhoa.png",
    courts: 2,
    permLines: true,
    permNets: false,
    portableNets: true,
  },
  {
    id: 3,
    name: "PickoLand Thảo Điền Pickleball Club",
    image: "/icons/courts/thaodien.png",
    courts: 5,
    permLines: true,
    permNets: true,
  },
  {
    id: 4,
    name: "PickoLand Thảo Điền (Indoor)",
    image: "/icons/courts/thaodien1.png",
    courts: 5,
    permLines: true,
    permNets: true,
  },
  {
    id: 5,
    name: "District 7 Community Court",
    image: "/icons/courts/HCMC.png",
    courts: 3,
    permLines: true,
    portableNets: true,
  },
  {
    id: 6,
    name: "Sala Riverside Pickleball",
    image: "/icons/courts/kyhoa.png",
    courts: 4,
    permLines: true,
    permNets: true,
  },
  {
    id: 7,
    name: "Thủ Đức Sports Park",
    image: "/icons/courts/thaodien.png",
    courts: 3,
    permLines: true,
  },
  {
    id: 8,
    name: "Phú Mỹ Hưng Central Court",
    image: "/icons/courts/thaodien1.png",
    courts: 6,
    permLines: true,
    permNets: true,
  },
  {
    id: 9,
    name: "Vinhomes Grand Park Courts",
    image: "/icons/courts/HCMC.png",
    courts: 4,
    permLines: true,
    portableNets: true,
  },
  {
    id: 10,
    name: "City View Rooftop Pickleball",
    image: "/icons/courts/kyhoa.png",
    courts: 2,
    permLines: true,
  },
];

// nhân bản list để tạo cảm giác vô cực
const COPIES = 3;

const CARD_WIDTH = 280; // px
const GAP = 24; // px
const STEP = CARD_WIDTH + GAP;

function resolveImageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  if (raw.startsWith("/uploads/")) return `${API_BASE}${raw}`;
  return raw;
}

export default function TopCourtsSection() {
  const scrollRef = useRef(null);


  const [stateCourts, setStateCourts] = useState(courts);

  // drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);


  const extendedCourts = useMemo(() => {
    return Array.from({ length: COPIES }, (_, copyIndex) =>
      stateCourts.map((c, idx) => ({
        ...c,
        _copyKey: `${copyIndex}-${idx}`,
      }))
    ).flat();
  }, [stateCourts]);


  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const url = `${API_BASE}/public/home/top-venues?limit=8`;
        const res = await fetch(url);
        const json = await res.json();
        const items = json?.items || [];

        if (!mounted) return;

        if (Array.isArray(items) && items.length > 0) {
          setStateCourts(
            items.map((v, idx) => ({
              id: v.id || `venue-${idx}`,
              name: v.name || "—",

              image: resolveImageUrl(v.avatarImage),
              courts: Number(v.courtsCount ?? 0),

              permLines: false,
              permNets: false,
              portableNets: false,
            }))
          );
        }
      } catch (e) {
        console.error("TopCourtsSection fetch failed:", e);
        // fallback mock
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);



  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      const totalWidth = container.scrollWidth;
      if (!totalWidth) return;

      const singleWidth = totalWidth / COPIES;
      container.scrollLeft = singleWidth; // copy thứ 2 (ở giữa)
    });
  }, [extendedCourts.length]);

  // vô cực: chỉnh lại vị trí khi kéo quá xa
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const totalWidth = container.scrollWidth;
    const singleWidth = totalWidth / COPIES;
    const current = container.scrollLeft;

    const leftEdge = singleWidth * 0.1;
    const rightEdge = singleWidth * 1.9;

    if (current < leftEdge) {
      container.scrollLeft = current + singleWidth;
    } else if (current > rightEdge) {
      container.scrollLeft = current - singleWidth;
    }
  };

  const scrollToDirection = (direction) => {
    const container = scrollRef.current;
    if (!container) return;

    const target =
      direction === "next"
        ? container.scrollLeft + STEP
        : container.scrollLeft - STEP;

    container.scrollTo({
      left: target,
      behavior: "smooth",
    });
  };

  // Drag bằng chuột (có snap lại card gần nhất cho mượt)
  const handleMouseDown = (e) => {
    const container = scrollRef.current;
    if (!container) return;
    isDragging.current = true;
    startX.current = e.clientX;
    scrollStart.current = container.scrollLeft;
    container.classList.add("cursor-grabbing");
    container.dataset.dragging = "true";
  };

  const handleMouseMove = (e) => {
    const container = scrollRef.current;
    if (!container || !isDragging.current) return;
    const dx = e.clientX - startX.current;
    container.scrollLeft = scrollStart.current - dx;
  };

  const stopDragging = () => {
    const container = scrollRef.current;
    if (!container) return;

    if (isDragging.current) {
      isDragging.current = false;
      container.classList.remove("cursor-grabbing");
      container.dataset.dragging = "false";

      // snap về vị trí card gần nhất để cảm giác mượt
      const nearest = Math.round(container.scrollLeft / STEP) * STEP;
      container.scrollTo({
        left: nearest,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-white">
      <Container className="py-12 md:py-16 bg-white">
        {/* heading + nút điều hướng */}
        <div className="flex items-center justify-between mb-6 md:mb-8 gap-4">
          <h2 className="text-xl md:text-3xl font-semibold text-black">
            Top sân pickleball được yêu thích nhất tại Hồ Chí Minh
          </h2>

          <div className="hidden md:flex items-center gap-3">
            <button
              type="button"
              onClick={() => scrollToDirection("prev")}
              className="h-9 w-9 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollToDirection("next")}
              className="h-9 w-9 rounded-full border border-zinc-300 flex items-center justify-center text-zinc-700 hover:bg-zinc-100 transition"
            >
              ›
            </button>
          </div>
        </div>

        {/* slider */}
        <div
          ref={scrollRef}
          className="slider flex gap-6 overflow-x-auto pb-6 cursor-grab select-none [-ms-overflow-style:none] [scrollbar-width:none] bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={stopDragging}
          onMouseUp={stopDragging}
          onScroll={handleScroll}
        >
          <style jsx>{`
            .slider {
              scroll-snap-type: x mandatory;
              scroll-padding-left: 1rem;
              background: white;
            }
            .slider[data-dragging="true"] {
              scroll-snap-type: none;
            }
            .slider::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {extendedCourts.map((court, index) => (
            <CourtCard
              key={`${court.id}-${court._copyKey}-${index}`}
              court={court}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
