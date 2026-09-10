"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminOrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadOrders() {
      const token = localStorage.getItem("adminAuthToken");
      if (!token) { router.push("/admin/login"); return; }

      const res = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem("adminAuthToken");
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
      setLoading(false);
    }
    loadOrders();
  }, [router]);

  function renderStatusBadge(status) {
    const s = (status || "").toLowerCase();
    let cls = "bg-stone-50 text-stone-700 border-stone-200";
    if (s === "pending") cls = "bg-amber-50 text-amber-800 border-amber-200";
    else if (s === "paid") cls = "bg-blue-50 text-blue-800 border-blue-200";
    else if (s === "shipped") cls = "bg-purple-50 text-purple-800 border-purple-200";
    else if (s === "delivered") cls = "bg-emerald-50 text-emerald-800 border-emerald-200";
    else if (["rto", "cancelled", "failed"].includes(s)) cls = "bg-rose-50 text-rose-800 border-rose-200";
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider font-medium border ${cls}`}>
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a]">Loading Orders…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e4e0d2] pb-5">
        <div>
          <h1 className="font-display font-semibold text-2xl text-[#0e0e0c] tracking-tight">Orders</h1>
          <p className="text-xs text-[#8f8a7a] mt-1">Monitor incoming purchases, review payment status, and dispatch shipments.</p>
        </div>
        <span className="font-mono text-xs text-[#5a5744] bg-white px-3 py-1.5 rounded-lg border border-[#e4e0d2] shadow-xs self-start sm:self-auto">
          Total: <strong className="text-[#0e0e0c]">{orders.length}</strong>
        </span>
      </div>

      <div className="bg-white border border-[#e4e0d2] rounded-xl overflow-hidden shadow-xs">
        {orders.length === 0 ? (
          <div className="py-16 text-center text-[#8f8a7a] space-y-2">
            <svg className="w-10 h-10 mx-auto stroke-current fill-none stroke-[1.2] text-[#c9c4b3]" viewBox="0 0 24 24">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
            </svg>
            <p className="text-sm font-medium text-[#0e0e0c]">No orders yet</p>
            <p className="text-xs text-[#8f8a7a]">Customer orders will appear here once checkout is completed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#fbf9f4] border-b border-[#e4e0d2] text-[11px] font-mono uppercase tracking-wider text-[#8f8a7a]">
                  <th className="px-5 py-3.5 font-medium">Order ID</th>
                  <th className="px-5 py-3.5 font-medium">Customer</th>
                  <th className="px-5 py-3.5 font-medium">Status</th>
                  <th className="px-5 py-3.5 font-medium">Total</th>
                  <th className="px-5 py-3.5 font-medium">AWB Track</th>
                  <th className="px-5 py-3.5 font-medium">Date</th>
                  <th className="px-5 py-3.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2efe6] text-sm">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => router.push(`/admin/orders/${order.id}`)}
                    className="hover:bg-[#faf8f2] transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 font-mono font-medium text-[#0e0e0c]">#{order.id}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-[#0e0e0c]">{order.customer_name}</div>
                      <div className="text-xs font-mono text-[#8f8a7a]">{order.customer_email}</div>
                    </td>
                    <td className="px-5 py-4">{renderStatusBadge(order.status)}</td>
                    <td className="px-5 py-4 font-mono font-semibold text-[#0e0e0c]">
                      ₹{(order.total_amount / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="px-5 py-4">
                      {order.shiprocket_awb ? (
                        <span className="font-mono text-xs bg-[#f2efe6] text-[#3a382f] px-2 py-0.5 rounded border border-[#e4e0d2]">
                          {order.shiprocket_awb}
                        </span>
                      ) : (
                        <span className="text-xs text-[#c9c4b3] font-mono">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-[#8f8a7a]">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[#5a5744] group-hover:text-[#0e0e0c] transition-colors">
                        <span>Details</span>
                        <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2] group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24">
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
