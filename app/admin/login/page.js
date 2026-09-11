"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("admin@aven.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        setSubmitting(false);
        return;
      }

      localStorage.setItem("adminAuthToken", data.token);
      router.push("/admin");
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-[#fcfbf9]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 group">
            <span className="font-display tracking-[0.25em] font-semibold text-2xl text-[#0e0e0c]">
              AVEN
            </span>
            <span className="w-2 h-2 rounded-full bg-[#0e0e0c] group-hover:bg-[#9DB7C5] transition-colors" />
          </Link>
          <div className="mt-2 flex items-center justify-center gap-2">
            <span className="font-mono text-[11px] tracking-wider uppercase bg-[#f2efe6] text-[#5a5744] px-2.5 py-0.5 rounded border border-[#e4e0d2] font-semibold">
              Admin Portal
            </span>
          </div>
          <p className="text-xs text-[#8f8a7a] mt-2 max-w-xs mx-auto">
            Authorized administrative access for managing orders, inventory, and fulfillment.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-[#e4e0d2] rounded-2xl p-6 sm:p-9 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2.5 font-medium animate-fadeIn">
                <svg
                  className="w-4 h-4 stroke-current fill-none stroke-[2] shrink-0 mt-0.5 text-rose-600"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-email"
                className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5"
              >
                Admin Email
              </label>
              <input
                id="admin-email"
                type="email"
                required
                placeholder="admin@aven.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-3.5 py-2.5 text-[15px] sm:text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3]"
              />
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5"
              >
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-3.5 py-2.5 text-[15px] sm:text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-[#0e0e0c] hover:bg-[#2b2506] disabled:opacity-60 text-white py-3 sm:py-2.5 px-4 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Sign In to Admin</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-[#8f8a7a] hover:text-[#0e0e0c] transition-colors inline-flex items-center gap-1 font-medium"
          >
            <span>← Return to Customer Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
}