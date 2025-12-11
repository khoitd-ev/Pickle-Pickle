"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { apiFetch } from "../../../../lib/apiClient";





const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

function resolveImageUrl(raw) {
    if (!raw) return "";
    // BE trả "/uploads/owners/..."
    if (raw.startsWith("/uploads/")) {
        return `${API_BASE}${raw}`; // -> http://localhost:4000/api/uploads/...
    }
    return raw;
}




// ================== CONTENT MODEL CHO OWNER ==================
// LƯU Ý: Giữ lại các field cũ để không phá BE,
// nhưng bổ sung thêm field mới đúng yêu cầu hero + overview.
const EMPTY_CONTENT = {
    // HERO
    heroTitle: "",          // Tên sân hiển thị ở hero
    heroSubtitle: "",       // Description ngắn
    heroTagline: "",        // Optional slogan
    heroPhone: "",          // NEW: Số điện thoại hiển thị ở hero
    heroAddress: "",        // NEW: Địa chỉ hiển thị ở hero
    heroImages: [],         // list ảnh hero (slider)
    avatarImage: "",        // ảnh đại diện dùng ở trang search

    // OVERVIEW – tiêu đề + mô tả tổng quan (cũ)
    overviewTitle: "",
    overviewDescription: "",

    // ĐẶC ĐIỂM & TIỆN ÍCH – NEW: 4 cột trái/phải
    // FE sẽ truyền mảng string, BE có thể map thẳng sang schema venue.featuresLeft / amenitiesLeft...
    featuresLeft: [],        // danh sách bullet cho cột "đặc điểm trái"
    featuresRight: [],       // danh sách bullet cho cột "đặc điểm phải"
    amenitiesLeft: [],       // danh sách bullet cho cột "tiện ích trái"
    amenitiesRight: [],      // danh sách bullet cho cột "tiện ích phải"

    // Ảnh cho đặc điểm + tiện ích
    highlightTitle: "",       // vẫn giữ (mô tả chung cho phần đặc điểm)
    highlightDescription: "",
    highlightImages: [],      // list ảnh ĐẶC ĐIỂM

    amenityTitle: "",         // mô tả chung cho phần TIỆN ÍCH
    amenityDescription: "",
    amenityImages: [],        // list ảnh TIỆN ÍCH

    // PRICING TEXT – GIỮ LẠI ĐỂ KHÔNG PHÁ BE NHƯNG KHÔNG HIỂN THỊ TRONG UI
    pricingTitle: "",
    pricingDescription: "",
    pricingNote: "",
};

// Chuẩn hóa data từ BE -> state FE
function normalizeContent(raw) {
    if (!raw || typeof raw !== "object") return { ...EMPTY_CONTENT };

    return {
        ...EMPTY_CONTENT,
        ...raw,

        // Đảm bảo các field list luôn là array
        heroImages: Array.isArray(raw.heroImages) ? raw.heroImages : [],
        highlightImages: Array.isArray(raw.highlightImages)
            ? raw.highlightImages
            : [],
        amenityImages: Array.isArray(raw.amenityImages)
            ? raw.amenityImages
            : [],

        featuresLeft: Array.isArray(raw.featuresLeft) ? raw.featuresLeft : [],
        featuresRight: Array.isArray(raw.featuresRight) ? raw.featuresRight : [],
        amenitiesLeft: Array.isArray(raw.amenitiesLeft) ? raw.amenitiesLeft : [],
        amenitiesRight: Array.isArray(raw.amenitiesRight) ? raw.amenitiesRight : [],
    };
}

// ================== UI HELPERS ==================

function SectionCard({ title, children }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
            {children}
        </div>
    );
}

function Label({ children }) {
    return (
        <label className="block text-sm font-medium text-gray-800 mb-1.5">
            {children}
        </label>
    );
}

function TextInput(props) {
    const { className, ...rest } = props;
    return (
        <input
            {...rest}
            className={
                "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm " +
                "text-black placeholder:text-gray-400 bg-white " +
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
                (className || "")
            }
        />
    );
}

