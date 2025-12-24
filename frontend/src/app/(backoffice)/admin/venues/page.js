"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { apiFetch } from "../../../../lib/apiClient";


const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

function resolveImageUrl(url) {
  if (!url) return "";

  // Đã là full URL thì giữ nguyên
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("//")) return url;

  // Backend đang serve static ở prefix /uploads
  // nên FE chỉ cần ghép API_BASE + url
  return `${API_BASE}${url}`;
}


// ====== MOCK (FALLBACK KHI API LỖI) ======
const MOCK_OWNERS = [
  {
    id: "owner-1",
    fullName: "Nguyễn Văn A",
    email: "owner.a@picklepickle.vn",
    phone: "0909000001",
    venuesCount: 3,
    status: "active", // active | pending | inactive
    createdAt: "2025-02-10T08:30:00.000Z",
  },
  {
    id: "owner-2",
    fullName: "Trần Thị B",
    email: "owner.b@picklepickle.vn",
    phone: "0909000002",
    venuesCount: 1,
    status: "pending",
    createdAt: "2025-02-05T10:00:00.000Z",
  },
  {
    id: "owner-3",
    fullName: "Lê Văn C",
    email: "owner.c@picklepickle.vn",
    phone: "0909000003",
    venuesCount: 0,
    status: "inactive",
    createdAt: "2025-01-28T09:15:00.000Z",
  },
];

const MOCK_VENUES = [
  {
    id: "venue-1",
    name: "PicklePickle Thủ Đức",
    ownerId: "owner-1",
    ownerName: "Nguyễn Văn A",
    address: "123 Võ Văn Ngân, Thủ Đức, TP.HCM",
    images: ["/courts/demo-court-1.jpg", "/courts/demo-court-2.jpg"],
    openTime: "05:00",
    closeTime: "22:00",
    priceRules: [
      { id: "pr-1", startTime: "05:00", endTime: "17:00", price: 120000 },
      { id: "pr-2", startTime: "17:00", endTime: "22:00", price: 150000 },
    ],
    status: "active",
    createdAt: "2025-02-08T07:20:00.000Z",
  },
  {
    id: "venue-2",
    name: "PicklePickle Quận 1",
    ownerId: "owner-2",
    ownerName: "Trần Thị B",
    address: "45 Lê Lợi, Quận 1, TP.HCM",
    images: ["/courts/demo-court-3.jpg"],
    openTime: "06:00",
    closeTime: "23:00",
    priceRules: [
      { id: "pr-3", startTime: "06:00", endTime: "18:00", price: 180000 },
      { id: "pr-4", startTime: "18:00", endTime: "23:00", price: 220000 },
    ],
    status: "pending",
    createdAt: "2025-02-12T09:45:00.000Z",
  },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];

const CREATED_SORT_OPTIONS = [
  { value: "DESC", label: "Ngày tạo: Mới nhất" },
  { value: "ASC", label: "Ngày tạo: Cũ nhất" },
];

