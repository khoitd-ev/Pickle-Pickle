"use client";

import Link from "next/link";
import { useMemo } from "react";

function slugify(s) {
  return (s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-");
}

export default function OwnerStaticShell({
  title,
  subtitle,
  sections = [],
  children,
}) {
  const toc = useMemo(
    () =>
      (sections || []).map((t) => ({
        text: t,
        id: slugify(t),
      })),
    [sections]
  );

  return (
   
    <main className="min-h-screen bg-white text-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <Link
              href="/"
              className="rounded-lg px-2 py-1 hover:bg-zinc-100 hover:text-zinc-950"
            >
              ← Trang chủ
            </Link>
            <span className="opacity-50">/</span>
            <span className="text-zinc-800">{title}</span>
          </div>

          <div className="text-xs text-zinc-500">
            Cập nhật: {new Date().toLocaleDateString("vi-VN")}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Content panel */}
          <section className="md:col-span-8 lg:col-span-9">
         
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 md:p-8 shadow-sm">
              <div className="mb-6">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-950">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-2 text-sm md:text-base text-zinc-600 leading-relaxed">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <div className="space-y-6 leading-relaxed text-zinc-800">
                {children}
              </div>
            </div>
          </section>

          {/* TOC panel (desktop) */}
          <aside className="md:col-span-4 lg:col-span-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sticky top-6 hidden md:block shadow-sm">
              <div className="text-sm font-semibold text-zinc-950">
                Mục lục
              </div>

              <div className="mt-3 space-y-2">
                {toc.length === 0 ? (
                  <div className="text-xs text-zinc-500">(Trang này không có mục lục)</div>
                ) : (
                  toc.map((i) => (
                    <a
                      key={i.id}
                      href={`#${i.id}`}
                      className="block rounded-lg px-2 py-1 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    >
                      {i.text}
                    </a>
                  ))
                )}
              </div>

              <div className="mt-6 border-t border-zinc-200 pt-4">
                <div className="text-xs font-semibold text-zinc-800 mb-2">
                  Liên kết nhanh
                </div>
                <div className="space-y-1 text-sm">
                  <Link
                    className="block rounded-lg px-2 py-1 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    href="/faq"
                  >
                    FAQ
                  </Link>
                  <Link
                    className="block rounded-lg px-2 py-1 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    href="/guide/booking"
                  >
                    Hướng dẫn đặt sân
                  </Link>
                  <Link
                    className="block rounded-lg px-2 py-1 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                    href="/policies/refund"
                  >
                    Huỷ & hoàn tiền
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

// helper để dùng trong page:
export function Section({ title, children }) {
  const id = slugify(title);
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-base md:text-lg font-semibold text-zinc-950">
        {title}
      </h2>
      <div className="mt-2 text-sm md:text-base text-zinc-700 space-y-3">
        {children}
      </div>
    </section>
  );
}