function TextArea(props) {
    const { className, ...rest } = props;
    return (
        <textarea
            {...rest}
            className={
                "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm " +
                "text-black placeholder:text-gray-400 bg-white " +
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 " +
                (className || "")
            }
        />
    );
}

// Editor list ảnh (hero / highlight / amenity)
function ImagesListEditor({
    label,
    images,
    onChange,
    onUpload,
    uploading,
    helperText,
}) {
    const fileInputRef = useRef(null);

    const handleAddClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !onUpload) return;
        await onUpload(file);
    };

    const handleRemove = (idx) => {
        if (!Array.isArray(images)) return;
        const next = images.filter((_, i) => i !== idx);
        onChange(next);
    };

    return (
        <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
                <Label>{label}</Label>
                <button
                    type="button"
                    onClick={handleAddClick}
                    disabled={uploading}
                    className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {uploading ? "Đang upload..." : "Thêm ảnh"}
                </button>
            </div>
            {helperText && (
                <p className="text-[11px] text-gray-500 mb-2">{helperText}</p>
            )}

            {(!images || images.length === 0) && (
                <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center text-xs text-gray-500">
                    Chưa có ảnh. Nhấn “Thêm ảnh” để upload.
                </div>
            )}

            {images && images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {images.map((url, idx) => (
                        <div
                            key={idx}
                            className="relative border border-gray-200 rounded-xl overflow-hidden"
                        >
                            <div className="relative w-full h-24 bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={resolveImageUrl(url)}
                                    alt={`image-${idx}`}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                className="absolute top-1 right-1 inline-flex items-center justify-center rounded-full bg-black/60 w-6 h-6 text-[11px] text-white"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}


            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}

// Upload 1 ảnh avatar
function AvatarEditor({ value, onUpload, uploading, onClear }) {
    const fileRef = useRef(null);

    const handleClick = () => {
        if (fileRef.current) {
            fileRef.current.value = "";
            fileRef.current.click();
        }
    };

    const handleChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !onUpload) return;
        await onUpload(file);
    };

    return (
        <div className="mb-4">
            <Label>Ảnh đại diện (avatar dùng ở trang tìm kiếm)</Label>
            <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                    {value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={resolveImageUrl(value)}
                            alt="avatar"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-[11px] text-gray-400 text-center px-2">
                            Chưa có ảnh
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleClick}
                        disabled={uploading}
                        className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {uploading ? "Đang upload..." : "Chọn / đổi ảnh"}
                    </button>
                    {value && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                            Xóa ảnh
                        </button>
                    )}
                </div>
            </div>

            <input
                type="file"
                accept="image/*"
                ref={fileRef}
                onChange={handleChange}
                className="hidden"
            />
        </div>
    );
}

