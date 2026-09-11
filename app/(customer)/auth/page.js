"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, saveToken } from "@/lib/apiClient";

// Boot glyph SVG watermark matching the reference design
function BootGlyph({ className = "w-[60%] stroke-[#efeadb] fill-none stroke-[1]" }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <path d="M12 6v16l-6 6c-2 2-3 4-3 7 0 3 2 4 5 4h26c3 0 5-1 5-4 0-3-2-5-5-6l-10-4V6z" />
      <path d="M12 12h14" />
      <path d="M9 33h30" />
      <path d="M20 22l7 6" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login"); // "login" | "signup"

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // Signup form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Status & error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab switch handler
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  // Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok || res.status === 200 || res.status === 201) {
        if (data?.token) {
          saveToken(data.token);
          router.push("/");
        } else {
          setError("Authentication successful, but no token was provided.");
        }
      } else {
        setError(data?.error || data?.message || "Invalid credentials");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Submit Signup
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fullName = `${firstName} ${lastName}`.trim();
      if (!fullName) {
        setError("Please enter your name.");
        setLoading(false);
        return;
      }

      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          name: fullName,
          email: signupEmail,
          password: signupPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok || res.status === 200 || res.status === 201) {
        if (data?.token) {
          saveToken(data.token);
          router.push("/");
        } else {
          setError("Account created, but no token was provided.");
        }
      } else {
        setError(data?.error || data?.message || "Failed to create account.");
      }
    } catch (err) {
      console.error("Signup failed:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#f2efe6] flex items-center justify-center p-4 sm:p-6 lg:p-10">
      {/* Centered Canvas Container */}
      <div className="w-full max-w-[1040px] bg-white rounded-[22px] border border-[#e4e0d2] shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[580px]">
        
        {/* ================= LEFT: AUTH VISUAL ================= */}
        <div className="bg-gradient-to-br from-[#161510] to-[#2b2820] text-[#efeadb] p-8 sm:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden min-h-[260px] md:min-h-[580px]">
          {/* Logo link to home */}
          <div className="z-10">
            <Link
              href="/"
              className="font-['Space_Grotesk'] font-bold text-[24px] tracking-[0.01em] text-[#efeadb] flex items-center"
            >
              AVEN<span className="not-italic text-[#0e0e0c] bg-[#9DB7C5] px-1 py-0.5 rounded-[3px] ml-1 leading-none text-[20px]">.</span>
            </Link>
          </div>

          {/* Quote */}
          <div className="z-10 my-8 md:my-0">
            <p className="font-['Space_Grotesk'] text-[20px] sm:text-[22px] lg:text-[24px] leading-[1.3] text-[#efeadb] font-medium max-w-[300px]">
              &ldquo;The best pair in my closet is the one I forget I&apos;m wearing.&rdquo;
            </p>
          </div>

          {/* Bottom detail / watermark */}
          <div className="z-10 hidden md:block text-[11.5px] uppercase tracking-[0.1em] text-[#a8a394] font-medium font-mono">
            Considered footwear · Est. 2026
          </div>

          {/* Decorative SVG glyph positioned absolute bottom-right */}
          <div className="absolute -right-8 -bottom-6 w-[240px] sm:w-[300px] lg:w-[340px] opacity-15 pointer-events-none select-none text-[#efeadb]">
            <BootGlyph className="w-full stroke-current fill-none stroke-[1]" />
          </div>
        </div>

        {/* ================= RIGHT: AUTH FORM SIDE ================= */}
        <div className="p-7 sm:p-10 lg:p-14 flex flex-col justify-center bg-white">
          
          {/* Login / Signup Toggle */}
          <div className="flex bg-[#f2efe6] rounded-full p-1 mb-7 w-fit border border-[#e4e0d2]">
            <button
              type="button"
              id="tab-toggle-login"
              onClick={() => handleTabSwitch("login")}
              className={`px-5 sm:px-6 py-2 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer ${
                activeTab === "login"
                  ? "bg-[#0e0e0c] text-[#f2efe6] shadow-2xs"
                  : "text-[#8f8a7a] hover:text-[#0e0e0c]"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              id="tab-toggle-signup"
              onClick={() => handleTabSwitch("signup")}
              className={`px-5 sm:px-6 py-2 rounded-full text-[12.5px] font-semibold transition-all cursor-pointer ${
                activeTab === "signup"
                  ? "bg-[#0e0e0c] text-[#f2efe6] shadow-2xs"
                  : "text-[#8f8a7a] hover:text-[#0e0e0c]"
              }`}
            >
              Sign up
            </button>
          </div>

          {/* ================= LOGIN PANEL ================= */}
          {activeTab === "login" && (
            <div id="auth-login" className="w-full">
              <h1 className="font-['Space_Grotesk'] text-[24px] font-bold text-[#0e0e0c] mb-1.5">
                Welcome back
              </h1>
              <p className="text-[13px] text-[#8f8a7a] mb-6">
                Log in to check order status and reorder favorites.
              </p>

              {/* Error Message Display */}
              {error && (
                <div
                  id="login-error-msg"
                  className="mb-5 p-3 rounded-[8px] bg-[#f7e7e1] border border-[#f0c2b4] text-[#b5482f] text-[12.5px] flex items-center gap-2.5"
                  role="alert"
                >
                  <svg className="w-4 h-4 shrink-0 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-3.5 py-2.5 sm:py-3 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white text-[#0e0e0c] placeholder:text-[#8f8a7a] focus:border-[#0e0e0c] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 sm:py-3 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white text-[#0e0e0c] placeholder:text-[#8f8a7a] focus:border-[#0e0e0c] outline-none transition-colors font-mono"
                  />
                </div>

                <div className="flex items-center justify-between text-[12px] pt-1">
                  <label className="flex items-center gap-2 text-[#8f8a7a] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="accent-[#0e0e0c] rounded"
                    />
                    <span>Remember me</span>
                  </label>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="text-[#3a382f] hover:text-[#0e0e0c] underline transition-colors"
                  >
                    Forgot password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 sm:py-3.5 px-6 rounded-full text-[13.5px] font-semibold tracking-[0.01em] bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#f2efe6] border-t-transparent rounded-full animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Log in</span>
                  )}
                </button>
              </form>

              {/* Toggle to Signup */}
              <div className="mt-6 text-[12.5px] text-[#8f8a7a] text-center">
                New to Aven?{" "}
                <button
                  type="button"
                  onClick={() => handleTabSwitch("signup")}
                  className="text-[#0e0e0c] underline font-medium hover:opacity-80 transition-opacity cursor-pointer"
                >
                  Create an account
                </button>
              </div>
            </div>
          )}

          {/* ================= SIGNUP PANEL ================= */}
          {activeTab === "signup" && (
            <div id="auth-signup" className="w-full">
              <h1 className="font-['Space_Grotesk'] text-[24px] font-bold text-[#0e0e0c] mb-1.5">
                Create your account
              </h1>
              <p className="text-[13px] text-[#8f8a7a] mb-6">
                Join Aven for early access to limited releases.
              </p>

              {/* Error Message Display */}
              {error && (
                <div
                  id="signup-error-msg"
                  className="mb-5 p-3 rounded-[8px] bg-[#f7e7e1] border border-[#f0c2b4] text-[#b5482f] text-[12.5px] flex items-center gap-2.5"
                  role="alert"
                >
                  <svg className="w-4 h-4 shrink-0 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold mb-1.5">
                      First name
                    </label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Marcus"
                      className="w-full px-3.5 py-2.5 sm:py-3 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white text-[#0e0e0c] placeholder:text-[#8f8a7a] focus:border-[#0e0e0c] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold mb-1.5">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Reyes"
                      className="w-full px-3.5 py-2.5 sm:py-3 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white text-[#0e0e0c] placeholder:text-[#8f8a7a] focus:border-[#0e0e0c] outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-3.5 py-2.5 sm:py-3 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white text-[#0e0e0c] placeholder:text-[#8f8a7a] focus:border-[#0e0e0c] outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3.5 py-2.5 sm:py-3 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white text-[#0e0e0c] placeholder:text-[#8f8a7a] focus:border-[#0e0e0c] outline-none transition-colors font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 sm:py-3.5 px-6 rounded-full text-[13.5px] font-semibold tracking-[0.01em] bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#f2efe6] border-t-transparent rounded-full animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Create account</span>
                  )}
                </button>
              </form>

              {/* Toggle to Login */}
              <div className="mt-6 text-[12.5px] text-[#8f8a7a] text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleTabSwitch("login")}
                  className="text-[#0e0e0c] underline font-medium hover:opacity-80 transition-opacity cursor-pointer"
                >
                  Log in
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </main>
  );
}
