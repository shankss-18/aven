"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCancellations, setPendingCancellations] = useState(0);

  // ⚠️ ALL hooks MUST be called before any conditional early return
  useEffect(() => {
    if (pathname === "/admin/login") return; // don't fetch on login screen
    const token = localStorage.getItem("adminAuthToken");
    if (!token) return;
    fetch("/api/admin/analytics", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) setPendingCancellations(Number(data.pendingCancellations) || 0);
      })
      .catch(() => {});
  }, [pathname]);

  // Exclude sidebar on login page — after all hooks
  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-[#fcfbf9] text-[#0e0e0c] font-sans antialiased">
        {children}
      </div>
    );
  }

  function handleLogout() {
    localStorage.removeItem("adminAuthToken");
    router.push("/admin/login");
  }

  const isAnalyticsActive = pathname === "/admin" || pathname === "/admin/analytics";
  const isOrdersActive = pathname.startsWith("/admin/orders");
  const isProductsActive = pathname.startsWith("/admin/products");
  const isCancellationsActive = pathname.startsWith("/admin/cancellations");

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#0e0e0c] font-sans antialiased flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#e4e0d2] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/analytics" className="flex items-center gap-1 group">
            <span className="font-display tracking-[0.2em] font-semibold text-[17px] text-[#0e0e0c]">
              AVEN
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0e0e0c] group-hover:bg-[#e7c94a] transition-colors" />
          </Link>
          <span className="text-[#c9c4b3]">/</span>
          <span className="font-mono text-[10px] tracking-wider uppercase bg-[#f2efe6] text-[#5a5744] px-2 py-0.5 rounded border border-[#e4e0d2] font-semibold">
            Admin Console
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#8f8a7a] hover:text-[#0e0e0c] transition-colors font-medium"
          >
            <span>Live Store</span>
            <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>

          <div className="h-4 w-px bg-[#e4e0d2] hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-[#5a5744]">Authenticated</span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* Left Sidebar */}
        <aside className="w-60 bg-white border-r border-[#e4e0d2] flex flex-col justify-between shrink-0 p-4">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#8f8a7a]">
              Navigation
            </div>

            <Link
              href="/admin/analytics"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isAnalyticsActive
                  ? "bg-[#0e0e0c] text-white shadow-xs font-semibold"
                  : "text-[#5a5744] hover:bg-[#f5f3eb] hover:text-[#0e0e0c]"
              }`}
            >
              <svg className={`w-4 h-4 stroke-current fill-none stroke-[1.8] ${isAnalyticsActive ? "text-white" : "text-[#8f8a7a]"}`} viewBox="0 0 24 24">
                <rect x="3" y="12" width="4" height="9"/>
                <rect x="9.5" y="7" width="4" height="14"/>
                <rect x="16" y="2" width="4" height="19"/>
              </svg>
              <span>Analytics</span>
            </Link>

            <Link
              href="/admin/orders"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isOrdersActive
                  ? "bg-[#0e0e0c] text-white shadow-xs font-semibold"
                  : "text-[#5a5744] hover:bg-[#f5f3eb] hover:text-[#0e0e0c]"
              }`}
            >
              <svg className={`w-4 h-4 stroke-current fill-none stroke-[1.8] ${isOrdersActive ? "text-white" : "text-[#8f8a7a]"}`} viewBox="0 0 24 24">
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                <path d="m3.3 7 8.7 5 8.7-5" />
                <path d="M12 22V12" />
              </svg>
              <span>Orders</span>
            </Link>

            <Link
              href="/admin/products"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isProductsActive
                  ? "bg-[#0e0e0c] text-white shadow-xs font-semibold"
                  : "text-[#5a5744] hover:bg-[#f5f3eb] hover:text-[#0e0e0c]"
              }`}
            >
              <svg className={`w-4 h-4 stroke-current fill-none stroke-[1.8] ${isProductsActive ? "text-white" : "text-[#8f8a7a]"}`} viewBox="0 0 24 24">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
              <span>Products</span>
            </Link>

            <Link
              href="/admin/cancellations"
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isCancellationsActive
                  ? "bg-[#0e0e0c] text-white shadow-xs font-semibold"
                  : "text-[#5a5744] hover:bg-[#f5f3eb] hover:text-[#0e0e0c]"
              }`}
            >
              <svg className={`w-4 h-4 stroke-current fill-none stroke-[1.8] ${isCancellationsActive ? "text-white" : "text-[#8f8a7a]"}`} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="flex-1">Cancellations</span>
              {pendingCancellations > 0 && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  isCancellationsActive ? "bg-white text-[#0e0e0c]" : "bg-rose-600 text-white"
                }`}>
                  {pendingCancellations}
                </span>
              )}
            </Link>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-[#e4e0d2]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-[#b5482f] hover:bg-rose-50 transition-colors text-left cursor-pointer"
            >
              <svg className="w-4 h-4 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log Out</span>
            </button>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 bg-[#fcfbf9] overflow-y-auto">
          <div className="p-6 md:p-8 lg:p-10 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
