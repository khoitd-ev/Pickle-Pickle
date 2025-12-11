// src/modules/addons/addon.controller.js
import {
  listAddonsService,
  getAddonByCodeService,
} from "./addon.service.js";

export async function listAddonsHandler(request, reply) {
  try {
    const { category, venueId } = request.query || {};

    const data = await listAddonsService({ category, venueId });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải danh sách dịch vụ thêm." });
  }
}

export async function getAddonByCodeHandler(request, reply) {
  try {
    const { code } = request.params;

    const addon = await getAddonByCodeService(code);
    if (!addon) {
      return reply.code(404).send({ message: "Không tìm thấy dịch vụ thêm." });
    }

    return reply.send({ data: addon });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải thông tin dịch vụ thêm." });
  }
}
