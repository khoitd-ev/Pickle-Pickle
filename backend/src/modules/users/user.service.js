// src/modules/users/user.service.js
import mongoose from "mongoose";
import { User } from "../../models/user.model.js";
import { Role } from "../../models/role.model.js";
import { UserRole } from "../../models/userRole.model.js";
import { verifyPassword,hashPassword } from "../../shared/utils/password.js";
import { HttpError } from "../../shared/errors/httpError.js";
import { Venue } from "../../models/venue.model.js";

const ADMIN_STATUS = ["ACTIVE", "PENDING", "INACTIVE"];

async function getAdminRole() {
  const role = await Role.findOne({ code: "ADMIN" });
  if (!role) throw new Error("Role ADMIN is not defined");
  return role;
}

// Chuyển status string <-> flags trong user
function statusToFlags(status) {
  switch (status) {
    case "ACTIVE":
      return { isActive: true, emailVerified: true };
    case "PENDING":
      return { isActive: true, emailVerified: false };
    case "INACTIVE":
      return { isActive: false, emailVerified: false };
    default:
      throw HttpError.badRequest("Invalid status");
  }
}

function flagsToStatus(user) {
  if (!user.isActive) return "INACTIVE";
  if (!user.emailVerified) return "PENDING";
  return "ACTIVE";
}

// Chỉ những user: có role ADMIN + canManageAdmins = true mới được quản lý admin
export async function assertAdminManager(currentUserId) {
  if (!currentUserId) {
    throw HttpError.unauthorized("Unauthorized");
  }

  const adminRole = await getAdminRole();

  const user = await User.findById(currentUserId);
  if (!user || !user.isActive) {
    throw HttpError.forbidden("No permission");
  }

  const mapping = await UserRole.findOne({
    user: user._id,
    role: adminRole._id,
  });

  if (!mapping || !user.canManageAdmins) {
    throw HttpError.forbidden("No permission to manage admins");
  }

  return user;
}

function mapAdminUser(user) {
  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
    status: flagsToStatus(user),
    canManageAdmins: !!user.canManageAdmins,
    isAdminLeader: !!user.isAdminLeader,
  };
}

export async function listAdminsService(currentUserId) {
  await assertAdminManager(currentUserId);

  const adminRole = await getAdminRole();

  const userRoles = await UserRole.find({ role: adminRole._id })
    .populate("user")
    .exec();

  const admins = userRoles
    .map((ur) => ur.user)
    .filter((u) => !!u);

  return admins.map(mapAdminUser);
}

export async function createAdminService(currentUserId, payload) {
  await assertAdminManager(currentUserId);

  const { fullName, email, phone, password, status, canManageAdmins } =
    payload || {};

  if (!fullName || !email || !password || !status) {
    throw HttpError.badRequest("fullName, email, password, status are required");
  }

  if (!ADMIN_STATUS.includes(status)) {
    throw HttpError.badRequest("Invalid status");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw HttpError.badRequest("Email already exists");
  }

  const { isActive, emailVerified } = statusToFlags(status);

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    email,
    fullName,
    phone,
    passwordHash,
    isActive,
    emailVerified,
    isAdminLeader: false,
    canManageAdmins: !!canManageAdmins,
  });

  const adminRole = await getAdminRole();
  await UserRole.create({ user: user._id, role: adminRole._id });

  return mapAdminUser(user);
}

export async function updateAdminService(currentUserId, adminId, payload) {
  const currentUser = await assertAdminManager(currentUserId);

  if (!mongoose.isValidObjectId(adminId)) {
    throw HttpError.badRequest("Invalid adminId");
  }

  const adminRole = await getAdminRole();

  const userRole = await UserRole.findOne({
    user: adminId,
    role: adminRole._id,
  }).populate("user");

  if (!userRole || !userRole.user) {
    throw HttpError.notFound("Admin not found");
  }

  const user = userRole.user;

  // Không cho chỉnh quyền leader qua API, tránh lock mất admin gốc
  const { fullName, phone, status, password, canManageAdmins } = payload || {};

  if (!fullName || !status) {
    throw HttpError.badRequest("fullName and status are required");
  }

  if (!ADMIN_STATUS.includes(status)) {
    throw HttpError.badRequest("Invalid status");
  }

  // Không cho current admin tự disable quyền manage hoặc tự inactive nếu là leader
  if (user.isAdminLeader && currentUser._id.equals(user._id)) {
    // chỉ cho đổi tên / phone / password, không đổi status & quyền
    user.fullName = fullName;
    user.phone = phone || user.phone;
    if (password) {
      user.passwordHash = await hashPassword(password);
    }
    await user.save();
    return mapAdminUser(user);
  }

  const { isActive, emailVerified } = statusToFlags(status);

  user.fullName = fullName;
  user.phone = phone || user.phone;
  user.isActive = isActive;
  user.emailVerified = emailVerified;
  user.canManageAdmins = !!canManageAdmins;

  if (password) {
    user.passwordHash = await hashPassword(password);
  }

  await user.save();
  return mapAdminUser(user);
}

