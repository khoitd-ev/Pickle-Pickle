// backend/src/modules/adminFinance/adminFinance.routes.js
import { requireAuth } from "../../shared/middlewares/requireAuth.js";
import {
  getAdminFinanceSummaryHandler,
  getPlatformSplitRulesHandler,
  createPlatformSplitRuleHandler,
  updatePlatformSplitRuleHandler,
  deletePlatformSplitRuleHandler,
  listPlatformPayoutsHandler,
  updateDefaultCommissionHandler,
} from "./adminFinance.controller.js";
import { SplitRule } from "../../models/splitRule.model.js";
import { Venue } from "../../models/venue.model.js";

export async function adminFinanceRoutes(app, opts) {
  // Tất cả route finance admin đều yêu cầu login
  app.addHook("onRequest", requireAuth);

  // Summary + % mặc định
  app.get("/admin/finance/summary", getAdminFinanceSummaryHandler);
  app.patch("/admin/finance/default-commission", updateDefaultCommissionHandler);

  // Cấu hình hoa hồng nền tảng
  app.get("/admin/finance/split-rules", getPlatformSplitRulesHandler);
  app.post("/admin/finance/split-rules", createPlatformSplitRuleHandler);
  app.put("/admin/finance/split-rules/:id", updatePlatformSplitRuleHandler);
  app.delete("/admin/finance/split-rules/:id", deletePlatformSplitRuleHandler);

  // Lịch sử thanh toán cho nền tảng
  app.get("/admin/finance/payouts", listPlatformPayoutsHandler);
}
