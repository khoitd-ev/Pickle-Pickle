"use client";

import { use, useEffect, useState } from "react";
import CourtHeroSection from "@/app/components/courts/detail/CourtHeroSection";
import CourtOverviewSection from "@/app/components/courts/detail/CourtOverviewSection";
import CourtPricingSection from "@/app/components/courts/detail/CourtPricingSection";

export default function CourtDetailPage({ params }) {
  // Next.js 16 turbo: params là Promise
  const { courtId } = use(params); // thực chất là venueId

  const [court, setCourt] = useState(null);
  const [overview, setOverview] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function fetchDetail() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/venues/${courtId}/detail`,
          { cache: "no-store" } // tránh cache khi dev
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch venue detail (${res.status})`);
        }

        const json = await res.json();
        const data = json.data;

        if (!data || !data.court) {
          throw new Error("Venue detail is empty");
        }

        if (!isMounted) return;

        setCourt(data.court);
        setOverview(data.overview);
        setPricing(data.pricing);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError("Không tải được thông tin sân. Vui lòng thử lại sau.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [courtId]);

  if (loading && !court) {
    return (
      <main className="min-h-screen bg-white">
        <section className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-sm text-zinc-600">Đang tải thông tin sân...</p>
        </section>
      </main>
    );
  }

  if (!court) {
    return (
      <main className="min-h-screen bg-white">
        <section className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-sm text-red-500">
            {error || "Không tìm thấy sân."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        {/* Truyền thêm venueId xuống Hero */}
        <CourtHeroSection court={court} venueId={courtId} />
        <CourtOverviewSection overview={overview} />
        <CourtPricingSection pricing={pricing} />
      </section>
    </main>
  );
}
