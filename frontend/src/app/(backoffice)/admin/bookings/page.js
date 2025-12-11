"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { apiFetch } from "../../../../lib/apiClient";

function formatDateYMDLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ====== DEFAULT MOCK ======
const DEFAULT_HOURS = Array.from({ length: 18 }, (_, idx) => {
  const hour = 5 + idx;
  return `${hour.toString().padStart(2, "0")}:00`;
});

const DEFAULT_COURTS = [
  { id: "court-1", name: "Sân 1" },
  { id: "court-2", name: "Sân 2" },
  { id: "court-3", name: "Sân 3" },
  { id: "court-4", name: "Sân 4" },
];

const DEFAULT_BOOKINGS = [];

function StatusBadge({ status }) {
  const map = {
    active: {
      label: "Đang hoạt động",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    completed: {
      label: "Đã xong",
      color: "bg-sky-50 text-sky-600 border-sky-200",
    },
    pending: {
      label: "Đã đặt",
      color: "bg-amber-50 text-amber-600 border-amber-200",
    },
    cancelled: {
      label: "Đã huỷ",
      color: "bg-red-50 text-red-600 border-red-200",
    },
  };

  const cfg = map[status] || map.pending;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${cfg.color}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {cfg.label}
    </span>
  );
}

function LegendItem({ colorClass, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-4 w-7 rounded-[8px] ${colorClass}`} />
      <span className="text-[13px] text-black">{label}</span>
    </div>
  );
}

export default function AdminBookingsPage() {
  // Ngày hiện tại – fix hydration: init null, set trong useEffect
  const [currentDate, setCurrentDate] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Chủ sân + venue
  const [owners, setOwners] = useState([]);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");

  // Courts & bookings trong venue + ngày đó
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [courts, setCourts] = useState(DEFAULT_COURTS);
  const [bookings, setBookings] = useState(DEFAULT_BOOKINGS);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Set ngày ở client
  useEffect(() => {
    if (!currentDate) {
      setCurrentDate(new Date());
    }
  }, [currentDate]);

  const dateParam = currentDate ? formatDateYMDLocal(currentDate) : "";
  const displayDate = currentDate
    ? currentDate.toLocaleDateString("vi-VN")
    : "";

  // ====== Load danh sách CHỦ SÂN + VENUE (dùng chung với dashboard admin) ======
  useEffect(() => {
    let mounted = true;

    async function loadOwners() {
      try {
        const res = await apiFetch("/admin/dashboard/owners");

        const payload = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        if (!mounted) return;

        const mappedOwners = (payload || []).map((o) => ({
          id: o.id || o._id,
          name: o.name || o.fullName || "Chủ sân",
          venues: o.venues || [],
        }));

        setOwners(mappedOwners);

        if (mappedOwners.length) {
          const firstOwner = mappedOwners[0];
          setSelectedOwnerId(firstOwner.id);

          const ownerVenues = firstOwner.venues || [];
          setVenues(ownerVenues);

          if (ownerVenues.length) {
            const firstVenue = ownerVenues[0];
            setSelectedVenueId(firstVenue.id || firstVenue._id);
          }
        }
      } catch (err) {
        console.error("Load owners error:", err);
      } finally {
        if (mounted) setOwnersLoading(false);
      }
    }

    loadOwners();

    return () => {
      mounted = false;
    };
  }, []);

  // Khi đổi chủ sân -> cập nhật lại danh sách sân
  useEffect(() => {
    if (!selectedOwnerId) {
      setVenues([]);
      setSelectedVenueId("");
      return;
    }

    const owner = owners.find(
      (o) => String(o.id) === String(selectedOwnerId)
    );

    const vs = owner?.venues || [];
    setVenues(vs);

    if (vs.length) {
      const v = vs[0];
      setSelectedVenueId(v.id || v._id);
    } else {
      setSelectedVenueId("");
    }
  }, [selectedOwnerId, owners]);

  // ====== Load bookings + availability theo venue + ngày (có polling) ======
  useEffect(() => {
    if (!dateParam || !selectedVenueId) return;

    let ignore = false;

    async function loadData() {
      if (ignore) return;

      setLoading(true);
      setErrorMsg("");

      try {
        const res = await apiFetch(
          `/admin/bookings/daily?date=${dateParam}&venueId=${selectedVenueId}`
        );

        const data = res?.data ?? res;

        // availability -> giờ + courts
        if (data?.availability?.courts?.length) {
          const firstCourtSlots = data.availability.courts[0].slots || [];

          const newHours =
            firstCourtSlots.length > 0
              ? firstCourtSlots.map((s) => s.timeFrom)
              : DEFAULT_HOURS;

          const newCourts = data.availability.courts.map((c) => ({
            id: c.courtId,
            name: c.courtName,
          }));

          if (!ignore) {
            setHours(newHours);
            setCourts(newCourts);
          }
        } else if (!ignore) {
          setHours(DEFAULT_HOURS);
          setCourts(DEFAULT_COURTS);
        }

        if (Array.isArray(data?.bookings)) {
          if (!ignore) {
            setBookings(data.bookings);
          }
        } else if (!ignore) {
          setBookings([]);
        }
      } catch (err) {
        console.error("Load admin daily bookings error:", err);
        if (!ignore) {
          setErrorMsg(
            "Không tải được dữ liệu từ server, đang hiển thị dữ liệu mô phỏng."
          );
          setHours(DEFAULT_HOURS);
          setCourts(DEFAULT_COURTS);
          setBookings(DEFAULT_BOOKINGS);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    // Gọi 1 lần
    loadData();

    // Polling 15s
    const intervalId = setInterval(loadData, 15000);

    return () => {
      ignore = true;
      clearInterval(intervalId);
    };
  }, [dateParam, selectedVenueId]);

  // Filter bookings theo trạng thái + search
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchStatus =
        statusFilter === "all" ? true : b.status === statusFilter;

      const searchText = search.trim().toLowerCase();
      const matchSearch =
        !searchText ||
        b.customerName?.toLowerCase().includes(searchText) ||
        b.phone?.toLowerCase().includes(searchText) ||
        b.code?.toLowerCase().includes(searchText);

      return matchStatus && matchSearch;
    });
  }, [bookings, statusFilter, search]);

  function isSlotBooked(courtId, hourLabel) {
    const slotHour = parseInt(hourLabel.split(":")[0], 10);

    return bookings.some((b) => {
      if (b.courtId !== courtId) return false;
      const startHour = parseInt(b.startTime.split(":")[0], 10);
      const endHour = parseInt(b.endTime.split(":")[0], 10);
      return slotHour >= startHour && slotHour < endHour;
    });
  }

  const handlePrevDate = () => {
    setCurrentDate((prev) => {
      if (!prev) return prev;
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextDate = () => {
    setCurrentDate((prev) => {
      if (!prev) return prev;
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const handleDateInputChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split("-").map(Number);
    const date = new Date(y, m - 1, d); // local
    if (Number.isNaN(date.getTime())) return;
    setCurrentDate(date);
  };

  return (
    <div className="space-y-6">
      {/* HEADER + FILTER NGÀY + CHỦ SÂN + VENUE */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Quản lý đặt sân (Admin)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tình trạng đặt sân trong ngày và chi tiết các lượt đặt
            theo từng chủ sân và sân.
          </p>
          {errorMsg && (
            <p className="mt-1 text-xs text-red-500">{errorMsg}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {/* Ngày */}
          <div className="flex items-center gap-2">
            <span className="!text-black font-medium">Ngày</span>
            <input
              type="date"
              value={dateParam}
              onChange={handleDateInputChange}
              className="px-3 py-1.5 rounded border border-gray-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 !text-black"
            />
          </div>

          {/* Chủ sân */}
          <div className="flex items-center gap-2">
            <span className="!text-black font-medium">Chủ sân</span>
            <select
              value={selectedOwnerId}
              onChange={(e) => setSelectedOwnerId(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs md:text-sm text-black min-w-[180px]"
            >
              {ownersLoading && <option>Đang tải...</option>}
              {!ownersLoading && owners.length === 0 && (
                <option>Chưa có chủ sân nào</option>
              )}
              {!ownersLoading &&
                owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Sân */}
          <div className="flex items-center gap-2">
            <span className="!text-black font-medium">Sân</span>
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs md:text-sm text-black min-w-[180px]"
            >
              {venues.length === 0 && (
                <option>Chủ sân này chưa có sân nào</option>
              )}
              {venues.map((v) => (
                <option key={v.id || v._id} value={v.id || v._id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Làm mới */}
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              if (currentDate) setCurrentDate(new Date(currentDate));
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 text-black bg-white hover:bg-gray-50"
          >
            <span className="text-base leading-none">⟳</span>
            <span className="text-xs">Làm mới</span>
          </button>
        </div>
      </section>

      {/* CARD: SÂN TRONG NGÀY (GIỐNG OWNER) */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Chi tiết sân trong ngày
          </h2>
          <p className="text-xs text-gray-500">
            {loading
              ? "Đang tải dữ liệu..."
              : "Khung giờ hiển thị: 05:00 – 22:00"}
          </p>
        </div>

        <div className="rounded-3xl bg-[#f7f7f7] border border-[#e5e5e5] px-6 py-6 space-y-5">
          {/* DATE NAVIGATION */}
          <div className="flex items-center justify-center gap-6 text-sm font-medium text-black">
            <button
              type="button"
              onClick={handlePrevDate}
              className="flex items-center justify-center cursor-pointer transition hover:opacity-80 hover:scale-110"
            >
              <Image
                src="/courts/prevIcon1.svg"
                alt="Ngày trước"
                width={20}
                height={20}
              />
            </button>

            <span>{displayDate}</span>

            <button
              type="button"
              onClick={handleNextDate}
              className="flex items-center justify-center cursor-pointer transition hover:opacity-80 hover:scale-110"
            >
              <Image
                src="/courts/nextIcon1.svg"
                alt="Ngày sau"
                width={20}
                height={20}
              />
            </button>
          </div>

          {/* LEGEND */}
          <div className="flex items-center justify-center gap-6 text-sm text-black">
            <LegendItem
              colorClass="bg-white border border-[#dcdcdc]"
              label="Trống"
            />
            <LegendItem colorClass="bg-[#ffe94d]" label="Đã đặt / Khóa" />
          </div>

          {/* TIME GRID */}
          <div className="rounded-3xl bg-white border border-[#e5e5e5] px-4 py-5">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* header row */}
                <div className="grid grid-cols-[90px_repeat(18,minmax(0,1fr))] gap-1 text-[11px] text-center text-black mb-2">
                  <div />
                  {hours.map((h) => (
                    <div key={h}>{h}</div>
                  ))}
                </div>

                {/* court rows */}
                <div className="space-y-1">
                  {courts.map((court) => (
                    <div
                      key={court.id}
                      className="grid grid-cols-[90px_repeat(18,minmax(0,1fr))] gap-1 items-center"
                    >
                      <div className="text-[13px] font-medium text-left text-black">
                        {court.name}
                      </div>

                      {hours.map((hour) => {
                        const booked = isSlotBooked(court.id, hour);

                        return (
                          <div
                            key={`${court.id}-${hour}`}
                            className="h-7 rounded-[6px] border border-[#dcdcdc] transition"
                            style={{
                              backgroundColor: booked
                                ? "#ffe94d"
                                : "#ffffff",
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-gray-500">
              Ô màu vàng thể hiện khung giờ đã được đặt trong ngày{" "}
              {displayDate || "..."}.
            </p>
          </div>
        </div>
      </section>

      {/* CARD: BẢNG CHI TIẾT ĐẶT SÂN */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Thanh filter */}
        <div className="px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-black">Trạng thái</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs md:text-sm text-black"
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
                <option value="completed">Đã xong</option>
                <option value="pending">Đã đặt</option>
                <option value="cancelled">Đã huỷ</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <span className="absolute left-2 top-1/2 -translate-y-1/2">
                <Image
                  src="/searchIcon1.svg"
                  alt="Tìm kiếm"
                  width={14}
                  height={14}
                />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên khách, SĐT, mã booking..."
                className="w-full md:w-64 pl-7 pr-3 py-1.5 rounded border border-gray-200 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 text-black"
              />
            </div>
          </div>
        </div>

        {/* Bảng */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-gray-50">
              <tr className="text-gray-700">
                <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                  STT
                </th>
                <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                  Mã booking
                </th>
                <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                  Người đặt
                </th>
                <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                  Sân
                </th>
                <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                  Thời gian
                </th>
                <th className="px-4 py-2 text-center font-medium border-b border-gray-100">
                  Số lượng sân con
                </th>
                <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                  Số điện thoại
                </th>
                <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                  Ngày đặt
                </th>
                <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-4 text-center text-gray-500 text-sm"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-4 text-center text-gray-500 text-sm"
                  >
                    Không có lượt đặt sân nào phù hợp trong ngày{" "}
                    {displayDate || "..."}.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b, index) => (
                  <tr
                    key={b.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-4 py-2 border-b border-gray-50">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                      {b.code}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                      {b.customerName}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                      {b.courtName}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                      {b.startTime} - {b.endTime}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-50 text-center text-gray-800">
                      {b.slotsCount ?? 1}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                      {b.phone}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                      {b.bookedAt}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-50">
                      <StatusBadge status={b.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <p>
            Tổng số lượt đặt:{" "}
            <span className="font-medium text-gray-700">
              {filteredBookings.length}
            </span>
          </p>
        </div>
      </section>
    </div>
  );
}
