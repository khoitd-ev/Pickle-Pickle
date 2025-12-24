import { Role } from "../models/role.model.js";
import { BookingStatus } from "../models/bookingStatus.model.js";
import { PaymentStatus } from "../models/paymentStatus.model.js";
import { ensureVenuesAndCourts } from "./seedVenuesAndCourts.js";
import { ensureAddons } from "./seedAddons.js";
import { User } from "../models/user.model.js";
import { UserRole } from "../models/userRole.model.js";
import { hashPassword } from "../shared/utils/password.js";

// ==== ROLES ==================================================
async function ensureRoles() {
  const roles = [
    { code: "CUSTOMER", name: "Khách đặt sân" },
    { code: "OWNER", name: "Chủ sân" },
    { code: "ADMIN", name: "Quản trị hệ thống" },
  ];

  for (const r of roles) {
    await Role.updateOne({ code: r.code }, r, { upsert: true });
  }
  console.log(" Default roles ensured");
}

// ==== BOOKING STATUSES =======================================
async function ensureBookingStatuses() {
  const statuses = [
    {
      code: "PENDING",
      label: "Chờ thanh toán",
      description: "Booking đã tạo, đang chờ thanh toán hoặc xác nhận.",
      isFinal: false,
      isCancel: false,
    },
    {
      code: "CONFIRMED",
      label: "Đã xác nhận",
      description: "Thanh toán thành công hoặc chủ sân đã xác nhận.",
      isFinal: false,
      isCancel: false,
    },
    {
      code: "COMPLETED",
      label: "Hoàn tất",
      description: "Khách đã chơi xong.",
      isFinal: true,
      isCancel: false,
    },
    {
      code: "CANCELLED",
      label: "Đã hủy",
      description: "Booking đã bị hủy.",
      isFinal: true,
      isCancel: true,
    },
    {
      code: "NO_SHOW",
      label: "Không đến",
      description: "Khách không đến sân.",
      isFinal: true,
      isCancel: true,
    },
  ];

  for (const s of statuses) {
    await BookingStatus.updateOne({ code: s.code }, s, { upsert: true });
  }
  console.log(" Default booking statuses ensured");
}

// ==== PAYMENT STATUSES =======================================
async function ensurePaymentStatuses() {
  const statuses = [
    {
      code: "PENDING",
      label: "Đang thanh toán",
      description: "Đã tạo yêu cầu thanh toán, chưa có kết quả cuối.",
      isSuccess: false,
      isFinal: false,
    },
    {
      code: "SUCCEEDED",
      label: "Thanh toán thành công",
      description: "Thanh toán thành công từ cổng (VNPay/MoMo...).",
      isSuccess: true,
      isFinal: true,
    },
    {
      code: "FAILED",
      label: "Thanh toán thất bại",
      description: "Thanh toán thất bại hoặc lỗi kỹ thuật.",
      isSuccess: false,
      isFinal: true,
    },
    {
      code: "CANCELLED",
      label: "Hủy thanh toán",
      description: "Khách hoặc hệ thống hủy giao dịch.",
      isSuccess: false,
      isFinal: true,
    },
  ];

  for (const s of statuses) {
    await PaymentStatus.updateOne({ code: s.code }, s, { upsert: true });
  }
  console.log(" Default payment statuses ensured");
}

async function ensureDefaultAccounts() {
  // ---- 1) ADMIN GỐC (LEADER) ----
  let admin = await User.findOne({ email: "admin@admin.com" });

  if (!admin) {
    admin = await User.create({
      email: "admin@admin.com",
      fullName: "System Administrator",
      phone: "0999999999",
      isActive: true,
      emailVerified: true,
      passwordHash: await hashPassword("admin"),
      isAdminLeader: true,
      canManageAdmins: true,
    });
    console.log("Default admin created");
  } else {
    // Đảm bảo admin seed luôn là leader + có quyền manage admin
    let changed = false;
    if (!admin.isAdminLeader) {
      admin.isAdminLeader = true;
      changed = true;
    }
    if (!admin.canManageAdmins) {
      admin.canManageAdmins = true;
      changed = true;
    }
    if (!admin.isActive) {
      admin.isActive = true;
      changed = true;
    }
    if (!admin.emailVerified) {
      admin.emailVerified = true;
      changed = true;
    }
    if (changed) {
      await admin.save();
      console.log("Default admin updated with leader/admin flags");
    } else {
      console.log("Default admin already exists");
    }
  }

  const adminRole = await Role.findOne({ code: "ADMIN" });
  if (adminRole) {
    await UserRole.updateOne(
      { user: admin._id, role: adminRole._id },
      { user: admin._id, role: adminRole._id },
      { upsert: true }
    );
  }

  // ---- 2) OWNER ----
  let owner = await User.findOne({ email: "owner@owner.com" });

  if (!owner) {
    owner = await User.create({
      email: "owner@owner.com",
      fullName: "Default Court Owner",
      phone: "0888888888",
      isActive: true,
      emailVerified: true,
      passwordHash: await hashPassword("owner"),
    });

    const ownerRole = await Role.findOne({ code: "OWNER" });

    await UserRole.create({
      user: owner._id,
      role: ownerRole._id,
    });

    console.log("Default owner created");
  } else {
    console.log("Default owner already exists");
  }
  // ---- 3) GUEST SYSTEM USER ----
  let guest = await User.findOne({ email: "guest@picklepickle.local" });

  if (!guest) {
    guest = await User.create({
      email: "guest@picklepickle.local",
      fullName: "Guest System",
      phone: "0000000000",
      isActive: true,
      emailVerified: true,
      passwordHash: await hashPassword("guest"),
    });

    const customerRole = await Role.findOne({ code: "CUSTOMER" });
    if (customerRole) {
      await UserRole.create({
        user: guest._id,
        role: customerRole._id,
      });
    }

    console.log("Default guest system user created");
  }


  // QUAN TRỌNG: trả về để dùng tiếp
  return { admin, owner };
}


// ==== ENTRY POINT: được gọi trong server.js ==================
export async function ensureDefaults() {
  await ensureRoles();
  await ensureBookingStatuses();

  const { admin, owner } = await ensureDefaultAccounts();

  await ensurePaymentStatuses();

  // Truyền owner vào, để seed venue gắn manager = owner
  await ensureVenuesAndCourts(owner);

  await ensureAddons();
}