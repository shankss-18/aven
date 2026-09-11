"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/compressImage";

export default function NewProductPage() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "sneaker",
    basePrice: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const router = useRouter();

  async function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const processed = await Promise.all(files.map((f) => compressImage(f)));
    const combined = [...selectedFiles, ...processed];
    setSelectedFiles(combined);
    setPreviewUrls(combined.map((f) => URL.createObjectURL(f)));
  }

  function handleRemoveFile(idx) {
    const updated = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(updated);
    setPreviewUrls(updated.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setUploadStatus("Creating product listing...");
    const token = localStorage.getItem("adminAuthToken");

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          basePrice: Math.round(parseFloat(form.basePrice) * 100), // ₹ input → paise
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to create product");
        setSubmitting(false);
        setUploadStatus("");
        return;
      }

      const productId = data.id;

      if (selectedFiles.length > 0) {
        setUploadStatus(`Uploading ${selectedFiles.length} direct photo${selectedFiles.length > 1 ? "s" : ""}...`);
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("images", file));

        await fetch(`/api/admin/products/${productId}/images`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      }

      router.push(`/admin/products/${productId}`);
    } catch (err) {
      alert("A network error occurred. Please try again.");
      setSubmitting(false);
      setUploadStatus("");
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
      <div className="bg-white border border-[#e4e0d2] rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-xs">
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
              className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-[15px] sm:text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3]"
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
              className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-[15px] sm:text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3] resize-y"
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
                className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-2.5 text-[15px] sm:text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all cursor-pointer font-sans"
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
                  className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl pl-8 pr-4 py-2.5 text-[15px] sm:text-sm font-mono bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all placeholder:text-[#c9c4b3]"
                />
              </div>
            </div>
          </div>

          {/* Direct Product Photos Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#5a5744]">
                  Product Photos (Direct Upload)
                </label>
                <p className="text-[11px] text-[#8f8a7a] mt-0.5">
                  Select direct product photos from your device. The first photo will be used as the primary cover thumbnail.
                </p>
              </div>
              {selectedFiles.length > 0 && (
                <span className="text-xs font-mono text-[#0e0e0c] bg-[#f2efe6] px-2.5 py-0.5 rounded border border-[#e4e0d2]">
                  {selectedFiles.length} photo{selectedFiles.length > 1 ? "s" : ""} selected
                </span>
              )}
            </div>

            {/* Upload Dropzone / Button */}
            <label className="border-2 border-dashed border-[#e4e0d2] hover:border-[#0e0e0c] rounded-2xl p-5 sm:p-6 text-center bg-[#fcfbf9] hover:bg-[#faf8f2] transition-all cursor-pointer block group">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#f2efe6] group-hover:bg-white border border-[#e4e0d2] flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 stroke-[#0e0e0c] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                </div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#0e0e0c] font-semibold">
                  + Click to Choose Product Photos
                </div>
                <p className="text-[11px] text-[#8f8a7a]">
                  Direct file upload · Supports JPG, PNG, WEBP, AVIF
                </p>
              </div>
            </label>

            {/* Selected Photos Preview Grid */}
            {selectedFiles.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-square rounded-xl border border-[#e4e0d2] bg-white overflow-hidden shadow-xs"
                  >
                    <img
                      src={previewUrls[idx]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Primary Cover Badge */}
                    {idx === 0 ? (
                      <span className="absolute bottom-1.5 left-1.5 bg-[#0e0e0c] text-white text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shadow-xs">
                        Cover
                      </span>
                    ) : (
                      <span className="absolute bottom-1.5 left-1.5 bg-white/90 text-[#0e0e0c] text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#e4e0d2] shadow-xs">
                        Photo #{idx + 1}
                      </span>
                    )}

                    {/* Remove file button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#0e0e0c]/80 hover:bg-rose-600 text-white flex items-center justify-center text-xs transition-colors cursor-pointer shadow-xs"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#f2efe6] flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-mono text-[#8f8a7a] self-start sm:self-auto">
              {uploadStatus}
            </span>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => router.push("/admin/products")}
                className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-[#5a5744] hover:text-[#0e0e0c] hover:bg-[#f5f3eb] transition-colors cursor-pointer border border-[#e4e0d2] sm:border-transparent"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-initial justify-center bg-[#0e0e0c] hover:bg-[#2b2506] disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{uploadStatus || "Creating..."}</span>
                  </>
                ) : (
                  <span>Create Product</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}