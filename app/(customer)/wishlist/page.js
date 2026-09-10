"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { apiFetch, getToken } from "@/lib/apiClient";
import { notifyWishlistUpdated } from "@/lib/useWishlistCount";

// Shared SVG glyph for sneaker
function SneakerGlyph({ className = "w-[62%] stroke-[#0e0e0c] fill-none stroke-[1.3]" }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <path d="M3 34c0-4 3-6 7-8 6-3 10-8 14-13 3-3 6-4 9-3 1 3 0 6-2 8 6 1 11 4 14 9 2 3 3 6 1 9-2 2-6 3-11 3H10c-4 0-7-1-7-5z" />
      <path d="M14 20c3 1 6 1 9 0" />
      <path d="M20 15c2 2 5 3 8 3" />
      <path d="M8 30h30" />
    </svg>
  );
}

// Shared SVG glyph for boot
function BootGlyph({ className = "w-[62%] stroke-[#0e0e0c] fill-none stroke-[1.3]" }) {
  return (
    <svg viewBox="0 0 60 40" className={className} aria-hidden="true">
      <path d="M12 6v16l-6 6c-2 2-3 4-3 7 0 3 2 4 5 4h26c3 0 5-1 5-4 0-3-2-5-5-6l-10-4V6z" />
      <path d="M12 12h14" />
      <path d="M9 33h30" />
      <path d="M20 22l7 6" />
    </svg>
  );
}

const TILE_TONES = [
  "bg-[#eae5d5]",
  "bg-[#e3dfd0]",
  "bg-[#dfe2dc]",
  "bg-[#ece3d8]",
  "bg-[#e6e6de]",
  "bg-[#e1ded1]",
];

