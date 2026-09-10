"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingCancellations, setPendingCancellations] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
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

  const NAV_ITEMS = [
    {
      href: "/admin/analytics",
      label: "Analytics",
      isActive: isAnalyticsActive,
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
          <rect x="3" y="12" width="4" height="9"/>
          <rect x="9.5" y="7" width="4" height="14"/>
          <rect x="16" y="2" width="4" height="19"/>
        </svg>
      ),
    },
    {
      href: "/admin/orders",
      label: "Orders",
      isActive: isOrdersActive,
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
          <path d="m3.3 7 8.7 5 8.7-5" />
          <path d="M12 22V12" />
        </svg>
      ),
    },
    {
      href: "/admin/products",
      label: "Products",
      isActive: isProductsActive,
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      ),
    },
    {
      href: "/admin/cancellations",
      label: "Cancellations",
      isActive: isCancellationsActive,
      badge: pendingCancellations,
      icon: (
        <svg className="w-4 h-4 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcfbf9] text-[#0e0e0c] font-sans antialiased flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-[#e4e0d2] px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg border border-[#e4e0d2] bg-[#fcfbf9] hover:bg-[#f5f3eb] flex items-center justify-center text-[#0e0e0c] cursor-pointer transition-colors"
            aria-label="Toggle admin menu"
          >
            {isMobileMenuOpen ? (
              <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          <Link href="/admin/analytics" className="flex items-center gap-1 group">
            <span className="font-display tracking-[0.2em] font-semibold text-[16px] sm:text-[17px] text-[#0e0e0c]">
              AVEN
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#0e0e0c] group-hover:bg-[#e7c94a] transition-colors" />
          </Link>
          <span className="text-[#c9c4b3]">/</span>
          <span className="font-mono text-[9.5px] sm:text-[10px] tracking-wider uppercase bg-[#f2efe6] text-[#5a5744] px-1.5 sm:px-2 py-0.5 rounded border border-[#e4e0d2] font-semibold">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] sm:text-xs font-mono text-[#5a5744]">Authenticated</span>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Sidebar Content */}
          <div className="relative w-4/5 max-w-[280px] bg-white h-full shadow-2xl z-10 flex flex-col justify-between p-5 animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              {/* Drawer Brand */}
              <div className="flex items-center justify-between pb-3 border-b border-[#f0eee6]">
                <div className="flex items-center gap-2">
                  <span className="font-display tracking-[0.2em] font-semibold text-[16px] text-[#0e0e0c]">
                    AVEN ADMIN
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[#8f8a7a] hover:text-[#0e0e0c] hover:bg-[#f6f5f0] text-[15px]"
                >
                  ✕
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#8f8a7a]">
                  Navigation
                </div>

                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                      item.isActive
                        ? "bg-[#0e0e0c] text-white shadow-xs font-semibold"
                        : "text-[#5a5744] hover:bg-[#f5f3eb] hover:text-[#0e0e0c]"
                    }`}
                  >
                    <span className={item.isActive ? "text-white" : "text-[#8f8a7a]"}>
                      {item.icon}
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.badge > 0 && (
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          item.isActive ? "bg-white text-[#0e0e0c]" : "bg-rose-600 text-white"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>

              {/* Live Store Link on mobile */}
              <div className="pt-2 border-t border-[#f0eee6]">
                <Link
                  href="/"
                  target="_blank"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-medium text-[#5a5744] hover:bg-[#f5f3eb] hover:text-[#0e0e0c] transition-colors"
                >
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  <span>Open Customer Store</span>
                </Link>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-[#e4e0d2]">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-[#b5482f] hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <svg className="w-4 h-4 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 min-h-[calc(100vh-64px)]">
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex w-60 bg-white border-r border-[#e4e0d2] flex-col justify-between shrink-0 p-4 sticky top-16 h-[calc(100vh-64px)]">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#8f8a7a]">
              Navigation
            </div>

            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  item.isActive
                    ? "bg-[#0e0e0c] text-white shadow-xs font-semibold"
                    : "text-[#5a5744] hover:bg-[#f5f3eb] hover:text-[#0e0e0c]"
                }`}
              >
                <span className={item.isActive ? "text-white" : "text-[#8f8a7a]"}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                      item.isActive ? "bg-white text-[#0e0e0c]" : "bg-rose-600 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
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
          <div className="p-4 sm:p-6 md:p-8 lg:p-10 pb-24 md:pb-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Quick Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-[#e4e0d2] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl text-[10.5px] font-medium transition-colors relative ${
              item.isActive
                ? "text-[#0e0e0c] font-semibold"
                : "text-[#8f8a7a] hover:text-[#0e0e0c]"
            }`}
          >
            <div className={`p-1 rounded-lg ${item.isActive ? "bg-[#f2efe6] text-[#0e0e0c]" : ""}`}>
              {item.icon}
            </div>
            <span>{item.label}</span>
            {item.badge > 0 && (
              <span className="absolute top-0.5 right-2 w-2 h-2 rounded-full bg-rose-600" />
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
