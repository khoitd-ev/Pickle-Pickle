// backend/src/modules/adminFinance/adminFinance.service.js
import mongoose from "mongoose";
import { Payment } from "../../models/payment.model.js";
import { PaymentStatus } from "../../models/paymentStatus.model.js";
import { SplitRule } from "../../models/splitRule.model.js";
import { SystemSetting } from "../../models/systemSetting.model.js";
import { PlatformPayout } from "../../models/platformPayout.model.js";
import { assertAdminManager } from "../users/user.service.js";

const DEFAULT_COMMISSION_KEY = "platform.defaultCommissionPercent";
const DEFAULT_COMMISSION_FALLBACK = 10; // 10%

async function getDefaultCommissionPercent() {
    const doc = await SystemSetting.findOne({ key: DEFAULT_COMMISSION_KEY });
    if (!doc) return DEFAULT_COMMISSION_FALLBACK;

    const val = Number(doc.value);
    if (Number.isNaN(val)) return DEFAULT_COMMISSION_FALLBACK;
    return val;
}

export async function updateDefaultCommissionPercentService(
    adminId,
    percent
) {
    await assertAdminManager(adminId);

    const value = Number(percent);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
        const err = new Error("Invalid commission percent");
        err.statusCode = 400;
        throw err;
    }

    const doc = await SystemSetting.findOneAndUpdate(
        { key: DEFAULT_COMMISSION_KEY },
        { value },
        { upsert: true, new: true }
    );

    return { percent: Number(doc.value) };
}

// ============ SUMMARY (3 ô trên đầu) ============

export async function getAdminFinanceSummaryService(adminId) {
    await assertAdminManager(adminId);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );

    const successStatus = await PaymentStatus.findOne({ code: "SUCCEEDED" });
    if (!successStatus) {
        const err = new Error("PaymentStatus SUCCEEDED not found");
        err.statusCode = 500;
        throw err;
    }

    // Tổng doanh thu xử lý (tháng này) = tổng amount các payment thành công
    const agg = await Payment.aggregate([
        {
            $match: {
                status: successStatus._id,
                createdAt: { $gte: monthStart, $lte: monthEnd },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
            },
        },
    ]);

    const totalProcessedRevenue = agg[0]?.total || 0;

    const defaultCommissionPercent = await getDefaultCommissionPercent();
    const platformCommissionThisMonth = Math.round(
        (totalProcessedRevenue * defaultCommissionPercent) / 100
    );

    // Đã thanh toán cho nền tảng trong tháng (từ PlatformPayout, status = PAID)
    const payoutAgg = await PlatformPayout.aggregate([
        {
            $match: {
                status: "PAID",
                periodFrom: { $lte: monthEnd },
                periodTo: { $gte: monthStart },
            },
        },
        {
            $group: {
                _id: null,
                total: { $sum: "$amount" },
            },
        },
    ]);

    const paidToPlatform = payoutAgg[0]?.total || 0;
    const needToPayPlatform = Math.max(
        0,
        platformCommissionThisMonth - paidToPlatform
    );

    return {
        summary: {
            totalProcessedRevenue,
            platformCommissionThisMonth,
            needToPayPlatform,
        },
        defaultCommissionPercent,
    };
}


// ============ CẤU HÌNH HOA HỒNG NỀN TẢNG ============

export async function listPlatformSplitRulesService(adminId, { type }) {
  await assertAdminManager(adminId);

  const rules = await SplitRule.find({})
    .populate("venue", "name")
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();

  // Map + tự tính trạng thái hiện tại
  const mapped = rules.map((r) => {
    // Nếu isActive chưa có (dữ liệu cũ) thì coi như true
    const manualFlag = r.isActive !== false;

    let inDateRange = true;
    if (r.effectiveFrom) {
      inDateRange = inDateRange && r.effectiveFrom <= now;
    }
    if (r.effectiveTo) {
      inDateRange = inDateRange && r.effectiveTo >= now;
    }

    // Trạng thái đang áp dụng = bật tay + nằm trong khoảng ngày
    const isCurrentlyActive = manualFlag && inDateRange;

    return {
      id: r._id.toString(),
      venueId: r.venue?._id?.toString() || null,
      venueName: r.venue?.name || "Toàn hệ thống",
      platformSharePercent: r.platformSharePercent,
      effectiveFrom: r.effectiveFrom,
      effectiveTo: r.effectiveTo,
      note: r.note || "",
      // FE dùng field này để hiển thị (Đang áp dụng) / (Đã ngưng)
      isActive: isCurrentlyActive,
    };
  });

  // Áp dụng filter theo loại cấu hình
  let filtered = mapped;
  if (type === "active") {
    filtered = mapped.filter((r) => r.isActive);
  } else if (type === "inactive") {
    filtered = mapped.filter((r) => !r.isActive);
  }

  return filtered;
}



