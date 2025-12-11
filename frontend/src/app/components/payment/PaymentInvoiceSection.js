"use client";

import { useState, useMemo } from "react";

export default function PaymentInvoiceSection({ items = [], onPay }) {
  const [couponCode, setCouponCode] = useState("");

  // Chuẩn hóa items để luôn có amount là số
  const normalizedItems = useMemo(
    () =>
      (items || []).map((item, idx) => {
        const rawAmount =
          item.amount ??
          item.totalPrice ??
          item.price ??
          0; // fallback nếu dữ liệu cũ

        const amountNumber = Number(rawAmount) || 0;

        return {
          id: item.id ?? `item-${idx}`,
          label: item.label ?? item.name ?? `Mục ${idx + 1}`,
          amount: amountNumber,
        };
      }),
    [items]
  );

  const subtotal = useMemo(
    () =>
      normalizedItems.reduce((sum, item) => {
        return sum + item.amount;
      }, 0),
    [normalizedItems]
  );

  const discount = 0; // hiện tại chưa xử lý mã giảm giá

  const handleApply = () => {
    console.log("Apply coupon (mock):", couponCode);
  };

  const handlePayClick = () => {
    if (onPay) onPay();
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg md:text-xl font-semibold text-black">Hóa đơn</h2>

      {/* Các dòng tiền */}
      <div className="space-y-1 text-sm">
        {normalizedItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-black"
          >
            <span>{item.label}</span>
            <span>{item.amount.toLocaleString("vi-VN")} VND</span>
          </div>
        ))}

        {normalizedItems.length === 0 && (
          <p className="text-xs text-zinc-500">
            Chưa có khoản phí nào. Vui lòng quay lại chọn khung giờ / dịch vụ
            thêm.
          </p>
        )}
      </div>

      {/* Mã giảm giá + Giảm giá + Tạm tính */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Mã giảm giá"
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-black"
          />
          <button
            type="button"
            onClick={handleApply}
            className="rounded-md bg-black px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-zinc-800"
          >
            ÁP DỤNG
          </button>
        </div>

        <div className="flex items-center justify-between text-sm text-black">
          <span>Giảm giá:</span>
          <span>{discount.toLocaleString("vi-VN")} VND</span>
        </div>

        <div className="flex items-center justify-between text-sm font-semibold text-black">
          <span>Tạm tính:</span>
          <span>{subtotal.toLocaleString("vi-VN")} VND</span>
        </div>
      </div>

      {/* Nút Thanh toán */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handlePayClick}
          className="mt-2 w-full rounded-md bg-[#4b4b4b] px-4 py-3 text-sm md:text-base font-semibold text-white hover:bg-black"
        >
          Thanh toán
        </button>
      </div>
    </section>
  );
}
