"use client";

import Image from "next/image";

export default function BookingInfoGuestSection({
  guestInfo,
  onChangeGuestInfo,
  courtName,
  courtAddress,
  phoneNumber,
  date,
  pricingDetails = [],
  totalCourtPrice = 0,
  onEdit,
}) {
  const handleChange = (field) => (e) => {
    onChangeGuestInfo?.({
      ...(guestInfo || {}),
      [field]: e.target.value,
    });
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white px-6 py-6 md:px-10 md:py-8 space-y-6">
      {/* Header + nút chỉnh sửa */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-black">
          Chi tiết đặt sân
        </h1>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-black px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          Chỉnh sửa
        </button>
      </div>

      {/* Guest (giống User block nhưng là input) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-200 pb-4">
        <div className="flex items-center gap-3">
          {/* Avatar giả */}
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#f5f5f5]">
            <span className="text-sm font-semibold text-black">
              {guestInfo?.fullName?.[0] ?? "G"}
            </span>
          </div>

          <div className="space-y-1">
            <input
              value={guestInfo?.fullName || ""}
              onChange={handleChange("fullName")}
              placeholder="Họ và tên"
              className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-semibold text-black outline-none focus:border-zinc-400"
            />

            <input
              value={guestInfo?.email || ""}
              onChange={handleChange("email")}
              placeholder="Email (không bắt buộc)"
              className="w-full rounded-md border border-zinc-200 px-3 py-1.5 text-xs text-zinc-700 outline-none focus:border-zinc-400"
            />
          </div>
        </div>
      </div>

      {/* Hàng 1–3: địa điểm, phone, ngày, địa chỉ sân */}
      <div className="space-y-3 text-sm">
        {/* Hàng 1: Địa điểm */}
        <Field label="Địa điểm" value={courtName} />

        {/* Hàng 2: Số điện thoại – Ngày */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-zinc-500">Số điện thoại</p>
            <input
              value={guestInfo?.phone || ""}
              onChange={handleChange("phone")}
              placeholder="Vui lòng nhập số điện thoại"
              className="w-full rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-2 text-sm text-black outline-none focus:border-zinc-400"
            />
          </div>

          <Field
            label="Ngày"
            value={date}
            icon="/search/calendarIcon.svg"
          />
        </div>

        {/* Hàng 3: Địa chỉ sân */}
        <Field label="Địa chỉ sân" value={courtAddress} />
      </div>

      {/* Hàng 4+: dynamic Khu vực – Thời gian – Giá tiền */}
      {pricingDetails.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="rounded-2xl border border-zinc-200 bg-[#fafafa] p-4 space-y-2">
            {/* header */}
            <div className="hidden md:grid grid-cols-[1.2fr_1.4fr_1fr] text-xs font-semibold text-zinc-600 pb-1 border-b border-zinc-200">
              <span>Khu vực</span>
              <span>Thời gian</span>
              <span>Giá tiền</span>
            </div>

            {/* rows */}
            <div className="space-y-1">
              {pricingDetails.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 gap-1 rounded-xl bg-white px-3 py-2 text-sm text-black md:grid-cols-[1.2fr_1.4fr_1fr] md:items-center"
                >
                  <RowLabel label="Khu vực" className="md:hidden" />
                  <span className="font-medium">{item.courtLabel}</span>

                  <RowLabel label="Thời gian" className="md:hidden mt-1" />
                  <span>{item.timeRange}</span>

                  <RowLabel label="Giá tiền" className="md:hidden mt-1" />
                  <span className="font-semibold">
                    {item.totalPrice.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tổng tiền */}
      <div className="flex justify-end pt-1">
        <p className="text-sm md:text-base font-semibold text-black">
          Tổng tiền sân:&nbsp;
          <span className="text-green-600">
            {totalCourtPrice.toLocaleString("vi-VN")} đ
          </span>
        </p>
      </div>
    </section>
  );
}

/* --------- Sub components (GIỮ NGUYÊN) --------- */

function Field({ label, value, icon }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-2">
        <span className="text-sm text-black flex-1 truncate">
          {value || "-"}
        </span>
        {icon && (
          <Image src={icon} alt="" width={16} height={16} className="shrink-0" />
        )}
      </div>
    </div>
  );
}

function RowLabel({ label, className = "" }) {
  return (
    <span className={`text-[11px] font-medium text-zinc-500 ${className}`}>
      {label}
    </span>
  );
}
