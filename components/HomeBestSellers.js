"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { apiFetch, getToken } from "@/lib/apiClient";
import { notifyWishlistUpdated } from "@/lib/useWishlistCount";
import ScrollReveal from "@/components/ScrollReveal";

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

export default function HomeBestSellers({ initialProducts = [] }) {
  const [products, setProducts] = useState(initialProducts);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  // Fetch products if initialProducts is empty
  useEffect(() => {
    if (!products || products.length === 0) {
      async function loadProducts() {
        try {
          const res = await fetch("/api/products");
          if (res.ok) {
            const data = await res.json();
            if (data?.products) {
              setProducts(data.products.slice(0, 4));
            }
          }
        } catch (err) {
          console.error("Failed to fetch home best sellers:", err);
        }
      }
      loadProducts();
    }
  }, [products]);

  // Load wishlist membership on mount
  useEffect(() => {
    async function loadWishlist() {
      const token = getToken();
      if (!token) return;
      try {
        const res = await apiFetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items)) {
            setWishlistIds(new Set(data.items.map((i) => Number(i.product_id))));
          }
        }
      } catch (err) {
        console.error("Failed to load wishlist:", err);
      }
    }
    loadWishlist();

    const handleUpdate = () => loadWishlist();
    window.addEventListener("wishlist-updated", handleUpdate);
    return () => window.removeEventListener("wishlist-updated", handleUpdate);
  }, []);

  const handleToggleWishlist = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    const token = getToken();
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    const pid = Number(productId);
    const isCurrentlyWishlisted = wishlistIds.has(pid);

    // Optimistic toggle
    setWishlistIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyWishlisted) {
        next.delete(pid);
      } else {
        next.add(pid);
      }
      return next;
    });

    try {
      if (isCurrentlyWishlisted) {
        const res = await apiFetch(`/api/wishlist/${pid}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Failed to remove from wishlist");
      } else {
        const res = await apiFetch("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: pid }),
        });
        if (!res.ok) throw new Error("Failed to add to wishlist");
      }
      notifyWishlistUpdated();
    } catch (err) {
      console.error("Wishlist toggle error on home page:", err);
      // Revert on error
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyWishlisted) {
          next.add(pid);
        } else {
          next.delete(pid);
        }
        return next;
      });
    }
  };

  const formatPrice = (basePrice) => {
    const val = Number(basePrice) || 0;
    const rupees = val >= 1000 ? val / 100 : val;
    return `₹${Math.round(rupees).toLocaleString("en-IN")}`;
  };

  return (
    <section className="w-full px-6 sm:px-10 lg:px-16 py-14 lg:py-20 bg-white">
      <div className="w-full">
        <ScrollReveal delay={0} y={20}>
          <div className="flex items-center justify-between mb-8">
            <div className="font-['Space_Grotesk'] text-[24px] font-semibold text-[#0e0e0c] flex items-center gap-4">
              <span>Best sellers</span>
              <div className="stitch" />
            </div>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold border border-[#e4e0d2] text-[#0e0e0c] bg-white hover:border-[#0e0e0c] transition-colors"
            >
              View all
            </Link>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product, index) => {
            const isWishlisted = wishlistIds.has(Number(product.id));
            const categoryLabel = product.category
              ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
              : "Footwear";
            const subLabel = product.sub || `${categoryLabel} · Premium`;

            return (
              <ScrollReveal key={product.id} delay={index * 90} y={36}>
                <div className="flex flex-col gap-3 group h-full">
                  <div
                    className={`aspect-square rounded-[14px] ${product.tileBg || "bg-[#eae5d5]"} relative overflow-hidden flex items-center justify-center border border-[#e4e0d2]`}
                  >
                    <Link
                      href={`/products/${product.id}`}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : product.category === "boot" ? (
                        <BootGlyph />
                      ) : (
                        <SneakerGlyph />
                      )}
                    </Link>

                    {/* Interactive Heart Button */}
                    <button
                      type="button"
                      aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      onClick={(e) => handleToggleWishlist(e, product.id)}
                      className="absolute top-3 right-3 w-[32px] h-[32px] rounded-full bg-white/85 backdrop-blur-xs flex items-center justify-center shadow-xs hover:scale-110 transition-transform cursor-pointer z-10"
                    >
                      <svg
                        className={`w-[15px] h-[15px] ${
                          isWishlisted
                            ? "stroke-[#b5482f] fill-[#b5482f]"
                            : "stroke-[#0e0e0c] fill-none"
                        } stroke-[1.6] transition-colors`}
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 20s-7-4.4-9.3-8.7C1.2 8 3 5 6.3 5c2 0 3.4 1.1 4.2 2.5C11.3 6.1 12.7 5 14.7 5 18 5 19.8 8 18.3 11.3 16 15.6 12 20 12 20z" />
                      </svg>
                    </button>
                  </div>

                  <Link
                    href={`/products/${product.id}`}
                    className="text-[14px] font-semibold text-[#0e0e0c] hover:underline block truncate mt-0.5"
                  >
                    {product.name}
                  </Link>

                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-[#8f8a7a]">{subLabel}</span>
                    <span className="font-mono text-[14px] font-semibold text-[#0e0e0c]">
                      {formatPrice(product.base_price || product.price)}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
