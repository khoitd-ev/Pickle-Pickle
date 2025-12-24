"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;


const GOOGLE_BTN_WIDTH = 180; // px
const GOOGLE_BTN_HEIGHT = 36; // px 

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject(new Error("No window"));
    if (window.google?.accounts?.id) return resolve(true);

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(script);
  });
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");

  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 2500);
  };

  const googleBtnWrapRef = useRef(null);
  const [googleReady, setGoogleReady] = useState(false);

  const finalizeAuthAndRedirect = (data) => {
    if (data?.token) localStorage.setItem("pp_token", data.token);
    if (data?.user) localStorage.setItem("pp_user", JSON.stringify(data.user));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("pp-auth-changed"));

    const role = data?.user?.role;
    if (role === "OWNER") router.push("/owner/dashboard");
    else if (role === "ADMIN") router.push("/admin/dashboard");
    else router.push("/");
  };

  useEffect(() => {
    let cancelled = false;

    async function initGoogle() {
      try {
        if (!GOOGLE_CLIENT_ID) return;
        await loadGoogleScript();
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              setError("");
              const credential = response?.credential;
              if (!credential) throw new Error("Missing Google credential");

              const res = await fetch(`${API_BASE}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.message || "Google login failed");

              finalizeAuthAndRedirect(data);
            } catch (e) {
              setError(e?.message || "Google login failed");
            }
          },
        });

        // Render google button thật vào container ẩn (nhưng không offscreen)
        if (googleBtnWrapRef.current) {
          googleBtnWrapRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnWrapRef.current, {
            theme: "outline",
            size: "large",
            width: GOOGLE_BTN_WIDTH,
          });
        }

        setGoogleReady(true);
      } catch {
        setGoogleReady(false);
      }
    }

    initGoogle();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleGoogleClick = () => {
    setError("");

    if (!GOOGLE_CLIENT_ID) return setError("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend env");
    if (!googleReady || !googleBtnWrapRef.current) return setError("Google is not ready yet. Please try again.");


    googleBtnWrapRef.current.click();


    const realBtn = googleBtnWrapRef.current.querySelector("div[role=button], button, iframe");
    if (realBtn && typeof realBtn.click === "function") realBtn.click();
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.fullName.trim()) newErrors.fullName = "Please enter your full name";
    if (!form.email.trim()) newErrors.email = "Please enter your email";
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) newErrors.email = "Email is not valid";

    if (!form.password.trim()) newErrors.password = "Please enter your password";
    if (!form.confirmPassword.trim()) newErrors.confirmPassword = "Please re-enter your password";
    else if (form.confirmPassword !== form.password) newErrors.confirmPassword = "Password confirmation does not match";

    if (!form.phone.trim()) newErrors.phone = "Please enter your phone number";

    setErrors(newErrors);
    return Object.values(newErrors).every((v) => !v);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Register failed");

      router.push(`/verify?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      showToast(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const borderClass = (field) =>
    errors[field]
      ? "border-2 border-red-500 text-red-600 placeholder-red-400"
      : "border-2 border-black text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-black focus:border-black";

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-[#f4f4f4]">
      {/* Toast */}
      {toast.open && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"
              }`}
          >
            {toast.message}
          </div>
        </div>
      )}

      <style jsx global>{`
        .pp-google-hidden-wrap {
          position: absolute;
          left: 0;
          top: 0;
          width: ${GOOGLE_BTN_WIDTH}px;
          height: ${GOOGLE_BTN_HEIGHT}px;
          opacity: 0;
          z-index: 50; /* nằm trên để click chắc chắn */
          overflow: hidden;
        }

        .pp-google-hidden-wrap > div {
          width: ${GOOGLE_BTN_WIDTH}px !important;
          height: ${GOOGLE_BTN_HEIGHT}px !important;
        }

        .pp-google-hidden-wrap iframe {
          width: ${GOOGLE_BTN_WIDTH}px !important;
          height: ${GOOGLE_BTN_HEIGHT}px !important;
        }
      `}</style>

      <div className="relative w-[1100px] h-[580px]">
        {/* LAYER 1 */}
        <div className="absolute top-0 left-0 w-[560px] h-[580px] rounded-[40px] overflow-hidden z-0">
          <Image src="/auth/layer1.png" alt="Left Background" fill className="object-cover" priority />
        </div>

        {/* LAYER 2 */}
        <div className="absolute top-0 left-[430px] w-[560px] h-[580px] z-10">
          <div className="absolute inset-0 rounded-[40px] overflow-hidden">
            <Image src="/auth/layer2.png" alt="Card Background" fill className="object-cover" priority />
          </div>

          <div className="absolute inset-0 px-12 py-10 flex flex-col">
            <h1 className="text-[24px] font-semibold text-center mb-6 text-gray-900 tracking-wide">
              Create Account
            </h1>

            {/* Social (giữ nguyên UI) */}
            <div className="flex items-center justify-center gap-4 mb-6">

              <div className="relative" style={{ width: GOOGLE_BTN_WIDTH, height: GOOGLE_BTN_HEIGHT }}>
                {/* Google button thật (ẩn) nằm ĐÚNG vị trí nút custom */}
                <div ref={googleBtnWrapRef} className="pp-google-hidden-wrap" aria-hidden="true" />

                {/* Nút UI custom của bạn */}
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer transition w-full h-full justify-center"
                >
                  <Image src="/auth/googleIcon.svg" alt="" width={20} height={20} />
                  <span>Sign in Google</span>
                </button>
              </div>

              <button className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer transition">
                <Image src="/auth/facebookIcon.svg" alt="" width={20} height={20} />
                <span>Sign in Facebook</span>
              </button>
            </div>

            {/* {error && <p className="text-xs text-red-500 text-right -mt-3 mb-3">{error}</p>} */}

            {/* Divider */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="w-28 h-px bg-gray-300" />
              <span className="text-xs text-gray-500">OR</span>
              <span className="w-28 h-px bg-gray-300" />
            </div>

            {/* FORM */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <div className="relative">
                <label className="absolute -top-2 left-4 bg-white px-1 text-xs text-gray-800">
                  Full name
                </label>
                <input
                  value={form.fullName}
                  onChange={handleChange("fullName")}
                  className={`w-full rounded-lg px-4 pt-4 pb-2 text-sm bg-white outline-none transition-colors ${borderClass(
                    "fullName"
                  )}`}
                  placeholder={errors.fullName || "Please enter your full name"}
                  type="text"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <label className="absolute -top-2 left-4 bg-white px-1 text-xs text-gray-800">Email</label>
                <input
                  value={form.email}
                  onChange={handleChange("email")}
                  className={`w-full rounded-lg px-4 pt-4 pb-2 text-sm bg-white outline-none transition-colors ${borderClass(
                    "email"
                  )}`}
                  placeholder={errors.email || "Please enter your email"}
                  type="email"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <label className="absolute -top-2 left-4 bg-white px-1 text-xs text-gray-800">
                  Phone number
                </label>
                <div
                  className={`flex items-center rounded-lg bg-white overflow-hidden transition-colors ${errors.phone
                    ? "border-2 border-red-500"
                    : "border-2 border-black focus-within:ring-2 focus-within:ring-black focus-within:border-black"
                    }`}
                >
                  <span className={`pl-4 pr-2 text-sm ${errors.phone ? "text-red-600" : "text-gray-800"}`}>
                    +84
                  </span>
                  <input
                    value={form.phone}
                    onChange={handleChange("phone")}
                    className={`flex-1 py-3 pr-4 text-sm outline-none ${errors.phone ? "text-red-600 placeholder-red-400" : "text-gray-800 placeholder-gray-400"
                      }`}
                    placeholder={errors.phone || "Please enter your phone number"}
                    type="tel"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="relative">
                <label className="absolute -top-2 left-4 bg-white px-1 text-xs text-gray-800">
                  Password
                </label>
                <input
                  value={form.password}
                  onChange={handleChange("password")}
                  className={`w-full rounded-lg px-4 pt-4 pb-2 text-sm bg-white outline-none transition-colors ${borderClass(
                    "password"
                  )}`}
                  placeholder={errors.password || "Please enter your password"}
                  type="password"
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <label className="absolute -top-2 left-4 bg-white px-1 text-xs text-gray-800">
                  Confirm Password
                </label>
                <input
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  className={`w-full rounded-lg px-4 pt-4 pb-2 text-sm bg-white outline-none transition-colors ${borderClass(
                    "confirmPassword"
                  )}`}
                  placeholder={errors.confirmPassword || "Please re-enter your password"}
                  type="password"
                />
              </div>

              <p className="mt-2 text-xs text-gray-500 text-right">
                Already have an account?{" "}
                <Link href="/login" className="italic text-gray-800 hover:underline">
                  Login.
                </Link>
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 w-[220px] mx-auto py-3 rounded-full bg-black text-white text-sm hover:bg-black/80 hover:shadow-lg transition duration-150 active:translate-y-[1px] disabled:opacity-60"
              >
                {submitting ? "Creating..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>

        {/* ROCKET */}
        <div className="absolute left-[30px] top-[140px] w-[400px] h-[340px] z-20 pointer-events-none">
          <Image src="/auth/rocketlogin.png" alt="Rocket" fill className="object-contain" priority />
        </div>
      </div>
    </div>
  );
}
