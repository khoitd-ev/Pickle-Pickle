"use client";

import Image from "next/image";

const PAYMENT_METHODS = [
  {
    id: "momo",
    name: "Ví điện tử Momo",
    description: "",
    icon: "/payment/momoIcon.svg",
  },
  {
    id: "vnpay",
    name: "Ví điện tử VNPay",
    description: "",
    icon: "/payment/Logo-VNPAY-QR 1.svg",
  },
  {
    id: "zalopay",
    name: "ZaloPay",
    description: "",
    icon: "/payment/zalopay.png",
  },
];

export default function PaymentMethodsSection({ selectedId, onChange }) {
  return (
    <section className="space-y-4">
      

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = method.id === selectedId;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onChange(method.id)}
              className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left shadow-sm transition
                ${
                  isSelected
                    ? "border-black bg-white"
                    : "border-zinc-200 bg-white hover:border-zinc-400"
                }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white overflow-hidden">
                  <Image
                    src={method.icon}
                    alt={method.name}
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-black">
                    {method.name}
                  </p>
                  {method.description && (
                    <p className="text-xs text-zinc-500">
                      {method.description}
                    </p>
                  )}
                </div>
              </div>

              {/* radio */}
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                  isSelected
                    ? "border-black bg-black"
                    : "border-zinc-400 bg-white"
                }`}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-white" />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
