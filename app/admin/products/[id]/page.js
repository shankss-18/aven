"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";

const STANDARD_SIZES = ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10"];

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

export default function EditProductPage() {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(false);

  // 2-Step Variant & Size Configurator state (Step 1: Colors, Step 2: UK-6 to UK-10 Checkboxes & Stock)
  const [definedColors, setDefinedColors] = useState([]);
  const [newColorInput, setNewColorInput] = useState("");
  const [newColorHexInput, setNewColorHexInput] = useState("#111111");

  const router = useRouter();
  const params = useParams();

  async function load() {
    const id = params?.id;
    if (!id) return;
    const token = localStorage.getItem("adminAuthToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("adminAuthToken");
        router.push("/admin/login");
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.product) {
        console.error("Failed to load product:", data.error || "Unknown error");
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProduct(data.product);
      setVariants(data.variants || []);
    } catch (err) {
      console.error("Failed to load product:", err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadImages() {
    const id = params?.id;
    if (!id) return;
    const token = localStorage.getItem("adminAuthToken");
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/products/${id}/images`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setImages(data.images || []);
      }
    } catch (err) {
      console.error("Failed to load product gallery images:", err);
    }
  }

  useEffect(() => {
    if (params?.id) {
      load();
      loadImages();
    }
  }, [params?.id]);

  // Sync definedColors with variants from DB — MUST be before any early returns
  useEffect(() => {
    if (variants && variants.length > 0) {
      setDefinedColors((prev) => {
        const map = new Map();
        prev.forEach((c) => map.set(c.name.toLowerCase(), c));
        variants.forEach((v) => {
          if (v.color && !map.has(v.color.toLowerCase())) {
            map.set(v.color.toLowerCase(), {
              name: v.color,
              hex: v.color_hex || getColorHex(v.color),
            });
          }
        });
        return Array.from(map.values());
      });
    }
  }, [variants]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a]">
          Loading Product Details...
        </p>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="bg-white border border-[#e4e0d2] rounded-2xl p-10 text-center max-w-md mx-auto space-y-4 shadow-xs">
        <p className="text-sm font-medium text-[#0e0e0c]">Product Not Found</p>
        <p className="text-xs text-[#8f8a7a]">
          The product ID could not be located in the catalog.
        </p>
        <button
          onClick={() => router.push("/admin/products")}
          className="bg-[#0e0e0c] text-white px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#2b2506] transition-colors"
        >
          Return to Products
        </button>
      </div>
    );
  }

  // ---- Handlers (all called after guards, but NOT hooks) ----
  const handleProductSave = async (e) => {
    e.preventDefault();
    setSavingProduct(true);
    const token = localStorage.getItem("adminAuthToken");

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          category: product.category,
          basePrice: product.base_price,
          imageUrl: product.image_url,
        }),
      });

      if (res.ok) {
        alert("Product successfully updated.");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update product");
      }
    } catch (err) {
      alert("Network error updating product");
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This will deactivate the listing.`
    );
    if (!confirmed) return;

    setDeletingProduct(true);
    const token = localStorage.getItem("adminAuthToken");

    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        router.push("/admin/products");
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete product");
        setDeletingProduct(false);
      }
    } catch (err) {
      alert("Network error deleting product");
      setDeletingProduct(false);
    }
  };

  const handleUploadImages = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    const token = localStorage.getItem("adminAuthToken");
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("images", files[i]);
    }

    try {
      const res = await fetch(`/api/admin/products/${params.id}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        await loadImages();
        await load();
      } else {
        let errMsg = "Failed to upload images";
        try {
          const err = await res.json();
          if (err?.error) errMsg = err.error;
        } catch (_) {}
        alert(errMsg);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Network error uploading images.");
    } finally {
      setUploadingImages(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId) => {
    setDeletingImageId(imageId);
    const token = localStorage.getItem("adminAuthToken");

    try {
      const res = await fetch(`/api/admin/products/${params.id}/images/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        await loadImages();
      } else {
        alert("Failed to delete image");
      }
    } catch (err) {
      alert("Network error deleting image");
    } finally {
      setDeletingImageId(null);
    }
  };

  const handleUploadCoverPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    const token = localStorage.getItem("adminAuthToken");
    const formData = new FormData();
    formData.append("images", file);
    formData.append("isCover", "true");

    try {
      const res = await fetch(`/api/admin/products/${params.id}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        await load();
        await loadImages();
      } else {
        alert("Failed to upload cover photo");
      }
    } catch (err) {
      alert("Network error uploading cover photo");
    } finally {
      setUploadingCover(false);
      e.target.value = "";
    }
  };

  const handleSetCoverImage = async (imageUrl) => {
    const token = localStorage.getItem("adminAuthToken");
    try {
      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          category: product.category,
          basePrice: product.base_price,
          imageUrl: imageUrl,
        }),
      });

      if (res.ok) {
        setProduct((prev) => ({ ...prev, image_url: imageUrl }));
      } else {
        alert("Failed to update cover photo");
      }
    } catch (err) {
      alert("Network error setting cover photo");
    }
  };


  const handleAddColor = (e) => {
    e.preventDefault();
    const name = newColorInput.trim();
    if (!name) return;
    if (definedColors.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      alert(`Color "${name}" is already in your available colors.`);
      return;
    }
    setDefinedColors([...definedColors, { name, hex: newColorHexInput }]);
    setNewColorInput("");
    setNewColorHexInput("#111111");
  };

  const handleRemoveColor = async (colorName) => {
    const colorVars = variants.filter((v) => v.color?.toLowerCase() === colorName.toLowerCase());
    if (colorVars.length > 0) {
      if (!window.confirm(`Delete "${colorName}" and all its ${colorVars.length} size variants?`)) {
        return;
      }
      const token = localStorage.getItem("adminAuthToken");
      for (const v of colorVars) {
        await fetch(`/api/admin/variants/${v.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      load();
    }
    setDefinedColors(definedColors.filter((c) => c.name.toLowerCase() !== colorName.toLowerCase()));
  };

  const handleUpdateColorHex = (colorName, newHex) => {
    setDefinedColors(
      definedColors.map((c) => (c.name.toLowerCase() === colorName.toLowerCase() ? { ...c, hex: newHex } : c))
    );
  };

  const handleSaveColorVariants = async (colorName, colorHex, sizeStates) => {
    const token = localStorage.getItem("adminAuthToken");

    for (const size of STANDARD_SIZES) {
      const state = sizeStates[size];
      if (!state) continue;

      if (state.enabled) {
        if (state.variantId) {
          // Update existing
          await fetch(`/api/admin/variants/${state.variantId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              stock: parseInt(state.stock, 10) || 0,
              priceOverride: state.priceOverride ? Math.round(parseFloat(state.priceOverride) * 100) : null,
              colorHex,
              color: colorName,
            }),
          });
        } else {
          // Insert new
          await fetch("/api/admin/variants", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              productId: params.id,
              size,
              color: colorName,
              colorHex,
              stock: parseInt(state.stock, 10) || 0,
              priceOverride: state.priceOverride ? parseFloat(state.priceOverride) : null,
            }),
          });
        }
      } else {
        // Disabled: delete if existed in DB
        if (state.variantId) {
          await fetch(`/api/admin/variants/${state.variantId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    }

    await load();
  };

  const handleDeleteVariant = async (variantId) => {
    if (!window.confirm("Are you sure you want to delete this variant?")) return;
    const token = localStorage.getItem("adminAuthToken");
    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        await load();
      } else {
        alert("Failed to delete variant");
      }
    } catch (err) {
      alert("Network error deleting variant");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Breadcrumb & Actions */}
      <div>
        <button
          onClick={() => router.push("/admin/products")}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8f8a7a] hover:text-[#0e0e0c] transition-colors cursor-pointer mb-3"
        >
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Products</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e4e0d2] pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-semibold text-2xl text-[#0e0e0c] tracking-tight">
              Edit Product #{product.id}
            </h1>
            <span className="font-mono text-xs uppercase bg-[#f2efe6] text-[#3a382f] px-2.5 py-0.5 rounded border border-[#e4e0d2]">
              {product.category}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <a
              href={`/products/${product.id}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-initial justify-center text-xs font-mono text-[#5a5744] hover:text-[#0e0e0c] inline-flex items-center gap-1 transition-colors px-3 py-2 rounded-lg border border-[#e4e0d2] bg-white"
            >
              <span>View Storefront</span>
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            {/* Delete Product Button */}
            <button
              type="button"
              onClick={handleDeleteProduct}
              disabled={deletingProduct}
              className="flex-1 sm:flex-initial justify-center bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              <span>{deletingProduct ? "Deleting..." : "Delete Product"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section 1: General Product Information */}
      <div className="bg-white border border-[#e4e0d2] rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#f2efe6] pb-3 flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
            General Information
          </h2>
          <span className="text-[11px] font-mono text-[#8f8a7a]">
            Primary Listing Data
          </span>
        </div>

        <form onSubmit={handleProductSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
              Product Title
            </label>
            <input
              type="text"
              required
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-[15px] sm:text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
              Product Description
            </label>
            <textarea
              rows={4}
              value={product.description || ""}
              onChange={(e) => setProduct({ ...product, description: e.target.value })}
              className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-[15px] sm:text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
                Category
              </label>
              <select
                value={product.category}
                onChange={(e) => setProduct({ ...product, category: e.target.value })}
                className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-[15px] sm:text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all cursor-pointer font-sans"
              >
                <option value="sneaker">Sneaker</option>
                <option value="boot">Boot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
                Base Price (₹)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-mono text-sm text-[#8f8a7a]">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={product.base_price / 100}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      base_price: Math.round(parseFloat(e.target.value || 0) * 100),
                    })
                  }
                  className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl pl-8 pr-4 py-2.5 text-[15px] sm:text-sm font-mono bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Primary Cover Photo (Direct Upload - No Links) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744]">
                  Primary Cover Photo
                </label>
                <p className="text-[11px] text-[#8f8a7a] mt-0.5">
                  Direct photo upload. Displayed on storefront cards and catalog listings.
                </p>
              </div>

              <label className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#f2efe6] hover:bg-[#e4e0d2] text-[#0e0e0c] text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer transition-colors border border-[#e4e0d2] shrink-0 w-full sm:w-auto">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingCover}
                  onChange={handleUploadCoverPhoto}
                  className="hidden"
                />
                {uploadingCover ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-[#0e0e0c]" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>+ Upload Cover Photo</span>
                  </>
                )}
              </label>
            </div>

            {product.image_url ? (
              <div className="p-3 bg-[#fcfbf9] border border-[#e4e0d2] rounded-xl flex items-center gap-3.5">
                <div className="w-16 h-16 rounded-lg bg-white border border-[#e4e0d2] overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-xs space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#0e0e0c]">Active Cover Photo</span>
                    <span className="bg-[#0e0e0c] text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                      Primary
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8f8a7a]">
                    To change, upload a new photo above or click &quot;Set as Cover&quot; on any gallery photo below.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-[#fcfbf9] border border-dashed border-[#e4e0d2] rounded-xl text-center">
                <p className="text-xs text-[#8f8a7a]">
                  No cover photo set yet. Click &quot;+ Upload Cover Photo&quot; or select one from the gallery below.
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={savingProduct}
              className="w-full sm:w-auto justify-center bg-[#0e0e0c] hover:bg-[#2b2506] disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              {savingProduct ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Product</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Multi-Image Upload & Photo Gallery */}
      <div className="bg-white border border-[#e4e0d2] rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        <div className="border-b border-[#f2efe6] pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
              Product Gallery Images ({images.length})
            </h2>
            <p className="text-xs text-[#8f8a7a] mt-0.5">
              Upload multiple product photos to populate the customer gallery view.
            </p>
          </div>

          {/* Upload Button */}
          <label className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0e0e0c] hover:bg-[#2b2506] text-white text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer transition-all shadow-xs shrink-0 w-full sm:w-auto">
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={uploadingImages}
              onChange={handleUploadImages}
              className="hidden"
            />
            {uploadingImages ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <span>+ Upload Images</span>
              </>
            )}
          </label>
        </div>

        {/* Thumbnail Preview Grid */}
        {images.length === 0 ? (
          <div className="border-2 border-dashed border-[#e4e0d2] rounded-xl p-8 text-center bg-[#fcfbf9] space-y-2">
            <svg
              className="w-8 h-8 mx-auto stroke-current fill-none stroke-[1.4] text-[#8f8a7a]"
              viewBox="0 0 24 24"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
            <p className="text-xs font-mono text-[#5a5744] font-medium">
              No gallery images uploaded yet
            </p>
            <p className="text-[11px] text-[#8f8a7a]">
              Upload multiple JPEG, PNG, or WEBP photos to populate the customer gallery view.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={`group relative aspect-square rounded-xl border bg-[#f2efe6] overflow-hidden shadow-xs transition-all ${
                  img.image_url === product.image_url
                    ? "border-[#0e0e0c] ring-2 ring-[#0e0e0c]/20"
                    : "border-[#e4e0d2] hover:border-[#0e0e0c]"
                }`}
              >
                <img
                  src={img.image_url}
                  alt={`Gallery image ${img.id}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover status or Set as Cover button */}
                {img.image_url === product.image_url ? (
                  <span className="absolute bottom-2 left-2 bg-[#0e0e0c] text-white text-[9.5px] font-mono uppercase px-2 py-0.5 rounded shadow-xs">
                    ★ Cover
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSetCoverImage(img.image_url)}
                    className="absolute bottom-2 left-2 bg-white/95 hover:bg-[#0e0e0c] hover:text-white text-[#0e0e0c] text-[9.5px] font-mono uppercase px-2 py-1 rounded border border-[#e4e0d2] opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all shadow-xs cursor-pointer"
                  >
                    Set Cover
                  </button>
                )}

                {/* Delete overlay button */}
                <button
                  type="button"
                  onClick={() => handleDeleteImage(img.id)}
                  disabled={deletingImageId === img.id}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#0e0e0c]/80 text-white flex items-center justify-center text-xs hover:bg-rose-600 transition-colors shadow-xs cursor-pointer opacity-90 sm:opacity-80 group-hover:opacity-100"
                  title="Delete image"
                >
                  {deletingImageId === img.id ? (
                    <span className="text-[9px]">...</span>
                  ) : (
                    <span>✕</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: 2-Step Variant & Size Configurator (Step 1: Save Colors, Step 2: Checkboxes UK-6 to UK-10) */}
      <div className="bg-white border border-[#e4e0d2] rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-xs space-y-6 sm:space-y-8">
        {/* Section Header */}
        <div className="border-b border-[#f2efe6] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
              Inventory & Variants ({variants.length} active units)
            </h2>
            <p className="text-xs text-[#8f8a7a] mt-0.5">
              1. Save available colors. 2. For every color, select sizes & stock from UK-6 to UK-10 checkboxes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#5a5744] bg-[#faf8f4] px-3 py-1 rounded-lg border border-[#e4e0d2]">
              {definedColors.length} {definedColors.length === 1 ? "color" : "colors"} defined
            </span>
          </div>
        </div>

        {/* STEP 1: Save Available Colors */}
        <div className="bg-[#fcfbf9] border border-[#e4e0d2] rounded-xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded bg-[#0e0e0c] text-white text-[10.5px] font-mono uppercase font-bold tracking-wider">
              Step 1
            </span>
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0e0e0c]">
              Save Available Colors
            </h3>
          </div>
          <p className="text-xs text-[#8f8a7a]">
            First, add and save the colors available for this sneaker (e.g. Green, Black, Brown). Each saved color will have its own UK 6 – UK 10 size manager below.
          </p>

          {/* Form to add a color */}
          <form onSubmit={handleAddColor} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="color"
                value={newColorHexInput}
                onChange={(e) => setNewColorHexInput(e.target.value)}
                className="w-10 h-10 rounded-xl border border-[#e4e0d2] cursor-pointer p-0.5 bg-white shrink-0 shadow-2xs"
                title="Pick Color Swatch"
              />
              <input
                type="text"
                required
                placeholder="e.g. Olive Green, Obsidian Black"
                value={newColorInput}
                onChange={(e) => setNewColorInput(e.target.value)}
                className="flex-1 border border-[#e4e0d2] focus:border-[#0e0e0c] rounded-xl px-3.5 py-2.5 text-[15px] sm:text-xs bg-white text-[#0e0e0c] outline-none"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0e0e0c] hover:bg-[#2b2506] text-white px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5 shrink-0"
            >
              <span>+ Save Color</span>
            </button>
          </form>

          {/* Saved Colors Chips */}
          <div className="pt-2 border-t border-[#e4e0d2]/70">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8f8a7a] mb-2">
              Saved Available Colors ({definedColors.length}):
            </div>
            {definedColors.length === 0 ? (
              <div className="text-xs text-[#8f8a7a] italic py-1">
                No colors saved yet. Choose a color and click &ldquo;+ Save Color&rdquo; above.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {definedColors.map((col) => {
                  const activeCount = variants.filter(
                    (v) => v.color?.toLowerCase() === col.name.toLowerCase()
                  ).length;
                  return (
                    <div
                      key={col.name}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-[#e4e0d2] bg-white shadow-2xs"
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <input
                        type="color"
                        value={col.hex}
                        onChange={(e) => handleUpdateColorHex(col.name, e.target.value)}
                        title="Click to adjust hex code"
                        className="w-3.5 h-3.5 -ml-1 opacity-0 absolute cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-[#0e0e0c]">{col.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f2efe6] text-[#5a5744]">
                        {activeCount} {activeCount === 1 ? "size" : "sizes"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(col.name)}
                        className="text-[#8f8a7a] hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-colors cursor-pointer text-xs leading-none"
                        title={`Remove "${col.name}" color`}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* STEP 2: Select Sizes & Stock from UK-6 to UK-10 Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded bg-[#0e0e0c] text-white text-[10.5px] font-mono uppercase font-bold tracking-wider">
              Step 2
            </span>
            <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0e0e0c]">
              Select Sizes & Stock for Every Color (UK-6 to UK-10 Checkboxes)
            </h3>
          </div>
          <p className="text-xs text-[#8f8a7a]">
            For every color saved above, use the checkboxes to pick active sizes from UK 6 to UK 10, set stock units, and click &ldquo;Save Variants&rdquo;.
          </p>

          {definedColors.length === 0 ? (
            <div className="border-2 border-dashed border-[#e4e0d2] rounded-xl p-8 text-center bg-[#fcfbf9] space-y-2">
              <p className="text-xs font-mono text-[#5a5744] font-medium">
                No colors saved yet in Step 1
              </p>
              <p className="text-[11px] text-[#8f8a7a]">
                Add at least one color above to unlock the UK-6 to UK-10 size checkboxes.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {definedColors.map((col) => (
                <ColorVariantConfigCard
                  key={col.name}
                  color={col}
                  variants={variants}
                  onSave={handleSaveColorVariants}
                  onRemoveColor={handleRemoveColor}
                  onUpdateHex={handleUpdateColorHex}
                />
              ))}
            </div>
          )}
        </div>

        {/* Current Active Inventory Summary Table */}
        {variants.length > 0 && (
          <div className="pt-6 border-t border-[#f2efe6] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-[#0e0e0c]">
                Current Active Inventory Overview ({variants.length})
              </h4>
              <span className="text-[11px] font-mono text-[#8f8a7a]">
                Saved in catalog database
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-[#e4e0d2]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#faf8f4] border-b border-[#e4e0d2] text-[#8f8a7a] font-mono text-[10.5px] uppercase tracking-wider">
                    <th className="py-2.5 px-4 font-semibold">Size</th>
                    <th className="py-2.5 px-4 font-semibold">Color Swatch & Name</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Stock Units</th>
                    <th className="py-2.5 px-4 font-semibold text-center">Price Override</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2efe6] bg-white font-mono">
                  {variants.map((v) => {
                    const colHex = v.color_hex || getColorHex(v.color);
                    return (
                      <tr key={v.id} className="hover:bg-[#faf8f4]/60 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-[#0e0e0c]">{v.size}</td>
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                              style={{ backgroundColor: colHex }}
                            />
                            <span className="font-medium text-[#0e0e0c]">{v.color}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              v.stock > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {v.stock} units
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-[#5a5744]">
                          {v.price_override ? `₹${(v.price_override / 100).toLocaleString()}` : "Base price"}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteVariant(v.id)}
                            className="text-[#8f8a7a] hover:text-rose-600 transition-colors cursor-pointer p-1"
                            title="Delete this variant"
                          >
                            <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-2.5">
              {variants.map((v) => {
                const colHex = v.color_hex || getColorHex(v.color);
                return (
                  <div
                    key={v.id}
                    className="bg-white border border-[#e4e0d2] rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                        style={{ backgroundColor: colHex }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#0e0e0c]">{v.size}</span>
                          <span className="text-xs text-[#5a5744] font-medium truncate">• {v.color}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                          <span className="text-[#8f8a7a]">
                            {v.price_override ? `₹${(v.price_override / 100).toLocaleString()}` : "Base price"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold ${
                          v.stock > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {v.stock} units
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(v.id)}
                        className="w-8 h-8 rounded-lg border border-[#e4e0d2] hover:border-rose-300 hover:bg-rose-50 text-[#8f8a7a] hover:text-rose-600 transition-colors flex items-center justify-center cursor-pointer"
                        title="Delete variant"
                      >
                        <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ColorVariantConfigCard({ color, variants, onSave, onRemoveColor, onUpdateHex }) {
  // Filter variants for this color
  const colorVariants = variants.filter(
    (v) => v.color?.toLowerCase() === color.name.toLowerCase()
  );

  // Initialize size state for UK 6 to UK 10
  const [sizeStates, setSizeStates] = useState(() => {
    const init = {};
    STANDARD_SIZES.forEach((size) => {
      const match = colorVariants.find((v) => v.size === size);
      init[size] = {
        enabled: Boolean(match),
        stock: match ? match.stock : 20,
        priceOverride: match && match.price_override ? (match.price_override / 100).toString() : "",
        variantId: match ? match.id : null,
      };
    });
    return init;
  });

  // Sync state whenever variants or color change
  useEffect(() => {
    setSizeStates((prev) => {
      const next = { ...prev };
      STANDARD_SIZES.forEach((size) => {
        const match = colorVariants.find((v) => v.size === size);
        next[size] = {
          enabled: Boolean(match),
          stock: match ? match.stock : (prev[size]?.stock ?? 20),
          priceOverride:
            match && match.price_override
              ? (match.price_override / 100).toString()
              : (prev[size]?.priceOverride ?? ""),
          variantId: match ? match.id : null,
        };
      });
      return next;
    });
  }, [variants, color.name]);

  const [bulkStock, setBulkStock] = useState(20);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Toggle single size checkbox
  const handleToggle = (size) => {
    setSizeStates((prev) => ({
      ...prev,
      [size]: {
        ...prev[size],
        enabled: !prev[size]?.enabled,
      },
    }));
  };

  // Update stock or price override
  const handleUpdate = (size, field, val) => {
    setSizeStates((prev) => ({
      ...prev,
      [size]: {
        ...prev[size],
        [field]: val,
      },
    }));
  };

  // Select all UK 6 - UK 10
  const handleSelectAll = () => {
    setSizeStates((prev) => {
      const next = {};
      STANDARD_SIZES.forEach((size) => {
        next[size] = {
          ...prev[size],
          enabled: true,
        };
      });
      return next;
    });
  };

  // Deselect all
  const handleDeselectAll = () => {
    setSizeStates((prev) => {
      const next = {};
      STANDARD_SIZES.forEach((size) => {
        next[size] = {
          ...prev[size],
          enabled: false,
        };
      });
      return next;
    });
  };

  // Apply bulk stock to all sizes
  const handleApplyBulkStock = () => {
    const s = parseInt(bulkStock, 10);
    if (isNaN(s) || s < 0) return;
    setSizeStates((prev) => {
      const next = {};
      STANDARD_SIZES.forEach((size) => {
        next[size] = {
          ...prev[size],
          stock: s,
        };
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onSave(color.name, color.hex, sizeStates);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = STANDARD_SIZES.filter((s) => sizeStates[s]?.enabled).length;

  return (
    <div className="border border-[#e4e0d2] rounded-xl bg-white overflow-hidden shadow-2xs">
      {/* Color Header */}
      <div className="bg-[#faf8f4] border-b border-[#e4e0d2] p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span
              className="w-5 h-5 rounded-full border border-black/20 block shadow-2xs cursor-pointer"
              style={{ backgroundColor: color.hex }}
              title="Click to edit hex"
            />
            <input
              type="color"
              value={color.hex}
              onChange={(e) => onUpdateHex(color.name, e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-bold text-sm text-[#0e0e0c] uppercase tracking-wide">
                {color.name}
              </h4>
              <span className="text-[10.5px] font-mono text-[#8f8a7a]">
                ({color.hex})
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#5a5744]">
              {enabledCount} of 5 sizes selected (UK 6 – UK 10)
            </span>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-[11px] font-mono text-[#0e0e0c] hover:bg-white px-2 py-1 rounded border border-[#e4e0d2] transition-colors cursor-pointer"
          >
            Select All UK 6–10
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-[11px] font-mono text-[#8f8a7a] hover:bg-white px-2 py-1 rounded border border-[#e4e0d2] transition-colors cursor-pointer"
          >
            Clear
          </button>

          <div className="flex items-center gap-1 bg-white border border-[#e4e0d2] rounded-lg px-2 py-0.5">
            <span className="text-[10px] font-mono text-[#8f8a7a]">Stock:</span>
            <input
              type="number"
              min="0"
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              className="w-12 text-center text-xs font-mono text-[#0e0e0c] outline-none"
            />
            <button
              type="button"
              onClick={handleApplyBulkStock}
              className="text-[10px] font-mono font-semibold uppercase text-[#0e0e0c] hover:underline cursor-pointer"
            >
              Apply
            </button>
          </div>

          <button
            type="button"
            onClick={() => onRemoveColor(color.name)}
            className="text-[11px] font-mono text-[#b5482f] hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer ml-1"
            title="Remove color and all its variants"
          >
            Remove Color
          </button>
        </div>
      </div>

      {/* Checkbox Tiles for UK 6 – UK 10 */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 sm:gap-3">
          {STANDARD_SIZES.map((size) => {
            const state = sizeStates[size] || { enabled: false, stock: 20, priceOverride: "" };
            return (
              <div
                key={size}
                className={`rounded-xl border p-3 sm:p-3.5 transition-all ${
                  state.enabled
                    ? "bg-white border-[#0e0e0c] shadow-2xs ring-1 ring-black/5"
                    : "bg-[#faf8f4] border-[#e4e0d2] opacity-70 hover:opacity-100"
                }`}
              >
                {/* Checkbox & Size Name */}
                <label className="flex items-center justify-between cursor-pointer select-none mb-2 sm:mb-2.5">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <input
                      type="checkbox"
                      checked={state.enabled}
                      onChange={() => handleToggle(size)}
                      className="w-4 h-4 rounded text-[#0e0e0c] border-[#c9c4b3] focus:ring-0 cursor-pointer accent-[#0e0e0c]"
                    />
                    <span className="font-mono text-xs sm:text-sm font-bold text-[#0e0e0c]">{size}</span>
                  </div>
                  {state.enabled ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Enabled" />
                  ) : (
                    <span className="text-[10px] font-mono text-[#8f8a7a]">Off</span>
                  )}
                </label>

                {state.enabled ? (
                  <div className="space-y-2 pt-2 border-t border-[#f2efe6]">
                    <div>
                      <span className="block text-[10px] font-mono text-[#8f8a7a] mb-0.5">
                        Stock units
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={state.stock}
                        onChange={(e) => handleUpdate(size, "stock", e.target.value)}
                        className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] rounded-lg px-2 py-1 text-[13px] sm:text-xs font-mono font-bold text-center bg-[#fcfbf9] text-[#0e0e0c] outline-none"
                      />
                    </div>
                    <div>
                      <span className="block text-[10px] font-mono text-[#8f8a7a] mb-0.5">
                        Price ₹ (Opt.)
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Base"
                        value={state.priceOverride}
                        onChange={(e) => handleUpdate(size, "priceOverride", e.target.value)}
                        className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] rounded-lg px-2 py-1 text-[13px] sm:text-xs font-mono text-center bg-[#fcfbf9] text-[#0e0e0c] outline-none placeholder:text-[#c9c4b3]"
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleToggle(size)}
                    className="w-full mt-1.5 py-1.5 px-1 rounded-lg border border-dashed border-[#c9c4b3] hover:border-[#0e0e0c] hover:bg-white text-[11px] font-mono text-[#5a5744] hover:text-[#0e0e0c] transition-all cursor-pointer text-center"
                  >
                    + Check {size}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Card Footer with Save button */}
        <div className="pt-3 border-t border-[#f2efe6] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <span className="text-xs font-mono text-[#8f8a7a] text-center sm:text-left">
            {enabledCount} {enabledCount === 1 ? "size" : "sizes"} ready to save for {color.name}
          </span>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`w-full sm:w-auto justify-center py-2.5 px-5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer inline-flex items-center gap-2 ${
              savedSuccess
                ? "bg-emerald-700 text-white"
                : "bg-[#0e0e0c] hover:bg-[#2b2506] text-white disabled:opacity-50"
            }`}
          >
            {saving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving {color.name}...</span>
              </>
            ) : savedSuccess ? (
              <span>✓ Saved {color.name} Variants!</span>
            ) : (
              <span>✓ Save {color.name} Variants</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}