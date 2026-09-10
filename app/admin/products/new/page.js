"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "sneaker",
    basePrice: "",
    imageUrl: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("adminAuthToken");

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          basePrice: Math.round(parseFloat(form.basePrice) * 100), // ₹ input → paise
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/admin/products/${data.id}`);
      } else {
        alert(data.error || "Failed to create product");
        setSubmitting(false);
      }
    } catch (err) {
      alert("A network error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back button */}
      <button
        onClick={() => router.push("/admin/products")}
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8f8a7a] hover:text-[#0e0e0c] transition-colors cursor-pointer"
      >
        <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>Back to Products</span>
      </button>

      {/* Header */}
      <div className="border-b border-[#e4e0d2] pb-5">
        <h1 className="font-display font-semibold text-2xl text-[#0e0e0c] tracking-tight">
          Add New Product
        </h1>
        <p className="text-xs text-[#8f8a7a] mt-1">
          Create a new catalog item. You will be able to configure inventory variants right after creation.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-[#e4e0d2] rounded-2xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
              Product Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Oakwood Derby Shoe in Chestnut Brown"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
              Product Description
            </label>
            <textarea
              rows={4}
              placeholder="Crafted with premium full-grain leather, hand-stitched welt, and cushioned insole..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3] resize-y"
            />
          </div>

          {/* 2-Column Grid for Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all cursor-pointer font-sans"
              >
                <option value="sneaker">Sneaker</option>
                <option value="boot">Boot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
                Base Retail Price (₹) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none font-mono text-sm text-[#8f8a7a]">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="2499.00"
                  value={form.basePrice}
                  onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                  className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3]"
                />
              </div>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
              Primary Image URL
            </label>
            <input
              type="url"
              placeholder="https://images.example.com/products/derby.jpg"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-sm font-mono bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3]"
            />

            {/* Live Preview if available */}
            {form.imageUrl && (
              <div className="mt-3 p-3 bg-[#fcfbf9] border border-[#e4e0d2] rounded-xl flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-white border border-[#e4e0d2] overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
                <div className="text-xs text-[#5a5744]">
                  <p className="font-medium text-[#0e0e0c]">Image Preview</p>
                  <p className="font-mono text-[11px] text-[#8f8a7a] truncate max-w-sm">
                    {form.imageUrl}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#f2efe6] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/admin/products")}
              className="px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-[#5a5744] hover:text-[#0e0e0c] hover:bg-[#f5f3eb] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="bg-[#0e0e0c] hover:bg-[#2b2506] disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating Listing...</span>
                </>
              ) : (
                <span>Create Product</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}