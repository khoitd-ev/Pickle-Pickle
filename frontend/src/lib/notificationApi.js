import { apiFetch } from "./apiClient";

export async function getUnreadCount() {
  const res = await apiFetch("/notifications/me/unread-count", { method: "GET" });
  return res?.count ?? 0;
}

export async function getMyNotifications({ limit = 10, unreadOnly = false } = {}) {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  qs.set("unreadOnly", String(unreadOnly));

  const res = await apiFetch(`/notifications/me?${qs.toString()}`, { method: "GET" });
  return res?.data ?? [];
}

export async function readOne(id) {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export async function readAll() {
  return apiFetch(`/notifications/me/read-all`, { method: "POST" });
}
