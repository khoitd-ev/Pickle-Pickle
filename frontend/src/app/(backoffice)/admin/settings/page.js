"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    inApp: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    allowNewVenues: true,
    autoApproveOwner: false,
  });

  const toggleNotification = (key) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSystemSetting = (key) => {
    setSystemSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-6">
      <header className="mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
          Cài đặt hệ thống
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Cấu hình chung cho toàn bộ hệ thống PicklePickle: tài khoản admin,
          cảnh báo và quy tắc duyệt chủ sân.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Thông tin admin */}
        <section className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Thông tin tài khoản admin
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900"
                  value="System Administrator"
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
                  value="admin@example.com"
                  readOnly
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl border border-sky-500 bg-white px-4 py-2 text-sm font-medium text-sky-600 hover:bg-sky-50 transition"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>

            
          </div>

          {/* Quy tắc phê duyệt */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Quy tắc phê duyệt & vận hành
            </h2>

            <div className="space-y-4">
              <ToggleRow
                title="Cho phép chủ sân mới tạo tài khoản đăng ký"
                description="Khi bật, chủ sân có thể tự đăng ký tài khoản và chờ admin phê duyệt."
                checked={systemSettings.allowNewVenues}
                onChange={() => toggleSystemSetting("allowNewVenues")}
              />
              <ToggleRow
                title="Tự động phê duyệt chủ sân mới"
                description="Nếu tắt, mọi yêu cầu mới sẽ ở trạng thái chờ admin xác nhận."
                checked={systemSettings.autoApproveOwner}
                onChange={() => toggleSystemSetting("autoApproveOwner")}
              />
            </div>
          </div>
        </section>

        {/* Thông báo & lưu cấu hình */}
        <section className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Thông báo cho admin
            </h2>

            <div className="space-y-4">
              <ToggleRow
                title="Email"
                description="Gửi email khi có yêu cầu chủ sân mới hoặc sự cố hệ thống quan trọng."
                checked={notificationSettings.email}
                onChange={() => toggleNotification("email")}
              />
              <ToggleRow
                title="Thông báo trong hệ thống"
                description="Hiển thị thông báo trên thanh điều hướng admin."
                checked={notificationSettings.inApp}
                onChange={() => toggleNotification("inApp")}
              />
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">
              Lưu cấu hình
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
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? "bg-sky-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
