"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { apiFetch } from "@/lib/apiClient";

export default function ZalopayReturnPage() {
  const searchParams = useSearchParams();

  // ZaloPay sandbox redirect: ?amount=...&appid=...&apptransid=...&status=...&checksum=...
  const status = searchParams.get("status");
  const amount = searchParams.get("amount");
  const appTransId = searchParams.get("apptransid");

  // Theo docs: status = 1 là thành công
  const isSuccess = status === "1";

  const formattedAmount =
    amount && !Number.isNaN(Number(amount))
      ? Number(amount).toLocaleString("vi-VN")
      : null;

  // Đồng bộ trạng thái thanh toán về backend
  // Đồng bộ trạng thái thanh toán về backend
  useEffect(() => {
    if (!appTransId) return;

    apiFetch("/payments/confirm-return", {
      method: "POST",
      body: {
        provider: "ZALOPAY",
        orderId: appTransId,
        success: isSuccess,
      },
    })
      .catch((err) => {
        console.error("Sync payment from ZaloPay return failed:", err);
      })
      .finally(() => {
        window.dispatchEvent(new Event("pp-notification-refresh"));
      });
  }, [appTransId, isSuccess]);


  return (
    <main className="min-h-screen bg-[#f5f7fb] flex flex-col items-center pt-24 px-4 text-gray-900">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-md px-10 py-10">
        {/* Icon + title + description */}
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
                : "Có lỗi xảy ra trong quá trình thanh toán. Vui lòng kiểm tra lại trong phần lịch sử đặt sân."}
            </p>
          </div>
        </div>

        {/* Payment info */}
        <div className="bg-gray-50 rounded-2xl px-6 py-5 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Thông tin thanh toán
          </h2>

          {appTransId && (
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Mã giao dịch</span>
              <span className="font-medium text-gray-800">{appTransId}</span>
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

          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-500">Phương thức</span>
            <span className="font-medium text-gray-800">ZaloPay</span>
          </div>

          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Trạng thái</span>
            <span
              className={`font-semibold ${isSuccess ? "text-emerald-600" : "text-red-500"
                }`}
            >
              {isSuccess ? "Thành công" : "Thất bại"}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/history"
            className="flex-1 inline-flex items-center justify-center rounded-full border border-gray-300 text-sm font-medium py-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Xem lịch sử đặt sân
          </Link>

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
