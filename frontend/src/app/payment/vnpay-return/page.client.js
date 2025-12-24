"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";

const PAYMENT_DRAFT_KEY = "pp_booking_payment_draft";

export default function VnpayReturnPage() {
  const searchParams = useSearchParams();

  const rspCode = searchParams.get("vnp_ResponseCode");
  const orderId = searchParams.get("vnp_TxnRef");
  const amount = searchParams.get("vnp_Amount");
  const bankCode = searchParams.get("vnp_BankCode");
  const cardType = searchParams.get("vnp_CardType");
  const payDate = searchParams.get("vnp_PayDate");

  const isSuccess = rspCode === "00";

  const formattedAmount =
    amount && !Number.isNaN(Number(amount))
      ? (Number(amount) / 100).toLocaleString("vi-VN")
      : null;

  // Hydration-safe flags
  const [mounted, setMounted] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(PAYMENT_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      setIsGuest(!!draft?.isGuest);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!orderId) return;

    apiFetch("/payments/confirm-return", {
      method: "POST",
      body: {
        provider: "VNPAY",
        orderId,
        success: isSuccess,
      },
    })
      .catch((err) => {
        console.error("Sync payment from VNPay return failed:", err);
      })
      .finally(() => {
        window.dispatchEvent(new Event("pp-notification-refresh"));
      });
  }, [orderId, isSuccess]);

  return (
    <main className="min-h-screen bg-[#f5f7fb] flex flex-col items-center pt-24 px-4 text-gray-900">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-md px-10 py-10">
        <div className="flex items-center justify-center gap-5 mb-8">
          <Image
            src={isSuccess ? "/success.png" : "/failed.png"}
            alt={isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
            width={60}
            height={60}
            className="object-contain"
          />

          <div className="text-left">
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              {isSuccess ? "Thanh toán thành công" : "Thanh toán thất bại"}
            </h1>
            <p className="text-sm text-gray-600">
              {isSuccess
                ? "Cảm ơn bạn đã hoàn tất thanh toán đơn đặt sân tại PicklePickle."
                : "Có lỗi xảy ra trong quá trình thanh toán."}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl px-6 py-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Thông tin thanh toán
          </h2>

          {orderId && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Mã đơn hàng</span>
              <span className="font-medium text-gray-800">{orderId}</span>
            </div>
          )}

          {formattedAmount && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Số tiền</span>
              <span className="font-semibold text-emerald-600">
                {formattedAmount} đ
              </span>
            </div>
          )}

          {bankCode && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Ngân hàng</span>
              <span className="font-medium text-gray-800">{bankCode}</span>
            </div>
          )}

          {cardType && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Loại thẻ</span>
              <span className="font-medium text-gray-800">{cardType}</span>
            </div>
          )}

          {payDate && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Thời gian thanh toán</span>
              <span className="font-medium text-gray-800">{payDate}</span>
            </div>
          )}

          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Phương thức</span>
            <span className="font-medium text-gray-800">VNPAY QR</span>
          </div>

          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Trạng thái</span>
            <span
              className={`font-semibold ${
                isSuccess ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {isSuccess ? "Thành công" : "Thất bại"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {mounted && !isGuest && (
            <Link
              href="/history"
              className="flex-1 inline-flex items-center justify-center rounded-full border border-gray-300 text-sm font-medium py-3 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Xem lịch sử đặt sân
            </Link>
          )}

          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center rounded-full border border-gray-300 text-sm font-medium py-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  );
}
