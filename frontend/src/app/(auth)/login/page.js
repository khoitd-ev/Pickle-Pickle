"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;


const GOOGLE_BTN_WIDTH = 180;
const GOOGLE_BTN_HEIGHT = 36;

// ---- Load Google Identity script once (per page) ----
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

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState(""); // email hoặc phone
  const [password, setPassword] = useState("");
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

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pp-auth-changed"));
    }

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
          ux_mode: "popup",
          auto_select: false,
        });


        if (googleBtnWrapRef.current) {
          googleBtnWrapRef.current.innerHTML = "";
          window.google.accounts.id.renderButton(googleBtnWrapRef.current, {
            theme: "outline",
            size: "large",
            width: GOOGLE_BTN_WIDTH,
          });
        }

        setGoogleReady(true);
      } catch (e) {
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

    // Click trực tiếp wrapper
    googleBtnWrapRef.current.click();

    // Fallback nếu browser cần click element con
    const realBtn = googleBtnWrapRef.current.querySelector("div[role=button], button, iframe");
    if (realBtn && typeof realBtn.click === "function") realBtn.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password.trim()) {
      setError("Please enter your email and password");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // NEW: nếu chưa verify -> chuyển sang verify + backend đã gửi OTP
        if (data?.code === "EMAIL_NOT_VERIFIED") {
          showToast(
            data?.message || "Email chưa được xác minh. Mã xác minh đã được gửi lại.",
            "error"
          );
          const targetEmail = data?.email || identifier;
          router.push(`/verify?email=${encodeURIComponent(targetEmail)}`);
          return;
        }

        throw new Error(data?.message || "Login failed");
      }

      finalizeAuthAndRedirect(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
          z-index: 50;
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

      {/* WRAPPER */}
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

          {/* Nội dung form */}
          <div className="absolute inset-0 px-12 py-10 flex flex-col">
            <h1 className="text-[24px] font-semibold text-center mb-6 text-gray-900">
              Log in with your Account
            </h1>

            {/* SOCIAL BUTTONS */}
            <div className="flex items-center justify-center gap-4 mb-6">

              <div className="relative" style={{ width: GOOGLE_BTN_WIDTH, height: GOOGLE_BTN_HEIGHT }}>
                <div ref={googleBtnWrapRef} className="pp-google-hidden-wrap" aria-hidden="true" />

                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer transition w-full h-full justify-center"
                >
                  <Image src="/auth/googleIcon.svg" alt="" width={20} height={20} />
                  <span>Log in Google</span>
                </button>
              </div>

              <button className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer transition">
                <Image src="/auth/facebookIcon.svg" alt="" width={20} height={20} />
                <span>Log in Facebook</span>
              </button>
            </div>

            {/* DIVIDER */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="w-24 h-px bg-gray-300" />
              <span className="text-xs text-gray-500">OR</span>
              <span className="w-24 h-px bg-gray-300" />
            </div>

            {/* FORM INPUTS */}
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  className="w-full border border-gray-400 rounded-lg px-4 py-3 pr-10 text-sm text-gray-800 placeholder-gray-500 bg-white/90 outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Email or phone"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
                <Image
                  src="/auth/emailIcon.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
                />
              </div>

              <div className="relative">
                <input
                  className="w-full border border-gray-400 rounded-lg px-4 py-3 pr-10 text-sm text-gray-800 placeholder-gray-500 bg-white/90 outline-none focus:ring-2 focus:ring-black focus:border-black transition-colors"
                  placeholder="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Image
                  src="/auth/lockIcon.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60"
                />
              </div>

              {/* {error && <p className="text-xs text-red-500 text-right mt-1">{error}</p>} */}

              <p className="mt-2 text-xs text-gray-500 text-right">
                Don&apos;t you have an account?{" "}
                <Link href="/register" className="text-blue-500 cursor-pointer hover:underline">
                  click here.
                </Link>
              </p>

              <button
                type="submit"
                disabled={submitting}
                className="mt-4 w-1/2 mx-auto py-3 rounded-full bg-black text-white text-sm hover:bg-black/80 hover:shadow-lg transition duration-150 active:translate-y-[1px] disabled:opacity-60"
              >
                {submitting ? "Logging in..." : "CONFIRM"}
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
