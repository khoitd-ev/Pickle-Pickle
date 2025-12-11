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

export default function OwnerBookingsPage() {
  // Ngày hiện tại – fix hydration: init null, set trong useEffect
  const [currentDate, setCurrentDate] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Venue
  const [venues, setVenues] = useState([]);
  const [selectedVenueId, setSelectedVenueId] = useState("");

  // Courts & bookings trong venue + ngày đó
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [courts, setCourts] = useState(DEFAULT_COURTS);
  const [bookings, setBookings] = useState(DEFAULT_BOOKINGS);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Cấu hình khung giờ mở cửa/đóng cửa
  const [openTime, setOpenTime] = useState("05:00");
  const [closeTime, setCloseTime] = useState("22:00");

  // Cấu hình giá theo khung giờ
  const [priceRules, setPriceRules] = useState([
    { id: 1, startTime: "05:00", endTime: "17:00", price: 120000 },
    { id: 2, startTime: "17:00", endTime: "22:00", price: 150000 },
  ]);
  const [nextRuleId, setNextRuleId] = useState(3);

  // Popup thông báo lưu cấu hình
  const [configDialog, setConfigDialog] = useState({
    open: false,
    type: "success", // "success" | "error"
    message: "",
  });

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

  // ====== Load danh sách VENUE của owner ======
  useEffect(() => {
    let ignore = false;

    async function loadVenues() {
      try {
        const res = await apiFetch("/owner/venues");

        // Hỗ trợ cả 2 kiểu: apiFetch trả thẳng array hoặc { data: [...] }
        let venuesData = [];
        if (Array.isArray(res)) {
          venuesData = res;
        } else if (Array.isArray(res?.data)) {
          venuesData = res.data;
        } else if (Array.isArray(res?.data?.data)) {
          venuesData = res.data.data;
        }

        if (!ignore) {
          setVenues(venuesData);
          // Nếu chưa chọn venue nào thì auto chọn venue đầu tiên
          if (venuesData.length && !selectedVenueId) {
            setSelectedVenueId(venuesData[0].id);
          }
        }
        console.log("owner venues res =", res);
        console.log("venuesData =", venuesData);
      } catch (err) {
        console.error("Load owner venues error:", err);
      }
    }

    loadVenues();

    return () => {
      ignore = true;
    };
    // chỉ load 1 lần khi mount
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ====== Load CONFIG giờ mở cửa + bảng giá theo venue ======
  useEffect(() => {
    if (!selectedVenueId) return;

    let ignore = false;

    async function loadConfig() {
      try {
        const res = await apiFetch(`/owner/venues/${selectedVenueId}/config`);

        // Hỗ trợ nhiều kiểu wrapper: { data: {...} } hoặc trả thẳng object
        const cfg = res?.data ?? res;

        if (ignore || !cfg) return;

        if (cfg.openTime) {
          setOpenTime(cfg.openTime.slice(0, 5));
        }
        if (cfg.closeTime) {
          setCloseTime(cfg.closeTime.slice(0, 5));
        }

        if (Array.isArray(cfg.priceRules)) {
          const mapped = cfg.priceRules.map((r, idx) => ({
            id: r.id || r._id || idx + 1,
            startTime: (r.startTime || "").slice(0, 5) || "05:00",
            endTime: (r.endTime || "").slice(0, 5) || "06:00",
            // backend có thể trả price hoặc pricePerHour
            price:
              typeof r.price === "number"
                ? r.price
                : typeof r.pricePerHour === "number"
                ? r.pricePerHour
                : 0,
          }));
          setPriceRules(mapped);
          setNextRuleId(mapped.length + 1);
        } else {
          setPriceRules([]);
          setNextRuleId(1);
        }
      } catch (err) {
        console.error("Load venue config error:", err);
        // nếu lỗi thì giữ nguyên state hiện tại, không popup để tránh phiền
      }
    }

    loadConfig();

    return () => {
      ignore = true;
    };
  }, [selectedVenueId]);

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
          `/owner/bookings/daily?date=${dateParam}&venueId=${selectedVenueId}`
        );

        const data = res?.data;

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
            // Nếu backend có trả openTime/closeTime trong availability thì sync luôn
            if (data.availability.openTime) {
              setOpenTime(data.availability.openTime.slice(0, 5));
            }
            if (data.availability.closeTime) {
              setCloseTime(data.availability.closeTime.slice(0, 5));
            }
          }
        } else {
          if (!ignore) {
            setHours(DEFAULT_HOURS);
            setCourts(DEFAULT_COURTS);
          }
        }

        if (Array.isArray(data?.bookings)) {
          if (!ignore) {
            setBookings(data.bookings);
          }
        } else if (!ignore) {
          setBookings([]);
        }
      } catch (err) {
        console.error("Load owner daily bookings error:", err);
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

  // ====== HANDLERS: PRICE RULES & SAVE CONFIG ======
  const handleAddPriceRule = () => {
    setPriceRules((prev) => [
      ...prev,
      {
        id: nextRuleId,
        startTime: "05:00",
        endTime: "06:00",
        price: 0,
      },
    ]);
    setNextRuleId((id) => id + 1);
  };

  const handlePriceRuleChange = (id, field, value) => {
    setPriceRules((prev) =>
      prev.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              [field]:
                field === "price"
                  ? value === ""
                    ? ""
                    : Number(value) || 0
                  : value,
            }
          : rule
      )
    );
  };

  const handleRemovePriceRule = (id) => {
    setPriceRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const handleSaveConfig = async () => {
    if (!selectedVenueId) {
      setConfigDialog({
        open: true,
        type: "error",
        message: "Vui lòng chọn sân cần cấu hình trước.",
      });
      return;
    }

    try {
      const payload = {
        openTime,
        closeTime,
        priceRules: priceRules.map((r) => ({
          id: typeof r.id === "string" ? r.id : undefined,
          startTime: r.startTime,
          endTime: r.endTime,
          price: r.price === "" ? 0 : Number(r.price) || 0,
        })),
      };

      await apiFetch(`/owner/venues/${selectedVenueId}/config`, {
        method: "PUT",
        body: payload,
      });

      setConfigDialog({
        open: true,
        type: "success",
        message: "Đã lưu cấu hình giờ mở cửa & bảng giá cho sân.",
      });
    } catch (err) {
      console.error("Save venue config error:", err);
      setConfigDialog({
        open: true,
        type: "error",
        message:
          err?.message || "Không lưu được cấu hình. Vui lòng thử lại.",
      });
    }
  };

  const closeConfigDialog = () => {
    setConfigDialog((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="space-y-6">
      {/* HEADER + FILTER NGÀY + VENUE */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Quản lý đặt sân
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tình trạng đặt sân trong ngày và chi tiết các lượt đặt.
          </p>
          {errorMsg && (
            <p className="mt-1 text-xs text-red-500">{errorMsg}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="!text-black font-medium">Ngày</span>
            <input
              type="date"
              value={dateParam}
              onChange={handleDateInputChange}
              className="px-3 py-1.5 rounded border border-gray-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 !text-black"
            />
          </div>

          {/* Dropdown chọn VENUE */}
          <div className="flex items-center gap-2">
            <span className="!text-black font-medium">Sân</span>
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs md:text-sm text-black"
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-gray-200 text-black bg-white hover:bg-gray-50"
          >
            <span className="text-base leading-none">⟳</span>
            <span className="text-xs">Làm mới</span>
          </button>
        </div>
      </section>

      {/* CARD: CẤU HÌNH GIỜ & GIÁ THEO SÂN */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Cấu hình khung giờ & bảng giá cho sân đang chọn
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Thiết lập giờ mở cửa, đóng cửa và giá theo từng khung giờ cho{" "}
              <span className="font-medium">
                sân trong dropdown phía trên
              </span>
              . Cấu hình sẽ được lưu cho từng sân riêng biệt.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">
                Mở cửa
              </span>
              <input
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-600">
                Đóng cửa
              </span>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveConfig}
              className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 h-9 text-xs font-semibold text-white shadow hover:bg-sky-600 transition"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>

        {/* Bảng giá theo khung giờ */}
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-900">
              Bảng giá theo khung giờ
            </p>
            <button
              type="button"
              onClick={handleAddPriceRule}
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 h-8 text-[11px] font-medium text-gray-800 hover:bg-gray-50"
            >
              + Thêm khung giờ
            </button>
          </div>

          {priceRules.length === 0 ? (
            <p className="text-xs text-gray-500">
              Chưa có khung giờ nào. Nhấn &quot;+ Thêm khung giờ&quot; để bắt
              đầu cấu hình giá.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-700">
                    <th className="px-3 py-2 text-left font-medium border-b border-gray-100">
                      STT
                    </th>
                    <th className="px-3 py-2 text-left font-medium border-b border-gray-100">
                      Bắt đầu
                    </th>
                    <th className="px-3 py-2 text-left font-medium border-b border-gray-100">
                      Kết thúc
                    </th>
                    <th className="px-3 py-2 text-left font-medium border-b border-gray-100">
                      Đơn giá (VND)
                    </th>
                    <th className="px-3 py-2 text-center font-medium border-b border-gray-100">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {priceRules.map((rule, index) => (
                    <tr
                      key={rule.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50/70"}
                    >
                      <td className="px-3 py-2 border-b border-gray-100 text-gray-800">
                        {index + 1}
                      </td>

                      <td className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="time"
                          value={rule.startTime}
                          onChange={(e) =>
                            handlePriceRuleChange(
                              rule.id,
                              "startTime",
                              e.target.value
                            )
                          }
                          className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <input
                          type="time"
                          value={rule.endTime}
                          onChange={(e) =>
                            handlePriceRuleChange(
                              rule.id,
                              "endTime",
                              e.target.value
                            )
                          }
                          className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={rule.price}
                            onChange={(e) =>
                              handlePriceRuleChange(
                                rule.id,
                                "price",
                                e.target.value
                              )
                            }
                            className="w-32 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                          <span className="text-[11px] text-gray-500">
                            /giờ
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 border-b border-gray-100 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemovePriceRule(rule.id)}
                          className="text-[11px] font-medium text-red-500 hover:text-red-600"
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-2 text-[11px] text-gray-500">
            Gợi ý: chia theo 2–3 khung giờ (ví dụ 05:00–17:00, 17:00–22:00) để
            dễ quản lý.
          </p>
        </div>
      </section>

      {/* CARD: SÂN TRONG NGÀY */}
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

      {/* POPUP THÔNG BÁO LƯU CẤU HÌNH */}
      {configDialog.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-5 w-[320px]">
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                  configDialog.type === "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {configDialog.type === "success" ? "✓" : "!"}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {configDialog.type === "success"
                    ? "Lưu cấu hình thành công"
                    : "Lưu cấu hình thất bại"}
                </h3>
                <p className="text-xs text-gray-600">
                  {configDialog.message}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeConfigDialog}
                className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 h-9 text-xs font-semibold text-white hover:bg-sky-600 transition"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