export async function deleteAdminService(currentUserId, adminId) {
  const currentUser = await assertAdminManager(currentUserId);

  if (!mongoose.isValidObjectId(adminId)) {
    throw HttpError.badRequest("Invalid adminId");
  }

  const adminRole = await getAdminRole();

  const userRole = await UserRole.findOne({
    user: adminId,
    role: adminRole._id,
  }).populate("user");

  if (!userRole || !userRole.user) {
    throw HttpError.notFound("Admin not found");
  }

  const user = userRole.user;

  if (user.isAdminLeader) {
    throw HttpError.forbidden("Cannot delete leader admin");
  }

  if (currentUser._id.equals(user._id)) {
    throw HttpError.forbidden("Cannot delete yourself");
  }

  await UserRole.deleteMany({ user: user._id, role: adminRole._id });
  await User.deleteOne({ _id: user._id });

  return { success: true };
}



// ==============================
// CUSTOMER MANAGEMENT
// ==============================

const CUSTOMER_STATUS = ["ACTIVE", "PENDING", "INACTIVE"];

async function getCustomerRole() {
  const role = await Role.findOne({ code: "CUSTOMER" });
  if (!role) throw new Error("Role CUSTOMER is not defined");
  return role;
}

function mapCustomerUser(user) {
  const status = flagsToStatus(user).toLowerCase(); // active | pending | inactive

  return {
    id: user._id.toString(),
    name: user.fullName || "",      // FE dùng field "name"
    fullName: user.fullName || "",  // để dành nếu cần
    email: user.email,
    phone: user.phone || "",
    address: user.address || "",
    status,                         // "active" | "pending" | "inactive"
    createdAt: user.createdAt,
  };
}

export async function listCustomerUsersService(currentUserId, filters = {}) {
  await assertAdminManager(currentUserId);

  const customerRole = await getCustomerRole();

  const userRoles = await UserRole.find({ role: customerRole._id })
    .populate("user")
    .exec();

  let users = userRoles.map((ur) => ur.user).filter(Boolean);

  const { search, status } = filters;

  // filter status (active/pending/inactive) nếu FE có gửi
  if (status && status !== "all") {
    users = users.filter(
      (u) => flagsToStatus(u).toLowerCase() === status.toLowerCase()
    );
  }

  // search theo tên / email / phone
  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    users = users.filter((u) => {
      return (
        u.fullName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q)
      );
    });
  }

  // sort mặc định: mới nhất trước
  users.sort((a, b) => {
    const da = new Date(a.createdAt || 0).getTime();
    const db = new Date(b.createdAt || 0).getTime();
    return db - da;
  });

  return users.map(mapCustomerUser);
}

export async function createCustomerUserService(currentUserId, payload = {}) {
  await assertAdminManager(currentUserId);

  const { fullName, email, phone, address, password, status } = payload;

  if (!fullName || !email || !password || !status) {
    throw HttpError.badRequest(
      "fullName, email, password, status are required"
    );
  }

  const upperStatus = status.toUpperCase();
  if (!CUSTOMER_STATUS.includes(upperStatus)) {
    throw HttpError.badRequest("Invalid status");
  }

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw HttpError.badRequest("Email already exists");
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      throw HttpError.badRequest("Phone already exists");
    }
  }

  const { isActive, emailVerified } = statusToFlags(upperStatus);
  const passwordHash = await hashPassword(password);

  const user = await User.create({
    email,
    fullName,
    phone,
    address,
    passwordHash,
    isActive,
    emailVerified,
  });

  const customerRole = await getCustomerRole();
  await UserRole.create({ user: user._id, role: customerRole._id });

  return mapCustomerUser(user);
}

