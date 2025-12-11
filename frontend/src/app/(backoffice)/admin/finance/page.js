"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../../lib/apiClient";
import StatCard from "../../components/widgets/StatCard";

function formatCurrency(v) {
  return (v || 0).toLocaleString("vi-VN") + "đ";
}

export default function AdminFinancePage() {
  // Summary
  const [summary, setSummary] = useState({
    totalProcessedRevenue: 0,
    platformCommissionThisMonth: 0,
    needToPayPlatform: 0,
  });
  const [defaultCommission, setDefaultCommission] = useState(10);

  // Split rules
  const [rules, setRules] = useState([]);
  const [ruleFilter, setRuleFilter] = useState("all");

  // Payout history
  const [payouts, setPayouts] = useState([]);
  const [payoutStatus, setPayoutStatus] = useState("ALL");
  const [payoutFrom, setPayoutFrom] = useState("");
  const [payoutTo, setPayoutTo] = useState("");

  // Owners & venues cho modal
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // Confirm delete
  const [deleteId, setDeleteId] = useState(null);

  // Toast
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 2500);
  };

  // ========== LOAD DATA ==========

  // Load summary + rules
  useEffect(() => {
    async function loadSummaryAndRules() {
      try {
        const res = await apiFetch("/admin/finance/summary");
        const payload = res.data || res;

        if (payload.summary) {
          setSummary(payload.summary);
        }
        if (payload.defaultCommissionPercent != null) {
          setDefaultCommission(payload.defaultCommissionPercent);
        }

        const resRules = await apiFetch(
          `/admin/finance/split-rules?type=${ruleFilter}`
        );
        const rulesPayload = resRules.data || resRules;
        setRules(Array.isArray(rulesPayload) ? rulesPayload : []);
      } catch (err) {
        console.error("Load finance summary/rules error:", err);
      }
    }

    loadSummaryAndRules();
  }, [ruleFilter]);

  // Load payouts
  useEffect(() => {
    async function loadPayouts() {
      try {
        const params = new URLSearchParams();
        if (payoutStatus) params.set("status", payoutStatus);
        if (payoutFrom) params.set("from", payoutFrom);
        if (payoutTo) params.set("to", payoutTo);

        const res = await apiFetch(
          `/admin/finance/payouts?${params.toString()}`
        );
        const payload = res.data || res;

        setPayouts(Array.isArray(payload.items) ? payload.items : []);
      } catch (err) {
        console.error("Load platform payouts error:", err);
      }
    }

    loadPayouts();
  }, [payoutStatus, payoutFrom, payoutTo]);

  // Load owners + venues cho dropdown trong modal
  useEffect(() => {
    async function loadOwners() {
      try {
        const res = await apiFetch("/admin/dashboard/owners");
        const payload = res.data || res;
        const owners = Array.isArray(payload.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
        setOwnerOptions(owners);
      } catch (err) {
        console.error("Load admin owners/venues error:", err);
      }
    }

    loadOwners();
  }, []);

  // Khi owners đã load mà đang edit rule có sẵn venueId -> auto map sang owner
  useEffect(() => {
    if (
      ownerOptions.length > 0 &&
      editingRule &&
      editingRule.venueId &&
      !selectedOwnerId
    ) {
      const owner = ownerOptions.find((o) =>
        o.venues?.some((v) => v.id === editingRule.venueId)
      );
      if (owner) {
        setSelectedOwnerId(owner.id);
      }
    }
  }, [ownerOptions, editingRule, selectedOwnerId]);

  const selectedOwner = ownerOptions.find((o) => o.id === selectedOwnerId);
  const venueOptions = selectedOwner?.venues || [];

  // ========== HANDLERS ==========

  async function handleSaveDefaultCommission() {
    try {
      const res = await apiFetch("/admin/finance/default-commission", {
        method: "PATCH",
        body: { percent: defaultCommission },
      });
      const payload = res.data || res;
      if (payload.percent != null) {
        setDefaultCommission(payload.percent);
      }
      showToast("Cập nhật hoa hồng mặc định thành công");
    } catch (err) {
      console.error(err);
      showToast("Cập nhật hoa hồng mặc định thất bại", "error");
    }
  }

  function openCreateRule() {
    setSelectedOwnerId("");
    setEditingRule({
      id: null,
      venueId: "",
      platformSharePercent: 10,
      effectiveFrom: "",
      effectiveTo: "",
      note: "",
      isActive: true,
    });
    setIsFormOpen(true);
  }

  function openEditRule(rule) {
    const prepared = {
      id: rule.id,
      venueId: rule.venueId || "",
      platformSharePercent: rule.platformSharePercent,
      effectiveFrom: rule.effectiveFrom
        ? new Date(rule.effectiveFrom).toISOString().slice(0, 10)
        : "",
      effectiveTo: rule.effectiveTo
        ? new Date(rule.effectiveTo).toISOString().slice(0, 10)
        : "",
      note: rule.note || "",
      isActive: !!rule.isActive,
    };
    setEditingRule(prepared);

    if (rule.venueId && ownerOptions.length > 0) {
      const owner = ownerOptions.find((o) =>
        o.venues?.some((v) => v.id === rule.venueId)
      );
      setSelectedOwnerId(owner ? owner.id : "");
    } else {
      setSelectedOwnerId("");
    }

    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingRule(null);
    setSelectedOwnerId("");
  }

  async function handleSubmitRule(e) {
    e.preventDefault();
    if (!editingRule) return;

    if (!editingRule.venueId) {
      showToast("Vui lòng chọn sân áp dụng hoa hồng", "error");
      return;
    }

    const payload = {
      venueId: editingRule.venueId || null,
      platformSharePercent: Number(editingRule.platformSharePercent),
      effectiveFrom: editingRule.effectiveFrom || null,
      effectiveTo: editingRule.effectiveTo || null,
      note: editingRule.note || "",
      isActive: editingRule.isActive,
    };

    try {
      if (!editingRule.id) {
        await apiFetch("/admin/finance/split-rules", {
          method: "POST",
          body: payload,
        });
        showToast("Thêm cấu hình hoa hồng thành công");
      } else {
        await apiFetch(`/admin/finance/split-rules/${editingRule.id}`, {
          method: "PUT",
          body: payload,
        });
        showToast("Cập nhật cấu hình hoa hồng thành công");
      }

      closeForm();

      const resRules = await apiFetch(
        `/admin/finance/split-rules?type=${ruleFilter}`
      );
      const rulesPayload = resRules.data || resRules;
      setRules(Array.isArray(rulesPayload) ? rulesPayload : []);
    } catch (err) {
      console.error(err);
      showToast("Lưu cấu hình hoa hồng thất bại", "error");
    }
  }

  function confirmDeleteRule(id) {
    setDeleteId(id);
  }

  async function handleDeleteRule() {
    if (!deleteId) return;
    try {
      await apiFetch(`/admin/finance/split-rules/${deleteId}`, {
        method: "DELETE",
      });
      showToast("Xoá cấu hình hoa hồng thành công");
      setDeleteId(null);

      const resRules = await apiFetch(
        `/admin/finance/split-rules?type=${ruleFilter}`
      );
      const rulesPayload = resRules.data || resRules;
      setRules(Array.isArray(rulesPayload) ? rulesPayload : []);
    } catch (err) {
      console.error(err);
      showToast("Xoá cấu hình hoa hồng thất bại", "error");
    }
  }

  // ===== UI =====
  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          Quản lý tài chính
        </h1>
        <p className="text-sm text-gray-500">
          Cấu hình tiền hoa hồng nền tảng và theo dõi lịch sử thanh toán cho
          nền tảng.
        </p>
      </header>

      {/* Toast */}
      {toast.open && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${
              toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* 3 cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tổng doanh thu xử lý (tháng này)"
          value={formatCurrency(summary.totalProcessedRevenue)}
        />
        <StatCard
          title="Hoa hồng nền tảng (tháng này)"
          value={formatCurrency(summary.platformCommissionThisMonth)}
        />
        <StatCard
          title="Số tiền cần thanh toán cho nền tảng"
          value={formatCurrency(summary.needToPayPlatform)}
        />
      </section>

      {/* CẤU HÌNH HOA HỒNG */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Cấu hình hoa hồng nền tảng
            </h2>
            <p className="text-xs text-gray-500">
              Thiết lập % hoa hồng mặc định và các cấu hình riêng cho từng sân.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">
                Hoa hồng mặc định toàn hệ thống
              </span>
              <input
                type="number"
                min={0}
                max={100}
                value={defaultCommission}
                onChange={(e) => setDefaultCommission(e.target.value)}
                className="w-16 rounded-md border border-gray-200 px-2 py-1 text-xs text-right text-gray-800 bg-white"
              />
              <span className="text-gray-500">%</span>
              <button
                type="button"
                onClick={handleSaveDefaultCommission}
                className="ml-2 rounded-md bg-sky-500 px-3 py-1 text-xs font-medium text-white hover:bg-sky-600"
              >
                Lưu
              </button>
            </div>

            <button
              type="button"
              onClick={openCreateRule}
              className="rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
            >
              + Thêm cấu hình hoa hồng
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Loại cấu hình</span>
            <select
              value={ruleFilter}
              onChange={(e) => setRuleFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Ngưng áp dụng</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  STT
                </th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Đối tượng áp dụng
                </th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Hoa hồng nền tảng
                </th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Hiệu lực
                </th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Ghi chú
                </th>
                <th className="px-3 py-2 text-right text-gray-500 font-semibold">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r, idx) => (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-800">{idx + 1}</td>
                  <td className="px-3 py-2 text-gray-800">{r.venueName}</td>
                  <td className="px-3 py-2 text-gray-800">
                    {r.platformSharePercent}%{" "}
                    {r.isActive ? (
                      <span className="ml-1 text-[11px] text-emerald-500">
                        (Đang áp dụng)
                      </span>
                    ) : (
                      <span className="ml-1 text-[11px] text-gray-400">
                        (Đã ngưng)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-800">
                    {r.effectiveFrom
                      ? new Date(r.effectiveFrom).toLocaleDateString("vi-VN")
                      : "Không giới hạn"}{" "}
                    –{" "}
                    {r.effectiveTo
                      ? new Date(r.effectiveTo).toLocaleDateString("vi-VN")
                      : "Không giới hạn"}
                  </td>
                  <td className="px-3 py-2 text-gray-800">{r.note}</td>
                  <td className="px-3 py-2 text-right space-x-3">
                    <button
                      type="button"
                      onClick={() => openEditRule(r)}
                      className="text-sky-600 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDeleteRule(r.id)}
                      className="text-red-500 hover:underline"
                    >
                      Xoá
                    </button>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    Chưa có cấu hình hoa hồng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* LỊCH SỬ THANH TOÁN CHO NỀN TẢNG */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              Lịch sử thanh toán cho nền tảng
            </h2>
            <p className="text-xs text-gray-500">
              Theo dõi các lần thanh toán hoa hồng từ chủ sân cho nền tảng.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">Trạng thái</span>
              <select
                value={payoutStatus}
                onChange={(e) => setPayoutStatus(e.target.value)}
                className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800"
              >
                <option value="ALL">Tất cả</option>
                <option value="PAID">Đã thanh toán</option>
                <option value="PENDING">Chờ thanh toán</option>
                <option value="CANCELLED">Đã huỷ</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-gray-500">Từ</span>
              <input
                type="date"
                value={payoutFrom}
                onChange={(e) => setPayoutFrom(e.target.value)}
                className="h-8 rounded-md border border-gray-200 px-2 text-xs text-gray-800 bg-white"
              />
              <span className="text-gray-500">đến</span>
              <input
                type="date"
                value={payoutTo}
                onChange={(e) => setPayoutTo(e.target.value)}
                className="h-8 rounded-md border border-gray-200 px-2 text-xs text-gray-800 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Mã phiếu
                </th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Kỳ thanh toán
                </th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Sân
                </th>
                <th className="px-3 py-2 text-right text-gray-500 font-semibold">
                  Số tiền
                </th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Trạng thái
                </th>
                <th className="px-3 py-2 text-left text-gray-500 font-semibold">
                  Cập nhật gần nhất
                </th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const from = new Date(p.periodFrom);
                const to = new Date(p.periodTo);
                const periodLabel = `${from.toLocaleDateString(
                  "vi-VN"
                )} – ${to.toLocaleDateString("vi-VN")}`;

                let statusLabel = "";
                let statusClass = "";
                if (p.status === "PAID") {
                  statusLabel = "Đã thanh toán";
                  statusClass = "bg-emerald-50 text-emerald-600";
                } else if (p.status === "PENDING") {
                  statusLabel = "Chờ thanh toán";
                  statusClass = "bg-amber-50 text-amber-600";
                } else if (p.status === "CANCELLED") {
                  statusLabel = "Đã huỷ";
                  statusClass = "bg-red-50 text-red-600";
                }

                return (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-800">{p.code}</td>
                    <td className="px-3 py-2 text-gray-800">{periodLabel}</td>
                    <td className="px-3 py-2 text-gray-800">{p.venueName}</td>
                    <td className="px-3 py-2 text-right text-gray-800">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-800">
                      {p.updatedAt
                        ? new Date(p.updatedAt).toLocaleString("vi-VN")
                        : ""}
                    </td>
                  </tr>
                );
              })}
              {payouts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-4 text-center text-gray-400"
                  >
                    Chưa có lịch sử thanh toán nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* FORM MODAL THÊM/SỬA HOA HỒNG */}
      {isFormOpen && editingRule && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {editingRule.id
                ? "Chỉnh sửa cấu hình hoa hồng"
                : "Thêm cấu hình hoa hồng"}
            </h3>

            <form className="space-y-4" onSubmit={handleSubmitRule}>
              {/* Chọn chủ sân */}
              <div className="space-y-1 text-xs">
                <label className="font-medium text-gray-700">
                  Chủ sân <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedOwnerId}
                  onChange={(e) => {
                    const ownerId = e.target.value;
                    setSelectedOwnerId(ownerId);
                    setEditingRule((prev) => ({
                      ...prev,
                      venueId: "",
                    }));
                  }}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs bg-white text-gray-800"
                >
                  <option value="">-- Chọn chủ sân --</option>
                  {ownerOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn sân */}
              <div className="space-y-1 text-xs">
                <label className="font-medium text-gray-700">
                  Sân áp dụng <span className="text-red-500">*</span>
                </label>
                <select
                  value={editingRule.venueId}
                  onChange={(e) =>
                    setEditingRule((prev) => ({
                      ...prev,
                      venueId: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs bg-white text-gray-800 disabled:bg-gray-50 disabled:text-gray-400"
                  disabled={!selectedOwnerId}
                >
                  <option value="">
                    {selectedOwnerId
                      ? "-- Chọn sân của chủ này --"
                      : "Vui lòng chọn chủ sân trước"}
                  </option>
                  {venueOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-medium text-gray-700">
                  Hoa hồng nền tảng (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingRule.platformSharePercent}
                  onChange={(e) =>
                    setEditingRule((prev) => ({
                      ...prev,
                      platformSharePercent: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-right text-gray-800 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-medium text-gray-700">
                    Hiệu lực từ ngày
                  </label>
                  <input
                    type="date"
                    value={editingRule.effectiveFrom}
                    onChange={(e) =>
                      setEditingRule((prev) => ({
                        ...prev,
                        effectiveFrom: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-800 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-medium text-gray-700">Đến ngày</label>
                  <input
                    type="date"
                    value={editingRule.effectiveTo}
                    onChange={(e) =>
                      setEditingRule((prev) => ({
                        ...prev,
                        effectiveTo: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-800 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-medium text-gray-700">Ghi chú</label>
                <textarea
                  rows={2}
                  value={editingRule.note}
                  onChange={(e) =>
                    setEditingRule((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-800 bg-white"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <input
                  id="is-active"
                  type="checkbox"
                  checked={editingRule.isActive}
                  onChange={(e) =>
                    setEditingRule((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                  className="h-3 w-3"
                />
                <label htmlFor="is-active" className="text-gray-700">
                  Đang áp dụng
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-sky-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-sky-600"
                >
                  {editingRule.id ? "Lưu thay đổi" : "Thêm cấu hình"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP XÁC NHẬN XOÁ */}
      {deleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Xác nhận xoá cấu hình hoa hồng
            </h3>
            <p className="text-xs text-gray-600 mb-4">
              Bạn có chắc chắn muốn xoá cấu hình này? Hành động này không thể
              hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleDeleteRule}
                className="rounded-md bg-red-500 px-4 py-1.5 text-xs font-medium text-white hover:bg-red-600"
              >
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
