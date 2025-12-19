"use client";

import { useEffect, useState } from "react";
import SearchFiltersBar from "../components/search/SearchFiltersBar";
import SearchResultsGrid from "../components/search/SearchResultsGrid";

const PER_PAGE = 8;

const DEFAULT_FILTERS = {
  keyword: "",
  date: "",
  startTime: "",
  endTime: "",
  area: "",
};

export default function SearchPage() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);

  const [currentPage, setCurrentPage] = useState(1);
  const [venues, setVenues] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PER_PAGE,
    total: 0,
  });
  const [meta, setMeta] = useState({ areaCount: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchVenues() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("page", String(currentPage));
        params.set("limit", String(PER_PAGE));

        if (filters.keyword) params.set("q", filters.keyword);
        if (filters.area) params.set("area", filters.area);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/venues?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          console.error("Failed to fetch venues");
          return;
        }

        const json = await res.json();

        setVenues(json.data ?? []);
        setPagination(
          json.pagination ?? {
            page: currentPage,
            limit: PER_PAGE,
            total: 0,
          }
        );
        setMeta(json.meta ?? { areaCount: 0 });
      } catch (err) {
        if (err.name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchVenues();

    return () => controller.abort();
  }, [filters.keyword, filters.area, currentPage]);

  const totalPages =
    pagination.limit > 0
      ? Math.max(1, Math.ceil(pagination.total / pagination.limit))
      : 1;

  // Áp dụng bộ lọc từ draftFilters vào filters
  const handleApplyFilters = () => {
    setFilters(draftFilters);
    setCurrentPage(1);
  };

  //  Xử lý thay đổi khu vực ngay lập tức
  const handleChangeAreaLive = (areaValue) => {
    setDraftFilters((prev) => ({ ...prev, area: areaValue }));
    setFilters((prev) => ({ ...prev, area: areaValue }));
    setCurrentPage(1);
  };

  return (
    <main className="bg-white min-h-screen">
      <section className="max-w-6xl mx-auto px-4 py-8">
        <SearchFiltersBar
          filters={draftFilters}
          onChangeFilters={(patch) =>
            setDraftFilters((prev) => ({ ...prev, ...patch }))
          }
          onApplyFilters={handleApplyFilters}
          onChangeAreaLive={handleChangeAreaLive}  
          stats={{
            totalCourts: pagination.total,
            totalAreas: meta.areaCount,
          }}
          loading={loading}
        />

        <div className="mt-6">
          <SearchResultsGrid
            venues={venues}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </div>
      </section>
    </main>
  );
}
