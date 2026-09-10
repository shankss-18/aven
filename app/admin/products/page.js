"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem("adminAuthToken");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const res = await fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("adminAuthToken");
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      setProducts(data.products || []);
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a]">
          Loading Catalog...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e4e0d2] pb-5">
        <div>
          <h1 className="font-display font-semibold text-2xl text-[#0e0e0c] tracking-tight">
            Products
          </h1>
          <p className="text-xs text-[#8f8a7a] mt-1">
            Manage your footwear catalog, product descriptions, pricing, and variants.
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/products/new")}
          className="bg-[#0e0e0c] hover:bg-[#2b2506] text-white px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
        >
          <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Add Product</span>
        </button>
      </div>

      {/* Products Table Card */}
      <div className="bg-white border border-[#e4e0d2] rounded-xl overflow-hidden shadow-xs">
        {products.length === 0 ? (
          <div className="py-16 text-center text-[#8f8a7a] space-y-3">
            <p className="text-sm font-medium text-[#0e0e0c]">No products found</p>
            <p className="text-xs text-[#8f8a7a]">
              Your catalog is empty. Click below to add your first footwear product.
            </p>
            <button
              onClick={() => router.push("/admin/products/new")}
              className="bg-[#0e0e0c] text-white px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer"
            >
              + Create First Product
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fbf9f4] border-b border-[#e4e0d2] text-[11px] font-mono uppercase tracking-wider text-[#8f8a7a]">
                  <th className="px-5 py-3.5 font-medium">Product</th>
                  <th className="px-5 py-3.5 font-medium">Category</th>
                  <th className="px-5 py-3.5 font-medium">Base Price</th>
                  <th className="px-5 py-3.5 font-medium">Date Added</th>
                  <th className="px-5 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2efe6] text-sm">
                {products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/admin/products/${p.id}`)}
                    className="hover:bg-[#faf8f2] transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-lg bg-[#f2efe6] border border-[#e4e0d2] overflow-hidden shrink-0 flex items-center justify-center relative">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-mono text-[#8f8a7a]">No Pic</span>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs sm:max-w-md">
                          <div className="font-medium text-[#0e0e0c] truncate group-hover:underline">
                            {p.name}
                          </div>
                          {p.description && (
                            <div className="text-xs text-[#8f8a7a] truncate mt-0.5">
                              {p.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-mono uppercase tracking-wider bg-[#f2efe6] text-[#3a382f] border border-[#e4e0d2]">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-[#0e0e0c]">
                      ₹{(p.base_price / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-[#8f8a7a]">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5a5744] group-hover:text-[#0e0e0c] transition-colors">
                        <span>Edit</span>
                        <svg
                          className="w-3.5 h-3.5 stroke-current fill-none stroke-[2] transform group-hover:translate-x-0.5 transition-transform"
                          viewBox="0 0 24 24"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}