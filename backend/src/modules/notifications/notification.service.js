import { Notification } from "../../models/notification.model.js";

export async function createNotification({
  userId,
  type,
  title,
  content,
  level = "INFO",
  data = {},
  dedupeKey = null,
}) {
  const dataStr = typeof data === "string" ? data : JSON.stringify(data || {});

  if (dedupeKey) {
    const existed = await Notification.findOne({ user: userId, dedupeKey }).lean();
    if (existed) return existed;
  }

  const doc = await Notification.create({
    user: userId,
    type,
    title,
    content,
    level,
    data: dataStr,
    dedupeKey,
  });

  return doc.toObject();
}

export async function listMyNotifications(userId, query = {}) {
  const limit = Math.min(Number(query.limit) || 10, 50);
  const unreadOnly = String(query.unreadOnly || "false") === "true";

  const filter = { user: userId };
  if (unreadOnly) filter.isRead = false;

  const items = await Notification.find(filter).sort({ _id: -1 }).limit(limit).lean();
  return items;
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ user: userId, isRead: false });
}

export async function markRead(userId, id) {
  return Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { new: true }
  ).lean();
}

export async function markAllRead(userId) {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );
  return true;
}
