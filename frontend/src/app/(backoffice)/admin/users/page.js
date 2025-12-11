"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { apiFetch } from "../../../../lib/apiClient";

const STATUS_STYLES = {
  active: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    label: "Active",
  },
  pending: {
    dot: "bg-amber-400",
    text: "text-amber-700",
    label: "Pending",
  },
  inactive: {
    dot: "bg-red-500",
    text: "text-red-600",
    label: "Inactive",
  },
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
];

const DATE_FILTER_OPTIONS = [
  { value: "desc", label: "Ngày tạo: Mới nhất" },
  { value: "asc", label: "Ngày tạo: Cũ nhất" },
];

// Dữ liệu fallback dùng khi API lỗi
const FALLBACK_USERS = [
  {
    id: "1",
    name: "Nguyễn Tường Huy",
    email: "hyu12@gmail.com",
    phone: "0463828294",
    address: "Quận Tân Phú",
    createdAt: "2021-02-05",
    status: "active",
  },
  {
    id: "2",
    name: "Nguyễn Minh Thuận",
    email: "thuan@gmail.com",
    phone: "0374839822",
    address: "Quận Tân Bình",
    createdAt: "2021-02-03",
    status: "pending",
  },
  {
    id: "3",
    name: "Lương Minh Khánh",
    email: "khanh@gmail.com",
    phone: "0354826483",
    address: "Quận 3",
    createdAt: "2021-02-02",
    status: "active",
  },
  {
    id: "4",
    name: "Lương Minh Phúc",
    email: "phuc@gmail.com",
    phone: "0746583846",
    address: "Quận Bình Thạnh",
    createdAt: "2021-02-02",
    status: "active",
  },
  {
    id: "5",
    name: "Trương Hiếu Thảo",
    email: "tharo@gmail.com",
    phone: "0475937464",
    address: "Quận Bình Tân",
    createdAt: "2021-02-02",
    status: "active",
  },
  {
    id: "6",
    name: "Lê Văn Sang",
    email: "sangle@gmail.com",
    phone: "0923749237",
    address: "Quận 1",
    createdAt: "2021-02-02",
    status: "pending",
  },
  {
    id: "7",
    name: "Tô Thị Lý",
    email: "lyto@gmail.com",
    phone: "0235794147",
    address: "Quận 2",
    createdAt: "2021-02-02",
    status: "active",
  },
  {
    id: "8",
    name: "Văn Thị Quỳnh",
    email: "quynhv@gmail.com",
    phone: "0927452891",
    address: "Quận Gò Vấp",
    createdAt: "2021-02-01",
    status: "inactive",
  },
  {
    id: "9",
    name: "Chu Ngọc Anh",
    email: "anhchu@gmail.com",
    phone: "0761236235",
    address: "Quận 12",
    createdAt: "2021-01-31",
    status: "active",
  },
  {
    id: "10",
    name: "Trần Lê Minh",
    email: "minhle@gmail.com",
    phone: "0123612839",
    address: "Quận 10",
    createdAt: "2021-01-31",
    status: "active",
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(FALLBACK_USERS);
  const [isLoading, setIsLoading] = useState(false);

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateSort, setDateSort] = useState("desc"); // desc = mới nhất

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Form / modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create"); // 'create' | 'edit'
  const [editingUser, setEditingUser] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    status: "active",
    password: "",
    confirmPassword: "",
  });

  // Delete popup
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Notify popup
  const [notify, setNotify] = useState({
    open: false,
    type: "success", // success | error
    message: "",
  });

  const showNotify = (message, type = "success") => {
    setNotify({
      open: true,
      type,
      message,
    });
  };

  // ===========================
  // LOAD DATA FROM API
  // ===========================
  useEffect(() => {
    let ignore = false;

    async function loadUsers() {
      setIsLoading(true);
      try {
        const res = await apiFetch("/admin/users", { method: "GET" });

        let list;
        if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (Array.isArray(res)) {
          list = res;
        } else {
          list = FALLBACK_USERS;
        }

        // chuẩn hóa name nếu backend trả về fullName
        list = list.map((u) => ({
          ...u,
          name: u.name || u.fullName || "",
          status: (u.status || "inactive").toLowerCase(),
        }));

        if (!ignore) {
          setUsers(list);
        }
      } catch (error) {
        console.error("Failed to load users:", error);
        if (!ignore) {
          setUsers(FALLBACK_USERS);
          showNotify(
            "Không thể tải danh sách người dùng, đang hiển thị dữ liệu mẫu.",
            "error"
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadUsers();

    return () => {
      ignore = true;
    };
  }, []);

  // ===========================
  // FILTER + SORT + PAGINATION
  // ===========================

  const filteredUsers = useMemo(() => {
    let list = [...users];

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter(
        (u) => (u.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((u) => {
        return (
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          (u.address || "").toLowerCase().includes(q)
        );
      });
    }

    // Sort by createdAt
    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      return dateSort === "asc" ? da - db : db - da;
    });

    return list;
  }, [users, statusFilter, search, dateSort]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const currentPageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(totalItems, currentPage * pageSize);

  // ===========================
  // FORM HELPERS
  // ===========================

  const resetForm = () => {
    setFormValues({
      name: "",
      email: "",
      phone: "",
      address: "",
      status: "active",
      password: "",
      confirmPassword: "",
    });
  };

  const openCreateForm = () => {
    setFormMode("create");
    resetForm();
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const openEditForm = (user) => {
    setFormMode("edit");
    setEditingUser(user);
    setFormValues({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      status: (user.status || "active").toLowerCase(),
      password: "",
      confirmPassword: "",
    });
    setIsFormOpen(true);
  };

  const handleFormChange = (field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===========================
  // SUBMIT FORM -> CALL API
  // ===========================

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formValues.name.trim()) {
      showNotify("Vui lòng nhập Họ và tên.", "error");
      return;
    }
    if (!formValues.email.trim()) {
      showNotify("Vui lòng nhập Email.", "error");
      return;
    }

    if (formMode === "create") {
      if (!formValues.password.trim()) {
        showNotify("Vui lòng nhập mật khẩu cho người dùng mới.", "error");
        return;
      }
      if (formValues.password !== formValues.confirmPassword) {
        showNotify("Mật khẩu xác nhận không khớp.", "error");
        return;
      }
    } else if (
      formMode === "edit" &&
      formValues.password &&
      formValues.password !== formValues.confirmPassword
    ) {
      showNotify("Mật khẩu xác nhận không khớp.", "error");
      return;
    }

    try {
      const statusApi = formValues.status.toUpperCase(); // ACTIVE/PENDING/INACTIVE

      if (formMode === "create") {
        const payload = {
          fullName: formValues.name.trim(),
          email: formValues.email.trim(),
          phone: formValues.phone.trim() || undefined,
          address: formValues.address.trim() || undefined,
          password: formValues.password.trim(),
          status: statusApi,
        };

        const res = await apiFetch("/admin/users", {
          method: "POST",
          body: payload,
        });

        const created = (res && res.data) || res;
        if (!created || !created.id) {
          throw new Error("Invalid response from server");
        }

        const normalized = {
          ...created,
          name: created.name || created.fullName || "",
          status: (created.status || "inactive").toLowerCase(),
        };

        setUsers((prev) => [normalized, ...prev]);
        showNotify("Thêm người dùng thành công.", "success");
      } else if (formMode === "edit" && editingUser) {
        const payload = {
          fullName: formValues.name.trim(),
          phone: formValues.phone.trim() || undefined,
          address: formValues.address.trim() || undefined,
          status: statusApi,
        };

        if (formValues.password.trim()) {
          payload.password = formValues.password.trim();
        }

        const res = await apiFetch(`/admin/users/${editingUser.id}`, {
          method: "PUT",
          body: payload,
        });

        const updated = (res && res.data) || res;
        if (!updated || !updated.id) {
          throw new Error("Invalid response from server");
        }

        const normalized = {
          ...updated,
          name: updated.name || updated.fullName || "",
          status: (updated.status || "inactive").toLowerCase(),
        };

        setUsers((prev) =>
          prev.map((u) => (u.id === normalized.id ? normalized : u))
        );
        showNotify("Cập nhật người dùng thành công.", "success");
      }

      setIsFormOpen(false);
    } catch (error) {
      console.error("Lưu người dùng thất bại:", error);
      showNotify(
        "Không thể lưu thông tin người dùng. Vui lòng thử lại sau.",
        "error"
      );
    }
  };

  // ===========================
  // DELETE USER
  // ===========================

  const openDeleteConfirm = (user) => {
    setDeleteTarget(user);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await apiFetch(`/admin/users/${deleteTarget.id}`, {
        method: "DELETE",
      });

      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      showNotify("Xóa người dùng thành công.", "success");
    } catch (error) {
      console.error("Xóa người dùng thất bại:", error);
      showNotify("Không thể xóa người dùng. Vui lòng thử lại.", "error");
    } finally {
      setIsDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteOpen(false);
    setDeleteTarget(null);
  };

  // ===========================
  // PAGINATION helpers
  // ===========================

  const handleChangePageSize = (value) => {
    const size = Number(value);
    if (!Number.isNaN(size) && size > 0) {
      setPageSize(size);
      setCurrentPage(1);
    }
  };

  const goPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  // ===========================
  // RENDER
  // ===========================

  return (
    <div className="space-y-6">
      {/* Breadcrumb + Title */}
      <header className="space-y-1">
        <p className="text-xs text-gray-500">
          Trang chủ <span className="mx-1">/</span> Quản lý user
        </p>
        <h1 className="text-xl font-semibold text-gray-900">
          Bảng chi tiết quản lý user
        </h1>
      </header>

      {/* Card chính */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
        {/* Header card */}
        <div className="px-6 pt-4 pb-3 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Bảng quản lý user
          </h2>
          <p className="text-xs text-gray-500">
            Danh sách các khách hàng sử dụng hệ thống đặt sân PicklePickle.
          </p>

          {/* Filter + Search row */}
          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* 2 dropdown filter bên trái */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Trạng thái */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-7 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {STATUS_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-gray-500">
                  ▼
                </span>
              </div>

              {/* Ngày tạo */}
              <div className="relative">
                <select
                  value={dateSort}
                  onChange={(e) => {
                    setDateSort(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-7 text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  {DATE_FILTER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] text-gray-500">
                  ▼
                </span>
              </div>
            </div>

            {/* Search + Add user */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Search bar */}
              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-3 flex items-center">
                  <Image
                    src="/searchIcon1.svg"
                    alt="Search"
                    width={14}
                    height={14}
                  />
                </span>
                <input
                  type="text"
                  placeholder="Tìm kiếm"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-3 py-2 text-sm text-[#101828] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              {/* Add user button */}
              <button
                type="button"
                onClick={openCreateForm}
                className="inline-flex items-center justify-center rounded-lg bg-[#1890ff] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1677d4]"
              >
                + Thêm người dùng
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-xs text-gray-500">
                <th className="px-4 py-2 text-left font-medium">STT</th>
                <th className="px-4 py-2 text-left font-medium">
                  Tên khách hàng
                </th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">
                  Số điện thoại
                </th>
                <th className="px-4 py-2 text-left font-medium">Địa chỉ</th>
                <th className="px-4 py-2 text-left font-medium">Ngày tạo</th>
                <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-2 text-left font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : currentPageData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-sm text-gray-500"
                  >
                    Không tìm thấy user nào.
                  </td>
                </tr>
              ) : (
                currentPageData.map((u, idx) => {
                  const statusKey = (u.status || "inactive").toLowerCase();
                  const statusMeta =
                    STATUS_STYLES[statusKey] || STATUS_STYLES.inactive;
                  const stt = startIndex + idx;

                  return (
                    <tr
                      key={u.id}
                      className={
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      }
                    >
                      <td className="px-4 py-2 border-b border-gray-50">
                        <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#f5f5f5] text-[11px] font-medium text-gray-700">
                          {stt}
                        </div>
                      </td>
                      <td className="px-4 py-2 border-b border-gray-50 text-[#1890ff] hover:underline cursor-pointer">
                        {u.name}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                        {u.email}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                        {u.phone}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                        {u.address}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-50 text-gray-800">
                        {u.createdAt?.slice(0, 10)}
                      </td>
                      <td className="px-4 py-2 border-b border-gray-50">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${statusMeta.text} ${
                            statusMeta.dot === "bg-emerald-500"
                              ? "border-emerald-100 bg-emerald-50"
                              : statusMeta.dot === "bg-amber-400"
                              ? "border-amber-100 bg-amber-50"
                              : "border-red-100 bg-red-50"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`}
                          />
                          {statusMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 border-b border-gray-50">
                        <button
                          type="button"
                          onClick={() => openEditForm(u)}
                          className="mr-3 text-xs font-medium text-[#1890ff] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(u)}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer – pagination */}
        <div className="px-6 py-3 border-t border-gray-100 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-[11px] text-gray-500">
          <p>
            {totalItems === 0
              ? "0 items"
              : `${startIndex}-${endIndex} of ${totalItems} items`}
          </p>

          <div className="flex items-center gap-3">
            {/* Page size */}
            <div className="flex items-center gap-1">
              <span>Items per page</span>
              <select
                value={pageSize}
                onChange={(e) => handleChangePageSize(e.target.value)}
                className="border border-gray-300 rounded px-1 py-0.5 text-[11px] bg-white text-gray-700 focus:outline-none"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>

            {/* Page indicator */}
            <span>
              Page {currentPage} of {totalPages}
            </span>

            {/* Prev / Next */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goPrevPage}
                disabled={currentPage === 1}
                className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-xs text-gray-600 disabled:opacity-40 hover:bg-gray-50"
              >
                {"<"}
              </button>
              <button
                type="button"
                onClick={goNextPage}
                disabled={currentPage === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 text-xs text-gray-600 disabled:opacity-40 hover:bg-gray-50"
              >
                {">"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-2xl rounded-2xl bg-white px-8 py-8 shadow-lg border border-gray-200">
            <h2 className="mb-6 text-center text-xl font-semibold text-gray-900">
              {formMode === "create"
                ? "THÊM NGƯỜI DÙNG"
                : "CHỈNH SỬA NGƯỜI DÙNG"}
            </h2>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={formValues.name}
                    onChange={(e) =>
                      handleFormChange("name", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Địa chỉ
                  </label>
                  <input
                    type="text"
                    value={formValues.address}
                    onChange={(e) =>
                      handleFormChange("address", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(e) =>
                      handleFormChange("email", e.target.value)
                    }
                    disabled={formMode === "edit"}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black disabled:bg-gray-50 disabled:text-gray-500 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={formValues.password}
                    onChange={(e) =>
                      handleFormChange("password", e.target.value)
                    }
                    placeholder={
                      formMode === "edit"
                        ? "Để trống nếu không đổi"
                        : "Tối thiểu 6 ký tự"
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={formValues.phone}
                    onChange={(e) =>
                      handleFormChange("phone", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    value={formValues.confirmPassword}
                    onChange={(e) =>
                      handleFormChange("confirmPassword", e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-800">
                    Trạng thái
                  </label>
                  <select
                    value={formValues.status}
                    onChange={(e) =>
                      handleFormChange("status", e.target.value)
                    }
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
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-[#1890ff] px-6 py-2 text-sm font-medium text-white hover:bg-[#1677d4]"
                >
                  Lưu người dùng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteOpen && deleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-2xl bg-white px-6 py-6 shadow-lg border border-gray-200">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Xác nhận xoá
            </h3>
            <p className="mb-6 text-sm text-gray-700">
              Bạn có chắc chắn muốn xoá{" "}
              <span className="font-semibold">{deleteTarget.name}</span> khỏi
              danh sách khách hàng?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelDelete}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-md bg-red-500 px-6 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFY POPUP */}
      {notify.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl px-6 py-5 w-[320px]">
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                  notify.type === "success"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {notify.type === "success" ? "✓" : "!"}
              </div>
              <div>
                <p className="text-xs text-gray-700">{notify.message}</p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  setNotify((prev) => ({ ...prev, open: false }))
                }
                className="inline-flex items-center rounded-md bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-sky-600"
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
