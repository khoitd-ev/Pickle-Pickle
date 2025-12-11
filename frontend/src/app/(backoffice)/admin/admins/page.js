"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { apiFetch } from "../../../../lib/apiClient";

// Mock data tạm, chỉ dùng fallback nếu API lỗi nặng
const MOCK_ADMINS = [
  {
    id: "1",
    fullName: "Nguyễn Văn A",
    email: "admin.a@picklepickle.vn",
    phone: "0909000001",
    createdAt: "2025-02-05T08:30:00.000Z",
    status: "ACTIVE", // ACTIVE | PENDING | INACTIVE
    canManageAdmins: true,
  },
  {
    id: "2",
    fullName: "Trần Thị B",
    email: "admin.b@picklepickle.vn",
    phone: "0909000002",
    createdAt: "2025-02-03T10:00:00.000Z",
    status: "PENDING",
    canManageAdmins: false,
  },
  {
    id: "3",
    fullName: "Lê Văn C",
    email: "admin.c@picklepickle.vn",
    phone: "0909000003",
    createdAt: "2025-02-01T09:15:00.000Z",
    status: "INACTIVE",
    canManageAdmins: false,
  },
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "INACTIVE", label: "Inactive" },
];

const CREATED_SORT_OPTIONS = [
  { value: "DESC", label: "Ngày tạo: Mới nhất" },
  { value: "ASC", label: "Ngày tạo: Cũ nhất" },
];

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function StatusBadge({ status }) {
  let label = "";
  let classes = "";

  switch (status) {
    case "ACTIVE":
      label = "Active";
      classes = "bg-emerald-50 text-emerald-700 border-emerald-100";
      break;
    case "PENDING":
      label = "Pending";
      classes = "bg-amber-50 text-amber-700 border-amber-100";
      break;
    case "INACTIVE":
      label = "Inactive";
      classes = "bg-red-50 text-red-600 border-red-100";
      break;
    default:
      label = "Unknown";
      classes = "bg-gray-50 text-gray-600 border-gray-100";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium ${classes}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function AdminPermissionBadge({ canManageAdmins }) {
  if (canManageAdmins) {
    return (
      <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-600">
        Có quyền
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">
      Không
    </span>
  );
}

function unwrapData(res) {
  // Backend đang trả { data: [...] } hoặc { data: {...} }
  // apiFetch thì trả object đó luôn
  if (!res) return res;
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.data)) return res.data;
  if (res.data) return res.data;
  return res;
}

export default function AdminManageAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [createdSort, setCreatedSort] = useState("DESC"); // DESC = mới nhất
  const [search, setSearch] = useState("");

  // Form
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // "create" | "edit"
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formValues, setFormValues] = useState({
    fullName: "",
    email: "",
    phone: "",
    status: "ACTIVE",
    canManageAdmins: false,
    password: "",
    confirmPassword: "",
  });

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Popup thông báo
  const [dialog, setDialog] = useState({
    open: false,
    type: "success", // "success" | "error"
    message: "",
  });

  const openDialog = (type, message) => {
    setDialog({ open: true, type, message });
  };

  const closeDialog = () => {
    setDialog((prev) => ({ ...prev, open: false }));
  };

  // ===== LOAD DATA TỪ API =====
  useEffect(() => {
    async function loadAdmins() {
      setLoading(true);
      try {
        const res = await apiFetch("/admin/admins", { method: "GET" });
        const list = unwrapData(res);

        if (Array.isArray(list)) {
          setAdmins(list);
        } else {
          // fallback demo nếu response lạ
          setAdmins(MOCK_ADMINS);
        }
      } catch (err) {
        console.error("Failed to load admins:", err);
        openDialog("error", err.message || "Không tải được danh sách admin.");
        setAdmins(MOCK_ADMINS);
      } finally {
        setLoading(false);
      }
    }

    loadAdmins();
  }, []);

  // Sort + filter + search
  const processedAdmins = useMemo(() => {
    let list = [...admins];

    // sort theo createdAt
    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      if (createdSort === "DESC") return db - da;
      return da - db;
    });

    // filter status
    if (statusFilter !== "ALL") {
      list = list.filter((a) => a.status === statusFilter);
    }

    // search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          a.fullName?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          a.phone?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [admins, statusFilter, createdSort, search]);

  // ===== FORM HANDLERS =====
  const openCreateForm = () => {
    setFormMode("create");
    setEditingAdmin(null);
    setFormValues({
      fullName: "",
      email: "",
      phone: "",
      status: "ACTIVE",
      canManageAdmins: false,
      password: "",
      confirmPassword: "",
    });
    setIsFormOpen(true);
  };

  const openEditForm = (admin) => {
    setFormMode("edit");
    setEditingAdmin(admin);
    setFormValues({
      fullName: admin.fullName || "",
      email: admin.email || "",
      phone: admin.phone || "",
      status: admin.status || "ACTIVE",
      canManageAdmins: !!admin.canManageAdmins,
      password: "",
      confirmPassword: "",
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setIsFormOpen(false);
  };

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formValues.fullName.trim()) {
      openDialog("error", "Vui lòng nhập họ và tên.");
      return;
    }
    if (!formValues.email.trim()) {
      openDialog("error", "Vui lòng nhập email.");
      return;
    }

    if (formMode === "create") {
      if (!formValues.password.trim()) {
        openDialog("error", "Vui lòng nhập mật khẩu cho admin mới.");
        return;
      }
      if (formValues.password !== formValues.confirmPassword) {
        openDialog("error", "Mật khẩu xác nhận không khớp.");
        return;
      }
    } else if (
      formMode === "edit" &&
      formValues.password &&
      formValues.password !== formValues.confirmPassword
    ) {
      openDialog("error", "Mật khẩu xác nhận không khớp.");
      return;
    }

    setSaving(true);
    try {
      if (formMode === "create") {
        const payload = {
          fullName: formValues.fullName.trim(),
          email: formValues.email.trim(),
          phone: formValues.phone.trim() || undefined,
          password: formValues.password,
          status: formValues.status,
          canManageAdmins: !!formValues.canManageAdmins,
        };

        const res = await apiFetch("/admin/admins", {
          method: "POST",
          body: payload,
        });

        const created = unwrapData(res);

        setAdmins((prev) =>
          created ? [created, ...prev] : [...prev]
        );
        openDialog("success", "Thêm admin mới thành công.");
      } else if (formMode === "edit" && editingAdmin) {
        const payload = {
          fullName: formValues.fullName.trim(),
          phone: formValues.phone.trim() || undefined,
          status: formValues.status,
          canManageAdmins: !!formValues.canManageAdmins,
        };

        if (formValues.password) {
          payload.password = formValues.password;
        }

        const res = await apiFetch(`/admin/admins/${editingAdmin.id}`, {
          method: "PUT",
          body: payload,
        });

        const updated = unwrapData(res);

        setAdmins((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
        openDialog("success", "Cập nhật admin thành công.");
      }

      setIsFormOpen(false);
    } catch (err) {
      console.error("Save admin failed:", err);
      openDialog(
        "error",
        err.message || "Không thể lưu thông tin admin. Vui lòng thử lại sau."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== DELETE HANDLERS =====
  const openDeleteConfirm = (admin) => {
    setDeleteTarget(admin);
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    try {
      await apiFetch(`/admin/admins/${deleteTarget.id}`, {
        method: "DELETE",
      });

      setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      openDialog("success", "Xóa admin thành công.");
    } catch (err) {
      console.error("Delete admin failed:", err);
      openDialog(
        "error",
        err.message || "Không thể xóa admin. Vui lòng thử lại."
      );
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Bảng quản lý admin
          </h1>
          <p className="mt-1 text-xs text-gray-500">
            Danh sách các admin (nhân viên quản trị) sử dụng hệ thống backoffice
            PicklePickle.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center rounded-xl bg-[#1677ff] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#165fdd] transition"
        >
          + Thêm admin
        </button>
      </div>

      {/* Card danh sách */}
      <section className="bg-white rounded-3xl shadow-sm border border-gray-200">
        {/* Filter bar */}
        <div className="px-6 pt-4 pb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Bảng quản lý admin
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Lọc theo trạng thái, ngày tạo và tìm kiếm nhanh theo tên, email,
              số điện thoại.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Dropdown trạng thái */}
            <select
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Dropdown ngày tạo */}
            <select
              className="h-9 rounded-xl border border-gray-200 bg-white px-3 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
              value={createdSort}
              onChange={(e) => setCreatedSort(e.target.value)}
            >
              {CREATED_SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Search input + icon searchIcon1.svg */}
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm"
                className="w-full h-9 rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <Image
                  src="/searchIcon1.svg"
                  alt="Search"
                  width={16}
                  height={16}
                />
              </span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 pb-4">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-t border-b border-gray-100 text-[11px] text-gray-500">
                  <th className="py-2 text-left font-medium w-16">STT</th>
                  <th className="py-2 text-left font-medium min-w-[180px]">
                    Tên admin
                  </th>
                  <th className="py-2 text-left font-medium min-w-[220px]">
                    Email
                  </th>
                  <th className="py-2 text-left font-medium min-w-[130px]">
                    Số điện thoại
                  </th>
                  <th className="py-2 text-left font-medium min-w-[110px]">
                    Ngày tạo
                  </th>
                  <th className="py-2 text-left font-medium min-w-[120px]">
                    Trạng thái
                  </th>
                  <th className="py-2 text-left font-medium min-w-[130px]">
                    Quyền quản lý admin
                  </th>
                  <th className="py-2 text-right font-medium w-28">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-6 text-center text-xs text-gray-400"
                    >
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                )}

                {!loading && processedAdmins.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-6 text-center text-xs text-gray-400"
                    >
                      Chưa có admin nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                )}

                {!loading &&
                  processedAdmins.map((admin, idx) => (
                    <tr
                      key={admin.id}
                      className="border-b border-gray-50 hover:bg-gray-50/60"
                    >
                      <td className="py-2 text-[11px] text-gray-500">
                        {idx + 1}
                      </td>
                      <td className="py-2 text-xs font-medium text-[#1677ff]">
                        {admin.fullName}
                      </td>
                      <td className="py-2 text-xs text-gray-700">
                        {admin.email}
                      </td>
                      <td className="py-2 text-xs text-gray-700">
                        {admin.phone || "-"}
                      </td>
                      <td className="py-2 text-xs text-gray-600">
                        {formatDate(admin.createdAt)}
                      </td>
                      <td className="py-2">
                        <StatusBadge status={admin.status} />
                      </td>
                      <td className="py-2">
                        <AdminPermissionBadge
                          canManageAdmins={admin.canManageAdmins}
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => openEditForm(admin)}
                          className="text-[11px] font-medium text-[#1677ff] hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(admin)}
                          className="text-[11px] font-medium text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 text-[11px] text-gray-500">
            1-{processedAdmins.length} of {processedAdmins.length} items
          </div>
        </div>
      </section>

      {/* ===== MODAL THÊM / SỬA ADMIN ===== */}
      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4 text-center">
              {formMode === "create" ? "THÊM ADMIN" : "CHỈNH SỬA ADMIN"}
            </h3>

            <form onSubmit={handleSubmitForm} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    className="w-full h-9 rounded-xl border border-gray-200 px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
                    value={formValues.fullName}
                    onChange={(e) =>
                      handleFormChange("fullName", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full h-9 rounded-xl border border-gray-200 px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
                    value={formValues.email}
                    onChange={(e) =>
                      handleFormChange("email", e.target.value)
                    }
                    disabled={formMode === "edit"}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    className="w-full h-9 rounded-xl border border-gray-200 px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
                    value={formValues.phone}
                    onChange={(e) =>
                      handleFormChange("phone", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    className="w-full h-9 rounded-xl border border-gray-200 px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
                    value={formValues.status}
                    onChange={(e) =>
                      handleFormChange("status", e.target.value)
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PENDING">Pending</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                {/* Quyền quản lý admin */}
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Quyền quản lý admin
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-700">
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="canManageAdmins"
                        checked={formValues.canManageAdmins === true}
                        onChange={() =>
                          handleFormChange("canManageAdmins", true)
                        }
                      />
                      <span>Có</span>
                    </label>
                    <label className="inline-flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="canManageAdmins"
                        checked={formValues.canManageAdmins === false}
                        onChange={() =>
                          handleFormChange("canManageAdmins", false)
                        }
                      />
                      <span>Không</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Mật khẩu chỉ bắt buộc khi thêm mới */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mật khẩu{" "}
                    {formMode === "edit" && (
                      <span className="text-[10px] text-gray-400">
                        (bỏ trống nếu không đổi)
                      </span>
                    )}
                  </label>
                  <input
                    type="password"
                    className="w-full h-9 rounded-xl border border-gray-200 px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
                    value={formValues.password}
                    onChange={(e) =>
                      handleFormChange("password", e.target.value)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    className="w-full h-9 rounded-xl border border-gray-200 px-3 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#1677ff]"
                    value={formValues.confirmPassword}
                    onChange={(e) =>
                      handleFormChange("confirmPassword", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-9 rounded-xl border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  disabled={saving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="h-9 rounded-xl bg-[#1677ff] px-4 text-xs font-semibold text-white hover:bg-[#165fdd] disabled:opacity-70"
                  disabled={saving}
                >
                  {formMode === "create"
                    ? saving
                      ? "Đang lưu..."
                      : "Lưu admin"
                    : saving
                    ? "Đang lưu..."
                    : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL XÁC NHẬN XÓA ===== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Xóa admin
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Bạn có chắc chắn muốn xóa admin{" "}
              <span className="font-semibold">
                {deleteTarget.fullName || deleteTarget.email}
              </span>
              ? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDeleteConfirm}
                className="h-9 rounded-xl border border-gray-200 px-4 text-xs font-medium text-gray-600 hover:bg-gray-50"
                disabled={deleting}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="h-9 rounded-xl bg-red-500 px-4 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-70"
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== POPUP THÔNG BÁO ===== */}
      {dialog.open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm px-6 py-5">
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                  dialog.type === "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {dialog.type === "success" ? "✓" : "!"}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {dialog.type === "success"
                    ? "Thao tác thành công"
                    : "Thao tác thất bại"}
                </h3>
                <p className="text-xs text-gray-600">{dialog.message}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeDialog}
                className="h-9 rounded-xl bg-[#1677ff] px-4 text-xs font-semibold text-white hover:bg-[#165fdd]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
