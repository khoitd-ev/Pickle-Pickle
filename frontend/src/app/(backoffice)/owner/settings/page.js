"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OwnerSettingsPage() {
  const router = useRouter();
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    sms: false,
    inApp: true,
  });

  const [bookingSettings, setBookingSettings] = useState({
    autoConfirmPaid: true,
    allowPending: true,
    showRealtime: true,
  });

  const toggleNotification = (key) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleBookingSetting = (key) => {
    setBookingSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Cài đặt
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý thông tin tài khoản, thông báo và cấu hình đặt sân cho chủ sân.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Cột trái: thông tin tài khoản */}
        <section className="xl:col-span-2 space-y-6">
          {/* Thông tin tài khoản */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Thông tin tài khoản
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                  value="Default Court Owner"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Email đăng nhập
                </label>
                <input
                  type="email"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                  value="owner@example.com"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                  value="0888 888 888"
                  readOnly
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => router.push("/account/password")}
                  className="inline-flex items-center justify-center rounded-xl border border-sky-500 bg-white px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 transition"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>

          {/* Cấu hình đặt sân */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Cấu hình đặt sân
            </h2>

            <div className="space-y-4">
              <ToggleRow
                title="Tự động xác nhận đơn đã thanh toán"
                description="Những booking đã thanh toán online sẽ tự động chuyển sang trạng thái đã xác nhận."
                checked={bookingSettings.autoConfirmPaid}
                onChange={() => toggleBookingSetting("autoConfirmPaid")}
              />
              <ToggleRow
                title="Cho phép đơn chờ thanh toán"
                description="Giữ slot trong một khoảng thời gian nhất định để khách hoàn tất thanh toán."
                checked={bookingSettings.allowPending}
                onChange={() => toggleBookingSetting("allowPending")}
              />
              <ToggleRow
                title="Hiển thị realtime trên màn hình quản lý đặt sân"
                description="Cập nhật trạng thái sân theo thời gian thực khi có khách đang đặt."
                checked={bookingSettings.showRealtime}
                onChange={() => toggleBookingSetting("showRealtime")}
              />
            </div>
          </div>
        </section>

        {/* Cột phải: thông báo & hệ thống */}
        <section className="space-y-6">
          {/* Thông báo */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Thông báo
            </h2>

            <div className="space-y-4">
              <ToggleRow
                title="Email"
                description="Gửi email khi có đơn đặt sân mới hoặc hủy sân."
                checked={notificationSettings.email}
                onChange={() => toggleNotification("email")}
              />
              <ToggleRow
                title="SMS"
                description="Gửi SMS ở các sự kiện quan trọng (có thể phát sinh chi phí)."
                checked={notificationSettings.sms}
                onChange={() => toggleNotification("sms")}
              />
              <ToggleRow
                title="Thông báo trong hệ thống"
                description="Hiện thông báo trên thanh điều hướng khi có hoạt động mới."
                checked={notificationSettings.inApp}
                onChange={() => toggleNotification("inApp")}
              />
            </div>
          </div>

          {/* Khu vực lưu */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Lưu thay đổi
            </h2>
            <button
              type="button"
              className="w-full rounded-xl bg-sky-500 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-600 transition"
            >
              Lưu cấu hình
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function ToggleRow({ title, description, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-sky-500" : "bg-gray-300"
          }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-1"
            }`}
        />
      </button>
    </div>
  );
}
