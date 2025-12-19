import { requireAuth } from "../../shared/middlewares/requireAuth.js";
import {
  listMyNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
} from "./notification.service.js";

export default async function notificationRoutes(app) {
  // GET /api/notifications/me?limit=10&unreadOnly=true
  app.get("/notifications/me", { preHandler: [requireAuth] }, async (req, reply) => {
    const userId = req.user?.id;
    const items = await listMyNotifications(userId, req.query || {});
    return reply.send({ data: items });
  });

  // GET /api/notifications/me/unread-count
  app.get(
    "/notifications/me/unread-count",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const userId = req.user?.id;
      const count = await getUnreadCount(userId);
      return reply.send({ count });
    }
  );

  // PATCH /api/notifications/:id/read
  app.patch(
    "/notifications/:id/read",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const userId = req.user?.id;
      const doc = await markRead(userId, req.params.id);
      return reply.send({ data: doc });
    }
  );

  // POST /api/notifications/me/read-all
  app.post(
    "/notifications/me/read-all",
    { preHandler: [requireAuth] },
    async (req, reply) => {
      const userId = req.user?.id;
      await markAllRead(userId);
      return reply.send({ ok: true });
    }
  );
}
