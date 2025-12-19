"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import NotificationBell from "@/app/components/notifications/NotificationBell";

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(""); // OWNER / ADMIN / ...
  const router = useRouter();
  const pathname = usePathname();

  const syncFromStorage = () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("pp_token");
    const rawUser = localStorage.getItem("pp_user");

    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser);
        setIsLoggedIn(true);
        setUserName(user.fullName || user.email || "User");
        setUserRole(user.role || "");
      } catch {
        setIsLoggedIn(false);
        setUserName("");
        setUserRole("");
      }
    } else {
      setIsLoggedIn(false);
      setUserName("");
      setUserRole("");
    }
  };

  useEffect(() => {
    syncFromStorage();
    if (typeof window === "undefined") return;
    const handler = () => syncFromStorage();
    window.addEventListener("pp-auth-changed", handler);
    return () => window.removeEventListener("pp-auth-changed", handler);
  }, []);

  const handleLogout = (e) => {
    e.stopPropagation();
    if (typeof window !== "undefined") {
      localStorage.removeItem("pp_token");
      localStorage.removeItem("pp_user");
      window.dispatchEvent(new Event("pp-auth-changed"));
    }
    setUserRole("");
    router.push("/login");
  };

  // =========================
  //  HEADER BACKOFFICE (OWNER / ADMIN)
  // =========================

  // là backoffice nếu role là OWNER/ADMIN hoặc đang ở /owner /admin
  const isBackoffice =
    userRole === "OWNER" ||
    userRole === "ADMIN" ||
    pathname.startsWith("/owner") ||
    pathname.startsWith("/admin");

  if (isBackoffice) {
    const isAdmin =
      userRole === "ADMIN" || pathname.startsWith("/admin");

    // Label hiển thị bên phải: ADMIN hay CHỦ SÂN
    const roleLabel = isAdmin ? "ADMIN" : "CHỦ SÂN";
    const displayInitial =
      (userName && userName[0]?.toUpperCase()) || roleLabel[0];

    const handleGoProfile = () => {
      router.push("/account/profile");
    };

    return (
      <header className="bg-[#032341] text-white h-12 flex items-center shadow-sm">
        <nav className="w-full max-w-6xl mx-auto px-4 flex items-center justify-between">
          {/* Logo + brand */}
          <button
            type="button"
            onClick={() => {
              if (isAdmin) {
                router.push("/admin/dashboard");
              } else {
                router.push("/owner/dashboard");
              }
            }}
            className="flex items-center gap-2"
          >
            <Image
              src="/Logo.svg"
              alt="PicklePickle logo"
              width={24}
              height={24}
              priority
            />
            <span className="text-sm font-semibold tracking-wide">
              PicklePickle
            </span>
          </button>

          {/* Icons + user area */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-[#04152c] transition-colors"
            >
              <Image
                src="/Search.svg"
                alt="Tìm kiếm"
                width={18}
                height={18}
              />
            </button>

            {/* Help */}
            <button
              type="button"
              className="p-1.5 rounded-full hover:bg-[#04152c] transition-colors"
            >
              <Image
                src="/QuestionCircle.svg"
                alt="Trợ giúp"
                width={18}
                height={18}
              />
            </button>

            {/* Bell */}
            <NotificationBell compact />


            {/* Avatar + tên + role + logout */}
            <div className="flex items-center gap-3">
              {/* Avatar + tên (click để vào profile) */}
              <button
                type="button"
                onClick={handleGoProfile}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-xs font-semibold">
                  {displayInitial}
                </div>

                <div className="flex flex-col items-start leading-tight text-left">
                  <span className="text-[11px] opacity-70">Xin chào</span>
                  <span className="text-xs font-semibold truncate max-w-[120px]">
                    {userName || roleLabel}
                  </span>
                  <span className="text-[10px] uppercase opacity-70">
                    {roleLabel}
                  </span>
                </div>
              </button>

              {/* Đăng xuất */}
              <button
                type="button"
                onClick={handleLogout}
                className="text-[11px] font-semibold px-3 py-1 rounded-full border border-white/30 hover:bg:white hover:text-[#032341] transition-colors"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  // =========================
  //  HEADER USER (PUBLIC)
  // =========================
  return (
    <header className="pp-header">
      <nav className="pp-header__inner">
        <Link href="/" className="pp-header__brand">
          <Image
            src="/Logo.svg"
            alt="PicklePickle logo"
            width={100}
            height={100}
            priority
            className="pp-header__logo"
          />
          <span className="pp-header__brand-text">PicklePickle</span>
        </Link>

        <div className="pp-header__right">
          {isLoggedIn ? (
            <>
            {/* thông báo */}
              <NotificationBell showText />


              <button
                className="pp-header__icon-btn"
                type="button"
                onClick={() => router.push("/history")}
              >
                <Image
                  src="/historyIcon.svg"
                  alt="Lịch sử"
                  width={20}
                  height={20}
                  className="pp-header__icon"
                />
                <span>Lịch sử</span>
              </button>

              <div
                className="pp-header__user cursor-pointer"
                onClick={() => router.push("/account/profile")}
              >
                <div className="pp-header__avatar">
                  <Image
                    src="/Logo.svg"
                    alt={userName || "User"}
                    width={32}
                    height={32}
                  />
                </div>
                <span className="pp-header__user-text">
                  Chào,&nbsp;
                  <span className="pp-header__user-name">
                    {userName || "User"}
                  </span>
                </span>

                <button
                  type="button"
                  className="pp-header__link pp-header__link--strong ml-3"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                className="pp-header__link pp-header__dropdown"
                type="button"
              >
                <span>Tin tức</span>
                <span className="pp-header__caret">▾</span>
              </button>

              <Link href="/login" className="pp-header__link">
                Đăng nhập
              </Link>

              <span className="pp-header__divider" />

              <Link
                href="/register"
                className="pp-header__link pp-header__link--strong"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