// Input nhiều dòng -> mảng string (dùng cho đặc điểm trái/phải, tiện ích trái/phải)
function MultiLineListInput({ label, value, onChange, placeholder }) {
  const [textValue, setTextValue] = useState(
    Array.isArray(value) ? value.join("\n") : ""
  );

  // Cờ để phân biệt update từ bên ngoài (load API) hay từ chính ô textarea
  const internalChangeRef = useRef(false);

  useEffect(() => {
    // Nếu update đến từ chính handleChange thì không overwrite textValue
    if (internalChangeRef.current) {
      internalChangeRef.current = false;
      return;
    }
    setTextValue(Array.isArray(value) ? value.join("\n") : "");
  }, [value]);

  const syncToArray = (text) => {
    const lines = text
      .split("\n")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    onChange(lines);
  };

  const handleChange = (e) => {
    const next = e.target.value;
    internalChangeRef.current = true;
    setTextValue(next);
    syncToArray(next);
  };

  const handleBlur = () => {
    syncToArray(textValue);
  };

  return (
    <div className="mb-3">
      <Label>{label}</Label>
      <TextArea
        rows={4}
        value={textValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
      />
      <p className="mt-1 text-[11px] text-gray-500">
        Mỗi dòng tương ứng một bullet ở trang chi tiết sân.
      </p>
    </div>
  );
}




// ================== MAIN PAGE: OWNER CONTENT ==================

export default function OwnerContentPage() {
    const [venues, setVenues] = useState([]);
    const [selectedVenueId, setSelectedVenueId] = useState("");
    const [loadingVenues, setLoadingVenues] = useState(true);

    const [content, setContent] = useState({ ...EMPTY_CONTENT });
    const [loadingContent, setLoadingContent] = useState(false);
    const [saving, setSaving] = useState(false);

    const [uploadingSection, setUploadingSection] = useState(null);

    const [notify, setNotify] = useState({
        open: false,
        type: "success",
        message: "",
    });

    const showNotify = (type, message) => {
        setNotify({ open: true, type, message });
        setTimeout(() => {
            setNotify((prev) => ({ ...prev, open: false }));
        }, 2500);
    };

    // ---- Load danh sách sân của owner ----
    useEffect(() => {
        let cancelled = false;

        async function loadVenues() {
            setLoadingVenues(true);
            try {
                const res = await apiFetch("/owner/venues");
                const payload = Array.isArray(res?.data)
                    ? res.data
                    : Array.isArray(res)
                        ? res
                        : [];

                if (cancelled) return;

                setVenues(payload);
                if (payload.length > 0) {
                    setSelectedVenueId(payload[0]._id || payload[0].id);
                }
            } catch (err) {
                console.error("Load owner venues failed:", err);
                if (!cancelled) {
                    showNotify("error", "Không thể tải danh sách sân.");
                }
            } finally {
                if (!cancelled) setLoadingVenues(false);
            }
        }

        loadVenues();

        return () => {
            cancelled = true;
        };
    }, []);

    // ---- Load content khi chọn sân ----
    useEffect(() => {
        if (!selectedVenueId) return;

        let cancelled = false;

        async function loadContent() {
            setLoadingContent(true);
            try {
                const res = await apiFetch(`/owner/venues/${selectedVenueId}/content`);
                const payload =
                    res?.data && typeof res.data === "object"
                        ? res.data
                        : typeof res === "object"
                            ? res
                            : null;

                if (cancelled) return;

                setContent(normalizeContent(payload));
            } catch (err) {
                console.error("Load venue content failed:", err);
                if (!cancelled) {
                    showNotify(
                        "error",
                        "Không thể tải nội dung trang chi tiết sân."
                    );
                    setContent({ ...EMPTY_CONTENT });
                }
            } finally {
                if (!cancelled) setLoadingContent(false);
            }
        }

        loadContent();

        return () => {
            cancelled = true;
        };
    }, [selectedVenueId]);

    const handleFieldChange = (field, value) => {
        setContent((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleImagesChange = (field, value) => {
        setContent((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const uploadImage = async (sectionKey, file, options = {}) => {
        if (!selectedVenueId) {
            showNotify("error", "Vui lòng chọn sân trước khi upload ảnh.");
            return;
        }

        if (!file) {
            showNotify("error", "Không có file ảnh.");
            return;
        }

        try {
            setUploadingSection(sectionKey);
            const formData = new FormData();
            formData.append("image", file);
            if (options.purpose) {
                formData.append("purpose", options.purpose);
            }

            const res = await apiFetch(
                `/owner/venues/${selectedVenueId}/content/upload-image`,
                {
                    method: "POST",
                    body: formData,
                }
            );

            const url =
                res?.imageUrl ||                          // <--- THÊM
                res?.data?.imageUrl ||                    // <--- THÊM
                res?.data?.url ||
                res?.url ||
                res?.data?.path ||
                res?.path ||
                "";

            if (!url) {
                showNotify("error", "Upload ảnh thất bại, không có đường dẫn.");
                return;
            }

            if (sectionKey === "avatarImage") {
                setContent((prev) => ({ ...prev, avatarImage: url }));
            } else {
                setContent((prev) => ({
                    ...prev,
                    [sectionKey]: [...(prev[sectionKey] || []), url],
                }));
            }

            showNotify("success", "Upload ảnh thành công.");
        } catch (err) {
            console.error("Upload image failed:", err);
            showNotify("error", "Upload ảnh thất bại.");
        } finally {
            setUploadingSection(null);
        }
    };


    const handleSave = async (e) => {
        e.preventDefault();
        if (!selectedVenueId) {
            showNotify("error", "Vui lòng chọn sân trước khi lưu.");
            return;
        }

        try {
            setSaving(true);
            await apiFetch(`/owner/venues/${selectedVenueId}/content`, {
                method: "PUT",
                body: content,
            });
            showNotify("success", "Đã lưu cấu hình trang chi tiết sân.");
        } catch (err) {
            console.error("Save venue content failed:", err);
            showNotify("error", "Lưu cấu hình thất bại.");
        } finally {
            setSaving(false);
        }
    };

    const currentVenue =
        venues.find((v) => v._id === selectedVenueId || v.id === selectedVenueId) ||
        null;

    return (
        <div className="flex flex-col gap-4">
            {/* Toast notification */}
            {notify.open && (
                <div className="fixed top-20 right-6 z-40">
                    <div
                        className={`rounded-xl px-4 py-2 text-sm shadow-lg ${notify.type === "success"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                    >
                        {notify.message}
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Quản lý content trang chi tiết sân (Owner)
                    </h1>
                    <p className="text-sm text-gray-500">
                        Tùy chỉnh nội dung hiển thị ở trang chi tiết sân (hero, overview,
                        đặc điểm, tiện ích, hình ảnh...).
                    </p>
                </div>
            </div>

            {/* Chọn sân */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-800">
                            Chọn sân để cấu hình
                        </p>
                        <p className="text-xs text-gray-500">
                            Chỉ hiển thị các sân thuộc quyền sở hữu của bạn.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedVenueId}
                            disabled={loadingVenues || venues.length === 0}
                            onChange={(e) => setSelectedVenueId(e.target.value)}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {loadingVenues ? (
                                <option>Đang tải...</option>
                            ) : venues.length === 0 ? (
                                <option>Hiện chưa có sân nào</option>
                            ) : (
                                venues.map((v) => (
                                    <option key={v._id || v.id} value={v._id || v.id}>
                                        {v.name}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                </div>

                {currentVenue && (
                    <p className="text-xs text-gray-500">
                        Đang chỉnh:{` `}
                        <span className="font-medium">{currentVenue.name}</span>
                        {currentVenue.address && (
                            <>
                                {" "}
                                • <span>{currentVenue.address}</span>
                            </>
                        )}
                        {currentVenue.phone && (
                            <>
                                {" "}
                                • <span>☎ {currentVenue.phone}</span>
                            </>
                        )}
                    </p>
                )}
            </div>

            {!selectedVenueId ? (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">
                    Vui lòng chọn sân để chỉnh sửa nội dung.
                </div>
            ) : loadingContent ? (
                <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white py-10 text-center text-sm text-gray-500">
                    Đang tải nội dung trang chi tiết sân...
                </div>
            ) : (
                <form
                    onSubmit={handleSave}
                    className="mt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)] gap-5"
                >
                    {/* Cột trái: HERO + OVERVIEW */}
                    <div>
                        {/* HERO */}
                        <SectionCard title="Hero & thông tin chính">
                            <div className="mb-3">
                                <Label>Tên sân (hero title)</Label>
                                <TextInput
                                    placeholder="VD: PicklePickle Thủ Đức – Sân pickleball chuẩn giải đấu"
                                    value={content.heroTitle}
                                    onChange={(e) =>
                                        handleFieldChange("heroTitle", e.target.value)
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Description (mô tả ngắn)</Label>
                                <TextInput
                                    placeholder="VD: 4 sân tiêu chuẩn, bãi giữ xe rộng, vị trí trung tâm."
                                    value={content.heroSubtitle}
                                    onChange={(e) =>
                                        handleFieldChange("heroSubtitle", e.target.value)
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Số điện thoại hiển thị</Label>
                                <TextInput
                                    placeholder={
                                        currentVenue?.phone || "VD: 0909 xxx xxx (bỏ trống sẽ dùng số trong hồ sơ sân)"
                                    }
                                    value={content.heroPhone}
                                    onChange={(e) =>
                                        handleFieldChange("heroPhone", e.target.value)
                                    }
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Để trống sẽ hiển thị số điện thoại của chủ sân
                                </p>
                            </div>
                            <div className="mb-4">
                                <Label>Địa chỉ hiển thị</Label>
                                <TextInput
                                    placeholder={
                                        currentVenue?.address || "VD: 123 Võ Văn Ngân, Thủ Đức..."
                                    }
                                    value={content.heroAddress}
                                    onChange={(e) =>
                                        handleFieldChange("heroAddress", e.target.value)
                                    }
                                />
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Để trống sẽ hiển thị địa chỉ của sân
                                </p>
                            </div>
                            <div className="mb-4">
                                <Label>Slogan / tagline (tùy chọn)</Label>
                                <TextInput
                                    placeholder="VD: Đặt sân nhanh – Vào chơi liền!"
                                    value={content.heroTagline}
                                    onChange={(e) =>
                                        handleFieldChange("heroTagline", e.target.value)
                                    }
                                />
                            </div>

                            <AvatarEditor
                                value={content.avatarImage}
                                uploading={uploadingSection === "avatarImage"}
                                onUpload={(file) =>
                                    uploadImage("avatarImage", file, { purpose: "avatar" })
                                }
                                onClear={() => handleFieldChange("avatarImage", "")}
                            />

                            <ImagesListEditor
                                label="Ảnh hero (slider đầu trang)"
                                helperText="Các ảnh này hiển thị ở phần hero phía trên cùng trang chi tiết sân."
                                images={content.heroImages}
                                onChange={(imgs) => handleImagesChange("heroImages", imgs)}
                                onUpload={(file) =>
                                    uploadImage("heroImages", file, { purpose: "hero" })
                                }
                                uploading={uploadingSection === "heroImages"}
                            />
                        </SectionCard>

                        {/* OVERVIEW + LIST ĐẶC ĐIỂM / TIỆN ÍCH */}
                        <SectionCard title="Giới thiệu tổng quan (Overview)">
                            <div className="mb-3">
                                <Label>Tiêu đề phần tổng quan</Label>
                                <TextInput
                                    placeholder="VD: Tổng quan sân PicklePickle Thủ Đức"
                                    value={content.overviewTitle}
                                    onChange={(e) =>
                                        handleFieldChange("overviewTitle", e.target.value)
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Mô tả chi tiết (tổng quan)</Label>
                                <TextArea
                                    rows={4}
                                    placeholder="Mô tả vị trí, chất lượng mặt sân, bãi xe, phòng thay đồ, không gian xung quanh..."
                                    value={content.overviewDescription}
                                    onChange={(e) =>
                                        handleFieldChange("overviewDescription", e.target.value)
                                    }
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <MultiLineListInput
                                    label="Đặc điểm (cột trái)"
                                    value={content.featuresLeft}
                                    onChange={(lines) =>
                                        handleFieldChange("featuresLeft", lines)
                                    }
                                    placeholder={"VD:\nMặt sân nhám, độ nảy tốt\nKhông gian thoáng mát"}
                                />
                                <MultiLineListInput
                                    label="Đặc điểm (cột phải)"
                                    value={content.featuresRight}
                                    onChange={(lines) =>
                                        handleFieldChange("featuresRight", lines)
                                    }
                                    placeholder={"VD:\nCó khu vực khán đài\nHệ thống đèn LED đạt chuẩn"}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <MultiLineListInput
                                    label="Tiện ích (cột trái)"
                                    value={content.amenitiesLeft}
                                    onChange={(lines) =>
                                        handleFieldChange("amenitiesLeft", lines)
                                    }
                                    placeholder={"VD:\nBãi giữ xe miễn phí\nPhòng tắm nước nóng"}
                                />
                                <MultiLineListInput
                                    label="Tiện ích (cột phải)"
                                    value={content.amenitiesRight}
                                    onChange={(lines) =>
                                        handleFieldChange("amenitiesRight", lines)
                                    }
                                    placeholder={"VD:\nKhu vực chờ máy lạnh\nDịch vụ thuê huấn luyện viên"}
                                />
                            </div>
                        </SectionCard>
                    </div>

                    {/* Cột phải: ẢNH ĐẶC ĐIỂM + TIỆN ÍCH (không triển khai section giá) */}
                    <div>
                        <SectionCard title="Hình ảnh ĐẶC ĐIỂM (Features)">
                            <div className="mb-3">
                                <Label>Tiêu đề / mô tả ngắn (optional)</Label>
                                <TextInput
                                    placeholder="VD: Cơ sở vật chất & mặt sân"
                                    value={content.highlightTitle}
                                    onChange={(e) =>
                                        handleFieldChange("highlightTitle", e.target.value)
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Mô tả chi tiết (optional)</Label>
                                <TextArea
                                    rows={3}
                                    placeholder="VD: 4 sân tiêu chuẩn giải đấu, mặt sân acrylic, hệ thống đèn LED..."
                                    value={content.highlightDescription}
                                    onChange={(e) =>
                                        handleFieldChange("highlightDescription", e.target.value)
                                    }
                                />
                            </div>

                            <ImagesListEditor
                                label="Ảnh đặc điểm (feature images)"
                                helperText="Ảnh mặt sân, khu vực thi đấu, khán đài..."
                                images={content.highlightImages}
                                onChange={(imgs) =>
                                    handleImagesChange("highlightImages", imgs)
                                }
                                onUpload={(file) =>
                                    uploadImage("highlightImages", file, {
                                        purpose: "highlight",
                                    })
                                }
                                uploading={uploadingSection === "highlightImages"}
                            />
                        </SectionCard>

                        <SectionCard title="Hình ảnh TIỆN ÍCH (Amenities)">
                            <div className="mb-3">
                                <Label>Tiêu đề / mô tả ngắn (optional)</Label>
                                <TextInput
                                    placeholder="VD: Tiện ích & dịch vụ đi kèm"
                                    value={content.amenityTitle}
                                    onChange={(e) =>
                                        handleFieldChange("amenityTitle", e.target.value)
                                    }
                                />
                            </div>
                            <div className="mb-3">
                                <Label>Mô tả chi tiết (optional)</Label>
                                <TextArea
                                    rows={3}
                                    placeholder="VD: Bãi giữ xe, phòng tắm, khu chờ, dịch vụ nước uống..."
                                    value={content.amenityDescription}
                                    onChange={(e) =>
                                        handleFieldChange("amenityDescription", e.target.value)
                                    }
                                />
                            </div>

                            <ImagesListEditor
                                label="Ảnh tiện ích (amenity images)"
                                helperText="Ảnh quầy nước, phòng tắm, khu chờ, bãi xe, khu vực dịch vụ..."
                                images={content.amenityImages}
                                onChange={(imgs) =>
                                    handleImagesChange("amenityImages", imgs)
                                }
                                onUpload={(file) =>
                                    uploadImage("amenityImages", file, {
                                        purpose: "amenity",
                                    })
                                }
                                uploading={uploadingSection === "amenityImages"}
                            />
                        </SectionCard>

                        {/* KHÔNG RENDER phần PRICING cho owner */}
                    </div>

                    {/* Footer buttons */}
                    <div className="xl:col-span-2 flex justify-end mt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center rounded-xl bg-sky-600 px-5 h-10 text-sm font-semibold text-white hover:bg-sky-700 disabled:bg-gray-400"
                        >
                            {saving ? "Đang lưu..." : "Lưu cấu hình trang chi tiết sân"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
