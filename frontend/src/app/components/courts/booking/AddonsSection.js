"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "equipment", label: "Dụng cụ" },
  { id: "drink", label: "Đồ uống" },
  { id: "support", label: "Phụ trợ" },
];

// Mock mặc định (fallback khi API lỗi / đang dev)
const FALLBACK_PRODUCTS = [
  {
    id: "balls",
    name: "Bóng Pickleball (3 quả)",
    category: "equipment",
    categoryLabel: "Dụng cụ",
    price: 280000,
    image: "/booking/pickleballIcon.svg",
  },
  {
    id: "racket-rent",
    name: "Thuê vợt Pickleball",
    category: "equipment",
    categoryLabel: "Dụng cụ",
    price: 50000,
    image: "/booking/racketIcon.svg",
  },
  {
    id: "water",
    name: "Nước suối",
    category: "drink",
    categoryLabel: "Đồ uống",
    price: 10000,
    image: "/booking/water.svg",
  },
  {
    id: "revive",
    name: "Nước khoáng",
    category: "drink",
    categoryLabel: "Đồ uống",
    price: 20000,
    image: "/booking/revive.svg",
  },
  {
    id: "wet-tissue",
    name: "Khăn ướt",
    category: "support",
    categoryLabel: "Phụ trợ",
    price: 5000,
    image: "/booking/khanuotIcon.svg",
  },
  {
    id: "wristband",
    name: "Băng cổ tay",
    category: "support",
    categoryLabel: "Phụ trợ",
    price: 35000,
    image: "/booking/bangcotayIcon.svg",
  },
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export default function AddonsSection({ onChange, venueId }) {
  const [activeTab, setActiveTab] = useState("all");
  const [quantities, setQuantities] = useState({}); // { productId: number }

  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== Fetch addons từ backend, filter theo venueId =====
  useEffect(() => {
    let cancelled = false;

    async function fetchAddons() {
      try {
        setLoading(true);
        setError("");

        // /addons?venueId=...
        const base = `${API_BASE}/addons`;
        const url =
          venueId && typeof venueId === "string"
            ? `${base}?venueId=${encodeURIComponent(venueId)}`
            : base;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Fetch addons failed: ${res.status}`);
        }

        const json = await res.json();
        const data = json.data || [];

        if (!cancelled && data.length > 0) {
          // data: [{ id, name, category, categoryLabel, price, image }]
          setProducts(data);
          // reset quantity mỗi lần đổi venue
          setQuantities({});
        }
      } catch (err) {
        console.error("Could not load addons", err);
        if (!cancelled) {
          setError(
            "Không tải được danh sách dịch vụ thêm. Đang dùng dữ liệu mặc định."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAddons();

    return () => {
      cancelled = true;
    };
  }, [venueId]);

  // ===== Tính tổng tiền & emit ra ngoài =====
  useEffect(() => {
    if (!onChange) return;

    const items = Object.entries(quantities)
      .map(([productId, qty]) => {
        const product = products.find((p) => p.id === productId);
        if (!product) return null;

        const lineTotal = product.price * qty;

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: qty,
          lineTotal, // tên cũ
          totalPrice: lineTotal, // alias để payment dùng
          category: product.category,
          categoryLabel: product.categoryLabel,
        };
      })
      .filter(Boolean);

    const addonsTotal = items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    onChange({ items, addonsTotal });
  }, [quantities, products, onChange]);

  const filteredProducts =
    activeTab === "all"
      ? products
      : products.filter((p) => p.category === activeTab);

  const handleAdd = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleIncrease = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const handleDecrease = (productId) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: current - 1 };
    });
  };

  // Chuẩn hoá src ảnh: nếu là /uploads/... -> prefix API_BASE
  const resolveImageSrc = (raw) => {
    if (!raw) return "/booking/water.svg"; // fallback
    if (raw.startsWith("/uploads/")) {
      return `${API_BASE}${raw}`;
    }
    return raw; // các icon tĩnh trong /public/booking
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white px-4 py-5 md:px-8 md:py-6 space-y-5">
      <h2 className="text-lg md:text-xl font-semibold text-black mb-1">
        Dịch vụ thêm
      </h2>

      {loading && (
        <p className="text-xs text-zinc-500">
          Đang tải danh sách dịch vụ thêm...
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4">
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${isActive
                  ? "bg-black text-white"
                  : "bg-[#e9eaed] text-black hover:bg-[#dcdde1]"
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Products grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredProducts.map((product) => {
          const qty = quantities[product.id] || 0;

          return (
            <article
              key={product.id}
              className="flex items-center justify-between rounded-2xl bg-[#f5f5f5] px-4 py-3 shadow-sm"
            >
              {/* left: image + text */}
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 relative rounded-full bg-white overflow-hidden flex-shrink-0">
                  <Image
                    src={resolveImageSrc(product.image)}
                    alt={product.name}
                    fill  // dùng fill để ảnh phủ toàn bộ khung tròn
                    sizes="56px"
                    className="object-cover"  // crop như avatar, không bị khoảng trắng
                    unoptimized
                  />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-semibold text-black">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Danh mục: {product.categoryLabel}
                  </p>
                  <p className="text-sm font-semibold text-black">
                    {product.price.toLocaleString("vi-VN")} VND
                  </p>
                </div>
              </div>

              {/* right: button / quantity control */}
              <div className="self-stretch flex items-end">
                {qty === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleAdd(product.id)}
                    className="rounded-md bg-black px-5 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-zinc-800"
                  >
                    Thêm
                  </button>
                ) : (
                  <div className="flex items-center gap-0 rounded-md bg-black text-white text-xs md:text-sm font-semibold">
                    {/* Nút giảm bên trái */}
                    <button
                      type="button"
                      onClick={() => handleDecrease(product.id)}
                      className="px-3 py-2 border-r border-zinc-800 hover:bg-zinc-800"
                    >
                      -
                    </button>

                    {/* Số lượng ở giữa */}
                    <span className="px-4 py-2 select-none">{qty}</span>

                    {/* Nút tăng bên phải */}
                    <button
                      type="button"
                      onClick={() => handleIncrease(product.id)}
                      className="px-3 py-2 border-l border-zinc-800 hover:bg-zinc-800"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
