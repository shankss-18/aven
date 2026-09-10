"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function AdminOrderDetailPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(false);
  const router = useRouter();
  const params = useParams();

  async function loadOrder() {
    const token = localStorage.getItem("adminAuthToken");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const res = await fetch(`/api/admin/orders/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      localStorage.removeItem("adminAuthToken");
      router.push("/admin/login");
      return;
    }

    const result = await res.json();
    setData(result);
    setLoading(false);
  }

  useEffect(() => {
    loadOrder();
  }, [params.id]);

  async function handleShip() {
    setShipping(true);
    const token = localStorage.getItem("adminAuthToken");

    const res = await fetch(`/api/admin/orders/${params.id}/ship`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Failed to create shipment");
      setShipping(false);
      return;
    }

    await loadOrder();
    setShipping(false);
  }

  function renderStatusBadge(status) {
    const s = (status || "").toLowerCase();
    let badgeStyle = "bg-stone-50 text-stone-700 border-stone-200";

    if (s === "pending") {
      badgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (s === "paid") {
      badgeStyle = "bg-blue-50 text-blue-800 border-blue-200";
    } else if (s === "shipped") {
      badgeStyle = "bg-purple-50 text-purple-800 border-purple-200";
    } else if (s === "delivered") {
      badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
    } else if (s === "rto" || s === "cancelled" || s === "failed") {
      badgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider font-medium border ${badgeStyle}`}
      >
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a]">
          Loading Order Details...
        </p>
      </div>
    );
  }

  if (!data?.order) {
    return (
      <div className="bg-white border border-[#e4e0d2] rounded-2xl p-10 text-center max-w-md mx-auto space-y-4 shadow-xs">
        <p className="text-sm font-medium text-[#0e0e0c]">Order Not Found</p>
        <p className="text-xs text-[#8f8a7a]">
          The requested order ID does not exist in the database or may have been removed.
        </p>
        <button
          onClick={() => router.push("/admin")}
          className="bg-[#0e0e0c] text-white px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold cursor-pointer hover:bg-[#2b2506] transition-colors"
        >
          Return to Orders
        </button>
      </div>
    );
  }

  const { order, items } = data;

  return (
    <div className="space-y-6">
      {/* Back button & Action Header */}
      <div>
        <button
          onClick={() => router.push("/admin")}
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#8f8a7a] hover:text-[#0e0e0c] transition-colors cursor-pointer mb-3"
        >
          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Orders</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e4e0d2] pb-5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-semibold text-2xl text-[#0e0e0c] tracking-tight">
              Order #{order.id}
            </h1>
            {renderStatusBadge(order.status)}
            <span className="text-xs font-mono text-[#8f8a7a]">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {order.status === "paid" && (
            <button
              onClick={handleShip}
              disabled={shipping}
              className="bg-[#0e0e0c] hover:bg-[#2b2506] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              {shipping ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Creating Shipment...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                    <rect width="16" height="13" x="1" y="6" rx="2" />
                    <path d="M16 8h4l3 5v4a2 2 0 0 1-2 2h-1" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                  <span>Create Shipment</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items and Shipment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <div className="bg-white border border-[#e4e0d2] rounded-xl overflow-hidden shadow-xs">
            <div className="px-5 py-4 border-b border-[#e4e0d2] bg-[#fbf9f4] flex items-center justify-between">
              <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
                Items Ordered ({items?.length || 0})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#e4e0d2] text-[11px] font-mono uppercase tracking-wider text-[#8f8a7a]">
                    <th className="px-5 py-3 font-medium">Item</th>
                    <th className="px-5 py-3 font-medium">Specs</th>
                    <th className="px-5 py-3 text-center font-medium">Qty</th>
                    <th className="px-5 py-3 text-right font-medium">Price</th>
                    <th className="px-5 py-3 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f2efe6] text-sm">
                  {items.map((item, i) => {
                    const unitPrice = item.price_at_purchase / 100;
                    const subtotal = (item.price_at_purchase * item.quantity) / 100;
                    return (
                      <tr key={i} className="hover:bg-[#faf8f2] transition-colors">
                        <td className="px-5 py-3.5 font-medium text-[#0e0e0c]">
                          {item.name}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-xs bg-[#f2efe6] text-[#3a382f] px-2 py-0.5 rounded border border-[#e4e0d2]">
                              Size: {item.size}
                            </span>
                            <span className="font-mono text-xs bg-[#f2efe6] text-[#3a382f] px-2 py-0.5 rounded border border-[#e4e0d2]">
                              {item.color}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono text-[#0e0e0c]">
                          {item.quantity}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-[#5a5744]">
                          ₹{unitPrice.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold text-[#0e0e0c]">
                          ₹{subtotal.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Footer */}
            <div className="p-5 border-t border-[#e4e0d2] bg-[#fbf9f4] flex justify-between items-center">
              <span className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a]">
                Order Total
              </span>
              <span className="text-lg font-mono font-bold text-[#0e0e0c]">
                ₹{(order.total_amount / 100).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Fulfillment Card */}
          <div className="bg-white border border-[#e4e0d2] rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
              Fulfillment & Dispatch
            </h2>
            {order.shiprocket_awb ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-1">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold uppercase tracking-wider font-mono">
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Shipment Dispatched via Shiprocket</span>
                </div>
                <p className="text-xs text-emerald-900 font-mono pt-1">
                  Air Waybill (AWB): <strong className="select-all">{order.shiprocket_awb}</strong>
                </p>
              </div>
            ) : order.status === "paid" ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900 text-xs flex items-center justify-between">
                <span>Payment verified. Ready to create Shiprocket carrier pickup label.</span>
              </div>
            ) : (
              <div className="bg-[#f2efe6] border border-[#e4e0d2] rounded-lg p-4 text-[#5a5744] text-xs">
                Shipment can be generated once order payment status is confirmed as <strong>paid</strong>.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer & Shipping Address */}
        <div className="space-y-6">
          {/* Customer Info Card */}
          <div className="bg-white border border-[#e4e0d2] rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
              Customer Details
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a] block">
                  Full Name
                </span>
                <span className="font-medium text-[#0e0e0c]">{order.customer_name}</span>
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a] block">
                  Email
                </span>
                <span className="font-mono text-xs text-[#0e0e0c]">{order.customer_email}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white border border-[#e4e0d2] rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
              Delivery Address
            </h2>
            <div className="space-y-1.5 text-sm text-[#0e0e0c]">
              <div className="font-medium">{order.full_name}</div>
              <div className="text-xs text-[#5a5744]">{order.line1}</div>
              <div className="text-xs text-[#5a5744]">
                {order.city}, {order.state} {order.pincode}
              </div>
              {order.phone && (
                <div className="text-xs font-mono text-[#5a5744] pt-1">
                  📞 {order.phone}
                </div>
              )}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white border border-[#e4e0d2] rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0e0e0c]">
              Payment Summary
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8f8a7a]">Payment Status</span>
                <span className="font-mono font-medium capitalize">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8f8a7a]">Gateway</span>
                <span className="font-mono">Razorpay</span>
              </div>
              <div className="border-t border-[#f2efe6] pt-2 flex justify-between font-semibold text-sm text-[#0e0e0c]">
                <span>Total Paid</span>
                <span className="font-mono">₹{(order.total_amount / 100).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}