export default function WishlistPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch("/api/wishlist");
      if (!res.ok) {
        throw new Error(`Failed to load wishlist (Status: ${res.status})`);
      }
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        setItems(data.items);
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Wishlist load error:", err);
      setError(err.message || "Could not load your wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);
      const res = await apiFetch(`/api/wishlist/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to remove item from wishlist");
      }
      // Refetch wishlist items after removal
      await fetchWishlist();
      notifyWishlistUpdated();
    } catch (err) {
      console.error("Remove from wishlist error:", err);
      alert(err.message || "Failed to remove item.");
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (paise) => {
    const amount = (Math.round(Number(paise) || 0) / 100);
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <main className="min-h-screen w-full bg-white text-[#0e0e0c] flex flex-col justify-between">
      <div>
        {/* ================= STORE TOP NAV ================= */}
        <Navbar activePage="wishlist" wishlistCountOverride={items.length} />

        {/* ================= BREADCRUMB ================= */}
        <div className="max-w-[1200px] mx-auto w-full px-6 sm:px-8 pt-6 text-[12px] text-[#8f8a7a]">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          <span className="mx-1 text-[#0e0e0c]">›</span>{" "}
          <b className="text-[#0e0e0c] font-medium">Wishlist</b>
        </div>

        {/* ================= WISHLIST MAIN CONTENT ================= */}
        <div className="max-w-[1200px] mx-auto w-full px-6 sm:px-8 py-8">
          
          {/* Header */}
          <div className="flex items-baseline gap-3 mb-8">
            <h1 className="font-['Space_Grotesk'] text-2xl sm:text-[28px] font-bold text-[#0e0e0c]">
              Wishlist
            </h1>
            {!loading && (
              <span className="font-mono text-[13px] text-[#8f8a7a]">
                ({items.length} {items.length === 1 ? "saved" : "saved"})
              </span>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-mono text-[13px] text-[#8f8a7a]">Loading your saved items...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center border border-dashed border-[#e4e0d2] rounded-2xl p-8 max-w-lg mx-auto">
              <p className="text-[14.5px] font-medium text-[#b5482f] mb-3">{error}</p>
              <button
                type="button"
                onClick={fetchWishlist}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            /* ================= EMPTY STATE ================= */
            <div className="py-20 sm:py-24 text-center border border-[#e4e0d2] rounded-2xl p-8 max-w-xl mx-auto bg-[#faf8f4]">
              <div className="w-[60px] h-[60px] rounded-full bg-white border border-[#e4e0d2] flex items-center justify-center mx-auto mb-5 shadow-2xs">
                <svg
                  className="w-7 h-7 stroke-[#8f8a7a] fill-none stroke-[1.5]"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 20s-7-4.4-9.3-8.7C1.2 8 3 5 6.3 5c2 0 3.4 1.1 4.2 2.5C11.3 6.1 12.7 5 14.7 5 18 5 19.8 8 18.3 11.3 16 15.6 12 20 12 20z" />
                </svg>
              </div>
              <h2 className="font-['Space_Grotesk'] text-xl font-bold text-[#0e0e0c] mb-2">
                Your wishlist is empty
              </h2>
              <p className="text-[13.5px] text-[#8f8a7a] max-w-md mx-auto mb-6 leading-relaxed">
                Explore our collection of considered footwear and save your favorite styles to review or purchase later.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                Explore Footwear →
              </Link>
            </div>
          ) : (
            /* ================= WISHLIST GRID ================= */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
              {items.map((item, index) => {
                const tileBg = TILE_TONES[index % TILE_TONES.length];
                const categoryLabel = item.category
                  ? item.category.charAt(0).toUpperCase() + item.category.slice(1)
                  : "Footwear";
                const isRemoving = removingId === item.product_id;

                return (
                  <div key={item.id || item.product_id} className="flex flex-col gap-2 sm:gap-3 group">
                    {/* Visual Card */}
                    <div
                      className={`aspect-square rounded-[12px] sm:rounded-[14px] ${tileBg} relative overflow-hidden flex items-center justify-center border border-[#e4e0d2]`}
                    >
                      <Link
                        href={`/products/${item.product_id}`}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : item.category === "boot" ? (
                          <BootGlyph />
                        ) : (
                          <SneakerGlyph />
                        )}
                      </Link>

                      {/* Remove Button (Red Heart) */}
                      <button
                        type="button"
                        title="Remove from wishlist"
                        aria-label="Remove from wishlist"
                        disabled={isRemoving}
                        onClick={() => handleRemove(item.product_id)}
                        className="absolute top-2 right-2 sm:top-3 sm:right-3 w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                      >
                        {isRemoving ? (
                          <div className="w-3.5 h-3.5 border-2 border-[#b5482f] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg
                            className="w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] stroke-[#b5482f] fill-[#b5482f] stroke-[1.6]"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 20s-7-4.4-9.3-8.7C1.2 8 3 5 6.3 5c2 0 3.4 1.1 4.2 2.5C11.3 6.1 12.7 5 14.7 5 18 5 19.8 8 18.3 11.3 16 15.6 12 20 12 20z" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {/* Info */}
                    <Link
                      href={`/products/${item.product_id}`}
                      className="text-[13px] sm:text-[14px] font-semibold text-[#0e0e0c] hover:underline block truncate mt-0.5"
                    >
                      {item.name}
                    </Link>

                    <div className="flex items-center justify-between text-[11px] sm:text-[12.5px]">
                      <span className="text-[#8f8a7a] truncate">{categoryLabel}</span>
                      <span className="font-mono text-[13px] sm:text-[14px] font-semibold text-[#0e0e0c]">
                        {formatPrice(item.base_price)}
                      </span>
                    </div>

                    {/* Move to Cart / View Details Button */}
                    <Link
                      href={`/products/${item.product_id}`}
                      className="w-full py-2.5 px-4 text-center rounded-full text-[12.5px] font-semibold bg-white text-[#0e0e0c] border border-[#e4e0d2] hover:border-[#0e0e0c] transition-colors mt-0.5 block"
                    >
                      Move to cart
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= STORE FOOTER ================= */}
      <footer className="w-full border-t border-[#e4e0d2] bg-white px-6 sm:px-8 py-10 lg:py-14 mt-16">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="font-['Space_Grotesk'] font-bold text-[20px] mb-2.5 text-[#0e0e0c]">
              AVEN.
            </div>
            <p className="text-[#8f8a7a] text-[13px] max-w-[240px] leading-relaxed">
              Considered footwear for men, made to be worn in.
            </p>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a] mb-3.5">
              Shop
            </h3>
            <Link href="/products?category=sneaker" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Sneakers
            </Link>
            <Link href="/products?category=boot" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Boots
            </Link>
            <Link href="/products?category=trainer" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Trainers
            </Link>
            <Link href="/products?sale=true" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Sale
            </Link>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a] mb-3.5">
              Company
            </h3>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              About
            </Link>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Stores
            </Link>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Craft
            </Link>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a] mb-3.5">
              Support
            </h3>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Help
            </Link>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Delivery
            </Link>
            <Link href="#" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              Returns
            </Link>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a] mb-3.5">
              Contact
            </h3>
            <a href="tel:+12045780492" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              +1 204 578 0492
            </a>
            <a href="mailto:hello@aven.com" className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors">
              hello@aven.com
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
