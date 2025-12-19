import jwt from "jsonwebtoken";
import { User } from "../../models/user.model.js";
import { config } from "../../config/env.js";
import { hashPassword, verifyPassword } from "../../shared/utils/password.js";
import { sendVerificationEmail } from "../../shared/email/emailClient.js";
import { UserRole } from "../../models/userRole.model.js";
import { Role } from "../../models/role.model.js";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";

function generateOtp() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

function toSafeUser(user, roleCode) {
    if (!user) return null;
    return {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        emailVerified: user.emailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        role: roleCode || undefined,
        isAdminLeader: user.isAdminLeader || false,
    };
}

function signToken(user, roleCode) {
    const payload = {
        sub: user._id.toString(),
        fullName: user.fullName,
        emailVerified: user.emailVerified,
        isAdminLeader: user.isAdminLeader || false,
    };
    if (roleCode) {
        payload.role = roleCode;
    }
    const token = jwt.sign(payload, config.jwtSecret, {
        expiresIn: "1d",
    });

    return token;
}

// ========== REGISTER ==========
export async function registerUser(input) {
    const { fullName, email, phone, password } = input;

    if (!fullName || !email || !password) {
        throw new Error("fullName, email và password là bắt buộc");
    }

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) {
        throw new Error("Email đã được sử dụng");
    }

    if (phone) {
        const existingByPhone = await User.findOne({ phone });
        if (existingByPhone) {
            throw new Error("Số điện thoại đã được sử dụng");
        }
    }

    const passwordHash = await hashPassword(password);

    const otp = generateOtp();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    const user = await User.create({
        fullName,
        email,
        phone: phone || null,
        passwordHash,
        emailVerified: false,
        emailVerificationCode: otp,
        emailVerificationExpiresAt: expires,
        isActive: true,
    });

    // ⭐ GÁN ROLE CUSTOMER CHO USER MỚI
    const customerRole = await Role.findOne({ code: "CUSTOMER" });
    if (customerRole) {
        await UserRole.create({
            user: user._id,
            role: customerRole._id,
        });
    }

    try {
        await sendVerificationEmail(email, otp);
    } catch (err) {
        console.error("[Auth] sendVerificationEmail error:", err.message);
    }

    // ⭐ Trả safeUser kèm role CUSTOMER
    const safeUser = toSafeUser(user, "CUSTOMER");
    const payload = { user: safeUser };

    if (config.nodeEnv === "development") {
        payload.debugOtp = otp;
    }

    return payload;
}


// ========== VERIFY EMAIL ==========
export async function verifyEmail(input) {
    const { email, code } = input;

    const user = await User.findOne({ email });
    if (!user) throw new Error("Không tìm thấy tài khoản");

    if (!user.emailVerificationCode || !user.emailVerificationExpiresAt) {
        throw new Error("Không có mã OTP, vui lòng yêu cầu gửi lại");
    }

    const now = new Date();
    if (user.emailVerificationExpiresAt < now) {
        throw new Error("Mã OTP đã hết hạn");
    }

    if (user.emailVerificationCode !== code) {
        throw new Error("Mã OTP không chính xác");
    }

    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpiresAt = null;
    await user.save();

    const safeUser = toSafeUser(user);
    const token = signToken(user);

    return { user: safeUser, token };
}

// ========== RESEND EMAIL OTP ==========
export async function resendEmailOtp(input) {
    const { email } = input;

    const user = await User.findOne({ email });
    if (!user) throw new Error("Không tìm thấy tài khoản");

    if (user.emailVerified) {
        throw new Error("Email đã được xác minh");
    }

    const otp = generateOtp();
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    user.emailVerificationCode = otp;
    user.emailVerificationExpiresAt = expires;
    await user.save();

    try {
        await sendVerificationEmail(email, otp);
    } catch (err) {
        console.error("[Auth] resendEmailOtp error:", err.message);
    }

    const safeUser = toSafeUser(user);
    const payload = { user: safeUser };

    if (config.nodeEnv === "development") {
        payload.debugOtp = otp;
    }

    return payload;
}

export async function loginUser(input) {
    const { identifier, password } = input;

    if (!identifier || !password) {
        throw new Error("Thiếu thông tin đăng nhập");
    }

    // login bằng email hoặc phone
    const user = await User.findOne({
        $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!user) {
        throw new Error("Sai thông tin đăng nhập");
    }

    if (!user.isActive) {
        throw new Error("Tài khoản đã bị khóa");
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
        throw new Error("Sai thông tin đăng nhập");
    }

    if (!user.emailVerified) {
        // gửi lại OTP luôn khi user cố login
        const resendPayload = await resendEmailOtp({ email: user.email });

        const e = new Error("Email chưa được xác minh. Mã xác minh đã được gửi lại.");
        e.code = "EMAIL_NOT_VERIFIED";
        e.email = user.email;

        // dev mode: nếu resendEmailOtp có debugOtp thì trả luôn (tiện test)
        if (resendPayload?.debugOtp) e.debugOtp = resendPayload.debugOtp;

        throw e;
    }


    // ---- Lấy role chính của user từ userroles ----
    const userRole = await UserRole.findOne({ user: user._id }).populate("role");
    const roleCode = userRole?.role?.code || "CUSTOMER";

    // cập nhật last login
    user.lastLoginAt = new Date();
    await user.save();

    const safeUser = toSafeUser(user, roleCode);
    const token = signToken(user, roleCode);

    return { user: safeUser, token };
}


export async function loginWithGoogle(input) {
    const { credential } = input || {};
    if (!credential) {
        throw new Error("Missing Google credential");
    }
    if (!config.googleClientId) {
        throw new Error("Missing GOOGLE_CLIENT_ID in env");
    }

    const client = new OAuth2Client(config.googleClientId);

    const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new Error("Invalid Google token");

    const email = payload.email;
    const fullName = payload.name || payload.given_name || "Google User";
    const emailVerifiedFromGoogle = !!payload.email_verified;

    if (!email) throw new Error("Google account has no email");

    // 1) find user by email
    let user = await User.findOne({ email });

    // 2) create if not exist
    if (!user) {

        const randomPassword = crypto.randomBytes(32).toString("hex");
        const passwordHash = await hashPassword(randomPassword);

        user = await User.create({
            fullName,
            email,
            phone: null,
            passwordHash,
            emailVerified: emailVerifiedFromGoogle ? true : false,
            isActive: true,
            lastLoginAt: new Date(),
        });

        // gán role CUSTOMER giống register:contentReference[oaicite:6]{index=6}
        const customerRole = await Role.findOne({ code: "CUSTOMER" });
        if (customerRole) {
            await UserRole.create({ user: user._id, role: customerRole._id });
        }
    } else {
        if (!user.isActive) throw new Error("Tài khoản đã bị khóa");

        // nếu user emailVerified=false mà Google verify rồi => nâng lên true
        if (!user.emailVerified && emailVerifiedFromGoogle) {
            user.emailVerified = true;
        }

        user.lastLoginAt = new Date();
        await user.save();
    }

    // lấy role giống loginUser():contentReference[oaicite:7]{index=7}
    const userRole = await UserRole.findOne({ user: user._id }).populate("role");
    const roleCode = userRole?.role?.code || "CUSTOMER";

    const safeUser = toSafeUser(user, roleCode);
    const token = signToken(user, roleCode);

    return { user: safeUser, token };
}