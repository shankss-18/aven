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
              AVEN<span className="not-italic text-[#2b2506] bg-[#e7c94a] px-1 py-0.5 rounded-[3px] ml-1 leading-none text-[20px]">.</span>
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

              {/* Social Login Divider */}
              <div className="flex items-center gap-3 text-[#8f8a7a] text-[11.5px] my-5 before:content-[''] before:flex-1 before:h-px before:bg-[#e4e0d2] after:content-[''] after:flex-1 after:h-px after:bg-[#e4e0d2]">
                or continue with
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <button
                  type="button"
                  onClick={() => setError("Social login is coming soon.")}
                  className="py-2.5 px-4 rounded-[8px] border border-[#e4e0d2] text-[12.5px] font-medium text-[#0e0e0c] hover:border-[#0e0e0c] hover:bg-[#faf8f4] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => setError("Social login is coming soon.")}
                  className="py-2.5 px-4 rounded-[8px] border border-[#e4e0d2] text-[12.5px] font-medium text-[#0e0e0c] hover:border-[#0e0e0c] hover:bg-[#faf8f4] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current text-[#0e0e0c]" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.68-1.26z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Toggle to Signup */}
              <div className="text-[12.5px] text-[#8f8a7a] text-center">
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

              {/* Social Login Divider */}
              <div className="flex items-center gap-3 text-[#8f8a7a] text-[11.5px] my-5 before:content-[''] before:flex-1 before:h-px before:bg-[#e4e0d2] after:content-[''] after:flex-1 after:h-px after:bg-[#e4e0d2]">
                or continue with
              </div>

              <div className="grid grid-cols-2 gap-2.5 mb-5">
                <button
                  type="button"
                  onClick={() => setError("Social signup is coming soon.")}
                  className="py-2.5 px-4 rounded-[8px] border border-[#e4e0d2] text-[12.5px] font-medium text-[#0e0e0c] hover:border-[#0e0e0c] hover:bg-[#faf8f4] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => setError("Social signup is coming soon.")}
                  className="py-2.5 px-4 rounded-[8px] border border-[#e4e0d2] text-[12.5px] font-medium text-[#0e0e0c] hover:border-[#0e0e0c] hover:bg-[#faf8f4] transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4 fill-current text-[#0e0e0c]" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.65 1.35-.58.66-1.09 1.73-.95 2.76 1.01.08 2.05-.51 2.68-1.26z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>

              {/* Toggle to Login */}
              <div className="text-[12.5px] text-[#8f8a7a] text-center">
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
