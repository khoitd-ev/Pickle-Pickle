"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function apiFetch(path, options = {}) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("pp_token") : null;

  let headers = {
    ...(options.headers || {}),
  };

  let body = options.body;

  // 1. Nếu body là FormData -> để browser tự set Content-Type (multipart/form-data)
  if (body instanceof FormData) {
    // KHÔNG set Content-Type ở đây
  }
  // 2. Nếu có body và là object -> stringify thành JSON + set Content-Type
  else if (body !== undefined && body !== null && typeof body === "object") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }
 

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body,
  });

  // Một số API trả 204 hoặc không có body
  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = {};
    }
  }

  if (!res.ok) {
    const message = data?.message || `Request failed: ${res.status}`;
    throw new Error(message);
  }

  return data;
}
