"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/apiClient";
import { useRouter } from "next/navigation";

export default function PasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận không khớp");
      return;
    }

    setSaving(true);
    try {
      await apiFetch("/users/me/password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      setSuccess("Đã đổi mật khẩu thành công");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Không thể đổi mật khẩu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="w-full flex justify-center bg-[#f5f5f5] py-10 px-4">
      <section className="w-full max-w-3xl bg-white rounded-2xl shadow-sm px-10 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Đổi mật khẩu
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Để bảo vệ tài khoản, hãy dùng mật khẩu mạnh và không chia sẻ cho
              người khác.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 max-w-md">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Mật khẩu hiện tại</label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Mật khẩu mới</label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-full bg-black text-white text-sm hover:bg-black/80 disabled:opacity-60"
            >
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
