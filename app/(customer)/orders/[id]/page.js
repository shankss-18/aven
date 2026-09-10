"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiFetch, getToken } from "@/lib/apiClient";

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

function formatPrice(amountInRupees) {
  return `₹${Math.round(amountInRupees).toLocaleString("en-IN")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const cleanStr = String(dateStr).replace(" ", "T");
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function getStatusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  switch (s) {
    case "paid":
    case "delivered":
      return "bg-[#e7efe3] text-[#3f6b46]";
    case "processing":
    case "pending":
    case "shipped":
    case "in transit":
      return "bg-[#f6ecd6] text-[#8a6512]";
    case "cancelled":
    case "returned":
    case "rto":
      return "bg-[#f7e7e1] text-[#b5482f]";
    default:
      return "bg-[#f2efe6] text-[#3a382f]";
  }
}

export default function OrderDetailPage({ params }) {
  const router = useRouter();
  const routeParams = useParams();
  const orderId = routeParams?.id || (params ? use(params)?.id : "");

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;

    try {
      setLoading(true);
      const token = getToken();
      if (!token) {
        router.push("/auth");
        return;
      }

      const res = await apiFetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order || null);
        setItems(Array.isArray(data.items) ? data.items : []);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Order not found");
      }
    } catch (err) {
      console.error("Order detail fetch error:", err);
      setError("Unable to retrieve order details.");
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!order || cancelling) return;

    try {
      setCancelling(true);
      setCancelError(null);

      const res = await apiFetch(`/api/orders/${order.id}/cancel`, {
        method: "POST",
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (res.ok) {
        setIsCancelModalOpen(false);
        setCancelReason("");
        await fetchOrderDetail();
      } else {
        const data = await res.json().catch(() => ({}));
        setCancelError(data.error || "Failed to submit cancellation request");
      }
    } catch (err) {
      console.error("Cancellation error:", err);
      setCancelError("Network error submitting cancellation request");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2efe6] text-[#0e0e0c] font-['Inter',sans-serif]">
      <Navbar activePage="orders" />

      <main className="max-w-[1180px] mx-auto py-8 sm:py-10 px-4 sm:px-6">
        <div className="bg-white rounded-[22px] shadow-[0_20px_60px_-30px_rgba(14,14,12,0.35)] border border-[#e4e0d2] overflow-hidden">
          {/* Top Bar with Back Link */}
          <div className="px-6 sm:px-10 py-5 border-b border-[#e4e0d2] flex items-center justify-between">
            <Link
              href="/orders"
              className="text-[12.5px] text-[#3a382f] hover:text-[#0e0e0c] underline transition-colors flex items-center gap-1.5"
            >
              <span>← Back to orders</span>
            </Link>
            <span className="text-[12px] font-mono text-[#8f8a7a]">Order #{orderId}</span>
          </div>

          <div className="p-6 sm:p-10">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="font-mono text-[13px] text-[#8f8a7a]">Loading order details...</p>
              </div>
            ) : error ? (
              <div className="py-16 text-center max-w-md mx-auto">
                <p className="text-[#b5482f] text-[15px] font-medium mb-4">{error}</p>
                <Link
                  href="/orders"
                  className="px-6 py-2.5 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity"
                >
                  Return to all orders
                </Link>
              </div>
            ) : order ? (
              <div>
                {/* Header Information: Order ID, Date, and Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#e4e0d2] mb-8">
                  <div>
                    <h1 className="font-['Space_Grotesk'] text-[24px] sm:text-[28px] font-bold text-[#0e0e0c] tracking-tight">
                      #AV-{order.id}
                    </h1>
                    <p className="text-[13px] text-[#8f8a7a] mt-1">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] text-[#8f8a7a] font-medium">Status:</span>
                      <span
                        className={`inline-flex items-center text-[12px] px-3 py-1 rounded-full font-semibold capitalize tracking-[0.02em] ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    {/* Cancellation Status Badge */}
                    {order.cancellation_status === "requested" && (
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] font-semibold border border-[#fde68a]">
                        <svg className="w-3 h-3 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Cancellation requested — awaiting approval
                      </span>
                    )}
                    {order.cancellation_status === "rejected" && (
                      <span className="inline-flex items-center gap-1.5 text-[11.5px] px-3 py-1 rounded-full bg-[#f7e7e1] text-[#b5482f] font-semibold border border-[#f5c6b8]">
                        <svg className="w-3 h-3 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                        Cancellation rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Tracking Number: Only shown if shiprocket_awb is actually populated */}
                {order.shiprocket_awb && (
                  <div className="mb-8 p-4.5 bg-[#faf8f4] border border-[#e4e0d2] rounded-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-[#e4e0d2] flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 stroke-[#0e0e0c] fill-none stroke-[1.8]" viewBox="0 0 24 24">
                          <rect x="1" y="3" width="15" height="13" />
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                          <circle cx="5.5" cy="18.5" r="2.5" />
                          <circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                      </div>
                      <div>
                        <span className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] font-medium">
                          Tracking number (Shiprocket)
                        </span>
                        <span className="font-mono text-[14px] font-bold text-[#0e0e0c]">
                          {order.shiprocket_awb}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white border border-[#e4e0d2] text-[#3a382f] shrink-0 self-start sm:self-auto">
                      In Transit
                    </span>
                  </div>
                )}

                {/* Order Detail 2-Column Layout matching #orderDetail */}
                <div className="p-6 sm:p-7 bg-[#f2efe6] border border-[#e4e0d2] rounded-[16px] grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
                  {/* Left Column: Itemized List */}
                  <div>
                    <h2 className="text-[11.5px] uppercase tracking-[0.08em] text-[#8f8a7a] font-bold mb-4">
                      Items ({items.length})
                    </h2>

                    <div className="divide-y divide-[#e4e0d2] border-t border-b border-[#e4e0d2]">
                      {items.map((item, index) => {
                        const unitRupees = (Number(item.price_at_purchase) || 0) / 100;
                        const lineTotalRupees = unitRupees * (Number(item.quantity) || 1);

                        return (
                          <div
                            key={index}
                            className="py-4 flex items-center gap-3.5 sm:gap-4 text-[13px]"
                          >
                            <div className="w-[60px] h-[60px] rounded-[10px] bg-[#eae5d5] overflow-hidden flex items-center justify-center shrink-0 border border-[#e4e0d2]">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (item.name || "").toLowerCase().includes("boot") ? (
                                <BootGlyph />
                              ) : (
                                <SneakerGlyph />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-[13.5px] text-[#0e0e0c] truncate">
                                {item.name}
                              </h3>
                              <p className="text-[12px] text-[#8f8a7a] mt-0.5">
                                Qty {item.quantity} · EU {item.size || "41"}{" "}
                                {item.color ? `· ${item.color}` : ""}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-[11px] font-mono text-[#8f8a7a]">
                                  {formatPrice(unitRupees)} each
                                </p>
                              )}
                            </div>

                            <div className="font-mono text-[13.5px] font-bold text-[#0e0e0c] shrink-0 text-right">
                              {formatPrice(lineTotalRupees)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Shipping Address & Summary */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <h2 className="text-[11.5px] uppercase tracking-[0.08em] text-[#8f8a7a] font-bold mb-3">
                        Shipping address
                      </h2>
                      <div className="p-4 bg-white border border-[#e4e0d2] rounded-[12px] text-[13px] text-[#3a382f] leading-relaxed mb-6">
                        <div className="font-semibold text-[#0e0e0c] mb-1">
                          {order.full_name}
                        </div>
                        <div>
                          {order.line1}, {order.city}
                        </div>
                        <div>
                          {order.state} - {order.pincode}
                        </div>
                        {order.phone && (
                          <div className="text-[12px] font-mono text-[#8f8a7a] mt-1.5">
                            Ph: {order.phone}
                          </div>
                        )}
                      </div>

                      <h2 className="text-[11.5px] uppercase tracking-[0.08em] text-[#8f8a7a] font-bold mb-3">
                        Order summary
                      </h2>
                      <div className="space-y-2.5 text-[13px]">
                        <div className="flex justify-between text-[#3a382f]">
                          <span>Subtotal</span>
                          <span className="font-mono">
                            {formatPrice((Number(order.total_amount) || 0) / 100)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[#3a382f] items-center">
                          <span>Shipping</span>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#e7efe3] text-[#3f6b46]">
                            Free
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-[15px] text-[#0e0e0c] border-t border-[#e4e0d2] pt-3 mt-1.5">
                          <span>Total</span>
                          <span className="font-mono">
                            {formatPrice((Number(order.total_amount) || 0) / 100)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 space-y-3">
                      {/* Cancel Order Button — only for paid orders with no cancellation request */}
                      {order.status === "paid" && order.cancellation_status === "none" && (
                        <button
                          type="button"
                          onClick={() => setIsCancelModalOpen(true)}
                          className="w-full py-2.5 rounded-full text-[13px] font-semibold bg-white border border-rose-300 text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                          <span>Cancel Order</span>
                        </button>
                      )}

                      <Link
                        href="/products"
                        className="w-full py-3 rounded-full text-[13px] font-semibold bg-white border border-[#0e0e0c] text-[#0e0e0c] hover:bg-[#0e0e0c] hover:text-[#f2efe6] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span>Browse more shoes</span>
                        <span>→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      {/* Cancellation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] shadow-2xl border border-[#e4e0d2] w-full max-w-md p-6 sm:p-8">
            <div className="mb-5">
              <h2 className="font-['Space_Grotesk'] text-[20px] font-bold text-[#0e0e0c] mb-1">Cancel Order #{orderId}</h2>
              <p className="text-[13px] text-[#8f8a7a]">Please let us know why you want to cancel. Our team will review your request and process the refund.</p>
            </div>

            <form onSubmit={handleCancelOrder} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-mono uppercase tracking-wider text-[#5a5744] mb-1.5">
                  Reason for cancellation
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Ordered the wrong size, found a better price elsewhere…"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full border border-[#e4e0d2] focus:border-[#0e0e0c] focus:ring-1 focus:ring-[#0e0e0c] rounded-xl px-4 py-3 text-sm bg-[#fcfbf9] text-[#0e0e0c] outline-none transition-all resize-none"
                />
              </div>

              {cancelError && (
                <p className="text-[12.5px] text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{cancelError}</p>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { setIsCancelModalOpen(false); setCancelReason(""); setCancelError(null); }}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-semibold border border-[#e4e0d2] text-[#3a382f] hover:bg-[#f2efe6] transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white transition-colors"
                >
                  {cancelling ? "Submitting…" : "Request Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