// ====== UTILS ======
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function SimpleStatusBadge({ status }) {
  const map = {
    active: {
      label: "Active",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    pending: {
      label: "Pending",
      cls: "bg-amber-50 text-amber-700 border-amber-100",
    },
    inactive: {
      label: "Inactive",
      cls: "bg-red-50 text-red-600 border-red-100",
    },
  };

  const cfg =
    map[status] || {
      label: "Unknown",
      cls: "bg-gray-50 text-gray-600 border-gray-100",
    };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cfg.cls}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

function TabButton({ label, isActive, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-xs md:text-sm font-medium border-b-2 ${isActive
        ? "border-[#1677ff] text-[#1677ff]"
        : "border-transparent text-gray-500 hover:text-gray-800"
        }`}
    >
      {label}
    </button>
  );
}

// Popup notify đơn giản (success / error)
function NotifyPopup({ open, type = "success", title, message, onClose }) {
  if (!open) return null;

  const isSuccess = type === "success";
  const color = isSuccess ? "text-emerald-600" : "text-red-600";
  const iconBg = isSuccess ? "bg-emerald-100" : "bg-red-100";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full ${iconBg}`}
          >
            <span className={`text-lg ${color}`}>{isSuccess ? "✓" : "!"}</span>
          </div>
          <div className="flex-1">
            <h3 className={`text-sm font-semibold ${color}`}>
              {title || (isSuccess ? "Thành công" : "Có lỗi xảy ra")}
            </h3>
            {message && (
              <p className="mt-1 text-xs text-gray-600 whitespace-pre-line">
                {message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-[#1677ff] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#145fcc]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-gray-900">
          {title || "Xác nhận"}
        </h3>
        {message && (
          <p className="mt-2 text-xs text-gray-600 whitespace-pre-line">
            {message}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-[#1677ff] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#145fcc]"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

// ====== HÀM MAP DỮ LIỆU TỪ API -> UI ======
function normalizeOwner(raw) {
  if (!raw) return null;

  const id = raw.id || raw._id;
  const venuesCount =
    raw.venuesCount ??
    raw.totalVenues ??
    (Array.isArray(raw.venues) ? raw.venues.length : 0) ??
    0;

  let status = raw.status;
  if (!status) {
    if (raw.isActive === false) status = "inactive";
    else if (raw.isActive === true) status = "active";
    else status = "pending";
  }

  return {
    id,
    fullName: raw.fullName || raw.name || "",
    email: raw.email || "",
    phone: raw.phone || "",
    address: raw.address || "",
    venuesCount,
    status: status.toLowerCase(),
    createdAt: raw.createdAt,
  };
}

function normalizeVenue(raw) {
  if (!raw) return null;

  const id = raw.id || raw._id;


  // Ưu tiên các field manager* do BE trả về từ mapVenue()
  const owner =
    raw.owner ||
    raw.manager ||
    raw.ownerInfo ||
    (raw.ownerName && { id: raw.ownerId, fullName: raw.ownerName }) ||
    (raw.managerName && { id: raw.managerId, fullName: raw.managerName });

  let status = raw.status;
  if (!status) {
    if (raw.isActive === false) status = "inactive";
    else if (raw.isActive === true) status = "active";
    else status = "pending";
  }

  return {
    id,
    name: raw.name || "",
    ownerId: owner?._id || owner?.id || raw.ownerId || raw.managerId || "",
    ownerName:
      owner?.fullName ||
      owner?.name ||
      raw.ownerName ||
      raw.managerName ||
      "",
    address: raw.address || "",
    courtsCount: Number(raw.courtsCount) || 1,
    images: raw.images || raw.photos || [],
    avatarImage: raw.avatarImage || (raw.images && raw.images[0]?.url) || "",
    openTime: raw.openTime || raw.openHour || "05:00",
    closeTime: raw.closeTime || raw.closeHour || "22:00",
    // nếu BE chưa trả priceRules thì vẫn để mảng rỗng
    priceRules: raw.priceRules || [],
    basePricePerHour: raw.basePricePerHour || 0,
    status: status.toLowerCase(),
    createdAt: raw.createdAt,
  };
}



// ====== MAIN PAGE ======
export default function AdminVenuesPage() {
  const [activeTab, setActiveTab] = useState("owners"); // owners | venues

  // Notify popup
  const [notify, setNotify] = useState({
    open: false,
    type: "success",
    title: "",
    message: "",
  });
  // Confirm dialog (delete owner / venue)
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const openConfirm = ({ title, message, onConfirm }) => {
    setConfirmDialog({
      open: true,
      title: title || "Xác nhận",
      message: message || "",
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const showNotify = (payload) => {
    setNotify({
      open: true,
      type: payload.type || "success",
      title: payload.title || "",
      message: payload.message || "",
    });
  };

  // ====== OWNER STATE ======
  const [owners, setOwners] = useState([]);
  const [isLoadingOwners, setIsLoadingOwners] = useState(false);

  const [ownerStatusFilter, setOwnerStatusFilter] = useState("all");
  const [ownerCreatedSort, setOwnerCreatedSort] = useState("DESC");
  const [ownerSearch, setOwnerSearch] = useState("");

  const [isOwnerFormOpen, setIsOwnerFormOpen] = useState(false);
  const [ownerFormMode, setOwnerFormMode] = useState("create"); // create | edit
  const [editingOwner, setEditingOwner] = useState(null);
  const [ownerFormValues, setOwnerFormValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    password: "",
    confirmPassword: "",
  });

  // ====== VENUE STATE ======
  const [venues, setVenues] = useState([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(false);

  const [venueStatusFilter, setVenueStatusFilter] = useState("all");
  const [venueCreatedSort, setVenueCreatedSort] = useState("DESC");
  const [venueSearch, setVenueSearch] = useState("");

  const [isVenueFormOpen, setIsVenueFormOpen] = useState(false);
  const [venueFormMode, setVenueFormMode] = useState("create"); // create | edit
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueFormValues, setVenueFormValues] = useState({
    name: "",
    ownerId: "",
    address: "",
    images: [],
    newImageUrl: "",
    openTime: "05:00",
    closeTime: "22:00",
    priceRules: [],
    status: "active",
    courtsCount: 1,
  });

  // ====== CALL API LOAD LIST ======
  async function loadOwners() {
    setIsLoadingOwners(true);
    try {
      const res = await apiFetch("/admin/owners", {
        method: "GET",
      });

      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];

      const mapped = list
        .map(normalizeOwner)
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

      setOwners(mapped);
    } catch (err) {
      console.error("Error loading owners:", err);
      // fallback mock để UI còn thấy được
      setOwners(MOCK_OWNERS);
      showNotify({
        type: "error",
        title: "Lỗi tải danh sách chủ sân",
        message:
          err?.message ||
          "Không tải được danh sách chủ sân. Đang hiển thị dữ liệu mock.",
      });
    } finally {
      setIsLoadingOwners(false);
    }
  }

  async function loadVenues() {
    setIsLoadingVenues(true);
    try {
      const res = await apiFetch("/admin/venues", {
        method: "GET",
      });

      const list = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
            ? res.items
            : [];

      const mapped = list
        .map(normalizeVenue)
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

      setVenues(mapped);
    } catch (err) {
      console.error("Error loading venues:", err);
      setVenues(MOCK_VENUES);
      showNotify({
        type: "error",
        title: "Lỗi tải danh sách sân",
        message:
          err?.message ||
          "Không tải được danh sách sân. Đang hiển thị dữ liệu mock.",
      });
    } finally {
      setIsLoadingVenues(false);
    }
  }

  useEffect(() => {
    loadOwners();
    loadVenues();
  }, []);

  // ====== OWNER LOGIC ======
  const filteredOwners = useMemo(() => {
    let result = [...owners];

    if (ownerStatusFilter !== "all") {
      result = result.filter(
        (o) => o.status.toLowerCase() === ownerStatusFilter.toLowerCase()
      );
    }

    if (ownerSearch.trim()) {
      const q = ownerSearch.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.fullName.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      if (ownerCreatedSort === "ASC") return da - db;
      return db - da;
    });

    return result;
  }, [owners, ownerStatusFilter, ownerCreatedSort, ownerSearch]);

  function openCreateOwnerForm() {
    setOwnerFormMode("create");
    setEditingOwner(null);
    setOwnerFormValues({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
      password: "",
      confirmPassword: "",
    });
    setIsOwnerFormOpen(true);
  }

  function openEditOwnerForm(owner) {
    setOwnerFormMode("edit");
    setEditingOwner(owner);
    setOwnerFormValues({
      fullName: owner.fullName || "",
      email: owner.email || "",
      phone: owner.phone || "",
      address: owner.address || "",
      status: owner.status || "active",
      password: "",
      confirmPassword: "",
    });
    setIsOwnerFormOpen(true);
  }

  function handleOwnerFormChange(field, value) {
    setOwnerFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmitOwnerForm(e) {
    e.preventDefault();

    if (
      ownerFormValues.password &&
      ownerFormValues.password !== ownerFormValues.confirmPassword
    ) {
      showNotify({
        type: "error",
        title: "Mật khẩu không khớp",
        message: "Mật khẩu và xác nhận mật khẩu phải giống nhau.",
      });
      return;
    }

    const payload = {
      fullName: ownerFormValues.fullName,
      email: ownerFormValues.email,
      phone: ownerFormValues.phone,
      address: ownerFormValues.address,
      status: ownerFormValues.status,
    };

    if (ownerFormValues.password) {
      payload.password = ownerFormValues.password;
    }

    try {
      if (ownerFormMode === "create") {
        const res = await apiFetch("/admin/owners", {
          method: "POST",
          body: payload,
        });

        const createdRaw = res?.data || res;
        const created = normalizeOwner(createdRaw);

        setOwners((prev) => (created ? [created, ...prev] : prev));

        showNotify({
          type: "success",
          title: "Thêm chủ sân",
          message: "Đã tạo chủ sân mới thành công.",
        });
      } else if (ownerFormMode === "edit" && editingOwner) {
        const ownerId = editingOwner.id;
        const res = await apiFetch(`/admin/owners/${ownerId}`, {
          method: "PUT",
          body: payload,
        });

        const updatedRaw = res?.data || res;
        const updated = normalizeOwner(updatedRaw) || {
          ...editingOwner,
          ...ownerFormValues,
        };

        setOwners((prev) =>
          prev.map((o) => (o.id === ownerId ? updated : o))
        );

        showNotify({
          type: "success",
          title: "Cập nhật chủ sân",
          message: "Đã cập nhật thông tin chủ sân thành công.",
        });
      }

      setIsOwnerFormOpen(false);
    } catch (err) {
      console.error("Error submit owner:", err);
      showNotify({
        type: "error",
        title:
          ownerFormMode === "create"
            ? "Lỗi tạo chủ sân"
            : "Lỗi cập nhật chủ sân",
        message:
          err?.message ||
          "Có lỗi khi gửi dữ liệu lên server. Vui lòng thử lại.",
      });
    }
  }

  function handleDeleteOwner(owner) {
    openConfirm({
      title: "Xóa chủ sân",
      message: `Bạn có chắc muốn xóa chủ sân "${owner.fullName}"?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/owners/${owner.id}`, {
            method: "DELETE",
          });

          setOwners((prev) => prev.filter((o) => o.id !== owner.id));
          showNotify({
            type: "success",
            title: "Xóa chủ sân",
            message: "Đã xóa chủ sân khỏi hệ thống.",
          });
        } catch (err) {
          console.error("Error delete owner:", err);
          showNotify({
            type: "error",
            title: "Lỗi xóa chủ sân",
            message:
              err?.message || "Không xóa được chủ sân. Vui lòng thử lại.",
          });
        } finally {
          closeConfirm();
        }
      },
    });
  }

  // ====== VENUE LOGIC ======
  const filteredVenues = useMemo(() => {
    let result = [...venues];

    if (venueStatusFilter !== "all") {
      result = result.filter(
        (v) => v.status.toLowerCase() === venueStatusFilter.toLowerCase()
      );
    }

    if (venueSearch.trim()) {
      const q = venueSearch.trim().toLowerCase();
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.address.toLowerCase().includes(q) ||
          v.ownerName.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      if (venueCreatedSort === "ASC") return da - db;
      return db - da;
    });

    return result;
  }, [venues, venueStatusFilter, venueCreatedSort, venueSearch]);

  function openCreateVenueForm() {
    setVenueFormMode("create");
    setEditingVenue(null);
    setVenueFormValues({
      name: "",
      ownerId: owners[0]?.id || "",
      address: "",
      avatarImage: "",
      images: [],
      newImageUrl: "",
      openTime: "05:00",
      closeTime: "22:00",
      priceRules: [],
      status: "active",
      courtsCount: 1,
    });
    setIsVenueFormOpen(true);
  }

  async function openEditVenueForm(venue) {
    // 1) Set state cơ bản từ list
    setVenueFormMode("edit");
    setEditingVenue(venue);
    setVenueFormValues({
      name: venue.name || "",
      ownerId: venue.ownerId || owners[0]?.id || "",
      address: venue.address || "",
      avatarImage: venue.avatarImage || "",
      images: venue.images || [],
      newImageUrl: "",
      openTime: venue.openTime || "05:00",
      closeTime: venue.closeTime || "22:00",
      priceRules: venue.priceRules || [],
      status: venue.status || "active",
      courtsCount: venue.courtsCount ?? 1,

    });
    setIsVenueFormOpen(true);

    // 2) Gọi API lấy CONFIG (openTime / closeTime / priceRules) cho admin
    try {
      const res = await apiFetch(`/admin/venues/${venue.id}/config`, {
        method: "GET",
      });
      const data = res?.data || res;

      if (data) {
        setVenueFormValues((prev) => ({
          ...prev,
          openTime: data.openTime || prev.openTime,
          closeTime: data.closeTime || prev.closeTime,
          priceRules: Array.isArray(data.priceRules)
            ? data.priceRules
            : prev.priceRules,
        }));
      }
    } catch (err) {
      console.error("Failed to load venue config for admin:", err);
      // Có thể show toast nhẹ nếu muốn, nhưng không bắt buộc
    }
  }


  function handleVenueFormChange(field, value) {
    setVenueFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleAddVenueImage() {
    const url = venueFormValues.newImageUrl.trim();
    if (!url) return;
    setVenueFormValues((prev) => ({
      ...prev,
      images: [...(prev.images || []), url],
      newImageUrl: "",
    }));
  }

  function handleRemoveVenueImage(idx) {
    setVenueFormValues((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  }

  function handleAddPriceRule() {
    setVenueFormValues((prev) => ({
      ...prev,
      priceRules: [
        ...(prev.priceRules || []),
        {
          id: `pr-${Date.now()}`,
          startTime: prev.openTime || "05:00",
          endTime: prev.closeTime || "22:00",
          price: 100000,
        },
      ],
    }));
  }

  function handleChangePriceRule(idx, field, value) {
    setVenueFormValues((prev) => {
      const next = [...(prev.priceRules || [])];
      const item = {
        ...next[idx],
        [field]: field === "price" ? Number(value || 0) : value,
      };
      next[idx] = item;
      return {
        ...prev,
        priceRules: next,
      };
    });
  }

  function handleRemovePriceRule(idx) {
    setVenueFormValues((prev) => ({
      ...prev,
      priceRules: prev.priceRules.filter((_, i) => i !== idx),
    }));
  }

  function getVenuePriceSummary(venue) {
    // 1) Ưu tiên lấy từ priceRules: MỨC GIÁ ĐẦU TIÊN
    if (Array.isArray(venue.priceRules) && venue.priceRules.length > 0) {
      const first = venue.priceRules[0];

      const price = Number(
        first.price ??
        first.pricePerHour ??
        first.basePricePerHour ??
        first.fixedPricePerHour ??
        first.walkinPricePerHour
      );

      if (!Number.isNaN(price) && price > 0) {
        return `${price.toLocaleString("vi-VN")}đ/giờ`;
      }
    }

    // 2) Fallback: dùng basePricePerHour nếu BE chỉ trả về field này
    if (venue.basePricePerHour != null) {
      const base = Number(venue.basePricePerHour);
      if (!Number.isNaN(base) && base > 0) {
        return `${base.toLocaleString("vi-VN")}đ/giờ`;
      }
    }

    // 3) Không có dữ liệu giá
    return "-";
  }



  async function handleSubmitVenueForm(e) {
    e.preventDefault();

    const owner = owners.find((o) => o.id === venueFormValues.ownerId);
    const ownerName = owner?.fullName || "Chưa rõ chủ sân";

    // Payload meta cho Venue (không chứa config)
    const metaPayload = {
      name: venueFormValues.name,
      managerId: venueFormValues.ownerId,
      address: venueFormValues.address,
      avatarImage: venueFormValues.avatarImage || "",
      images: venueFormValues.images || [],
      status: venueFormValues.status,
      courtsCount: Number(venueFormValues.courtsCount) || 1,

    };

    // Payload config: openTime / closeTime / priceRules
    const configPayload = {
      openTime: venueFormValues.openTime || "05:00",
      closeTime: venueFormValues.closeTime || "22:00",
      priceRules: venueFormValues.priceRules || [],
    };

    try {
      if (venueFormMode === "create") {
        // 1) Tạo venue
        const res = await apiFetch("/admin/venues", {
          method: "POST",
          body: metaPayload,
        });

        const createdRaw = res?.data || res;
        const venueId = createdRaw?.id || createdRaw?._id;

        // 2) Lưu config (openHours + priceRules) cho venue vừa tạo
        let cfg = null;
        if (venueId) {
          const cfgRes = await apiFetch(`/admin/venues/${venueId}/config`, {
            method: "PUT",
            body: configPayload,
          });
          cfg = cfgRes?.data || cfgRes;
        }

        const createdNorm =
          normalizeVenue({
            ...createdRaw,
            openTime: cfg?.openTime ?? configPayload.openTime,
            closeTime: cfg?.closeTime ?? configPayload.closeTime,
            priceRules: cfg?.priceRules ?? configPayload.priceRules,
          }) || {
            id: venueId,
            ownerName,
            ...metaPayload,
            ...configPayload,
            createdAt: createdRaw?.createdAt || new Date().toISOString(),
          };

        setVenues((prev) => [createdNorm, ...prev]);
        showNotify({
          type: "success",
          title: "Thêm sân / venue",
          message: "Đã tạo sân mới thành công.",
        });
      } else if (venueFormMode === "edit" && editingVenue) {
        const venueId = editingVenue.id;

        // 1) Update meta venue
        const res = await apiFetch(`/admin/venues/${venueId}`, {
          method: "PUT",
          body: metaPayload,
        });
        const updatedRaw = res?.data || res;

        // 2) Update config
        const cfgRes = await apiFetch(`/admin/venues/${venueId}/config`, {
          method: "PUT",
          body: configPayload,
        });
        const cfg = cfgRes?.data || cfgRes;

        const updatedNorm =
          normalizeVenue({
            ...editingVenue,
            ...updatedRaw,
            openTime: cfg?.openTime ?? configPayload.openTime,
            closeTime: cfg?.closeTime ?? configPayload.closeTime,
            priceRules: cfg?.priceRules ?? configPayload.priceRules,
          }) || {
            ...editingVenue,
            ownerName,
            ...metaPayload,
            ...configPayload,
          };

        setVenues((prev) =>
          prev.map((v) => (v.id === venueId ? updatedNorm : v))
        );

        showNotify({
          type: "success",
          title: "Cập nhật sân",
          message: "Đã cập nhật cấu hình sân thành công.",
        });
      }

      setIsVenueFormOpen(false);
    } catch (err) {
      console.error("Error submit venue:", err);
      showNotify({
        type: "error",
        title:
          venueFormMode === "create" ? "Lỗi tạo sân" : "Lỗi cập nhật sân",
        message:
          err?.message ||
          "Có lỗi khi gửi dữ liệu sân lên server. Vui lòng thử lại.",
      });
    }
  }


  function handleDeleteVenue(venue) {
    openConfirm({
      title: "Xóa sân / venue",
      message: `Bạn có chắc muốn xóa sân "${venue.name}"?`,
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/venues/${venue.id}`, {
            method: "DELETE",
          });

          setVenues((prev) => prev.filter((v) => v.id !== venue.id));
          showNotify({
            type: "success",
            title: "Xóa sân",
            message: "Đã xóa sân khỏi hệ thống.",
          });
        } catch (err) {
          console.error("Error delete venue:", err);
          showNotify({
            type: "error",
            title: "Lỗi xóa sân",
            message: err?.message || "Không xóa được sân. Vui lòng thử lại.",
          });
        } finally {
          closeConfirm();
        }
      },
    });
  }

  // ====== RENDER ======
  return (
    <div className="space-y-6 text-black">
      {/* Breadcrumb + title */}
      <div>
        <nav className="mb-2 text-[11px] text-gray-500">
          <span>Admin</span>
          <span className="mx-1">/</span>
          <span className="text-gray-700">Quản lý sân &amp; chủ sân</span>
        </nav>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          Quản lý sân &amp; nhà cung cấp
        </h1>
        <p className="mt-1 text-xs md:text-sm text-gray-500 max-w-2xl">
          Admin có thể quản lý danh sách <strong>chủ sân</strong> và{" "}
          <strong>các sân / venue</strong> trên toàn nền tảng. Giao diện chia 2
          tab để chuyển nhanh giữa 2 nhóm dữ liệu.
        </p>
      </div>

      {/* CARD + TABS */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-4 md:px-6">
          <TabButton
            label="Chủ sân"
            isActive={activeTab === "owners"}
            onClick={() => setActiveTab("owners")}
          />
          <TabButton
            label="Sân / Venue"
            isActive={activeTab === "venues"}
            onClick={() => setActiveTab("venues")}
          />
        </div>

        {activeTab === "owners" ? (
          <OwnersTabContent
            owners={filteredOwners}
            isLoading={isLoadingOwners}
            statusFilter={ownerStatusFilter}
            setStatusFilter={setOwnerStatusFilter}
            createdSort={ownerCreatedSort}
            setCreatedSort={setOwnerCreatedSort}
            search={ownerSearch}
            setSearch={setOwnerSearch}
            onCreate={openCreateOwnerForm}
            onEdit={openEditOwnerForm}
            onDelete={handleDeleteOwner}
          />
        ) : (
          <VenuesTabContent
            venues={filteredVenues}
            owners={owners}
            isLoading={isLoadingVenues}
            statusFilter={venueStatusFilter}
            setStatusFilter={setVenueStatusFilter}
            createdSort={venueCreatedSort}
            setCreatedSort={setVenueCreatedSort}
            search={venueSearch}
            setSearch={setVenueSearch}
            onCreate={openCreateVenueForm}
            onEdit={openEditVenueForm}
            onDelete={handleDeleteVenue}
            getPriceSummary={getVenuePriceSummary}
          />
        )}
      </section>

      {/* FORM OWNER */}
      {isOwnerFormOpen && (
        <OwnerFormDialog
          mode={ownerFormMode}
          values={ownerFormValues}
          onChange={handleOwnerFormChange}
          onClose={() => setIsOwnerFormOpen(false)}
          onSubmit={handleSubmitOwnerForm}
        />
      )}

      {/* FORM VENUE */}
      {isVenueFormOpen && (
        <VenueFormDialog
          mode={venueFormMode}
          owners={owners}
          values={venueFormValues}
          onChange={handleVenueFormChange}
          onClose={() => setIsVenueFormOpen(false)}
          onSubmit={handleSubmitVenueForm}
          onAddImage={handleAddVenueImage}
          onRemoveImage={handleRemoveVenueImage}
          onAddPriceRule={handleAddPriceRule}
          onChangePriceRule={handleChangePriceRule}
          onRemovePriceRule={handleRemovePriceRule}
          venueId={editingVenue?.id || null}
        />
      )}

      {/* Popup notify */}
      <NotifyPopup
        open={notify.open}
        type={notify.type}
        title={notify.title}
        message={notify.message}
        onClose={() => setNotify((prev) => ({ ...prev, open: false }))}
      />
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onCancel={closeConfirm}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
        }}
      />
    </div>
  );
}

// ====== TAB CONTENT: OWNERS ======
function OwnersTabContent({
  owners,
  isLoading,
  statusFilter,
  setStatusFilter,
  createdSort,
  setCreatedSort,
  search,
  setSearch,
  onCreate,
  onEdit,
  onDelete,
}) {
  return (
    <div className="px-4 md:px-6 py-5 space-y-4">
      {/* Header + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            Bảng quản lý chủ sân
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            CRUD chủ sân tương tự trang quản lý user: tạo tài khoản, khóa / mở
            tài khoản, cập nhật thông tin liên hệ.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-md bg-[#1890ff] px-4 py-2 text-xs md:text-sm font-medium text-white hover:bg-[#1677d4]"
        >
          + Thêm chủ sân
        </button>
      </div>

      {/* Filter row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs md:text-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs md:text-sm text-gray-900"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Created sort */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Ngày tạo</span>
            <select
              value={createdSort}
              onChange={(e) => setCreatedSort(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs md:text-sm text-gray-900"
            >
              {CREATED_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <span className="absolute left-2 top-1/2 -translate-y-1/2">
              <Image
                src="/searchIcon1.svg"
                alt="Tìm kiếm"
                width={14}
                height={14}
              />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, SĐT chủ sân..."
              className="w-full md:w-64 pl-7 pr-3 py-1.5 rounded border border-gray-200 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-700">
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                STT
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Chủ sân
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Email
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Số điện thoại
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Số sân đang quản lý
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Ngày tạo
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Trạng thái
              </th>
              <th className="px-4 py-2 text-right font-medium border-b border-gray-100">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-xs text-gray-400"
                >
                  Đang tải dữ liệu chủ sân...
                </td>
              </tr>
            ) : owners.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-xs text-gray-400"
                >
                  Chưa có chủ sân nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              owners.map((owner, idx) => (
                <tr
                  key={owner.id || `${owner.email}-${idx}`}
                  className="border-b border-gray-50 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-2 text-[11px] text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2 text-xs font-medium text-[#1677ff]">
                    {owner.fullName}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {owner.email}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {owner.phone || "-"}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {owner.venuesCount ?? 0}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-600">
                    {formatDate(owner.createdAt)}
                  </td>
                  <td className="px-4 py-2">
                    <SimpleStatusBadge status={owner.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(owner)}
                      className="text-[11px] font-medium text-[#1677ff] hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(owner)}
                      className="text-[11px] font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====== TAB CONTENT: VENUES ======
function VenuesTabContent({
  venues,
  owners,
  isLoading,
  statusFilter,
  setStatusFilter,
  createdSort,
  setCreatedSort,
  search,
  setSearch,
  onCreate,
  onEdit,
  onDelete,
  getPriceSummary,
}) {
  return (
    <div className="px-4 md:px-6 py-5 space-y-4">
      {/* Header + actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-gray-900">
            Bảng quản lý sân / venue
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            CRUD sân với đầy đủ cấu hình cơ bản: tên sân, địa chỉ, chủ sở hữu,
            danh sách ảnh, khung giờ hoạt động và bảng giá theo khung giờ.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center rounded-md bg-[#1890ff] px-4 py-2 text-xs md:text-sm font-medium text-white hover:bg-[#1677d4]"
        >
          + Thêm sân / venue
        </button>
      </div>

      {/* Filter row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs md:text-sm">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Trạng thái</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs md:text-sm text-gray-900"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Created sort */}
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Ngày tạo</span>
            <select
              value={createdSort}
              onChange={(e) => setCreatedSort(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 text-xs md:text-sm text-gray-900"
            >
              {CREATED_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <span className="absolute left-2 top-1/2 -translate-y-1/2">
              <Image
                src="/searchIcon1.svg"
                alt="Tìm kiếm"
                width={14}
                height={14}
              />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên sân, địa chỉ, chủ sân..."
              className="w-full md:w-72 pl-7 pr-3 py-1.5 rounded border border-gray-200 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 text-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs md:text-sm">
          <thead className="bg-gray-50">
            <tr className="text-gray-700">
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                STT
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Tên sân
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Chủ sân
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Địa chỉ
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Khung giờ
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Bảng giá
              </th>
              <th className="px-4 py-2 text-left font-medium border-b border-gray-100">
                Trạng thái
              </th>
              <th className="px-4 py-2 text-right font-medium border-b border-gray-100">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-xs text-gray-400"
                >
                  Đang tải dữ liệu sân / venue...
                </td>
              </tr>
            ) : venues.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-xs text-gray-400"
                >
                  Chưa có sân / venue nào phù hợp với bộ lọc.
                </td>
              </tr>
            ) : (
              venues.map((venue, idx) => (
                <tr
                  key={venue.id || `${venue.name}-${idx}`}
                  className="border-b border-gray-50 hover:bg-gray-50/60"
                >
                  <td className="px-4 py-2 text-[11px] text-gray-500">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-2 text-xs font-medium text-[#1677ff]">
                    {venue.name}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {venue.ownerName}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700 max-w-xs">
                    <span className="line-clamp-2">{venue.address}</span>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {venue.openTime} - {venue.closeTime}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-700">
                    {getPriceSummary(venue)}
                  </td>
                  <td className="px-4 py-2">
                    <SimpleStatusBadge status={venue.status} />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onEdit(venue)}
                      className="text-[11px] font-medium text-[#1677ff] hover:underline mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(venue)}
                      className="text-[11px] font-medium text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ====== DIALOG: OWNER FORM ======
function OwnerFormDialog({ mode, values, onChange, onClose, onSubmit }) {
  const title =
    mode === "create" ? "Thêm chủ sân mới" : "Chỉnh sửa thông tin chủ sân";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <form onSubmit={onSubmit} className="p-5 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">
            {title}
          </h3>


          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Họ tên chủ sân
              </label>
              <input
                type="text"
                required
                value={values.fullName}
                onChange={(e) => onChange("fullName", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={values.email}
                  onChange={(e) => onChange("email", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={values.phone}
                  onChange={(e) => onChange("phone", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Địa chỉ (optional)
              </label>
              <input
                type="text"
                value={values.address}
                onChange={(e) => onChange("address", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Mật khẩu 
                </label>
                <input
                  type="password"
                  value={values.password}
                  onChange={(e) => onChange("password", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Xác nhận mật khẩu
                </label>
                <input
                  type="password"
                  value={values.confirmPassword}
                  onChange={(e) => onChange("confirmPassword", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Trạng thái
              </label>
              <select
                value={values.status}
                onChange={(e) => onChange("status", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#1890ff] px-6 py-2 text-sm font-medium text-white hover:bg-[#1677d4]"
            >
              {mode === "create" ? "Thêm chủ sân" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ====== DIALOG: VENUE FORM ======
function VenueFormDialog({
  mode,
  owners,
  values,
  onChange,
  onClose,
  onSubmit,
  onAddImage,
  onRemoveImage,
  onAddPriceRule,
  onChangePriceRule,
  onRemovePriceRule,
  venueId,              // <-- nhận thêm prop này
}) {
  const title =
    mode === "create" ? "Thêm sân / venue mới" : "Chỉnh sửa thông tin sân / venue";

  // ====== UPLOAD AVATAR STATE ======
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const canUploadAvatar = !!venueId; // chỉ upload được khi đã có venueId

  async function handleAvatarFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!venueId) {
      setAvatarError("Hãy lưu sân trước, sau đó mở lại để upload avatar.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file); // field name giống backend content

    setAvatarError("");
    setUploadingAvatar(true);

    try {
      const res = await apiFetch(
        `/admin/venues/${venueId}/content/upload-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      const url =
        res?.imageUrl ||
        res?.data?.imageUrl ||
        res?.data?.url ||
        res?.url ||
        res?.data?.path ||
        res?.path ||
        "";

      if (!url) {
        setAvatarError("Server không trả về URL ảnh. Kiểm tra lại API upload.");
        return;
      }

      onChange("avatarImage", url);
    } catch (err) {
      console.error("Upload avatar error:", err);
      setAvatarError(
        err?.message || "Upload avatar thất bại. Vui lòng thử lại."
      );
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit} className="p-5 md:p-6 space-y-5">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-gray-900">
              {title}
            </h3>

          </div>

          {/* Thông tin cơ bản */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-gray-500">
              Thông tin sân
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Tên sân / venue
                </label>
                <input
                  type="text"
                  required
                  value={values.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Chủ sân
                </label>
                <select
                  value={values.ownerId}
                  onChange={(e) => onChange("ownerId", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {owners.length === 0 ? (
                    <option value="">Chưa có chủ sân</option>
                  ) : (
                    owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.fullName} ({o.email})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Số lượng sân con
              </label>
              <input
                type="number"
                min={1}
                step={1}
                value={values.courtsCount ?? 1}
                onChange={(e) => onChange("courtsCount", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>


            <div>
              <label className="mb-1 block text-sm font-medium text-gray-800">
                Địa chỉ sân
              </label>
              <textarea
                rows={2}
                value={values.address}
                onChange={(e) => onChange("address", e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Giờ mở cửa
                </label>
                <input
                  type="time"
                  value={values.openTime}
                  onChange={(e) => onChange("openTime", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Giờ đóng cửa
                </label>
                <input
                  type="time"
                  value={values.closeTime}
                  onChange={(e) => onChange("closeTime", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Trạng thái
                </label>
                <select
                  value={values.status}
                  onChange={(e) => onChange("status", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black bg-white focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </section>

          {/* Avatar sân */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-gray-500">
              Avatar sân
            </h4>
            <p className="text-[11px] text-gray-500">
              Ảnh đại diện dùng ở trang danh sách sân / tìm kiếm. Phần hero và
              gallery chi tiết sẽ cấu hình riêng ở trang quản lý content.
            </p>

            <div className="flex flex-col md:flex-row gap-3 items-start">
              {/* Preview */}
              <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                {values.avatarImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImageUrl(values.avatarImage)}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[11px] text-gray-400 text-center px-2">
                    Chưa có ảnh
                  </span>
                )}
              </div>

              {/* Upload control */}
              <div className="flex-1 space-y-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Upload ảnh avatar
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                    disabled={uploadingAvatar}
                    className="block w-full text-[11px] text-gray-700 file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-gray-700 hover:file:bg-gray-50"
                  />
                  {uploadingAvatar && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Đang upload ảnh, vui lòng đợi...
                    </p>
                  )}
                  {avatarError && (
                    <p className="mt-1 text-[11px] text-red-500">
                      {avatarError}
                    </p>
                  )}
                </div>

                {values.avatarImage && (
                  <button
                    type="button"
                    onClick={() => onChange("avatarImage", "")}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    Xóa avatar hiện tại
                  </button>
                )}
              </div>
            </div>
          </section>


          {/* Cấu hình giá theo khung giờ */}
          <section className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-gray-500">
              Cấu hình giá theo khung giờ
            </h4>
            <p className="text-[11px] text-gray-500">
              Bảng giá tối thiểu: mỗi dòng là một khung giờ và đơn giá / giờ.
              Sau này có thể reuse logic từ module venue config hiện tại.
            </p>

            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50">
                  <tr className="text-gray-700">
                    <th className="px-3 py-2 text-left font-medium border-b border-gray-100">
                      STT
                    </th>
                    <th className="px-3 py-2 text-left font-medium border-b border-gray-100">
                      Từ giờ
                    </th>
                    <th className="px-3 py-2 text-left font-medium border-b border-gray-100">
                      Đến giờ
                    </th>
                    <th className="px-3 py-2 text-left font-medium border-b border-gray-100">
                      Đơn giá / giờ (VNĐ)
                    </th>
                    <th className="px-3 py-2 text-right font-medium border-b border-gray-100">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(!values.priceRules || values.priceRules.length === 0) && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-3 text-center text-[11px] text-gray-400"
                      >
                        Chưa có cấu hình giá nào. Thêm ít nhất 1 khung giờ.
                      </td>
                    </tr>
                  )}

                  {values.priceRules &&
                    values.priceRules.map((rule, idx) => (
                      <tr
                        key={rule.id || idx}
                        className="border-b border-gray-50"
                      >
                        <td className="px-3 py-2 text-[11px] text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            value={rule.startTime}
                            onChange={(e) =>
                              onChangePriceRule(
                                idx,
                                "startTime",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] text-black focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="time"
                            value={rule.endTime}
                            onChange={(e) =>
                              onChangePriceRule(
                                idx,
                                "endTime",
                                e.target.value
                              )
                            }
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] text-black focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={rule.price}
                            onChange={(e) =>
                              onChangePriceRule(idx, "price", e.target.value)
                            }
                            className="w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] text-black focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => onRemovePriceRule(idx)}
                            className="text-[11px] font-medium text-red-500 hover:underline"
                          >
                            Xoá
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={onAddPriceRule}
              className="mt-2 rounded-md border border-dashed border-gray-400 px-3 py-1.5 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
            >
              + Thêm khung giờ
            </button>
          </section>

          {/* Footer buttons */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#1890ff] px-6 py-2 text-sm font-medium text-white hover:bg-[#1677d4]"
            >
              {mode === "create" ? "Tạo sân / venue" : "Lưu cấu hình"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
