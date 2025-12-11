"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

import PaymentMethodsSection from "@/app/components/payment/PaymentMethodsSection";
import PaymentInvoiceSection from "@/app/components/payment/PaymentInvoiceSection";

const PAYMENT_DRAFT_KEY = "pp_booking_payment_draft";

export default function CourtPaymentPage() {
  const params = useParams();
  const courtId = params?.courtId;

  const [selectedMethod, setSelectedMethod] = useState("momo");
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [paymentDraft, setPaymentDraft] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = localStorage.getItem(PAYMENT_DRAFT_KEY);

    if (!raw) {
      setLoadingDraft(false);
      return;
    }

    try {
      const draft = JSON.parse(raw);
      setPaymentDraft(draft);

      const items = [];

      if (draft.courtTotal && draft.courtTotal > 0) {
        items.push({
          id: "court",
          label: "Tiền sân",
          amount: draft.courtTotal,
        });
      }

      if (draft.addons?.items?.length) {
        draft.addons.items.forEach((addon) => {
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

  const mapMethodForApi = (methodId) => {
    if (!methodId) return null;
    const m = String(methodId).toLowerCase();
    if (m === "momo") return "MOMO";
    if (m === "vnpay") return "VNPAY";
    if (m === "zalopay") return "ZALOPAY";
    return null;
  };

  const handlePay = async () => {
    if (!paymentDraft || !paymentDraft.bookingId) {
      alert("Không tìm thấy bookingId. Vui lòng quay lại bước trước.");
      return;
    }

    const paymentMethodForApi = mapMethodForApi(selectedMethod);
    if (!paymentMethodForApi) {
      alert("Phương thức thanh toán không hợp lệ.");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/payments/checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethod: paymentMethodForApi,
            bookingId: paymentDraft.bookingId,
          }),
        }
      );

      if (!res.ok) {
        console.error("Payment error", await res.text());
        alert("Thanh toán thất bại. Vui lòng thử lại.");
        return;
      }

      const json = await res.json();
      const data = json?.data || json;

      console.log("Payment result:", data);

      if (data && data.redirectUrl) {
        window.location.href = data.redirectUrl;
        return;
      }

      alert(
        "Tạo yêu cầu thanh toán thành công nhưng chưa nhận được URL thanh toán. Vui lòng kiểm tra lại backend."
      );
    } catch (err) {
      console.error("Payment request error", err);
      alert("Có lỗi trong quá trình thanh toán. Vui lòng thử lại sau.");
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-4 py-10 space-y-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-black mb-4">
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