export async function createPlatformSplitRuleService(adminId, payload) {
    await assertAdminManager(adminId);

    const {
        venueId,
        platformSharePercent,
        effectiveFrom,
        effectiveTo,
        note,
        isActive = true,
    } = payload;

    if (!venueId) {
        const err = new Error("venueId is required");
        err.statusCode = 400;
        throw err;
    }

    const value = Number(platformSharePercent);
    if (!Number.isFinite(value) || value < 0 || value > 100) {
        const err = new Error("Invalid platformSharePercent");
        err.statusCode = 400;
        throw err;
    }

    const doc = await SplitRule.create({
        venue: new mongoose.Types.ObjectId(venueId),
        platformSharePercent: value,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null,
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        note: note || "",
        isActive,
        createdBy: adminId,
    });

    return { id: doc._id.toString() };
}

export async function updatePlatformSplitRuleService(adminId, id, payload) {
    await assertAdminManager(adminId);

    const value = payload.platformSharePercent;
    if (value != null) {
        const v = Number(value);
        if (!Number.isFinite(v) || v < 0 || v > 100) {
            const err = new Error("Invalid platformSharePercent");
            err.statusCode = 400;
            throw err;
        }
    }

    const update = {};
    if (payload.platformSharePercent != null)
        update.platformSharePercent = Number(payload.platformSharePercent);
    if (payload.effectiveFrom != null)
        update.effectiveFrom = payload.effectiveFrom
            ? new Date(payload.effectiveFrom)
            : null;
    if (payload.effectiveTo != null)
        update.effectiveTo = payload.effectiveTo
            ? new Date(payload.effectiveTo)
            : null;
    if (payload.note != null) update.note = payload.note;
    if (payload.isActive != null) update.isActive = !!payload.isActive;

    update.updatedBy = adminId;

    const doc = await SplitRule.findByIdAndUpdate(id, update, { new: true });
    if (!doc) {
        const err = new Error("SplitRule not found");
        err.statusCode = 404;
        throw err;
    }

    return { id: doc._id.toString() };
}

export async function deletePlatformSplitRuleService(adminId, id) {
    await assertAdminManager(adminId);

    const doc = await SplitRule.findById(id);
    if (!doc) {
        const err = new Error("SplitRule not found");
        err.statusCode = 404;
        throw err;
    }

    await SplitRule.deleteOne({ _id: id });
    return { success: true };
}

// ============ LỊCH SỬ THANH TOÁN CHO NỀN TẢNG ============

export async function listPlatformPayoutsService(
    adminId,
    { status, from, to, page = 1, limit = 10 }
) {
    await assertAdminManager(adminId);

    const filter = {};
    if (status && status !== "ALL") {
        filter.status = status;
    }

    if (from || to) {
        filter.periodFrom = filter.periodFrom || {};
        filter.periodTo = filter.periodTo || {};
        if (from) {
            const d = new Date(from);
            d.setHours(0, 0, 0, 0);
            filter.periodFrom.$gte = d;
        }
        if (to) {
            const d = new Date(to);
            d.setHours(23, 59, 59, 999);
            filter.periodTo.$lte = d;
        }
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
        PlatformPayout.find(filter)
            .populate("venue", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        PlatformPayout.countDocuments(filter),
    ]);

    return {
        items: items.map((p) => ({
            id: p._id.toString(),
            code: p.code,
            venueName: p.venue?.name || "",
            periodFrom: p.periodFrom,
            periodTo: p.periodTo,
            amount: p.amount,
            status: p.status,
            updatedAt: p.updatedAt,
        })),
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
        },
    };
}
