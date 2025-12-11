"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/apiClient";

const GENDER_OPTIONS = [
  { value: "unknown", label: "Không xác định" },
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
  { value: "other", label: "Khác" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState({
    fullName: "",
    nickname: "",
    gender: "unknown",
    phone: "",
    birthday: "",
    address: "",
    email: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/users/me", { method: "GET" });
        setProfile({
          fullName: data.user.fullName || "",
          nickname: data.user.nickname || "",
          gender: data.user.gender || "unknown",
          phone: data.user.phone || "",
          birthday: data.user.birthday?.slice(0, 10) || "",
          address: data.user.address || "",
          email: data.user.email || "",
        });

        if (typeof window !== "undefined") {
          const current = JSON.parse(localStorage.getItem("pp_user") || "{}");
          const merged = { ...current, ...data.user };
          localStorage.setItem("pp_user", JSON.stringify(merged));
          window.dispatchEvent(new Event("pp-auth-changed"));
        }
      } catch {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("pp_user");
          if (raw) {
            try {
              const user = JSON.parse(raw);
              setProfile({
                fullName: user.fullName || "",
                nickname: user.nickname || "",
                gender: user.gender || "unknown",
                phone: user.phone || "",
                birthday: user.birthday?.slice?.(0, 10) || "",
                address: user.address || "",
                email: user.email || "",
              });
            } catch {
              // ignore
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const payload = {
        fullName: profile.fullName,
        nickname: profile.nickname,
        gender: profile.gender,
        phone: profile.phone,
        birthday: profile.birthday || null,
        address: profile.address,
      };

      const data = await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      if (typeof window !== "undefined") {
        const merged = { ...(data.user || payload), email: profile.email };
        localStorage.setItem("pp_user", JSON.stringify(merged));
        window.dispatchEvent(new Event("pp-auth-changed"));
      }

      setEditMode(false);
    } catch (err) {
      setError(err.message || "Không thể lưu thông tin");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("pp_user");
      if (raw) {
        try {
          const user = JSON.parse(raw);
          setProfile({
            fullName: user.fullName || "",
            nickname: user.nickname || "",
            gender: user.gender || "unknown",
            phone: user.phone || "",
            birthday: user.birthday?.slice?.(0, 10) || "",
            address: user.address || "",
            email: user.email || "",
          });
        } catch {
          // ignore
        }
      }
    }
    setEditMode(false);
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <p className="text-gray-500 text-sm">Đang tải thông tin...</p>
      </main>
    );
  }

  return (
    <main className="w-full flex justify-center bg-[#f5f5f5] py-10 px-4">
      <section className="w-full max-w-5xl bg-white rounded-2xl shadow-sm px-10 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-[#F2F2F2] flex items-center justify-center">
              <Image
                src="/Logo.svg"
                alt={profile.fullName || "Avatar"}
                width={80}
                height={80}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {profile.fullName || "nguyenvietquang"}
              </h1>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {editMode && (
              <>
                <button
                  type="button"
                  className="px-4 py-2 rounded-full text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Huỷ
                </button>
                <button
                  type="button"
                  className="px-5 py-2 rounded-full text-sm bg-black text-white hover:bg-black/80 disabled:opacity-60"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </>
            )}
            {!editMode && (
              <button
                type="button"
                className="px-5 py-2 rounded-full text-sm bg-black text-white hover:bg-black/80"
                onClick={() => setEditMode(true)}
              >
                Chỉnh sửa
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500 mb-4 text-right">{error}</p>
        )}

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Họ và tên */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Họ và Tên</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={profile.fullName}
              onChange={handleChange("fullName")}
              disabled={!editMode}
            />
          </div>

          {/* Biệt danh */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Biệt danh</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={profile.nickname}
              onChange={handleChange("nickname")}
              disabled={!editMode}
            />
          </div>

          {/* Giới tính */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Giới tính</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={profile.gender}
              onChange={handleChange("gender")}
              disabled={!editMode}
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          {/* SĐT */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Số điện thoại</label>
            <input
              type="tel"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={profile.phone}
              onChange={handleChange("phone")}
              disabled={!editMode}
            />
          </div>

          {/* Ngày sinh */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Ngày sinh</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={profile.birthday || ""}
              onChange={handleChange("birthday")}
              disabled={!editMode}
            />
          </div>

          {/* Địa chỉ */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Địa chỉ</label>
            <input
              type="text"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-[#F9F9F9] text-black"
              value={profile.address}
              onChange={handleChange("address")}
              disabled={!editMode}
            />
          </div>
        </div>

        {/* email */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-3">
            My email Address
          </h2>
          <div className="flex items-center gap-3">
            {/* NỀN XÁM NHẸ + ICON ĐEN */}
            <div className="w-9 h-9 rounded-full bg-[#F2F2F2] flex items-center justify-center">
              <Image
                src="/mailIcon.svg"
                alt="Mail"
                width={18}
                height={18}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-900">{profile.email}</span>
              <span className="text-xs text-gray-400">Primary email</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
