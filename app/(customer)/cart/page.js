"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiFetch, getToken } from "@/lib/apiClient";
import { notifyCartUpdated } from "@/lib/useCartCount";

// Shared SVG glyph for sneaker fallback
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

// Shared SVG glyph for boot fallback
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

// Format price in Indian Rupees
function formatPrice(amount) {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

// Get unit price for a cart item (price_override if not null, otherwise base_price / 100)
function getItemUnitPrice(item) {
  const rawPrice =
    item.price_override !== null && item.price_override !== undefined
      ? item.price_override
      : item.base_price;
  return (Number(rawPrice) || 0) / 100;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [promoMsg, setPromoMsg] = useState(null);

  // Fetch cart items from GET /api/cart via apiFetch
  const fetchCart = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const queryToken = urlParams.get("token") || urlParams.get("authToken");
        if (queryToken) {
          localStorage.setItem("authToken", queryToken);
        }
      }
      const token = getToken();
      if (!token) {
        router.push("/auth");
        return;
      }

      const res = await apiFetch("/api/cart");

      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setItems(data.items);
        } else {
          setItems([]);
        }
        notifyCartUpdated();
      }
    } catch (err) {
      console.error("Failed to load /api/cart:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Update item quantity via PUT /api/cart/[itemId]
  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1 || updatingId) return;

    try {
      setUpdatingId(itemId);
      const res = await apiFetch(`/api/cart/${itemId}`, {
        method: "PUT",
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (res.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(`Failed to update quantity for cart item ${itemId}:`, err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Remove item via DELETE /api/cart/[itemId]
  const handleRemoveItem = async (itemId) => {
    if (updatingId) return;

    try {
      setUpdatingId(itemId);
      const res = await apiFetch(`/api/cart/${itemId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchCart();
      }
    } catch (err) {
      console.error(`Failed to remove cart item ${itemId}:`, err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Running subtotal calculation (sum of quantity * unit price)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + getItemUnitPrice(item) * (Number(item.quantity) || 1);
    }, 0);
  }, [items]);

  // Total quantity of items in cart
  const totalItemsCount = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [items]);

  // Handle promo code application
  const handleApplyPromo = (e) => {
    e.preventDefault();
    const clean = promoCode.trim().toUpperCase();
    if (clean === "AVEN10") {
      setDiscountPercent(10);
      setPromoMsg({ type: "success", text: "Promo code AVEN10 applied! 10% off." });
    } else if (clean === "AVEN20") {
      setDiscountPercent(20);
      setPromoMsg({ type: "success", text: "Promo code AVEN20 applied! 20% off." });
    } else if (clean === "") {
      setDiscountPercent(0);
      setPromoMsg(null);
    } else {
      setDiscountPercent(0);
      setPromoMsg({ type: "error", text: "Invalid promo code." });
    }
  };

  const discountAmount = (subtotal * discountPercent) / 100;
  const grandTotal = Math.max(0, subtotal - discountAmount);

  return (
    <main className="min-h-screen w-full bg-white text-[#0e0e0c] flex flex-col justify-between">
      <div>
        {/* ================= STORE TOP NAV ================= */}
        <Navbar activePage="cart" countOverride={totalItemsCount} />

        {/* ================= PAGE CONTENT WRAPPER ================= */}
        <div className="w-full px-6 sm:px-10 lg:px-16 pt-8 pb-16">
          {/* Header Title */}
          <div className="mb-7">
            <h1 className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-[#0e0e0c] flex items-center gap-2.5">
              Your cart{" "}
              {!loading && (
                <span className="font-mono text-[13px] text-[#8f8a7a] font-normal">
                  ({totalItemsCount} {totalItemsCount === 1 ? "item" : "items"})
                </span>
              )}
            </h1>
          </div>

          {loading ? (
            /* Loading State */
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-mono text-[13px] text-[#8f8a7a]">Loading your cart...</p>
            </div>
          ) : items.length === 0 ? (
            /* Empty Cart State */
            <div className="py-20 px-6 max-w-lg mx-auto text-center border border-dashed border-[#e4e0d2] rounded-3xl bg-[#faf8f4]">
              <div className="w-16 h-16 rounded-full bg-white border border-[#e4e0d2] flex items-center justify-center mx-auto mb-5 shadow-2xs">
                <svg
                  className="w-7 h-7 stroke-[#8f8a7a] fill-none stroke-[1.5]"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="17" cy="20" r="1.4" />
                  <path d="M3 4h2l2.4 12h10.2L20 7H6" />
                </svg>
              </div>
              <h2 className="font-['Space_Grotesk'] font-bold text-[20px] text-[#0e0e0c] mb-2">
                Your cart is empty
              </h2>
              <p className="text-[13.5px] text-[#8f8a7a] max-w-xs mx-auto mb-7 leading-relaxed">
                Looks like you haven&apos;t added any footwear to your cart yet. Explore our handcrafted collection.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity"
              >
                <span>Explore collection</span>
                <span>→</span>
              </Link>
            </div>
          ) : (
            /* Cart Grid with Items & Order Summary */
            <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
              {/* Left Column: Cart Items */}
              <div>
                <div className="divide-y divide-[#e4e0d2] border-t border-b border-[#e4e0d2]">
                  {items.map((item) => {
                    const unitPrice = getItemUnitPrice(item);
                    const lineTotal = unitPrice * (Number(item.quantity) || 1);
                    const isUpdatingThis = updatingId === item.id;

                    return (
                      <div
                        key={item.id}
                        className="py-5 grid grid-cols-[88px_1fr_auto] gap-4 sm:gap-5 items-center group"
                      >
                        {/* Thumbnail Image */}
                        <div className="w-[88px] h-[88px] rounded-[12px] bg-[#eae5d5] overflow-hidden flex items-center justify-center shrink-0 border border-[#e4e0d2] relative">
                          <Link href={`/products/${item.product_id}`} className="w-full h-full flex items-center justify-center">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (item.name || "").toLowerCase().includes("boot") ? (
                              <BootGlyph />
                            ) : (
                              <SneakerGlyph />
                            )}
                          </Link>
                        </div>

                        {/* Middle Info */}
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.product_id}`}
                            className="font-semibold text-[14px] sm:text-[15px] text-[#0e0e0c] hover:underline block truncate mb-1"
                          >
                            {item.name}
                          </Link>

                          <div className="text-[12px] text-[#8f8a7a] mb-2.5">
                            {item.color} · {item.size}
                          </div>

                          {/* Low stock warning */}
                          {item.stock !== undefined && item.stock !== null && Number(item.stock) <= 5 && (
                            <span className="text-[11px] text-[#b5482f] font-medium block mb-2">
                              Only {item.stock} left in stock
                            </span>
                          )}

                          {/* Quantity Stepper */}
                          <div className="inline-flex items-center border border-[#e4e0d2] rounded-full bg-white shadow-2xs">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1 || isUpdatingThis}
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 flex items-center justify-center text-[15px] hover:bg-[#f2efe6] rounded-l-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              –
                            </button>
                            <span className="w-7 text-center font-mono text-[12.5px] font-medium text-[#0e0e0c]">
                              {isUpdatingThis ? "..." : item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={
                                (item.stock && item.quantity >= item.stock) || isUpdatingThis
                              }
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 flex items-center justify-center text-[15px] hover:bg-[#f2efe6] rounded-r-full transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Right Details: Price & Remove */}
                        <div className="text-right flex flex-col items-end justify-between self-stretch py-1">
                          <div className="flex flex-col items-end">
                            <span className="font-mono text-[14.5px] sm:text-[15px] font-semibold text-[#0e0e0c]">
                              {formatPrice(lineTotal)}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-[11px] text-[#8f8a7a] font-mono mt-0.5">
                                ({formatPrice(unitPrice)} each)
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={isUpdatingThis}
                            className="text-[11.5px] text-[#8f8a7a] hover:text-[#b5482f] underline cursor-pointer flex items-center gap-1 transition-colors mt-auto disabled:opacity-50"
                          >
                            <svg
                              className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                            </svg>
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Link
                  href="/products"
                  className="inline-block mt-6 text-[12.5px] text-[#3a382f] hover:text-[#0e0e0c] underline transition-colors"
                >
                  ← Continue shopping
                </Link>
              </div>

              {/* Right Column: Order Summary Card */}
              <div className="bg-[#f2efe6] border border-[#e4e0d2] rounded-[20px] p-6 sm:p-7 h-fit sticky top-6">
                <h3 className="font-['Space_Grotesk'] font-bold text-[16px] text-[#0e0e0c] mb-4.5">
                  Order summary
                </h3>

                <div className="space-y-3 text-[13px] text-[#3a382f]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono font-medium text-[#0e0e0c]">{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Shipping</span>
                    <span className="bg-[#e7f5e8] text-[#1b6e26] px-2.5 py-0.5 rounded-full text-[11px] font-semibold">
                      Free
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Estimated tax</span>
                    <span className="font-mono text-[#8f8a7a]">Included</span>
                  </div>

                  {discountPercent > 0 && (
                    <div className="flex justify-between text-[#1b6e26]">
                      <span>Promo discount ({discountPercent}%)</span>
                      <span className="font-mono font-semibold">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                </div>

                {/* Promo Code Input */}
                <form onSubmit={handleApplyPromo} className="mt-5 mb-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code (e.g. AVEN10)"
                      className="flex-1 bg-white border border-[#e4e0d2] rounded-full px-4 py-2 text-[12.5px] text-[#0e0e0c] placeholder:text-[#8f8a7a] outline-none focus:border-[#0e0e0c] transition-colors"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 border border-[#e4e0d2] bg-white rounded-full text-[12px] font-semibold text-[#0e0e0c] hover:border-[#0e0e0c] hover:bg-[#faf8f4] transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                  {promoMsg && (
                    <p
                      className={`text-[11.5px] mt-1.5 px-1 ${
                        promoMsg.type === "success" ? "text-[#1b6e26]" : "text-[#b5482f]"
                      }`}
                    >
                      {promoMsg.text}
                    </p>
                  )}
                </form>

                {/* Grand Total */}
                <div className="flex justify-between items-baseline border-t border-[#e4e0d2] pt-4 mt-2">
                  <span className="font-semibold text-[15px] text-[#0e0e0c]">Total</span>
                  <span className="font-mono text-[20px] font-bold text-[#0e0e0c]">
                    {formatPrice(grandTotal)}
                  </span>
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="w-full mt-5 py-3.5 px-6 rounded-full text-[13.5px] font-semibold tracking-[0.01em] bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Checkout</span>
                  <span>→</span>
                </Link>

                <div className="mt-4 pt-3.5 border-t border-[#e4e0d2]/70 flex items-center justify-center gap-2 text-[11.5px] text-[#8f8a7a]">
                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>Secure checkout · Free 30-day returns</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= STORE FOOTER ================= */}
      <footer className="w-full border-t border-[#e4e0d2] bg-white px-6 sm:px-10 lg:px-16 py-14 lg:py-20 mt-12">
        <div className="w-full grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8 lg:gap-12">
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
