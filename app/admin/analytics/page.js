"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className={`rounded-2xl border p-6 shadow-xs ${accent ? "bg-[#0e0e0c] border-[#0e0e0c] text-white" : "bg-white border-[#e4e0d2] text-[#0e0e0c]"}`}>
      <p className={`text-[10.5px] font-mono uppercase tracking-wider mb-1 ${accent ? "text-[#a0a090]" : "text-[#8f8a7a]"}`}>{label}</p>
      <p className={`font-display font-bold text-[32px] tracking-tight leading-none mb-1 ${accent ? "text-white" : "text-[#0e0e0c]"}`}>{value}</p>
      {sub && <p className={`text-[12px] ${accent ? "text-[#a0a090]" : "text-[#8f8a7a]"}`}>{sub}</p>}
    </div>
  );
}

const STATUS_COLORS = {
  paid:       { bg: "bg-[#e7efe3]", text: "text-[#3f6b46]", bar: "bg-[#5da564]" },
  shipped:    { bg: "bg-[#e8f0fe]", text: "text-[#2a4f9e]", bar: "bg-[#4b7ee8]" },
  delivered:  { bg: "bg-[#e7efe3]", text: "text-[#3f6b46]", bar: "bg-[#3f8a47]" },
  pending:    { bg: "bg-[#f6ecd6]", text: "text-[#8a6512]", bar: "bg-[#d4a017]" },
  cancelled:  { bg: "bg-[#f7e7e1]", text: "text-[#b5482f]", bar: "bg-[#c0583a]" },
};

function getStatusStyle(status) {
  return STATUS_COLORS[status?.toLowerCase()] || { bg: "bg-[#f2efe6]", text: "text-[#3a382f]", bar: "bg-[#8f8a7a]" };
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("adminAuthToken");
    if (!token) { router.push("/admin/login"); return; }

    fetch("/api/admin/analytics", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401) { localStorage.removeItem("adminAuthToken"); router.push("/admin/login"); return; }
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a]">Loading Analytics…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center text-sm text-[#8f8a7a]">
        Failed to load analytics. Please refresh.
      </div>
    );
  }

  const totalRevenue = (Number(data.totalRevenue) || 0) / 100;
  const maxCount = Math.max(...(data.statusBreakdown || []).map((s) => Number(s.count) || 0), 1);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="border-b border-[#e4e0d2] pb-5">
        <h1 className="font-display font-semibold text-2xl text-[#0e0e0c] tracking-tight">Analytics</h1>
        <p className="text-xs text-[#8f8a7a] mt-1">Store performance overview — revenue, orders, and top products.</p>
      </div>

      {/* Headline Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          accent
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString("en-IN")}`}
          sub={`Across ${data.orderCount} completed orders`}
        />
        <StatCard
          label="Total Orders"
          value={data.orderCount}
          sub="All time"
        />
        {/* Pending Cancellations — links to cancellations page */}
        <Link href="/admin/cancellations" className="block">
          <div className={`rounded-2xl border p-6 shadow-xs transition-all hover:shadow-md cursor-pointer ${
            Number(data.pendingCancellations) > 0
              ? "bg-[#fff8f6] border-rose-300"
              : "bg-white border-[#e4e0d2]"
          }`}>
            <p className="text-[10.5px] font-mono uppercase tracking-wider mb-1 text-[#8f8a7a]">
              Pending Cancellations
            </p>
            <p className={`font-display font-bold text-[32px] tracking-tight leading-none mb-1 ${
              Number(data.pendingCancellations) > 0 ? "text-rose-600" : "text-[#0e0e0c]"
            }`}>
              {data.pendingCancellations}
            </p>
            <p className={`text-[12px] flex items-center gap-1 ${
              Number(data.pendingCancellations) > 0 ? "text-rose-500" : "text-[#8f8a7a]"
            }`}>
              {Number(data.pendingCancellations) > 0 ? (
                <>
                  <svg className="w-3 h-3 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Requires action →
                </>
              ) : "All clear"}
            </p>
          </div>
        </Link>
      </div>

      {/* Status Breakdown + Top Products row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white border border-[#e4e0d2] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-[#f2efe6] pb-3">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
              Orders by Status
            </h2>
          </div>
          <div className="space-y-3">
            {(data.statusBreakdown || []).map((row) => {
              const style = getStatusStyle(row.status);
              const pct = Math.round((Number(row.count) / maxCount) * 100);
              return (
                <div key={row.status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className={`inline-flex px-2 py-0.5 rounded-full font-semibold capitalize text-[11px] ${style.bg} ${style.text}`}>
                      {row.status}
                    </span>
                    <span className="font-mono font-semibold text-[#0e0e0c]">{row.count}</span>
                  </div>
                  <div className="w-full h-2 bg-[#f2efe6] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${style.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {(!data.statusBreakdown || data.statusBreakdown.length === 0) && (
              <p className="text-xs text-[#8f8a7a] text-center py-6">No order data yet.</p>
            )}
          </div>
        </div>

        {/* Top 5 Products */}
        <div className="bg-white border border-[#e4e0d2] rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-[#f2efe6] pb-3">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
              Top 5 Best-Selling Products
            </h2>
          </div>
          <div className="space-y-2">
            {(data.topProducts || []).map((p, idx) => (
              <div
                key={p.name}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#fcfbf9] border border-[#f2efe6]"
              >
                <span className="w-6 h-6 rounded-full bg-[#0e0e0c] text-white text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="flex-1 text-[13px] font-medium text-[#0e0e0c] truncate">{p.name}</span>
                <span className="font-mono text-[12px] font-semibold text-[#3a382f] shrink-0">
                  {p.units_sold} units
                </span>
              </div>
            ))}
            {(!data.topProducts || data.topProducts.length === 0) && (
              <p className="text-xs text-[#8f8a7a] text-center py-6">No sales data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
