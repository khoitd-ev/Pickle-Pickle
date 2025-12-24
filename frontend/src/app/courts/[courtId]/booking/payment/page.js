"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import PaymentMethodsSection from "@/app/components/payment/PaymentMethodsSection";
import PaymentInvoiceSection from "@/app/components/payment/PaymentInvoiceSection";

const PAYMENT_DRAFT_KEY = "pp_booking_payment_draft";
const TOKEN_STORAGE_KEY = "pp_token";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export default function CourtPaymentPage() {
  const params = useParams();
  const courtId = params?.courtId;

  const [selectedMethod, setSelectedMethod] = useState("momo");
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true);

  /* ===================== LOAD DRAFT ===================== */
  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(PAYMENT_DRAFT_KEY);
    if (!raw) {
      setLoadingDraft(false);
      return;
    }

    try {
      const draft = JSON.parse(raw);

      const normalizedDraft = {
        ...draft,
        addons: {
          items: draft?.addons?.items || [],
          total: Number(draft?.addons?.total ?? 0) || 0,
        },
      };

      setPaymentDraft(normalizedDraft);

      const items = [];

      if (normalizedDraft.courtTotal > 0) {
        items.push({
          id: "court",
          label: "Tiền sân",
          amount: normalizedDraft.courtTotal,
        });
      }

      if (normalizedDraft.addons.items.length) {
        normalizedDraft.addons.items.forEach((addon) => {
          items.push({
            id: `addon-${addon.id}`,
            label: `${addon.name} (x${addon.quantity})`,
            amount: addon.totalPrice,
          });
        });
      }

      setInvoiceItems(items);
    } catch (err) {
      console.error("Cannot parse payment draft", err);
    } finally {
      setLoadingDraft(false);
    }
  }, []);

  /* ===================== MAP PAYMENT METHOD ===================== */
  const mapMethodForApi = (methodId) => {
    if (!methodId) return null;
    const m = String(methodId).toLowerCase();
    if (m === "momo") return "MOMO";
    if (m === "vnpay") return "VNPAY";
    if (m === "zalopay") return "ZALOPAY";
    return null;
  };

  /* ===================== PAY HANDLER ===================== */
  const handlePay = async () => {
    if (!paymentDraft) {
      alert("Không tìm thấy thông tin đặt sân. Vui lòng quay lại bước trước.");
      return;
    }

    const paymentMethodForApi = mapMethodForApi(selectedMethod);
    if (!paymentMethodForApi) {
      alert("Phương thức thanh toán không hợp lệ.");
      return;
    }

    const isGuest = !!paymentDraft.isGuest;

    let token = null;
    if (typeof window !== "undefined") {
      token = localStorage.getItem(TOKEN_STORAGE_KEY);
    }


    if (!isGuest && !token) {
      alert("Vui lòng đăng nhập để thanh toán.");
      window.location.href = `/login?redirect=/courts/${courtId}/booking/payment`;
      return;
    }

    try {
      let bookingId = paymentDraft.bookingId;

      /* ===================== 1) CREATE BOOKING (nếu chưa có) ===================== */
      if (!bookingId) {
        const addonsTotal = Number(paymentDraft.addons.total || 0);
        const addonsPayload = {
          items: paymentDraft.addons.items || [],
          total: addonsTotal,
        };

        const createUrl = isGuest
          ? `${API_BASE}/bookings/guest`
          : `${API_BASE}/bookings`;

        const createHeaders = {
          "Content-Type": "application/json",
          ...(isGuest ? {} : { Authorization: `Bearer ${token}` }),
        };

        const createBody = {
          venueId: paymentDraft.venueId,
          date: paymentDraft.date,
          courts: paymentDraft.courtsPayload,
          addons: addonsPayload,
          addonsTotal,
          note:
            paymentDraft.addons.items.length > 0
              ? `Addons: ${paymentDraft.addons.items
                  .map((i) => `${i.name}x${i.quantity}`)
                  .join(", ")}`
              : "",
          ...(isGuest ? { guestInfo: paymentDraft.guestInfo } : {}),
        };

        const resCreate = await fetch(createUrl, {
          method: "POST",
          headers: createHeaders,
          body: JSON.stringify(createBody),
        });

        const jsonCreate = await resCreate.json();
        if (!resCreate.ok) {
          alert(jsonCreate?.message || "Không thể tạo booking. Vui lòng thử lại.");
          return;
        }

        bookingId =
          jsonCreate?.data?.bookingId ||
          jsonCreate?.bookingId ||
          jsonCreate?.data?.booking?._id ||
          jsonCreate?._id;

        if (!bookingId) {
          alert("Không lấy được bookingId sau khi tạo booking.");
          return;
        }

        const nextDraft = { ...paymentDraft, bookingId };
        localStorage.setItem(PAYMENT_DRAFT_KEY, JSON.stringify(nextDraft));
        setPaymentDraft(nextDraft);
      }

      /* ===================== 2) CHECKOUT PAYMENT ===================== */
      const res = await fetch(`${API_BASE}/payments/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          paymentMethod: paymentMethodForApi,
          bookingId,
        }),
      });

      if (!res.ok) {
        console.error("Payment error", await res.text());
        alert("Thanh toán thất bại. Vui lòng thử lại.");
        return;
      }

      const json = await res.json();
      const data = json?.data || json;

      if (data?.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      alert(
        "Tạo yêu cầu thanh toán thành công nhưng chưa nhận được URL thanh toán."
      );
    } catch (err) {
      console.error("Payment request error", err);
      alert("Có lỗi trong quá trình thanh toán. Vui lòng thử lại sau.");
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-black">
          Phương thức thanh toán
        </h1>

        {loadingDraft && (
          <p className="text-sm text-zinc-500">
            Đang tải thông tin thanh toán...
          </p>
        )}

        {!loadingDraft && !paymentDraft && (
          <p className="text-sm text-red-500">
            Không tìm thấy thông tin đặt sân. Vui lòng quay lại bước trước.
          </p>
        )}

        {!loadingDraft && paymentDraft && (
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-start">
            <PaymentMethodsSection
              selectedId={selectedMethod}
              onChange={setSelectedMethod}
            />
            <PaymentInvoiceSection items={invoiceItems} onPay={handlePay} />
          </div>
        )}
      </section>
    </main>
  );
}