export async function updateCustomerUserService(
  currentUserId,
  userId,
  payload = {}
) {
  await assertAdminManager(currentUserId);

  if (!mongoose.isValidObjectId(userId)) {
    throw HttpError.badRequest("Invalid userId");
  }

  const customerRole = await getCustomerRole();

  const userRole = await UserRole.findOne({
    user: userId,
    role: customerRole._id,
  }).populate("user");

  if (!userRole || !userRole.user) {
    throw HttpError.notFound("User not found");
  }

  const user = userRole.user;

  const { fullName, phone, address, password, status } = payload;

  if (!fullName || !status) {
    throw HttpError.badRequest("fullName and status are required");
  }

  const upperStatus = status.toUpperCase();
  if (!CUSTOMER_STATUS.includes(upperStatus)) {
    throw HttpError.badRequest("Invalid status");
  }

  const { isActive, emailVerified } = statusToFlags(upperStatus);

  user.fullName = fullName;
  user.phone = phone ?? user.phone;
  user.address = address ?? user.address;
  user.isActive = isActive;
  user.emailVerified = emailVerified;

  if (password) {
    user.passwordHash = await hashPassword(password);
  }

  await user.save();
  return mapCustomerUser(user);
}

export async function deleteCustomerUserService(currentUserId, userId) {
  await assertAdminManager(currentUserId);

  if (!mongoose.isValidObjectId(userId)) {
    throw HttpError.badRequest("Invalid userId");
  }

  const customerRole = await getCustomerRole();

  const userRole = await UserRole.findOne({
    user: userId,
    role: customerRole._id,
  }).populate("user");

  if (!userRole || !userRole.user) {
    throw HttpError.notFound("User not found");
  }

  const user = userRole.user;

  // Soft delete: chuyển sang INACTIVE
  const { isActive, emailVerified } = statusToFlags("INACTIVE");
  user.isActive = isActive;
  user.emailVerified = emailVerified;

  await user.save();

  return { success: true };
}


// ==============================
// OWNER MANAGEMENT
// ==============================

export const OWNER_STATUS = {
  ACTIVE: "ACTIVE",
  PENDING: "PENDING",
  INACTIVE: "INACTIVE",
};


async function getOwnerRole() {
  const role = await Role.findOne({ code: "OWNER" }).lean();
  if (!role) {
    throw new HttpError(500, "OWNER role is not configured");
  }
  return role;
}


function mapOwnerUser(user) {
  const status = flagsToStatus(user); // dùng chung hàm đang có

  return {
    id: user._id.toString(),
    fullName: user.fullName || "",
    email: user.email,
    phone: user.phone || "",
    address: user.address || "",
    status, // "ACTIVE" | "PENDING" | "INACTIVE"
    createdAt: user.createdAt,
  };
}

/**
 * Danh sách chủ sân cho admin
 */
export async function listOwnerUsersService(adminId, query = {}) {
  await assertAdminManager(adminId); // đã có sẵn trong file

  const { search = "", status = "ALL" } = query;

  const ownerRole = await getOwnerRole();

  const userRoleDocs = await UserRole.find({ role: ownerRole._id })
    .select("user")
    .lean();

  const ownerIds = userRoleDocs.map((ur) => ur.user);
  if (ownerIds.length === 0) return [];

  const filter = { _id: { $in: ownerIds } };

  if (status && status !== "ALL") {
    const flags = statusToFlags(status);
    filter.isActive = flags.isActive;
    // LƯU Ý: admin tạo owner -> luôn emailVerified = true
    filter.emailVerified = true;
  }

  if (search) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
  }

  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .lean();

  if (users.length === 0) return [];

  
  const ownerObjectIds = users.map((u) => u._id);

  const counts = await Venue.aggregate([
    { $match: { manager: { $in: ownerObjectIds } } },
    { $group: { _id: "$manager", count: { $sum: 1 } } },
  ]);

  const countMap = counts.reduce((acc, cur) => {
    acc[cur._id.toString()] = cur.count;
    return acc;
  }, {});

  return users.map((u) => ({
    ...mapOwnerUser(u),
    venuesCount: countMap[u._id.toString()] || 0,
  }));
}


/**
 * Tạo chủ sân mới (admin tạo -> auto emailVerified = true)
 */
export async function createOwnerUserService(adminId, payload = {}) {
  await assertAdminManager(adminId);

  // THÊM address vào destructuring
  const {
    fullName,
    email,
    phone,
    password,
    status = "ACTIVE",
    address,
  } = payload;

  if (!email) throw new HttpError(400, "Email là bắt buộc");
  if (!password) throw new HttpError(400, "Mật khẩu là bắt buộc");

  const existed = await User.findOne({ email }).lean();
  if (existed) {
    throw new HttpError(400, "Email đã tồn tại");
  }

  const normalizedStatus = (status || "ACTIVE").toUpperCase();
  const flags = statusToFlags(normalizedStatus);

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    email,
    fullName: fullName || email,
    phone: phone || "",
    address: address || "",
    passwordHash,
    isActive: flags.isActive,
    // IMPORTANT: admin tạo -> không cần verify email nữa
    emailVerified: true,
  });

  const ownerRole = await getOwnerRole();
  await UserRole.create({
    user: user._id,
    role: ownerRole._id,
  });

  return mapOwnerUser(user.toObject());
}

