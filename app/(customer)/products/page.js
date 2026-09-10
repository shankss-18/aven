"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
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

const TILE_TONES = [
  "bg-[#eae5d5]",
  "bg-[#e3dfd0]",
  "bg-[#dfe2dc]",
  "bg-[#ece3d8]",
  "bg-[#e6e6de]",
  "bg-[#e1ded1]",
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
];

const SIZE_OPTIONS = [
  { id: "UK 7", label: "UK 7", eu: "41" },
  { id: "UK 8", label: "UK 8", eu: "42" },
  { id: "UK 9", label: "UK 9", eu: "43" },
  { id: "UK 10", label: "UK 10", eu: "44" },
  { id: "UK 11", label: "UK 11", eu: "45" },
];

const COLOR_OPTIONS = [
  { id: "Black", name: "Black", hex: "#111111" },
  { id: "White", name: "Bone / White", hex: "#efeadb" },
  { id: "Brown", name: "Chestnut / Brown", hex: "#8a6b4a" },
  { id: "Tan", name: "Tan", hex: "#d2b48c" },
  { id: "Grey", name: "Grey", hex: "#9a9a94" },
  { id: "Olive", name: "Forest Olive", hex: "#3a4a3a" },
];

function formatPrice(basePrice) {
  const amount = (Number(basePrice) || 0) / 100;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active filters and sort state
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [minPrice, setMinPrice] = useState(1000);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState(["Aven Original"]);
  const [sortOption, setSortOption] = useState("newest");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const sortDropdownRef = useRef(null);

  // Fetch user's active wishlist on mount to reflect filled hearts
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

    // Optimistic state toggle
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
      console.error("Wishlist toggle error:", err);
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

  // Sync category and search query from URL
  useEffect(() => {
    function readUrlParams() {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const cat = params.get("category");
        if (cat) {
          setSelectedCategories([cat.toLowerCase()]);
        }
        const q = params.get("search") || "";
        setSearchQuery(q);
      }
    }

    readUrlParams();
    window.addEventListener("popstate", readUrlParams);
    const interval = setInterval(readUrlParams, 300);
    return () => {
      window.removeEventListener("popstate", readUrlParams);
      clearInterval(interval);
    };
  }, []);

  // Fetch initial products array from GET /api/products
  useEffect(() => {
    let isMounted = true;

    async function fetchCatalog() {
      try {
        setLoading(true);
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data && Array.isArray(data.products)) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.error("Failed to load /api/products:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setIsSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate category counts from the base products array
  const categoryCounts = useMemo(() => {
    const counts = { sneaker: 0, boot: 0, trainer: 0, chukka: 0 };
    products.forEach((p) => {
      const cat = (p.category || "").toLowerCase();
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts[cat] = 1;
      }
    });
    return counts;
  }, [products]);

  // Compute filtered & sorted product list in-memory with useMemo
  const filteredAndSortedProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];

    // Helper to check size match (supports UK 8 or EU 42)
    const matchesSize = (vSize, targetSize) => {
      if (!vSize || !targetSize) return false;
      const s1 = vSize.toLowerCase().trim();
      const s2 = targetSize.toLowerCase().trim();
      if (s1 === s2) return true;
      const euMap = {
        "40.5": "uk 7",
        "41": "uk 7",
        "42": "uk 8",
        "43": "uk 9",
        "44": "uk 10",
        "45": "uk 11",
      };
      if (euMap[s2] === s1 || euMap[s1] === s2) return true;
      return false;
    };

    // Helper to check color match
    const matchesColor = (vColor, targetColor) => {
      if (!vColor || !targetColor) return false;
      const c1 = vColor.toLowerCase().trim();
      const c2 = targetColor.toLowerCase().trim();
      if (c1 === c2) return true;
      if (c2 === "brown" && (c1 === "brown" || c1 === "chestnut")) return true;
      if (c2 === "tan" && (c1 === "tan" || c1 === "oak")) return true;
      if (c2 === "white" && (c1 === "white" || c1 === "bone")) return true;
      return false;
    };

    // 1. Apply all active filters
    let result = products.filter((product) => {
      // Filter by category
      if (selectedCategories.length > 0) {
        const prodCategory = (product.category || "").toLowerCase();
        const matchesCat = selectedCategories.some(
          (cat) => cat.toLowerCase() === prodCategory
        );
        if (!matchesCat) return false;
      }

      // Filter by price range (converting displayed ₹ range to paise)
      const minPaise = minPrice * 100;
      const maxPaise = maxPrice * 100;
      const prodPrice = Number(product.base_price) || 0;
      if (prodPrice < minPaise || prodPrice > maxPaise) {
        return false;
      }

      // Filter by Size and Color using product variants
      const variants = product.variants || [];
      const prodColors = (product.colors || variants.map((v) => v.color)).filter(Boolean);
      const prodSizes = (product.sizes || variants.map((v) => v.size)).filter(Boolean);

      // If BOTH color and size are selected:
      // Product must have a variant that matches BOTH the selected color AND the selected size
      if (selectedColors.length > 0 && selectedSizes.length > 0) {
        const hasMatchingVariant = variants.some((v) => {
          const colorOk = selectedColors.some((c) => matchesColor(v.color, c));
          const sizeOk = selectedSizes.some((s) => matchesSize(v.size, s));
          return colorOk && sizeOk;
        });
        if (!hasMatchingVariant) return false;
      } else if (selectedColors.length > 0) {
        // Only color selected
        const hasMatchingColor = selectedColors.some((c) =>
          prodColors.some((pc) => matchesColor(pc, c))
        );
        if (!hasMatchingColor) return false;
      } else if (selectedSizes.length > 0) {
        // Only size selected
        const hasMatchingSize = selectedSizes.some((s) =>
          prodSizes.some((ps) => matchesSize(ps, s))
        );
        if (!hasMatchingSize) return false;
      }

      // Filter by brand line
      if (selectedBrands.length > 0 && !selectedBrands.includes("Aven Original")) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = product.name && product.name.toLowerCase().includes(q);
        const matchesCategory = product.category && product.category.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory) {
          return false;
        }
      }

      return true;
    });

    // 2. Sort by selected sort option
    result = [...result].sort((a, b) => {
      if (sortOption === "price_asc") {
        return (Number(a.base_price) || 0) - (Number(b.base_price) || 0);
      }
      if (sortOption === "price_desc") {
        return (Number(b.base_price) || 0) - (Number(a.base_price) || 0);
      }
      if (sortOption === "newest") {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      }
      return 0;
    });

    return result;
  }, [products, selectedCategories, minPrice, maxPrice, selectedSizes, selectedColors, selectedBrands, sortOption, searchQuery]);

  const toggleCategory = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const toggleSize = (sizeId) => {
    setSelectedSizes((prev) =>
      prev.includes(sizeId) ? prev.filter((s) => s !== sizeId) : [...prev, sizeId]
    );
  };

  const toggleColor = (colorId) => {
    setSelectedColors((prev) =>
      prev.includes(colorId) ? prev.filter((c) => c !== colorId) : [...prev, colorId]
    );
  };

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setMinPrice(1000);
    setMaxPrice(10000);
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedBrands(["Aven Original"]);
    setSortOption("newest");
  };

  const activeSortLabel =
    SORT_OPTIONS.find((opt) => opt.id === sortOption)?.label || "Newest first";

  return (
    <main className="min-h-screen w-full bg-white text-[#0e0e0c]">
      
      {/* ================= STORE TOP NAV ================= */}
      <Navbar activePage="products" />

      {/* ================= SEARCH QUERY INDICATOR ================= */}
      {searchQuery && (
        <div className="w-full px-6 sm:px-10 lg:px-16 pt-5 flex items-center gap-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f2efe6] border border-[#e4e0d2] text-[12.5px] text-[#0e0e0c]">
            <span>
              Search results for &ldquo;<b>{searchQuery}</b>&rdquo;
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                if (typeof window !== "undefined") {
                  window.history.replaceState({}, "", "/products");
                }
              }}
              className="text-[#8f8a7a] hover:text-[#0e0e0c] font-mono text-[11px] ml-1 cursor-pointer"
              aria-label="Clear search filter"
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      {/* ================= BREADCRUMB ================= */}
      <div className="w-full px-6 sm:px-10 lg:px-16 pt-5 text-[12px] text-[#8f8a7a]">
        Clothes and shoes <span className="mx-1 text-[#0e0e0c]">›</span>{" "}
        <b className="text-[#0e0e0c] font-medium">
          {selectedCategories.length === 1
            ? selectedCategories[0].charAt(0).toUpperCase() + selectedCategories[0].slice(1) + "s"
            : "All Footwear"}
        </b>
      </div>

      {/* ================= LISTING & FILTERS WRAPPER ================= */}
      <div className="w-full px-6 sm:px-10 lg:px-16 py-7 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-9 items-start">
        
        {/* Filter Sidebar */}
        <aside className="md:border-r border-[#e4e0d2] md:pr-7 space-y-7">
          
          {/* Category Filter */}
          <div className="filter-group">
            <div className="flex items-center justify-between mb-3">
              <h6 className="text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold">
                Category
              </h6>
              {selectedCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="text-[10px] text-[#8f8a7a] hover:text-[#0e0e0c] underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 text-[13px] text-[#3a382f] cursor-pointer hover:text-[#0e0e0c]">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("sneaker")}
                  onChange={() => toggleCategory("sneaker")}
                  className="w-4 h-4 accent-[#0e0e0c] rounded cursor-pointer"
                />
                <span>Sneakers ({categoryCounts.sneaker || 0})</span>
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-[#3a382f] cursor-pointer hover:text-[#0e0e0c]">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("boot")}
                  onChange={() => toggleCategory("boot")}
                  className="w-4 h-4 accent-[#0e0e0c] rounded cursor-pointer"
                />
                <span>Boots ({categoryCounts.boot || 0})</span>
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-[#3a382f] cursor-pointer hover:text-[#0e0e0c]">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("trainer")}
                  onChange={() => toggleCategory("trainer")}
                  className="w-4 h-4 accent-[#0e0e0c] rounded cursor-pointer"
                />
                <span>Trainers ({categoryCounts.trainer || 0})</span>
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-[#3a382f] cursor-pointer hover:text-[#0e0e0c]">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes("chukka")}
                  onChange={() => toggleCategory("chukka")}
                  className="w-4 h-4 accent-[#0e0e0c] rounded cursor-pointer"
                />
                <span>Chukka ({categoryCounts.chukka || 0})</span>
              </label>
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="filter-group">
            <div className="flex items-center justify-between mb-3">
              <h6 className="text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold">
                Price Range
              </h6>
              {(minPrice > 1000 || maxPrice < 10000) && (
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice(1000);
                    setMaxPrice(10000);
                  }}
                  className="text-[10px] text-[#8f8a7a] hover:text-[#0e0e0c] underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="relative h-5 flex items-center my-3 mx-1">
              {/* Background Track */}
              <div className="w-full h-[3px] bg-[#e4e0d2] rounded-full relative">
                {/* Active Highlight Fill */}
                <div
                  className="absolute top-0 bottom-0 bg-[#0e0e0c] rounded-full pointer-events-none"
                  style={{
                    left: `${((minPrice - 1000) / (10000 - 1000)) * 100}%`,
                    right: `${100 - ((maxPrice - 1000) / (10000 - 1000)) * 100}%`,
                  }}
                />
              </div>

              {/* Dual Range Inputs */}
              <input
                type="range"
                min="1000"
                max="10000"
                step="250"
                value={minPrice}
                onChange={(e) => {
                  const val = Math.min(Number(e.target.value), maxPrice - 500);
                  setMinPrice(val);
                }}
                className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0e0e0c] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#0e0e0c] [&::-moz-range-thumb]:cursor-pointer"
              />
              <input
                type="range"
                min="1000"
                max="10000"
                step="250"
                value={maxPrice}
                onChange={(e) => {
                  const val = Math.max(Number(e.target.value), minPrice + 500);
                  setMaxPrice(val);
                }}
                className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0e0e0c] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#0e0e0c] [&::-moz-range-thumb]:cursor-pointer"
              />
            </div>

            <div className="flex justify-between font-mono text-[11px] text-[#8f8a7a]">
              <span>₹{minPrice.toLocaleString("en-IN")}</span>
              <span>₹{maxPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>

          {/* Size Filter */}
          <div className="filter-group">
            <div className="flex items-center justify-between mb-3">
              <h6 className="text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold">
                Size · EU Men
              </h6>
              {selectedSizes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSizes([])}
                  className="text-[10px] text-[#8f8a7a] hover:text-[#0e0e0c] underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((s) => {
                const isSelected = selectedSizes.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSize(s.id)}
                    title={`UK ${s.label.replace("UK ", "")} · EU ${s.eu}`}
                    className={`px-3 py-1.5 rounded-full text-[12px] transition-all cursor-pointer ${
                      isSelected
                        ? "border border-[#0e0e0c] bg-[#0e0e0c] text-[#f2efe6] font-medium shadow-xs"
                        : "border border-[#e4e0d2] text-[#3a382f] hover:border-[#0e0e0c] bg-white"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Filter */}
          <div className="filter-group">
            <div className="flex items-center justify-between mb-3">
              <h6 className="text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold">
                Color {selectedColors.length === 1 ? `· ${selectedColors[0]}` : ""}
              </h6>
              {selectedColors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedColors([])}
                  className="text-[10px] text-[#8f8a7a] hover:text-[#0e0e0c] underline cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5 items-center">
              {COLOR_OPTIONS.map((c) => {
                const isSelected = selectedColors.includes(c.id);
                const isLight = c.id === "White" || c.id === "Tan";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleColor(c.id)}
                    title={c.name}
                    aria-label={`Filter by ${c.name}`}
                    className={`w-[24px] h-[24px] rounded-full border transition-all cursor-pointer relative flex items-center justify-center ${
                      isSelected
                        ? "ring-2 ring-offset-2 ring-[#0e0e0c] scale-110 shadow-xs border-[#0e0e0c]"
                        : "hover:scale-110 border-[#e4e0d2]"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <span
                        className={`text-[10px] font-bold leading-none ${
                          isLight ? "text-[#0e0e0c]" : "text-white"
                        }`}
                      >
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Brand Line Filter */}
          <div className="filter-group">
            <h6 className="text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-semibold mb-3">
              Brand line
            </h6>
            <div className="space-y-2.5">
              <label className="flex items-center gap-2.5 text-[13px] text-[#3a382f] cursor-pointer hover:text-[#0e0e0c]">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes("Aven Original")}
                  onChange={() => toggleBrand("Aven Original")}
                  className="w-4 h-4 accent-[#0e0e0c] rounded cursor-pointer"
                />
                <span>Aven Original</span>
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-[#3a382f] cursor-pointer hover:text-[#0e0e0c]">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes("Aven Field")}
                  onChange={() => toggleBrand("Aven Field")}
                  className="w-4 h-4 accent-[#0e0e0c] rounded cursor-pointer"
                />
                <span>Aven Field</span>
              </label>
              <label className="flex items-center gap-2.5 text-[13px] text-[#3a382f] cursor-pointer hover:text-[#0e0e0c]">
                <input
                  type="checkbox"
                  checked={selectedBrands.includes("Aven Limited")}
                  onChange={() => toggleBrand("Aven Limited")}
                  className="w-4 h-4 accent-[#0e0e0c] rounded cursor-pointer"
                />
                <span>Aven Limited</span>
              </label>
            </div>
          </div>

          {/* Clear Filters CTA */}
          <button
            type="button"
            onClick={handleClearFilters}
            className="w-full py-2.5 rounded-full text-[13px] font-semibold border border-[#e4e0d2] text-[#0e0e0c] bg-white hover:border-[#0e0e0c] transition-colors cursor-pointer"
          >
            Clear filters
          </button>
        </aside>

        {/* Product Grid Area */}
        <section>
          <div className="flex items-center justify-between mb-6 relative">
            <span className="text-[12.5px] text-[#8f8a7a]">
              Showing {filteredAndSortedProducts.length} of {products.length} results
            </span>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="inline-flex items-center gap-2 text-[12.5px] border border-[#e4e0d2] px-4 py-2 rounded-full text-[#0e0e0c] hover:border-[#0e0e0c] transition-colors bg-white cursor-pointer"
              >
                <span>Sort · {activeSortLabel}</span>
                <svg
                  className={`w-2.5 h-2.5 stroke-current fill-none stroke-2 transition-transform duration-200 ${
                    isSortOpen ? "rotate-180" : ""
                  }`}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#e4e0d2] rounded-xl shadow-lg z-30 py-1 overflow-hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortOption(opt.id);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-[12.5px] flex items-center justify-between hover:bg-[#faf8f4] transition-colors cursor-pointer ${
                        sortOption === opt.id
                          ? "font-semibold text-[#0e0e0c] bg-[#faf8f4]"
                          : "text-[#3a382f]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {sortOption === opt.id && (
                        <span className="text-[#0e0e0c] text-[12px]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-mono text-[13px] text-[#8f8a7a]">Loading catalog...</p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#e4e0d2] rounded-2xl p-8">
              <p className="text-[15px] font-semibold text-[#0e0e0c] mb-1">
                No products match your filters
              </p>
              <p className="text-[13px] text-[#8f8a7a] mb-5">
                Try clearing selected categories or widening your price range.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedProducts.map((product, index) => {
                const tileBg = TILE_TONES[index % TILE_TONES.length];
                const categoryLabel = product.category
                  ? product.category.charAt(0).toUpperCase() + product.category.slice(1)
                  : "Footwear";

                return (
                  <ScrollReveal key={product.id} delay={(index % 3) * 80} y={28}>
                    <div
                      className={`aspect-square rounded-[14px] ${tileBg} relative overflow-hidden flex items-center justify-center`}
                    >
                      <Link
                        href={`/products/${product.id}`}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : product.category === "boot" ? (
                          <BootGlyph />
                        ) : (
                          <SneakerGlyph />
                        )}
                      </Link>

                      <button
                        type="button"
                        aria-label={wishlistIds.has(Number(product.id)) ? "Remove from wishlist" : "Add to wishlist"}
                        onClick={(e) => handleToggleWishlist(e, product.id)}
                        className="absolute top-3 right-3 w-[32px] h-[32px] rounded-full bg-white/85 backdrop-blur-xs flex items-center justify-center shadow-xs hover:scale-110 transition-transform cursor-pointer z-10"
                      >
                        <svg
                          className={`w-[15px] h-[15px] ${
                            wishlistIds.has(Number(product.id))
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
                      <span className="text-[#8f8a7a]">{categoryLabel}</span>
                      <span className="font-mono text-[14px] font-semibold text-[#0e0e0c]">
                        {formatPrice(product.base_price)}
                      </span>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 mt-12 mb-6">
            <span className="w-8 h-8 rounded-full bg-[#0e0e0c] text-[#f2efe6] flex items-center justify-center text-[12.5px] font-medium cursor-pointer">
              1
            </span>
            <span className="w-8 h-8 rounded-full text-[#3a382f] hover:bg-[#f2efe6] flex items-center justify-center text-[12.5px] cursor-pointer transition-colors">
              2
            </span>
            <span className="w-8 h-8 rounded-full text-[#3a382f] hover:bg-[#f2efe6] flex items-center justify-center text-[12.5px] cursor-pointer transition-colors">
              3
            </span>
            <span className="w-8 h-8 text-[#8f8a7a] flex items-center justify-center text-[12.5px] select-none">
              ···
            </span>
            <span className="w-8 h-8 rounded-full text-[#3a382f] hover:bg-[#f2efe6] flex items-center justify-center text-[12.5px] cursor-pointer transition-colors">
              5
            </span>
          </div>
        </section>

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
            <button
              type="button"
              onClick={() => setSelectedCategories(["sneaker"])}
              className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors cursor-pointer"
            >
              Sneakers
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategories(["boot"])}
              className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors cursor-pointer"
            >
              Boots
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategories(["trainer"])}
              className="block text-[13px] text-[#3a382f] mb-2.5 hover:text-[#0e0e0c] transition-colors cursor-pointer"
            >
              Trainers
            </button>
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
