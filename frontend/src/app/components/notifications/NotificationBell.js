"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getMyNotifications, getUnreadCount, readAll, readOne } from "@/lib/notificationApi";

function dot(level) {
  if (level === "CRITICAL") return "bg-red-500";
  if (level === "WARNING") return "bg-yellow-500";
  return "bg-sky-500";
}

function safeParse(str) {
  try {
    return str ? JSON.parse(str) : {};
  } catch {
    return {};
  }
}

export default function NotificationBell({
  compact = false,
  showText = false, // muốn hiện chữ "Thông báo" thì bật true
}) {
  const router = useRouter();
  const ref = useRef(null);

  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);

  const sync = async () => {
    try {
      const c = await getUnreadCount();
      setUnread(c);
    } catch {}
  };

  const load = async () => {
    try {
      const list = await getMyNotifications({ limit: 10 });
      setItems(list);
    } catch {}
  };

  useEffect(() => {
    sync();
    const t = setInterval(sync, 20000);

    const onRefresh = () => sync();
    window.addEventListener("pp-notification-refresh", onRefresh);

    return () => {
      clearInterval(t);
      window.removeEventListener("pp-notification-refresh", onRefresh);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    load();

    const onClickOutside = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const onClickItem = async (n) => {
    try {
      if (!n.isRead) await readOne(n._id);
      await sync();
    } catch {}

    const data = safeParse(n.data);
    setOpen(false);

    if (data?.route) router.push(data.route);
    else router.push("/history");
  };

  const onReadAll = async () => {
    try {
      await readAll();
      await sync();
      await load();
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          compact
            ? "relative p-2 rounded-full hover:bg-[#04152c] transition-colors"
            : "pp-header__icon-btn relative"
        }
        aria-label="Notifications"
      >
        <div className="relative">
          <Image
            src="/Bell.svg"
            alt="Notifications"
            width={18}
            height={18}
            priority
          />
          {unread > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>

        {!compact && showText && <span>Thông báo</span>}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
            <div className="text-sm font-semibold text-gray-900">Thông báo</div>
            <button
              type="button"
              onClick={onReadAll}
              className="text-[11px] font-medium text-sky-600 hover:underline"
            >
              Đã đọc hết
            </button>
          </div>

          <div className="max-h-[360px] overflow-auto">
            {items.length === 0 ? (
              <div className="px-3 py-6 text-xs text-gray-500 text-center">
                Chưa có thông báo.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n._id}
                  type="button"
                  onClick={() => onClickItem(n)}
                  className={`w-full text-left px-3 py-2.5 border-b border-gray-50 hover:bg-gray-50 ${
                    n.isRead ? "opacity-75" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1 w-2 h-2 rounded-full ${dot(n.level)}`} />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-gray-900">{n.title}</div>
                      <div className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                        {n.content}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
