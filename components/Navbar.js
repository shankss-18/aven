"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartCount } from "@/lib/useCartCount";
import { useWishlistCount } from "@/lib/useWishlistCount";

export default function Navbar({
  activePage = "",
  countOverride,
  wishlistCountOverride,
}) {
  const router = useRouter();
  const dynamicCartCount = useCartCount();
  const cartCount = countOverride !== undefined ? countOverride : dynamicCartCount;

  const dynamicWishlistCount = useWishlistCount();
  const wishlistCount =
    wishlistCountOverride !== undefined ? wishlistCountOverride : dynamicWishlistCount;

  const [searchQuery, setSearchQuery] = useState("");
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);
  const mobileSearchContainerRef = useRef(null);

  // Sync search query from URL on load and on popstate
  useEffect(() => {
    const syncQueryFromUrl = () => {
      if (typeof window !== "undefined") {
        const q = new URLSearchParams(window.location.search).get("search") || "";
        setSearchQuery(q);
      }
    };
    syncQueryFromUrl();
    window.addEventListener("popstate", syncQueryFromUrl);
    return () => {
      window.removeEventListener("popstate", syncQueryFromUrl);
    };
  }, []);

  // Fetch product catalog for fast live search suggestions
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.products) {
            setCatalogProducts(data.products);
          }
        }
      } catch (err) {
        console.error("Failed to load catalog for navbar search:", err);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close live search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target) &&
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute live search suggestions
  const liveMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return catalogProducts
      .filter((p) => {
        const nameMatch = p.name && p.name.toLowerCase().includes(q);
        const catMatch = p.category && p.category.toLowerCase().includes(q);
        return nameMatch || catMatch;
      })
      .slice(0, 5);
  }, [searchQuery, catalogProducts]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowDropdown(val.trim().length > 0);

    // If already on /products page, update filter live as user types
    if (typeof window !== "undefined" && window.location.pathname === "/products") {
      const q = val.trim();
      const newUrl = q ? `/products?search=${encodeURIComponent(q)}` : "/products";
      window.history.replaceState({}, "", newUrl);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    const trimmed = searchQuery.trim();
    const targetUrl = trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : "/products";

    if (typeof window !== "undefined") {
      if (window.location.pathname === "/products") {
        window.history.pushState({}, "", targetUrl);
        window.dispatchEvent(new Event("popstate"));
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setShowDropdown(false);
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/products") {
        window.history.pushState({}, "", "/products");
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  const formatPrice = (basePrice) => {
    const val = (Number(basePrice) || 0) / 100;
    return `₹${Math.round(val).toLocaleString("en-IN")}`;
  };

  return (
    <header className="w-full border-b border-[#e4e0d2] bg-white sticky top-0 z-40">
      <div className="w-full flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5">
        {/* Logo */}
        <Link
          href="/"
          className="font-['Space_Grotesk'] font-bold text-[22px] tracking-[0.01em] text-[#0e0e0c] flex items-center"
        >
          AVEN
          <span className="not-italic text-[#2b2506] bg-[#e7c94a] px-1 py-0.5 rounded-[3px] ml-0.5 leading-none">
            .
          </span>
        </Link>

        {/* Central Nav Links */}
        <nav className="hidden md:flex items-center gap-9 text-[13.5px] text-[#3a382f] font-medium">
          <Link
            href="/"
            className={`hover:text-[#0e0e0c] transition-colors ${
              activePage === "home" ? "text-[#0e0e0c] font-semibold" : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={`hover:text-[#0e0e0c] transition-colors ${
              activePage === "products" ? "text-[#0e0e0c] font-semibold" : ""
            }`}
          >
            Products
          </Link>
          <Link
            href="/account?tab=orders"
            className={`hover:text-[#0e0e0c] transition-colors ${
              activePage === "orders" ? "text-[#0e0e0c] font-semibold" : ""
            }`}
          >
            Orders
          </Link>
        </nav>

        {/* Desktop Search Bar with Live Suggestions Dropdown */}
        <div ref={searchContainerRef} className="relative hidden sm:block">
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2.5 w-[200px] md:w-[250px] lg:w-[320px] bg-[#f2efe6] rounded-full px-4 py-2 text-[13px] text-[#0e0e0c] focus-within:ring-1 focus-within:ring-[#0e0e0c] transition-all"
          >
            <button
              type="submit"
              aria-label="Submit search"
              className="bg-transparent border-none p-0 flex items-center justify-center cursor-pointer text-[#8f8a7a] hover:text-[#0e0e0c]"
            >
              <svg
                className="w-[15px] h-[15px] stroke-current fill-none stroke-[1.6] shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" />
              </svg>
            </button>
            <input
              type="text"
              id="navbar-search-input"
              value={searchQuery}
              onFocus={() => {
                if (searchQuery.trim()) setShowDropdown(true);
              }}
              onChange={handleInputChange}
              placeholder="Search Aven.com"
              className="bg-transparent border-none outline-none text-[13px] w-full placeholder:text-[#8f8a7a] text-[#0e0e0c]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-[#8f8a7a] hover:text-[#0e0e0c] text-[12px] font-mono leading-none px-1 cursor-pointer"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </form>

          {/* Live Search Dropdown */}
          {showDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 mt-2 w-[320px] lg:w-[360px] bg-white rounded-[16px] border border-[#e4e0d2] shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 border-b border-[#e4e0d2] bg-[#faf8f4] flex items-center justify-between text-[11px] font-mono text-[#8f8a7a] px-3">
                <span>Matching footwear ({liveMatches.length})</span>
                <span className="text-[10px]">Press Enter to search</span>
              </div>

              {liveMatches.length > 0 ? (
                <div className="py-1">
                  {liveMatches.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowDropdown(false);
                        if (typeof window !== "undefined") {
                          window.location.href = `/products/${item.id}`;
                        }
                      }}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-[#f2efe6] cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-[8px] bg-[#eae5d5] overflow-hidden flex items-center justify-center shrink-0 border border-[#e4e0d2]">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-mono text-[#8f8a7a]">SHOE</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-[#0e0e0c] truncate">
                          {item.name}
                        </div>
                        <div className="text-[11.5px] text-[#8f8a7a] capitalize">
                          {item.category || "Footwear"}
                        </div>
                      </div>
                      <div className="font-mono text-[12.5px] font-semibold text-[#0e0e0c] shrink-0">
                        {formatPrice(item.base_price)}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full text-center py-2.5 bg-[#faf8f4] hover:bg-[#f2efe6] text-[12px] font-semibold text-[#0e0e0c] border-t border-[#e4e0d2] transition-colors cursor-pointer"
                  >
                    View all results for &ldquo;{searchQuery}&rdquo; →
                  </button>
                </div>
              ) : (
                <div className="py-6 px-4 text-center">
                  <p className="text-[13px] text-[#0e0e0c] font-medium mb-1">
                    No footwear matches &ldquo;{searchQuery}&rdquo;
                  </p>
                  <p className="text-[11.5px] text-[#8f8a7a]">
                    Try searching for sneakers, boots, or trainers.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Action Icons (Wishlist, Cart, Profile) */}
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Wishlist Link with Live Number Badge */}
          <Link
            href="/wishlist"
            id="nav-wishlist-link"
            className={`relative flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
              activePage === "wishlist" ? "text-[#0e0e0c] font-semibold" : "text-[#3a382f] hover:text-[#0e0e0c]"
            }`}
          >
            {wishlistCount > 0 && (
              <span
                id="nav-wishlist-badge"
                className="absolute -top-1.5 -right-2 bg-[#0e0e0c] text-white font-mono text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center animate-in fade-in zoom-in-75 duration-200 shadow-2xs border border-white"
              >
                {wishlistCount}
              </span>
            )}
            <svg
              className="w-[20px] h-[20px] stroke-[#0e0e0c] fill-white stroke-[2] transition-colors"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 20s-7-4.4-9.3-8.7C1.2 8 3 5 6.3 5c2 0 3.4 1.1 4.2 2.5C11.3 6.1 12.7 5 14.7 5 18 5 19.8 8 18.3 11.3 16 15.6 12 20 12 20z" />
            </svg>
            <span>Wishlist</span>
          </Link>

          {/* Cart Link with Live Number Badge */}
          <Link
            href="/cart"
            id="nav-cart-link"
            className={`relative flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
              activePage === "cart" ? "text-[#0e0e0c] font-semibold" : "text-[#3a382f] hover:text-[#0e0e0c]"
            }`}
          >
            {cartCount > 0 && (
              <span
                id="nav-cart-badge"
                className="absolute -top-1.5 -right-2 bg-[#e7c94a] text-[#2b2506] font-mono text-[9px] font-semibold w-4 h-4 rounded-full flex items-center justify-center animate-in fade-in zoom-in-75 duration-200 shadow-2xs"
              >
                {cartCount}
              </span>
            )}
            <svg
              className="w-[20px] h-[20px] stroke-[#0e0e0c] fill-none stroke-[1.5]"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="9" cy="20" r="1.4" />
              <circle cx="17" cy="20" r="1.4" />
              <path d="M3 4h2l2.4 12h10.2L20 7H6" />
            </svg>
            <span>Cart</span>
          </Link>

          {/* Profile */}
          <Link
            href="/account"
            aria-label="Profile"
            className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${
              activePage === "account" ? "text-[#0e0e0c] font-semibold" : "text-[#3a382f] hover:text-[#0e0e0c]"
            }`}
          >
            <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[#cfc9b3] to-[#8f8a7a] flex items-center justify-center text-white overflow-hidden shadow-2xs hover:opacity-90 transition-opacity">
              <svg className="w-3.5 h-3.5 stroke-white fill-none stroke-[2]" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span>Profile</span>
          </Link>

          {/* Admin Link */}
          <Link
            href="/admin/login"
            aria-label="Admin dashboard"
            className="hidden lg:flex flex-col items-center gap-0.5 text-[10px] text-[#3a382f] hover:text-[#0e0e0c] transition-colors"
          >
            <svg className="w-[20px] h-[20px] stroke-current fill-none stroke-[1.5]" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Admin</span>
          </Link>
        </div>
      </div>

      {/* Mobile Search Bar for small screens */}
      <div ref={mobileSearchContainerRef} className="sm:hidden px-4 pb-3 pt-0 relative">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-2 w-full bg-[#f2efe6] rounded-full px-3.5 py-1.5 text-[12.5px] text-[#0e0e0c] border border-[#e4e0d2]"
        >
          <button type="submit" className="bg-transparent border-none p-0 flex items-center text-[#8f8a7a]">
            <svg
              className="w-[14px] h-[14px] stroke-current fill-none stroke-[1.6] shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim()) setShowDropdown(true);
            }}
            onChange={handleInputChange}
            placeholder="Search Aven.com"
            className="bg-transparent border-none outline-none text-[12.5px] w-full placeholder:text-[#8f8a7a] text-[#0e0e0c]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="text-[#8f8a7a] hover:text-[#0e0e0c] text-[12px] font-mono leading-none px-1 cursor-pointer"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </form>

        {/* Mobile Search Dropdown */}
        {showDropdown && searchQuery.trim() && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-[16px] border border-[#e4e0d2] shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b border-[#e4e0d2] bg-[#faf8f4] text-[11px] font-mono text-[#8f8a7a] px-3">
              Matching footwear ({liveMatches.length})
            </div>
            {liveMatches.length > 0 ? (
              <div>
                {liveMatches.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowDropdown(false);
                      if (typeof window !== "undefined") {
                        window.location.href = `/products/${item.id}`;
                      }
                    }}
                    className="flex items-center gap-3 px-3 py-2 border-b border-[#f4f2ea] last:border-none"
                  >
                    <div className="w-9 h-9 rounded bg-[#eae5d5] overflow-hidden shrink-0">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-semibold text-[#0e0e0c] truncate">{item.name}</div>
                      <div className="text-[11px] text-[#8f8a7a] capitalize">{item.category}</div>
                    </div>
                    <div className="font-mono text-[12px] font-semibold text-[#0e0e0c]">
                      {formatPrice(item.base_price)}
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="w-full text-center py-2 bg-[#faf8f4] text-[12px] font-semibold text-[#0e0e0c] border-t border-[#e4e0d2]"
                >
                  View all results →
                </button>
              </div>
            ) : (
              <div className="py-4 text-center text-[12px] text-[#8f8a7a]">No footwear matches</div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Navigation Links Bar */}
      <div className="flex md:hidden items-center justify-around border-t border-[#e4e0d2] py-2.5 px-4 text-[12px] text-[#3a382f] bg-[#faf8f4]">
        <Link
          href="/"
          className={`transition-colors ${
            activePage === "home" ? "text-[#0e0e0c] font-bold" : "hover:text-[#0e0e0c]"
          }`}
        >
          Home
        </Link>
        <Link
          href="/products"
          className={`transition-colors ${
            activePage === "products" ? "text-[#0e0e0c] font-bold" : "hover:text-[#0e0e0c]"
          }`}
        >
          Products
        </Link>
        <Link
          href="/account?tab=orders"
          className={`transition-colors ${
            activePage === "orders" ? "text-[#0e0e0c] font-bold" : "hover:text-[#0e0e0c]"
          }`}
        >
          Orders
        </Link>
      </div>
    </header>
  );
}