/**
 * Cập nhật chủ sân
 */
export async function updateOwnerUserService(adminId, ownerId, payload = {}) {
  await assertAdminManager(adminId);

  const ownerRole = await getOwnerRole();

  // Đảm bảo user này là OWNER
  const userRole = await UserRole.findOne({
    user: ownerId,
    role: ownerRole._id,
  }).lean();
  if (!userRole) {
    throw new HttpError(404, "Không tìm thấy chủ sân");
  }

  // THÊM address + password vào destructuring
  const { fullName, phone, status, address, password } = payload;

  const update = {};
  if (fullName !== undefined) update.fullName = fullName;
  if (phone !== undefined) update.phone = phone;

  if (status) {
    const normalizedStatus = status.toUpperCase();
    const flags = statusToFlags(normalizedStatus);
    update.isActive = flags.isActive;
    // vẫn luôn giữ emailVerified = true
    update.emailVerified = true;
  }

  if (address !== undefined) {
    update.address = address;        // <-- giờ address đã được destructuring
  }

  if (password) {
    update.passwordHash = await hashPassword(password); // cho phép reset password
  }

  const user = await User.findByIdAndUpdate(ownerId, update, {
    new: true,
  }).lean();

  if (!user) throw new HttpError(404, "Không tìm thấy chủ sân");

  return mapOwnerUser(user);
}

/**
 * Xoá (vô hiệu hoá) chủ sân
 * -> chỉ cho phép xoá nếu không còn sân nào gán cho chủ này
 */
export async function deleteOwnerUserService(adminId, ownerId) {
  await assertAdminManager(adminId);

  const ownerRole = await getOwnerRole();

  const userRole = await UserRole.findOne({
    user: ownerId,
    role: ownerRole._id,
  }).lean();

  if (!userRole) {
    throw new HttpError(404, "Không tìm thấy chủ sân");
  }

  const venueCount = await Venue.countDocuments({ manager: ownerId });
  if (venueCount > 0) {
    throw new HttpError(
      400,
      "Chủ sân vẫn còn sân đang quản lý, hãy chuyển chủ hoặc xoá sân trước."
    );
  }

  const user = await User.findByIdAndUpdate(
    ownerId,
    { isActive: false },
    { new: true }
  ).lean();

  if (!user) throw new HttpError(404, "Không tìm thấy chủ sân");

  return { success: true };
}




const pickSafeUser = (u) => ({
  _id: u._id,
  fullName: u.fullName,
  email: u.email,
  phone: u.phone,
  nickname: u.nickname,
  gender: u.gender,
  birthday: u.birthday,
  address: u.address,
  role: u.role,
  isActive: u.isActive,
  emailVerified: u.emailVerified,
});

export async function getMeService(userId) {
  if (!userId) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(userId).lean();
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return pickSafeUser(user);
}

export async function updateMeService(userId, payload) {
  if (!userId) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }

  // allowlist field (tránh user tự patch role/emailVerified…)
  const update = {};
  if (typeof payload.fullName === "string") update.fullName = payload.fullName.trim();
  if (typeof payload.phone === "string") update.phone = payload.phone.trim();
  if (typeof payload.nickname === "string") update.nickname = payload.nickname.trim();
  if (typeof payload.gender === "string") update.gender = payload.gender;
  if (payload.birthday === null || typeof payload.birthday === "string") {
    update.birthday = payload.birthday ? new Date(payload.birthday) : null;
  }
  if (typeof payload.address === "string") update.address = payload.address.trim();

  const user = await User.findByIdAndUpdate(userId, update, { new: true }).lean();
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  return pickSafeUser(user);
}

export async function changeMyPasswordService(userId, { currentPassword, newPassword }) {
  if (!userId) {
    const err = new Error("Unauthorized");
    err.statusCode = 401;
    throw err;
  }
  if (!currentPassword || !newPassword) {
    const err = new Error("currentPassword and newPassword are required");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) {
    const err = new Error("Mật khẩu hiện tại không đúng");
    err.statusCode = 400;
    throw err;
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
}