"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function LoginPage() {
  const router = useRouter();

  const [identifier, setIdentifier] = useState(""); // email hoặc phone
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        throw new Error(data?.message || "Login failed");
      }

      if (data.token) {
        localStorage.setItem("pp_token", data.token);
      }
      if (data.user) {
        localStorage.setItem("pp_user", JSON.stringify(data.user));
      }

      // Báo cho Header biết auth đã thay đổi
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("pp-auth-changed"));
      }

      if (data.user.role === "OWNER") {
        router.push("/owner/dashboard");
      } else if (data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/");
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center bg-[#f4f4f4]">
      {/* WRAPPER */}
      <div className="relative w-[1100px] h-[580px]">
        {/* LAYER 1 */}
        <div className="absolute top-0 left-0 w-[560px] h-[580px] rounded-[40px] overflow-hidden z-0">
          <Image
            src="/auth/layer1.png"
            alt="Left Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* LAYER 2 */}
        <div className="absolute top-0 left-[430px] w-[560px] h-[580px] z-10">
          <div className="absolute inset-0 rounded-[40px] overflow-hidden">
            <Image
              src="/auth/layer2.png"
              alt="Card Background"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Nội dung form */}
          <div className="absolute inset-0 px-12 py-10 flex flex-col">
            <h1 className="text-[24px] font-semibold text-center mb-6 text-gray-900">
              Log in with your Account
            </h1>

            {/* SOCIAL BUTTONS */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer transition">
                <Image src="/auth/googleIcon.svg" alt="" width={20} height={20} />
                <span>Log in Google</span>
              </button>

              <button className="flex items-center gap-2 border border-gray-400 rounded-lg px-4 py-2 text-sm text-gray-800 hover:bg-gray-50 cursor-pointer transition">
                <Image
                  src="/auth/facebookIcon.svg"
                  alt=""
                  width={20}
                  height={20}
                />
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

              {error && (
                <p className="text-xs text-red-500 text-right mt-1">{error}</p>
              )}

              <p className="mt-2 text-xs text-gray-500 text-right">
                Don&apos;t you have an account?{" "}
                <Link
                  href="/register"
                  className="text-blue-500 cursor-pointer hover:underline"
                >
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
          <Image
            src="/auth/rocketlogin.png"
            alt="Rocket"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
