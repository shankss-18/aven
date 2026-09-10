"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(String(dateStr).replace(" ", "T"));
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function formatPrice(paise) {
  return `₹${(Math.round(Number(paise) || 0) / 100).toLocaleString("en-IN")}`;
}

export default function AdminCancellationsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function load() {
    const token = localStorage.getItem("adminAuthToken");
    if (!token) { router.push("/admin/login"); return; }

    try {
      const res = await fetch("/api/admin/cancellations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { localStorage.removeItem("adminAuthToken"); router.push("/admin/login"); return; }
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load cancellation requests:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAction(orderId, action) {
    const label = action === "approve" ? "Approve & Refund" : "Reject";
    const warning = action === "approve"
      ? `Approve cancellation for Order #${orderId}? This will trigger a REAL Razorpay refund and is irreversible.`
      : `Reject the cancellation request for Order #${orderId}? This cannot be undone.`;

    if (!window.confirm(warning)) return;

    const token = localStorage.getItem("adminAuthToken");
    setActionLoadingId(orderId);

    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== orderId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || `Failed to ${action} cancellation`);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono uppercase tracking-wider text-[#8f8a7a]">Loading Requests…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Page Header */}
      <div className="border-b border-[#e4e0d2] pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-display font-semibold text-2xl text-[#0e0e0c] tracking-tight flex items-center gap-2.5">
              Cancellation Requests
              {requests.length > 0 && (
                <span className="text-xs font-mono font-semibold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                  {requests.length}
                </span>
              )}
            </h1>
            <p className="text-xs text-[#8f8a7a] mt-1">
              Review customer cancellation requests. Approving will trigger a real Razorpay refund.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[#5a5744] hover:text-[#0e0e0c] transition-colors px-3 py-1.5 rounded-lg border border-[#e4e0d2] bg-white cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white border border-[#e4e0d2] rounded-2xl p-14 text-center shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#f2efe6] flex items-center justify-center mx-auto">
            <svg className="w-5 h-5 stroke-[#8f8a7a] fill-none stroke-[1.6]" viewBox="0 0 24 24">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-[#0e0e0c]">No pending requests</p>
          <p className="text-xs text-[#8f8a7a]">All cancellation requests have been resolved.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#e4e0d2] rounded-2xl p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                {/* Left: Order Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-semibold text-[#0e0e0c] bg-[#f2efe6] px-2.5 py-0.5 rounded border border-[#e4e0d2]">
                      Order #{req.id}
                    </span>
                    <span className="text-xs text-[#8f8a7a]">{formatDate(req.created_at)}</span>
                    <span className="font-mono text-sm font-bold text-[#0e0e0c]">
                      {formatPrice(req.total_amount)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0e0e0c]">{req.customer_name}</p>
                    <p className="text-xs text-[#8f8a7a]">{req.customer_email}</p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAction(req.id, "reject")}
                    disabled={actionLoadingId === req.id}
                    className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold border border-[#e4e0d2] bg-white text-[#5a5744] hover:bg-[#f2efe6] disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {actionLoadingId === req.id ? "…" : "Reject"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(req.id, "approve")}
                    disabled={actionLoadingId === req.id}
                    className="px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    {actionLoadingId === req.id ? "Processing…" : "Approve & Refund"}
                  </button>
                </div>
              </div>

              {/* Reason */}
              {req.cancellation_reason && (
                <div className="bg-[#fcfbf9] border border-[#e4e0d2] rounded-xl px-4 py-3">
                  <p className="text-[10.5px] font-mono uppercase tracking-wider text-[#8f8a7a] mb-1">Customer reason</p>
                  <p className="text-[13px] text-[#3a382f] leading-relaxed">{req.cancellation_reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
