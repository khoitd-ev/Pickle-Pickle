"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("pp_user");
    if (!raw) return;
    try {
      const user = JSON.parse(raw);
      setUserName(user.fullName || user.email || "User");
      setEmail(user.email || "");
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pp_token");
      localStorage.removeItem("pp_user");
      window.dispatchEvent(new Event("pp-auth-changed"));
    }
    router.push("/login");
  };

  const navItems = [
    {
      key: "profile",
      label: "Hồ sơ cá nhân",
      href: "/account/profile",
      icon: "",
    },
    {
      key: "password",
      label: "Đổi mật khẩu",
      href: "/account/password",
      icon: "",
    },
  ];

  const isActive = (href) => pathname.startsWith(href);

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#f5f5f5] py-10 px-4 flex justify-center">
      <div className="w-full max-w-6xl flex gap-8 items-start">
        {/* SIDEBAR */}
        <aside className="mt-10 w-[260px] bg-white rounded-2xl shadow-sm py-6 flex flex-col self-start">
          {/* Avatar + name */}
          <div className="px-6 mb-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#F2F2F2] flex items-center justify-center">
              <Image
                src="/Logo.svg"
                alt={userName || "Avatar"}
                width={44}
                height={44}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white bg-[#001B3A] rounded-full px-3 py-1">
                PicklePickle
              </span>
              <span className="text-xs text-gray-500 mt-1 truncate">
                {email}
              </span>
            </div>
          </div>

          {/* Menu */}
          <nav className="mb-2">
            {navItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => router.push(item.href)}
                className={
                  "w-full flex items-center gap-3 px-6 py-3 text-sm text-gray-700 hover:bg-[#E7F1FF] " +
                  (isActive(item.href) ? "bg-[#E7F1FF] font-medium" : "")
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-100 pt-3 px-6">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg"
            >
              <span></span>
              <span>Đăng xuất</span>
            </button>
          </div>
        </aside>

        {/* CONTENT */}
        <section className="flex-1">
          {/* card profile / password đã có margin mặc định */}
          {children}
        </section>
      </div>
    </main>
  );
}
