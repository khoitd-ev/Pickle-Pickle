"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";

const TOKEN_STORAGE_KEY = "pp_token";
const PAYMENT_DRAFT_KEY = "pp_booking_payment_draft";

// 05:00 -> 22:00
const DEFAULT_HOURS = Array.from({ length: 18 }, (_, idx) => {
  const hour = 5 + idx;
  return `${hour.toString().padStart(2, "0")}:00`;
});

export default function CourtBookingTimePage() {
  const params = useParams();
  const courtId = params?.courtId; // venueId
  const router = useRouter();

  const [venueName, setVenueName] = useState("");

  useEffect(() => {
    if (!courtId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/venues/${courtId}/detail`
        );
        if (!res.ok) {
          console.error("Fetch venue detail failed", res.status);
          return;
        }

        const json = await res.json();
        const nameFromApi =
          json.data?.court?.name || json.data?.name || "";

        if (!cancelled && nameFromApi) {
          setVenueName(nameFromApi);
        }
      } catch (err) {
        console.error("Error fetching venue detail", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courtId]);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);

  const [availability, setAvailability] = useState(null);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [errorAvail, setErrorAvail] = useState("");

  const displayDate = currentDate.toLocaleDateString("vi-VN");
  const dateParam = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD

  // ===== Fetch availability (poll 10s) =====
  useEffect(() => {
    if (!courtId) return;

    let isMounted = true;
    let intervalId;

    const fetchAvailability = async () => {
      try {
        setLoadingAvail(true);
        setErrorAvail("");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE}/venues/${courtId}/availability?date=${dateParam}`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch availability (${res.status})`);
        }

        const json = await res.json();
        const data = json.data;

        if (!isMounted) return;

        setAvailability(data);

        // Sau khi có availability mới, loại bỏ các slot đã bị khoá
        if (data && Array.isArray(data.courts)) {
          const availableKeySet = new Set();

          data.courts.forEach((court, courtIndex) => {
            const label = `Sân ${courtIndex + 1}`;
            (court.slots || []).forEach((slot) => {
              if (slot.status === "available") {
                const hour = (slot.timeFrom || "").slice(0, 5);
                const key = `${label}-${hour}`;
                availableKeySet.add(key);
              }
            });
          });

          setSelectedSlots((prev) =>
            prev.filter((key) => availableKeySet.has(key))
          );
        }
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setErrorAvail("Không tải được tình trạng sân. Vui lòng thử lại.");
      } finally {
        if (isMounted) setLoadingAvail(false);
      }
    };

    fetchAvailability();
    intervalId = setInterval(fetchAvailability, 10000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [courtId, dateParam]);

  // ===== Điều hướng ngày =====
  const handlePrevDate = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 1);
      return next;
    });
  };

  const handleNextDate = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 1);
      return next;
    });
  };

  const hasAvailability =
    availability &&
    Array.isArray(availability.courts) &&
    availability.courts.length > 0;

  const headerSlots = hasAvailability
    ? availability.courts[0].slots || []
    : [];
  const HOURS =
    headerSlots.length > 0
      ? headerSlots.map((s) => (s.timeFrom || "").slice(0, 5))
      : DEFAULT_HOURS;

  const courtsRows = hasAvailability
    ? availability.courts.map((c, index) => ({
        label: `Sân ${index + 1}`,
        courtName: c.courtName,
        slots: c.slots || [],
      }))
    : Array.from({ length: 3 }, (_, idx) => ({
        label: `Sân ${idx + 1}`,
        courtName: `Sân ${idx + 1}`,
        slots: [],
      }));

  // ===== Chọn / bỏ chọn slot =====
  const toggleSlot = (rowIndex, colIndex) => {
    const row = courtsRows[rowIndex];
    const hour = HOURS[colIndex];
    const key = `${row.label}-${hour}`;

    const slot = row.slots?.[colIndex];

    // KHÔNG có slot thực, không cho chọn (tránh chọn "ô ma")
    if (!slot) return;

    const status = slot.status ?? "available";
    if (status !== "available") return;

    setSelectedSlots((prev) => {
      const set = new Set(prev);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      return Array.from(set);
    });
  };

  // ===== Helper tính giá 1 slot =====
  const getSlotPriceByKey = (key) => {
    const [label, hour] = key.split("-");
    const rowIndex = courtsRows.findIndex((row) => row.label === label);
    if (rowIndex === -1) return 0;

    const colIndex = HOURS.indexOf(hour);
    if (colIndex === -1) return 0;

    const slot = courtsRows[rowIndex].slots?.[colIndex];
    if (!slot) return 0;

    const price =
      slot.pricePerHour ??
      slot.walkinPrice ??
      slot.fixedPrice ??
      0;

    return typeof price === "number" ? price : 0;
  };

  const totalPrice = selectedSlots.reduce(
    (sum, key) => sum + getSlotPriceByKey(key),
    0
  );

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    if (selectedSlots.length === 0) return;

    let token = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }

    console.log("pp_token in booking page =", token);

    if (!token) {
      alert("Vui lòng đăng nhập để đặt sân.");
      router.push(`/auth/login?redirect=/courts/${courtId}/booking`);
      return;
    }

    if (!availability || !Array.isArray(availability.courts)) {
      alert("Không có dữ liệu sân để tạo booking. Vui lòng tải lại trang.");
      return;
    }

    // Build slotMap BÁM THEO GRID: (rowIndex, slotIdx) + HOURS
    const slotMap = new Map();

    availability.courts.forEach((court, rowIndex) => {
      const label = `Sân ${rowIndex + 1}`;
      const slots = court.slots || [];

      slots.forEach((slot, slotIdx) => {
        const hour =
          HOURS[slotIdx] || (slot.timeFrom || "").slice(0, 5);
        const key = `${label}-${hour}`;

        slotMap.set(key, {
          courtId: court.courtId,
          slotIndex: slot.slotIndex,
        });
      });
    });

    // Gom lại theo courtId
    const courtsById = new Map();

    selectedSlots.forEach((key) => {
      const info = slotMap.get(key);
      if (!info) return;

      const { courtId, slotIndex } = info;
      if (!courtsById.has(courtId)) {
        courtsById.set(courtId, []);
      }
      courtsById.get(courtId).push(slotIndex);
    });

    const courtsPayload = Array.from(courtsById.entries()).map(
      ([cid, indices]) => ({
        courtId: cid,
        slotIndices: Array.from(new Set(indices)).sort((a, b) => a - b),
      })
    );

    if (courtsPayload.length === 0) {
      alert("Không tìm thấy slot hợp lệ để tạo booking.");
      return;
    }

    console.log("courtsPayload gửi backend =", courtsPayload);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/bookings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            venueId: courtId,
            date: dateParam,
            courts: courtsPayload,
          }),
        }
      );

      const json = await res.json();
      console.log("Create booking response", res.status, json);

      if (!res.ok) {
        alert(json?.message || "Không thể tạo booking. Vui lòng thử lại.");
        return;
      }

      const bookingId =
        json.data?.booking?._id ||
        json.data?.bookingId ||
        json.bookingId ||
        json._id;

      if (!bookingId) {
        alert("Không lấy được mã booking. Vui lòng thử lại.");
        return;
      }

      if (typeof window !== "undefined") {
        const draft = {
          bookingId,
          courtTotal: totalPrice,
          addons: { items: [] },
        };
        localStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(draft));
      }

      const slotsParam = selectedSlots.join(",");
      router.push(
        `/courts/${courtId}/booking/addons?date=${encodeURIComponent(
          displayDate
        )}&slots=${encodeURIComponent(slotsParam)}`
      );
    } catch (err) {
      console.error("Error creating booking", err);
      alert("Có lỗi khi tạo booking. Vui lòng thử lại.");
    }
  };

  const titleVenue = venueName || "PicklePickle";

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <section className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <h1 className="text-center text-2xl md:text-3xl font-semibold text-black">
          Tình trạng đặt sân {titleVenue}
        </h1>

        {loadingAvail && (
          <p className="text-center text-xs text-zinc-500">
            Đang tải tình trạng sân...
          </p>
        )}
        {errorAvail && (
          <p className="text-center text-xs text-red-500">{errorAvail}</p>
        )}

        <div className="rounded-3xl bg-[#f7f7f7] border border-[#e5e5e5] px-6 py-7 md:px-10 md:py-8 space-y-6">
          {/* DATE + ARROWS */}
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
            <LegendItem colorClass="bg-[#7fd321]" label="Đang chọn" />
          </div>

          {/* GRID */}
          <div className="rounded-3xl bg-white border border-[#e5e5e5] px-4 py-5">
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                <div className="grid grid-cols-[90px_repeat(18,minmax(0,1fr))] gap-1 text-[11px] text-center text-black mb-2">
                  <div />
                  {HOURS.map((h) => (
                    <div key={h}>{h}</div>
                  ))}
                </div>

                <div className="space-y-1">
                  {courtsRows.map((row, rowIndex) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[90px_repeat(18,minmax(0,1fr))] gap-1 items-center"
                    >
                      <div className="text-[13px] font-medium text-left text-black">
                        {row.label}
                      </div>

                      {HOURS.map((hour, colIndex) => {
                        const key = `${row.label}-${hour}`;
                        const slot = row.slots?.[colIndex];
                        const status = slot?.status ?? "available";

                        const isBooked =
                          status === "booked" || status === "blackout";
                        const isSelected = selectedSlots.includes(key);

                        let bg = "bg-white";
                        if (isBooked) bg = "bg-[#ffe94d]";
                        if (isSelected) bg = "bg-[#7fd321]";

                        const isClickable = !!slot && !isBooked;

                        return (
                          <button
                            key={key}
                            type="button"
                            disabled={!isClickable}
                            onClick={() => toggleSlot(rowIndex, colIndex)}
                            className={`h-7 rounded-[6px] border border-[#dcdcdc] ${bg} transition hover:border-[#b3b3b3] disabled:cursor-not-allowed`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end text-sm md:text-base font-semibold text-black">
              Tổng tiền:&nbsp;
              <span>{totalPrice.toLocaleString("vi-VN")} đ</span>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={selectedSlots.length === 0}
              className="w-full max-w-xs rounded-full bg-[#2ecc3b] px-10 py-3 text-sm md:text-base font-semibold text-white shadow-md transition hover:bg-[#27b834] disabled:bg-[#c4c4c4] disabled:cursor-not-allowed"
            >
              ĐẶT SÂN NGAY
            </button>
          </div>
        </div>
      </section>
    </main>
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
