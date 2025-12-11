// backend/src/modules/adminFinance/adminFinance.controller.js
import {
  getAdminFinanceSummaryService,
  listPlatformSplitRulesService,
  createPlatformSplitRuleService,
  updatePlatformSplitRuleService,
  deletePlatformSplitRuleService,
  listPlatformPayoutsService,
  updateDefaultCommissionPercentService,
} from "./adminFinance.service.js";

export async function getAdminFinanceSummaryHandler(req, reply) {
  const adminId = req.user?.id;
  const data = await getAdminFinanceSummaryService(adminId);
  return reply.send({ data });
}

export async function getPlatformSplitRulesHandler(req, reply) {
  const adminId = req.user?.id;
  const { type } = req.query;
  const data = await listPlatformSplitRulesService(adminId, { type });
  return reply.send({ data });
}

export async function createPlatformSplitRuleHandler(req, reply) {
  const adminId = req.user?.id;
  const result = await createPlatformSplitRuleService(adminId, req.body || {});
  return reply.code(201).send({ data: result });
}

export async function updatePlatformSplitRuleHandler(req, reply) {
  const adminId = req.user?.id;
  const { id } = req.params;
  const result = await updatePlatformSplitRuleService(adminId, id, req.body);
  return reply.send({ data: result });
}

export async function deletePlatformSplitRuleHandler(req, reply) {
  const adminId = req.user?.id;
  const { id } = req.params;
  const result = await deletePlatformSplitRuleService(adminId, id);
  return reply.send({ data: result });
}

export async function listPlatformPayoutsHandler(req, reply) {
  const adminId = req.user?.id;
  const { status, from, to, page, limit } = req.query;
  const data = await listPlatformPayoutsService(adminId, {
    status,
    from,
    to,
    page,
    limit,
  });
  return reply.send({ data });
}

export async function updateDefaultCommissionHandler(req, reply) {
  const adminId = req.user?.id;
  const { percent } = req.body || {};
  const data = await updateDefaultCommissionPercentService(adminId, percent);
  return reply.send({ data });
}
