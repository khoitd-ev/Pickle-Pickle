"use client";

import Image from "next/image";

export default function BookingInfoGuestSection({
  guestInfo,
  onChangeGuestInfo,
  courtName,
  courtAddress,
  date,
  pricingDetails = [],
  totalCourtPrice = 0,
  onEdit,
}) {
  const handleChange = (field) => (e) => {
    onChangeGuestInfo({
      ...guestInfo,
      [field]: e.target.value,
    });
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white px-6 py-6 md:px-10 md:py-8 space-y-6">
      {/* Header + nút chỉnh sửa */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-black">
          Thông tin khách & chi tiết đặt sân
        </h1>

        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-black px-4 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
        >
          Chỉnh sửa
        </button>
      </div>

      {/* Thông tin khách hàng */}
      <div className="space-y-3 text-sm border-b border-zinc-200 pb-4">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Họ và tên"
            placeholder="Nhập họ tên"
            value={guestInfo.name || ""}
            onChange={handleChange("name")}
            required
          />
          <InputField
            label="Email"
            placeholder="example@email.com"
            value={guestInfo.email || ""}
            onChange={handleChange("email")}
            required
          />
        </div>

        <InputField
          label="Số điện thoại"
          placeholder="Nhập số điện thoại"
          value={guestInfo.phone || ""}
          onChange={handleChange("phone")}
          required
        />
      </div>

      {/* Thông tin đặt sân (chỉ đọc) */}
      <div className="space-y-3 text-sm">
        <Field
          label="Địa điểm"
          value={courtName || "Sân PickoLand Thảo Điền"}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Ngày" value={date || "19/11/2025"} icon="/search/calendarIcon.svg" />
          <Field
            label="Địa chỉ sân"
            value={
              courtAddress ||
              "188 A6 Nguyễn Văn Hưởng, Thảo Điền, TP. Thủ Đức, TP.HCM"
            }
          />
        </div>
      </div>

      {/* Bảng khu vực / thời gian / giá tiền – chỉ đọc giống bản user */}
      {pricingDetails.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="rounded-2xl border border-zinc-200 bg-[#fafafa] p-4 space-y-2">
            <div className="hidden md:grid grid-cols-[1.2fr_1.4fr_1fr] text-xs font-semibold text-zinc-600 pb-1 border-b border-zinc-200">
              <span>Khu vực</span>
              <span>Thời gian</span>
              <span>Giá tiền</span>
            </div>

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

      {/* Tổng tiền sân */}
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

/* --------- Sub components --------- */

function InputField({ label, value, onChange, placeholder, required }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-2 text-sm text-black outline-none focus:border-black"
      />
    </div>
  );
}

function Field({ label, value, icon }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-[#fafafa] px-3 py-2">
        <span className="text-sm text-black flex-1 truncate">{value}</span>
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
