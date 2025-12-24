"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "../chat/ChatWidget";


export default function LayoutClient({ children }) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const rawUser = localStorage.getItem("pp_user");
    if (!rawUser) {
      setUserRole("");
      return;
    }
    try {
      const user = JSON.parse(rawUser);
      setUserRole(user.role || "");
    } catch {
      setUserRole("");
    }
  }, [pathname]);

  const isOwnerOrAdmin = userRole === "OWNER" || userRole === "ADMIN";

  // Các route backoffice /owner, /admin hoặc
  // trang profile nhưng user là OWNER/ADMIN
  const isBackoffice =
    pathname.startsWith("/owner") ||
    pathname.startsWith("/admin") ||
    (pathname.startsWith("/account") && isOwnerOrAdmin);

  if (isBackoffice) {
    // (backoffice)/layout.js lo sidebar, ở profile chỉ có header + nội dung
    return (
      <>
        <Header />
        {children}
      </>
    );
  }

  // Layout phía user: Header + main + Footer
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </>
  );
}
