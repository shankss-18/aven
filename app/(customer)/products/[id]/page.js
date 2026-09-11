"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiFetch, getToken } from "@/lib/apiClient";
import { notifyCartUpdated } from "@/lib/useCartCount";
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

function getColorHex(colorName) {
  const name = (colorName || "").toLowerCase();
  if (name.includes("black")) return "#111111";
  if (name.includes("white")) return "#f4f3ef";
  if (name.includes("grey") || name.includes("gray")) return "#9a9a94";
  if (name.includes("brown") || name.includes("chestnut")) return "#8a6b4a";
  if (name.includes("oak") || name.includes("tan")) return "#c29b68";
  if (name.includes("green") || name.includes("olive")) return "#3a4a3a";
  if (name.includes("blue") || name.includes("navy")) return "#223344";
  if (name.includes("fog") || name.includes("bone")) return "#e3dfd0";
  return "#dcd7cb";
}

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [productData, setProductData] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [activeTab, setActiveTab] = useState("reviews");
  const [activeThumbnail, setActiveThumbnail] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [relatedWishlistIds, setRelatedWishlistIds] = useState(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const [addedNotice, setAddedNotice] = useState(false);
  const [cartError, setCartError] = useState(null);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  // Check wishlist status on mount
  useEffect(() => {
    async function checkWishlist() {
      const token = getToken();
      if (!token) return;
      try {
        const res = await apiFetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items)) {
            const ids = new Set(data.items.map((item) => Number(item.product_id)));
            setIsWishlisted(ids.has(Number(id)));
            setRelatedWishlistIds(ids);
          }
        }
      } catch (err) {
        console.error("Failed to check wishlist membership:", err);
      }
    }
    checkWishlist();

    const handleUpdate = () => checkWishlist();
    window.addEventListener("wishlist-updated", handleUpdate);
    return () => window.removeEventListener("wishlist-updated", handleUpdate);
  }, [id]);

  const handleToggleWishlist = async () => {
    const token = getToken();
    if (!token) {
      window.location.href = "/auth";
      return;
    }

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    try {
      if (nextState) {
        const res = await apiFetch("/api/wishlist", {
          method: "POST",
          body: JSON.stringify({ productId: Number(id) }),
        });
        if (!res.ok) throw new Error("Failed to add to wishlist");
      } else {
        const res = await apiFetch(`/api/wishlist/${Number(id)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to remove from wishlist");
      }
      notifyWishlistUpdated();
    } catch (err) {
      console.error("Wishlist toggle error:", err);
      setIsWishlisted(!nextState); // Revert on failure
    }
  };

  const handleToggleRelatedWishlist = async (e, relId) => {
    e.preventDefault();
    e.stopPropagation();
    const token = getToken();
    if (!token) {
      window.location.href = "/auth";
      return;
    }
    const pid = Number(relId);
    const isCurrentlyWishlisted = relatedWishlistIds.has(pid);
    setRelatedWishlistIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyWishlisted) next.delete(pid);
      else next.add(pid);
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
      console.error("Related wishlist toggle error:", err);
      setRelatedWishlistIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyWishlisted) next.add(pid);
        else next.delete(pid);
        return next;
      });
    }
  };

  // Close size chart modal with Escape key & lock body scrolling
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setIsSizeChartOpen(false);
      }
    }
    if (isSizeChartOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSizeChartOpen]);

  useEffect(() => {
    let isMounted = true;

    async function fetchProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error(`Product not found (Status: ${res.status})`);
        }
        const data = await res.json();
        if (isMounted) {
          setProductData(data);

          // Default selection from variants
          if (data.variants && data.variants.length > 0) {
            const firstAvailable =
              data.variants.find((v) => Number(v.stock) > 0) || data.variants[0];
            setSelectedColor(firstAvailable.color || "");
            setSelectedSize(firstAvailable.size || "");
          }
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function fetchRelated() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.products) {
            setRelatedProducts(
              data.products.filter((p) => String(p.id) !== String(id)).slice(0, 4)
            );
          }
        }
      } catch (e) {
        console.warn("Could not load related products", e);
      }
    }

    fetchProduct();
    fetchRelated();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-12 text-[#0e0e0c]">
        <div className="w-8 h-8 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-[13px] text-[#8f8a7a]">Loading product details...</p>
      </main>
    );
  }

  if (error || !productData || !productData.product) {
    return (
      <main className="min-h-screen w-full bg-white flex flex-col items-center justify-center p-12 text-[#0e0e0c]">
        <h1 className="font-['Space_Grotesk'] text-2xl font-bold mb-3">Product Not Found</h1>
        <p className="text-[#8f8a7a] mb-6 text-[14px]">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/products"
          className="px-6 py-3 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-white hover:opacity-90 transition-opacity"
        >
          Return to catalog
        </Link>
      </main>
    );
  }

  const { product, variants = [] } = productData;

  // Extract unique colors & sizes from the variants array
  const availableColors = Array.from(new Set(variants.map((v) => v.color))).filter(Boolean);
  const availableSizes = Array.from(new Set(variants.map((v) => v.size))).filter(Boolean);

  // Find currently active variant based on selectedColor & selectedSize
  const currentVariant =
    variants.find((v) => v.color === selectedColor && v.size === selectedSize) ||
    variants.find((v) => v.color === selectedColor) ||
    variants[0];

  // Price rule: price_override if not null, otherwise product.base_price, divided by 100, prefixed with ₹
  const rawPrice =
    currentVariant && currentVariant.price_override !== null && currentVariant.price_override !== undefined
      ? currentVariant.price_override
      : product.base_price;
  const formattedPrice = `₹${(Math.round(Number(rawPrice) || 0) / 100).toLocaleString("en-IN")}`;

  // Check if active variant is out of stock
  const isOutOfStock = !currentVariant || Number(currentVariant.stock) <= 0;

  // Gallery images (from product cover and product_images gallery records)
  const galleryImages = [];
  if (product.image_url) {
    galleryImages.push(product.image_url);
  }
  if (productData.images && Array.isArray(productData.images)) {
    productData.images.forEach((img) => {
      const url = img.image_url || img.url;
      if (url && !galleryImages.includes(url)) {
        galleryImages.push(url);
      }
    });
  }

  const handleAddToCart = async () => {
    if (isOutOfStock || !currentVariant || isAdding) return;

    const token = getToken();
    if (!token) {
      router.push("/auth");
      return;
    }

    try {
      setIsAdding(true);
      setCartError(null);
      const res = await apiFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          variantId: currentVariant.id,
          quantity: 1,
        }),
      });

      if (res.ok) {
        setAddedNotice(true);
        setTimeout(() => setAddedNotice(false), 3000);
        notifyCartUpdated();
      } else {
        const data = await res.json().catch(() => ({}));
        setCartError(data.error || "Failed to add to cart");
        setTimeout(() => setCartError(null), 3500);
      }
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setCartError("Failed to add to cart");
      setTimeout(() => setCartError(null), 3500);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-white text-[#0e0e0c]">
      
      {/* ================= STORE TOP NAV ================= */}
      <Navbar activePage="products" />

      {/* ================= BREADCRUMB ================= */}
      <div className="max-w-[1200px] mx-auto w-full px-6 sm:px-8 pt-6 text-[12px] text-[#8f8a7a]">
        <Link href="/products" className="hover:underline">
          Clothes and shoes
        </Link>{" "}
        <span className="mx-1 text-[#0e0e0c]">›</span>{" "}
        <Link href="/products" className="hover:underline">
          Shoes
        </Link>{" "}
        <span className="mx-1 text-[#0e0e0c]">›</span>{" "}
        <b className="text-[#0e0e0c] font-medium">{product.name}</b>
      </div>

      {/* ================= PRODUCT DETAIL MAIN SECTION (BALANCED & PROPORTIONAL) ================= */}
      <section className="max-w-[1200px] mx-auto w-full px-6 sm:px-8 py-6 grid grid-cols-1 md:grid-cols-[460px_1fr] lg:grid-cols-[510px_1fr] gap-8 lg:gap-14 items-start">
        
        {/* Left Gallery */}
        <div className="w-full max-w-[510px] mx-auto md:sticky md:top-24">
          <div className="w-full aspect-[4/3.3] max-h-[430px] rounded-[18px] bg-[#eae5d5] relative overflow-hidden flex items-center justify-center border border-[#e4e0d2] shadow-2xs">
            {galleryImages.length > 0 ? (
              <img
                src={galleryImages[activeThumbnail] || galleryImages[0]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : product.category === "boot" ? (
              <BootGlyph className="w-[58%] stroke-[#0e0e0c] fill-none stroke-[1.2]" />
            ) : (
              <SneakerGlyph className="w-[58%] stroke-[#0e0e0c] fill-none stroke-[1.2]" />
            )}
          </div>

          {/* Thumbnails */}
          {galleryImages.length > 1 && (
            <div className="flex items-center gap-2.5 mt-3.5 overflow-x-auto pb-1">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveThumbnail(idx)}
                  className={`w-16 h-14 sm:w-20 sm:h-16 shrink-0 rounded-[10px] bg-[#eae5d5] relative overflow-hidden flex items-center justify-center border-2 transition-all cursor-pointer ${
                    activeThumbnail === idx
                      ? "border-[#0e0e0c] ring-1 ring-[#0e0e0c]"
                      : "border-transparent hover:border-[#8f8a7a]"
                  }`}
                  title={`Photo ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Info */}
        <div className="flex flex-col justify-start">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-[24px] h-[24px] rounded-full bg-[#0e0e0c] text-[#f2efe6] flex items-center justify-center font-bold text-[10.5px]">
              A
            </div>
            <span className="text-[12.5px] text-[#3a382f] font-medium">Aven Original</span>
            <span className="ml-auto font-mono text-[11px] text-[#8f8a7a]">
              AV-PR{product.id}-{product.category?.slice(0, 3)?.toUpperCase() || "SHOE"}
            </span>
          </div>

          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl lg:text-[27px] font-bold text-[#0e0e0c] mb-1.5 leading-tight">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-3">
            <div className="text-[#2b2506] text-[12px] tracking-[2px]">★★★★☆</div>
            <span className="text-[11.5px] text-[#8f8a7a]">42 reviews</span>
          </div>

          {/* Dynamic Price */}
          <div className="font-mono text-xl sm:text-[24px] font-bold text-[#0e0e0c] mb-5">
            {formattedPrice}
          </div>

          {/* Color Selector (Built from variants array with hex swatches) */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-[12px] mb-2.5">
              <b className="text-[#8f8a7a] uppercase tracking-[0.06em] font-semibold">Color</b>
              <div className="flex items-center gap-1.5">
                {selectedColor && (
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-2xs inline-block shrink-0"
                    style={{
                      backgroundColor:
                        variants.find((v) => v.color === selectedColor && v.color_hex)?.color_hex ||
                        getColorHex(selectedColor),
                    }}
                  />
                )}
                <span className="font-medium text-[#0e0e0c]">{selectedColor || "None"}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {availableColors.map((colorName) => {
                // Check if this color has any stock across its sizes
                const colorStock = variants
                  .filter((v) => v.color === colorName)
                  .reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
                const isColorDisabled = colorStock <= 0;
                const isSelected = selectedColor === colorName;
                const variantForColor = variants.find((v) => v.color === colorName && v.color_hex);
                const swatchHex = variantForColor?.color_hex || getColorHex(colorName);

                return (
                  <button
                    key={colorName}
                    type="button"
                    disabled={isColorDisabled}
                    onClick={() => {
                      setSelectedColor(colorName);
                      // Adjust size if current selected size is out of stock in this new color
                      const matchingVar = variants.find(
                        (v) => v.color === colorName && v.size === selectedSize
                      );
                      if (!matchingVar || Number(matchingVar.stock) <= 0) {
                        const firstInStockSize = variants.find(
                          (v) => v.color === colorName && Number(v.stock) > 0
                        );
                        if (firstInStockSize) setSelectedSize(firstInStockSize.size);
                      }
                    }}
                    className={`w-[42px] h-[42px] rounded-full border-2 relative transition-all flex items-center justify-center ${
                      isColorDisabled
                        ? "opacity-35 cursor-not-allowed border-zinc-300"
                        : isSelected
                        ? "border-[#0e0e0c] ring-2 ring-offset-2 ring-[#0e0e0c] scale-105"
                        : "border-black/10 hover:border-[#0e0e0c] hover:scale-105 cursor-pointer shadow-2xs"
                    }`}
                    style={{ backgroundColor: swatchHex }}
                    title={`${colorName}${isColorDisabled ? " (Out of Stock)" : ""}`}
                    aria-label={colorName}
                  >
                    {isColorDisabled && (
                      <span className="absolute inset-0 flex items-center justify-center text-red-500 font-bold text-[18px]">
                        ×
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Size Selector (Built from variants array) */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-[12px] mb-2.5">
              <b className="text-[#8f8a7a] uppercase tracking-[0.06em] font-semibold">
                Size · UK Men
              </b>
              <span className="font-medium text-[#0e0e0c]">
                {selectedSize ? selectedSize : "Select a size"}
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {availableSizes.map((sizeName) => {
                // Find variant for selectedColor + this size
                const sizeVariant = variants.find(
                  (v) => v.color === selectedColor && v.size === sizeName
                );
                const isSizeDisabled = !sizeVariant || Number(sizeVariant.stock) <= 0;
                const isSelected = selectedSize === sizeName && !isSizeDisabled;

                return (
                  <button
                    key={sizeName}
                    type="button"
                    disabled={isSizeDisabled}
                    onClick={() => setSelectedSize(sizeName)}
                    className={`py-3 text-center rounded-[8px] text-[12.5px] border transition-all ${
                      isSizeDisabled
                        ? "opacity-35 cursor-not-allowed bg-zinc-100 text-zinc-400 border-zinc-200 line-through select-none"
                        : isSelected
                        ? "bg-[#0e0e0c] text-[#f2efe6] border-[#0e0e0c] font-semibold"
                        : "bg-white text-[#3a382f] border-[#e4e0d2] hover:border-[#0e0e0c] cursor-pointer"
                    }`}
                  >
                    {sizeName}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              id="sizeGuideButton"
              onClick={() => setIsSizeChartOpen(true)}
              className="text-[11.5px] text-[#8f8a7a] underline mt-3 inline-flex items-center gap-1 cursor-pointer hover:text-[#0e0e0c] transition-colors"
            >
              <span>Size guide</span>
              <span>→</span>
            </button>
          </div>

          {/* Stock Notice */}
          {currentVariant && Number(currentVariant.stock) > 0 && Number(currentVariant.stock) <= 6 && (
            <p className="text-[12px] text-[#b5482f] font-medium mb-3">
              Low Stock: Only {currentVariant.stock} pairs remaining in this size & color.
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              id="add-to-cart-btn"
              disabled={isOutOfStock || isAdding}
              onClick={handleAddToCart}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full text-[13.5px] font-semibold tracking-[0.01em] transition-all ${
                isOutOfStock
                  ? "bg-zinc-200 text-zinc-400 border border-zinc-200 cursor-not-allowed"
                  : "bg-[#0e0e0c] text-[#f2efe6] border border-[#0e0e0c] hover:-translate-y-0.5 cursor-pointer shadow-sm disabled:opacity-50"
              }`}
            >
              {isAdding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    className="stroke-current fill-none stroke-[1.6]"
                  >
                    <circle cx="9" cy="20" r="1.4" />
                    <circle cx="17" cy="20" r="1.4" />
                    <path d="M3 4h2l2.4 12h10.2L20 7H6" />
                  </svg>
                  <span>{isOutOfStock ? "Out of stock" : "Add to cart"}</span>
                </>
              )}
            </button>

            <button
              type="button"
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={handleToggleWishlist}
              className="w-[48px] h-[48px] rounded-[8px] border border-[#e4e0d2] bg-white flex items-center justify-center hover:border-[#0e0e0c] transition-colors cursor-pointer"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-[19px] h-[19px] ${
                  isWishlisted
                    ? "stroke-[#b5482f] fill-[#b5482f]"
                    : "stroke-[#0e0e0c] fill-none"
                } stroke-[1.6]`}
              >
                <path d="M12 20s-7-4.4-9.3-8.7C1.2 8 3 5 6.3 5c2 0 3.4 1.1 4.2 2.5C11.3 6.1 12.7 5 14.7 5 18 5 19.8 8 18.3 11.3 16 15.6 12 20 12 20z" />
              </svg>
            </button>
          </div>

          {addedNotice && (
            <div className="mb-3 p-2.5 rounded-lg bg-[#e7efe3] text-[#3f6b46] text-[12.5px] font-medium text-center">
              ✓ Added {product.name} ({selectedColor} · {selectedSize}) to cart!
            </div>
          )}

          <div className="flex items-center gap-2 text-[12.5px] text-[#3a382f] mt-2">
            <svg
              className="w-4 h-4 stroke-[#3a382f] fill-none stroke-[1.5] shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M3 16V6h11v10" />
              <path d="M14 10h4l3 3v3h-7" />
              <circle cx="7" cy="18" r="1.6" />
              <circle cx="18" cy="18" r="1.6" />
            </svg>
            <span>Free delivery on orders over ₹2,500 · Free 30-day returns</span>
          </div>
        </div>
      </section>

      {/* ================= TABS SECTION ================= */}
      <section className="max-w-[1200px] mx-auto w-full px-6 sm:px-8 mt-8">
        <div className="flex gap-7 border-b border-[#e4e0d2]">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`pb-3.5 text-[13.5px] transition-colors cursor-pointer ${
              activeTab === "details"
                ? "text-[#0e0e0c] border-b-2 border-[#0e0e0c] font-semibold"
                : "text-[#8f8a7a] hover:text-[#0e0e0c]"
            }`}
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`pb-3.5 text-[13.5px] transition-colors cursor-pointer ${
              activeTab === "reviews"
                ? "text-[#0e0e0c] border-b-2 border-[#0e0e0c] font-semibold"
                : "text-[#8f8a7a] hover:text-[#0e0e0c]"
            }`}
          >
            Reviews
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shipping")}
            className={`pb-3.5 text-[13.5px] transition-colors cursor-pointer ${
              activeTab === "shipping"
                ? "text-[#0e0e0c] border-b-2 border-[#0e0e0c] font-semibold"
                : "text-[#8f8a7a] hover:text-[#0e0e0c]"
            }`}
          >
            Shipping &amp; returns
          </button>
        </div>

        {/* Tab Content: Details */}
        {activeTab === "details" && (
          <div className="py-8 max-w-3xl space-y-4 text-[14px] text-[#3a382f] leading-relaxed">
            <p>{product.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#e4e0d2]">
              <div>
                <b className="text-[12px] uppercase tracking-wider text-[#8f8a7a] block mb-1">
                  Materials
                </b>
                <span>Full-grain bovine leather, breathable mesh lining, waxed cotton laces</span>
              </div>
              <div>
                <b className="text-[12px] uppercase tracking-wider text-[#8f8a7a] block mb-1">
                  Sole Construction
                </b>
                <span>Reinforced rubber cupsole with welted perimeter stitching</span>
              </div>
              <div>
                <b className="text-[12px] uppercase tracking-wider text-[#8f8a7a] block mb-1">
                  Origin
                </b>
                <span>Hand-finished in Léon, Mexico</span>
              </div>
              <div>
                <b className="text-[12px] uppercase tracking-wider text-[#8f8a7a] block mb-1">
                  Warranty
                </b>
                <span>8-Year Outsole Replacement Warranty</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Reviews */}
        {activeTab === "reviews" && (
          <div className="py-8 grid grid-cols-1 md:grid-cols-[1fr_1.4fr] gap-10 lg:gap-14">
            <div>
              <div className="flex items-center gap-3.5 mb-5">
                <span className="font-['Space_Grotesk'] text-4xl font-bold text-[#0e0e0c]">
                  4.8
                </span>
                <div className="text-[#2b2506] text-[16px] tracking-[2px]">★★★★★</div>
              </div>

              <div className="space-y-2 text-[12px] text-[#8f8a7a]">
                <div className="flex items-center gap-3">
                  <span className="w-3">5</span>
                  <div className="flex-1 h-1.5 bg-[#e4e0d2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#b7e8f7] rounded-full" style={{ width: "88%" }} />
                  </div>
                  <span className="w-5 text-right">28</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3">4</span>
                  <div className="flex-1 h-1.5 bg-[#e4e0d2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#b7e8f7] rounded-full" style={{ width: "30%" }} />
                  </div>
                  <span className="w-5 text-right">9</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3">3</span>
                  <div className="flex-1 h-1.5 bg-[#e4e0d2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#b7e8f7] rounded-full" style={{ width: "14%" }} />
                  </div>
                  <span className="w-5 text-right">4</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3">2</span>
                  <div className="flex-1 h-1.5 bg-[#e4e0d2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#b7e8f7] rounded-full" style={{ width: "4%" }} />
                  </div>
                  <span className="w-5 text-right">1</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-3">1</span>
                  <div className="flex-1 h-1.5 bg-[#e4e0d2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#b7e8f7] rounded-full" style={{ width: "2%" }} />
                  </div>
                  <span className="w-5 text-right">0</span>
                </div>
              </div>
            </div>

            <div className="divide-y divide-[#e4e0d2]">
              <div className="pb-4 mb-4">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-[#c9c4b3]" />
                  <b className="text-[13px] text-[#0e0e0c]">Helen M.</b>
                  <span className="text-[11.5px] text-[#8f8a7a]">Yesterday</span>
                </div>
                <div className="text-[11px] text-[#2b2506] mb-1">★★★★★</div>
                <p className="text-[13px] text-[#3a382f]">
                  True to size and the ankle padding held up on a 10-mile day. Breaks in fast.
                </p>
              </div>

              <div className="py-4">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-[#c9c4b3]" />
                  <b className="text-[13px] text-[#0e0e0c]">Andrew G.</b>
                  <span className="text-[11.5px] text-[#8f8a7a]">2 days ago</span>
                </div>
                <div className="text-[11px] text-[#2b2506] mb-1">★★★★☆</div>
                <p className="text-[13px] text-[#3a382f]">
                  Great everyday shoe. Wish the fog colorway ran a half size wider.
                </p>
              </div>

              <div className="pt-4">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-[#c9c4b3]" />
                  <b className="text-[13px] text-[#0e0e0c]">Priya D.</b>
                  <span className="text-[11.5px] text-[#8f8a7a]">4 days ago</span>
                </div>
                <div className="text-[11px] text-[#2b2506] mb-1">★★★★★</div>
                <p className="text-[13px] text-[#3a382f]">
                  Ordered a size up per the guide and it was spot on. Excellent build quality.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Shipping */}
        {activeTab === "shipping" && (
          <div className="py-8 max-w-3xl space-y-4 text-[13.5px] text-[#3a382f] leading-relaxed">
            <p>
              We offer complimentary standard ground shipping on all orders over ₹2,500 across India.
              Orders are packaged in recyclable boxes within 24-48 hours of confirmation.
            </p>
            <div className="pt-3 border-t border-[#e4e0d2] space-y-2">
              <p>
                <b>Standard Delivery:</b> 3–5 business days
              </p>
              <p>
                <b>Express Courier:</b> 1–2 business days (additional fee at checkout)
              </p>
              <p>
                <b>Returns:</b> If you are not completely satisfied with your purchase, returns are accepted
                within 30 days of receipt for unworn items in their original packaging.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ================= RELATED PRODUCTS ("YOU MAY ALSO LIKE") ================= */}
      {relatedProducts.length > 0 && (
        <section className="max-w-[1200px] mx-auto w-full px-6 sm:px-8 py-10 lg:py-14 border-t border-[#e4e0d2] mt-8">
          <div className="flex items-center gap-4 mb-7">
            <h2 className="font-['Space_Grotesk'] text-[20px] sm:text-[22px] font-medium text-[#1c1b18]">
              You may also like
            </h2>
            <div className="stitch" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 lg:gap-8">
            {relatedProducts.map((rel, idx) => {
              const bgColors = ["bg-[#eae5d5]", "bg-[#e3dfd0]", "bg-[#dfe2dc]", "bg-[#ece3d8]"];
              const bg = bgColors[idx % bgColors.length];
              const cleanName = rel.name ? rel.name.split(" | ")[0].trim() : "Footwear";
              const rawPrice = Number(rel.base_price) || 0;
              const formattedPrice = rawPrice > 1000 ? Math.round(rawPrice / 100) : rawPrice;
              const isItemWishlisted = relatedWishlistIds.has(Number(rel.id));

              return (
                <div key={rel.id} className="flex flex-col gap-2.5 group h-full">
                  <div
                    className={`aspect-square rounded-[14px] ${bg} overflow-hidden flex items-center justify-center relative border border-[#e4e0d2]`}
                  >
                    <Link
                      href={`/products/${rel.id}`}
                      className="w-full h-full flex items-center justify-center"
                    >
                      {rel.image_url ? (
                        <img
                          src={rel.image_url}
                          alt={cleanName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : rel.category === "boot" ? (
                        <BootGlyph className="w-[55%] stroke-[#0e0e0c] fill-none stroke-[1.2]" />
                      ) : (
                        <SneakerGlyph className="w-[55%] stroke-[#0e0e0c] fill-none stroke-[1.2]" />
                      )}
                    </Link>

                    {/* Interactive Heart Button */}
                    <button
                      type="button"
                      aria-label={isItemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                      onClick={(e) => handleToggleRelatedWishlist(e, rel.id)}
                      className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer z-10"
                    >
                      <svg
                        className={`w-[13px] h-[13px] sm:w-[15px] sm:h-[15px] ${
                          isItemWishlisted
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
                    href={`/products/${rel.id}`}
                    className="text-[13px] sm:text-[13.5px] font-medium text-[#1c1b18] hover:underline block truncate mt-0.5"
                    title={rel.name}
                  >
                    {cleanName}
                  </Link>

                  <div className="flex items-center justify-between text-[11.5px] sm:text-[12px]">
                    <span className="text-[#8f8a7a] font-normal truncate">
                      {rel.category ? rel.category.charAt(0).toUpperCase() + rel.category.slice(1) : "Footwear"}
                    </span>
                    <span className="font-medium text-[13px] sm:text-[13.5px] text-[#1c1b18] shrink-0 ml-2">
                      ₹{formattedPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ================= STORE FOOTER ================= */}
      <footer className="w-full border-t border-[#e4e0d2] bg-white px-6 sm:px-8 py-10 lg:py-14">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr] gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <div className="font-['Space_Grotesk'] font-bold text-[20px] mb-2.5 text-[#0e0e0c]">
              AVEN
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

      {/* ================= SIZE CHART MODAL ================= */}
      {isSizeChartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="size-chart-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            id="sizeChartBackdrop"
            onClick={() => setIsSizeChartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
          />

          {/* Modal Content Card */}
          <div className="relative w-full max-w-xl bg-white rounded-[24px] shadow-2xl border border-[#e4e0d2] z-10 overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-[#e4e0d2] bg-[#faf8f4]">
              <div>
                <h3
                  id="size-chart-title"
                  className="font-['Space_Grotesk'] font-bold text-[19px] tracking-[0.01em] text-[#0e0e0c]"
                >
                  Size Chart &amp; Fit Guide
                </h3>
                <p className="text-[12px] text-[#8f8a7a] mt-0.5">
                  Men&apos;s Footwear · International Size Conversion
                </p>
              </div>
              <button
                type="button"
                id="closeSizeChartBtn"
                onClick={() => setIsSizeChartOpen(false)}
                aria-label="Close size guide"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8f8a7a] hover:text-[#0e0e0c] hover:bg-[#e4e0d2]/50 transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4 stroke-current stroke-2 fill-none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
              {/* Size Conversion Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#8f8a7a]">
                    Conversion Table
                  </h4>
                  <span className="text-[11.5px] text-[#8f8a7a]">
                    Click row to select size
                  </span>
                </div>

                <div className="border border-[#e4e0d2] rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead>
                      <tr className="bg-[#f5f3eb] text-[#3a382f] font-semibold border-b border-[#e4e0d2]">
                        <th className="py-2.5 px-3.5">UK</th>
                        <th className="py-2.5 px-3.5">EU</th>
                        <th className="py-2.5 px-3.5">US</th>
                        <th className="py-2.5 px-3.5">Foot Length</th>
                        <th className="py-2.5 px-3.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e0d2]">
                      {[
                        { uk: "UK 7", eu: "41", us: "8", length: "25.4 cm / 10.0\"" },
                        { uk: "UK 8", eu: "42", us: "9", length: "26.2 cm / 10.3\"" },
                        { uk: "UK 9", eu: "43", us: "10", length: "27.1 cm / 10.7\"" },
                        { uk: "UK 10", eu: "44", us: "11", length: "27.9 cm / 11.0\"" },
                        { uk: "UK 11", eu: "45", us: "12", length: "28.8 cm / 11.3\"" },
                      ].map((row) => {
                        const isCurrent = selectedSize === row.uk;
                        const matchingVariant = variants.find(
                          (v) =>
                            v.size === row.uk &&
                            (selectedColor ? v.color === selectedColor : true)
                        );
                        const isAvailable =
                          matchingVariant && Number(matchingVariant.stock) > 0;
                        const isOption = availableSizes.includes(row.uk);

                        return (
                          <tr
                            key={row.uk}
                            onClick={() => {
                              if (isOption) {
                                setSelectedSize(row.uk);
                              }
                            }}
                            className={`transition-colors cursor-pointer ${
                              isCurrent
                                ? "bg-[#0e0e0c] text-[#f2efe6] font-medium"
                                : "hover:bg-[#faf8f4] text-[#0e0e0c]"
                            }`}
                          >
                            <td className="py-2.5 px-3.5 font-semibold">{row.uk}</td>
                            <td className="py-2.5 px-3.5">{row.eu}</td>
                            <td className="py-2.5 px-3.5">{row.us}</td>
                            <td className="py-2.5 px-3.5 font-mono text-[11.5px] opacity-85">
                              {row.length}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#b7e8f7]">
                                  Selected ✓
                                </span>
                              ) : isAvailable ? (
                                <span className="text-[11.5px] text-emerald-600 font-medium">
                                  In stock
                                </span>
                              ) : isOption ? (
                                <span className="text-[11.5px] text-[#8f8a7a]">
                                  Select
                                </span>
                              ) : (
                                <span className="text-[11.5px] text-zinc-400">
                                  Unavailable
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* How to Measure */}
              <div className="bg-[#f7f5ed] p-4.5 rounded-xl border border-[#e4e0d2]">
                <h5 className="text-[12.5px] font-semibold text-[#0e0e0c] mb-2.5 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 stroke-current fill-none stroke-[1.8]"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M4 21v-7a4 4 0 014-4h8a4 4 0 014 4v7M12 3v7" />
                  </svg>
                  How to Measure for the Perfect Fit
                </h5>
                <ol className="text-[12px] text-[#3a382f] space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>
                    Place a sheet of paper on the floor against a flat wall.
                  </li>
                  <li>
                    Stand on the paper with your heel lightly touching the wall.
                  </li>
                  <li>
                    Mark the furthest point of your longest toe and measure the distance in centimeters.
                  </li>
                </ol>
                <div className="mt-3 pt-2.5 border-t border-[#e4e0d2] text-[11.5px] text-[#8f8a7a]">
                  <b className="text-[#0e0e0c] font-medium">Fit Recommendation:</b>{" "}
                  Aven shoes fit true to size in standard D-width. If you fall between sizes or prefer wearing thick wool socks with your boots, we recommend sizing up.
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 sm:px-8 py-4 border-t border-[#e4e0d2] bg-white flex items-center justify-between">
              <span className="text-[12px] text-[#8f8a7a]">
                Current selection: <b className="text-[#0e0e0c]">{selectedSize || "None"}</b>
              </span>
              <button
                type="button"
                onClick={() => setIsSizeChartOpen(false)}
                className="px-5 py-2 rounded-full text-[12.5px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Apply &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
