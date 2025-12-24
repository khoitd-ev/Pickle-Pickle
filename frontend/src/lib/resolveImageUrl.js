// frontend/src/lib/resolveImageUrl.js
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

export function resolveImageUrl(raw) {
  if (!raw) return "";
  if (typeof raw !== "string") return "";

  if (raw.startsWith("/uploads/")) {
    return `${API_BASE}${raw}`;
  }
  return raw;
}
