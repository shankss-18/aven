"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { apiFetch, clearToken } from "@/lib/apiClient";

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
      return "bg-[#e7efe3] text-[#3f6b46] border border-[#d2e3cb]";
    case "processing":
    case "pending":
    case "shipped":
    case "in transit":
      return "bg-[#f6ecd6] text-[#8a6512] border border-[#e8dcb8]";
    case "cancelled":
    case "returned":
    case "rto":
      return "bg-[#f7e7e1] text-[#b5482f] border border-[#ebd0c7]";
    default:
      return "bg-[#f2efe6] text-[#3a382f] border border-[#e4e0d2]";
  }
}

export default function AccountPage() {
  const router = useRouter();
  const [account, setAccount] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "addresses" | "orders"

  // Address Modal State (for both Create and Edit)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressFormData, setAddressFormData] = useState({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Delete confirmation state
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync tab from URL query params on mount & popstate
  useEffect(() => {
    const syncTabFromUrl = () => {
      if (typeof window !== "undefined") {
        const tab = new URLSearchParams(window.location.search).get("tab");
        if (tab && ["profile", "addresses", "orders"].includes(tab)) {
          setActiveTab(tab);
        }
      }
    };
    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);
    return () => {
      window.removeEventListener("popstate", syncTabFromUrl);
    };
  }, []);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newTab === "profile") {
        url.searchParams.delete("tab");
      } else {
        url.searchParams.set("tab", newTab);
      }
      window.history.pushState(null, "", url.toString());
    }
  };

  // Fetch saved addresses
  const fetchAddresses = useCallback(async () => {
    try {
      const res = await apiFetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        if (data?.addresses && Array.isArray(data.addresses)) {
          setAddresses(data.addresses);
        }
      }
    } catch (err) {
      console.error("Failed to load addresses:", err);
    }
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const ordRes = await apiFetch("/api/orders");
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        if (ordData?.orders && Array.isArray(ordData.orders)) {
          setOrders(ordData.orders);
        }
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  }, []);

  // Fetch initial account data
  useEffect(() => {
    let isMounted = true;

    async function loadAccountData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch user account details
        const accRes = await apiFetch("/api/account");
        if (!accRes.ok) {
          throw new Error(`Failed to load account (${accRes.status})`);
        }
        const accData = await accRes.json();
        const userAccount = accData?.account || accData;

        if (isMounted) {
          setAccount(userAccount);
        }

        // 2. Fetch saved addresses
        await fetchAddresses();

        // 3. Fetch all orders
        await fetchOrders();
      } catch (err) {
        console.error("Error loading account:", err);
        if (isMounted) {
          setError(err.message || "Failed to load account details");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAccountData();

    return () => {
      isMounted = false;
    };
  }, [fetchAddresses, fetchOrders]);

  const handleLogout = () => {
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    } else {
      router.push("/");
    }
  };

  // Open modal to create a new address
  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setAddressFormData({
      fullName: account?.name || "",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pincode: "",
    });
    setFormError("");
    setIsAddressModalOpen(true);
  };

  // Open modal to edit existing address
  const handleOpenEditModal = (addr) => {
    setEditingAddress(addr);
    setAddressFormData({
      fullName: addr.full_name || "",
      phone: addr.phone || "",
      line1: addr.line1 || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
    });
    setFormError("");
    setIsAddressModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setIsAddressModalOpen(false);
    setEditingAddress(null);
    setFormError("");
  };

  // Handle address form submit (create or edit)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setFormError("");

    const { fullName, phone, line1, city, state, pincode } = addressFormData;
    if (!fullName.trim() || !phone.trim() || !line1.trim() || !city.trim() || !state.trim() || !pincode.trim()) {
      setFormError("All fields are required.");
      return;
    }

    try {
      setFormSubmitting(true);

      if (editingAddress) {
        // Edit existing address
        const res = await apiFetch(`/api/addresses/${editingAddress.id}`, {
          method: "PUT",
          body: JSON.stringify({
            id: editingAddress.id,
            fullName: fullName.trim(),
            phone: phone.trim(),
            line1: line1.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to update address.");
        }

        setStatusMessage("Address updated successfully.");
      } else {
        // Create new address
        const res = await apiFetch("/api/addresses", {
          method: "POST",
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phone.trim(),
            line1: line1.trim(),
            city: city.trim(),
            state: state.trim(),
            pincode: pincode.trim(),
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to save address.");
        }

        setStatusMessage("New address added successfully.");
      }

      await fetchAddresses();
      handleCloseModal();

      setTimeout(() => {
        setStatusMessage("");
      }, 4000);
    } catch (err) {
      console.error("Save address error:", err);
      setFormError(err.message || "Failed to save address. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle address deletion
  const handleDeleteAddress = async (addrId) => {
    try {
      setIsDeleting(true);
      const res = await apiFetch(`/api/addresses/${addrId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete address.");
      }

      setAddresses((prev) => prev.filter((a) => a.id !== addrId));
      setDeletingId(null);
      setStatusMessage("Address removed successfully.");
      setTimeout(() => {
        setStatusMessage("");
      }, 4000);
    } catch (err) {
      console.error("Delete address error:", err);
      alert(err.message || "Failed to delete address.");
    } finally {
      setIsDeleting(false);
    }
  };

  const memberYear = account?.created_at
    ? new Date(account.created_at).getFullYear()
    : "2024";

  return (
    <main className="min-h-screen w-full bg-white text-[#0e0e0c] flex flex-col justify-between font-['Inter',sans-serif]">
      <div>
        {/* Top Store Navigation */}
        <Navbar activePage={activeTab === "orders" ? "orders" : "account"} />

        {/* Breadcrumb Navigation */}
        <div className="max-w-[1180px] mx-auto w-full px-6 sm:px-10 pt-5 text-[12px] text-[#8f8a7a]">
          <Link href="/" className="hover:underline">
            Home
          </Link>{" "}
          <span className="mx-1.5 text-[#0e0e0c]">›</span>{" "}
          <span
            className="text-[#8f8a7a] cursor-pointer hover:underline"
            onClick={() => handleTabChange("profile")}
          >
            Account
          </span>
          {activeTab === "addresses" && (
            <>
              <span className="mx-1.5 text-[#0e0e0c]">›</span>{" "}
              <b className="text-[#0e0e0c] font-medium">Addresses</b>
            </>
          )}
          {activeTab === "orders" && (
            <>
              <span className="mx-1.5 text-[#0e0e0c]">›</span>{" "}
              <b className="text-[#0e0e0c] font-medium">Orders</b>
            </>
          )}
        </div>

        {/* Status Toast Banner */}
        {statusMessage && (
          <div className="max-w-[1180px] mx-auto w-full px-6 sm:px-10 pt-4">
            <div className="bg-[#e7efe3] border border-[#d2e3cb] text-[#3f6b46] px-4 py-2.5 rounded-[8px] text-[13px] flex items-center justify-between animate-in fade-in duration-200">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {statusMessage}
              </span>
              <button
                type="button"
                onClick={() => setStatusMessage("")}
                className="text-[#3f6b46] hover:opacity-75 text-[14px] leading-none px-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="max-w-[1180px] mx-auto w-full px-6 sm:px-10 py-8">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin mb-3" />
              <p className="font-mono text-[13px] text-[#8f8a7a]">Loading account details...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center border border-dashed border-[#e4e0d2] rounded-2xl p-8 max-w-lg mx-auto bg-[#faf8f4]">
              <p className="text-[14.5px] font-medium text-[#b5482f] mb-3">{error}</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-5 py-2.5 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-full text-[13px] font-semibold border border-[#e4e0d2] hover:bg-[#f2efe6] transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-9">
              {/* Account Sidebar Navigation (.account-nav) */}
              <nav className="flex flex-col gap-1">
                {/* Profile Tab */}
                <button
                  type="button"
                  id="tab-profile"
                  onClick={() => handleTabChange("profile")}
                  className={`w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] text-[13px] transition-colors cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-[#f2efe6] text-[#0e0e0c] font-semibold"
                      : "text-[#3a382f] hover:bg-[#f2efe6]/60 hover:text-[#0e0e0c]"
                  }`}
                >
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[1.6]" viewBox="0 0 24 24">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" />
                  </svg>
                  <span>Profile</span>
                </button>

                {/* Orders Tab */}
                <button
                  type="button"
                  id="tab-orders"
                  onClick={() => handleTabChange("orders")}
                  className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-[8px] text-[13px] transition-colors cursor-pointer ${
                    activeTab === "orders"
                      ? "bg-[#f2efe6] text-[#0e0e0c] font-semibold"
                      : "text-[#3a382f] hover:bg-[#f2efe6]/60 hover:text-[#0e0e0c]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 stroke-current fill-none stroke-[1.6]" viewBox="0 0 24 24">
                      <path d="M4 4h16v16H4z" />
                      <path d="M4 9h16M9 4v16" />
                    </svg>
                    <span>Orders</span>
                  </div>
                  {orders.length > 0 && (
                    <span className="font-mono text-[11px] text-[#8f8a7a] bg-white px-1.5 py-0.5 rounded border border-[#e4e0d2]">
                      {orders.length}
                    </span>
                  )}
                </button>

                {/* Wishlist Link */}
                <Link
                  href="/wishlist"
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] text-[13px] text-[#3a382f] hover:bg-[#f2efe6]/60 hover:text-[#0e0e0c] transition-colors"
                >
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[1.6]" viewBox="0 0 24 24">
                    <path d="M12 20s-7-4.4-9.3-8.7C1.2 8 3 5 6.3 5c2 0 3.4 1.1 4.2 2.5C11.3 6.1 12.7 5 14.7 5 18 5 19.8 8 18.3 11.3 16 15.6 12 20 12 20z" />
                  </svg>
                  <span>Wishlist</span>
                </Link>

                {/* Addresses Tab */}
                <button
                  type="button"
                  id="tab-addresses"
                  onClick={() => handleTabChange("addresses")}
                  className={`w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-[8px] text-[13px] transition-colors cursor-pointer ${
                    activeTab === "addresses"
                      ? "bg-[#f2efe6] text-[#0e0e0c] font-semibold"
                      : "text-[#3a382f] hover:bg-[#f2efe6]/60 hover:text-[#0e0e0c]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 stroke-current fill-none stroke-[1.6]" viewBox="0 0 24 24">
                      <path d="M3 16V6h11v10" />
                      <path d="M14 10h4l3 3v3h-7" />
                      <circle cx="7" cy="18" r="1.6" />
                      <circle cx="18" cy="18" r="1.6" />
                    </svg>
                    <span>Addresses</span>
                  </div>
                  {addresses.length > 0 && (
                    <span className="font-mono text-[11px] text-[#8f8a7a] bg-white px-1.5 py-0.5 rounded border border-[#e4e0d2]">
                      {addresses.length}
                    </span>
                  )}
                </button>

                {/* Payment methods */}
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] text-[13px] text-[#8f8a7a] cursor-default">
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[1.6]" viewBox="0 0 24 24">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                  <span>Payment methods</span>
                </div>

                <hr className="my-2 border-[#e4e0d2]" />

                {/* Log Out Button */}
                <button
                  id="account-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] text-[13px] text-[#b5482f] hover:bg-[#f7e7e1] transition-colors cursor-pointer font-medium"
                >
                  <svg className="w-4 h-4 stroke-current fill-none stroke-[1.6]" viewBox="0 0 24 24">
                    <path d="M15 3h4v18h-4" />
                    <path d="M10 17l5-5-5-5M15 12H3" />
                  </svg>
                  <span>Log Out</span>
                </button>
              </nav>

              {/* Main Column Content */}
              <div className="space-y-6">
                {activeTab === "profile" ? (
                  /* ================= TAB 1: PROFILE VIEW ================= */
                  <>
                    {/* Profile Card (.profile-card) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 border border-[#e4e0d2] rounded-[14px] bg-white shadow-2xs">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#cfc9b3] to-[#8f8a7a] flex items-center justify-center text-white text-xl font-bold font-['Space_Grotesk'] shadow-2xs shrink-0">
                          {account?.name ? account.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <h3 className="font-['Space_Grotesk'] text-[17px] font-bold text-[#0e0e0c]">
                            {account?.name || "Customer"}
                          </h3>
                          <span className="text-[12.5px] text-[#8f8a7a] block mt-0.5">
                            {account?.email} · Member since {memberYear}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="px-4 py-2 rounded-full border border-[#e4e0d2] text-[12.5px] font-semibold text-[#0e0e0c] hover:bg-[#f2efe6] transition-colors cursor-pointer"
                        >
                          Log Out
                        </button>
                      </div>
                    </div>

                    {/* Saved Addresses Summary Section */}
                    <section id="addresses" className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h2 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#0e0e0c]">
                            Saved addresses
                          </h2>
                          {addresses.length > 0 && (
                            <span className="font-mono text-[11.5px] text-[#8f8a7a]">
                              ({addresses.length})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="text-[12.5px] font-semibold text-[#0e0e0c] bg-[#f2efe6] hover:bg-[#e7c94a]/30 px-3.5 py-1.5 rounded-full border border-[#e4e0d2] transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <span>+</span> Add address
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTabChange("addresses")}
                            className="text-[12px] text-[#8f8a7a] hover:text-[#0e0e0c] hover:underline"
                          >
                            Manage all →
                          </button>
                        </div>
                      </div>

                      {addresses.length > 0 ? (
                        <div className="space-y-3">
                          {addresses.slice(0, 2).map((addr, idx) => (
                            <div
                              key={addr.id || idx}
                              className="border border-[#e4e0d2] rounded-[8px] p-4 bg-white hover:border-[#8f8a7a] transition-colors relative group"
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <b className="text-[13.5px] font-semibold text-[#0e0e0c]">
                                    {addr.full_name || `Address #${idx + 1}`}
                                  </b>
                                  {addr.phone && (
                                    <span className="font-mono text-[11.5px] text-[#8f8a7a]">
                                      · {addr.phone}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(addr)}
                                    className="text-[12px] text-[#0e0e0c] hover:underline px-2 py-0.5 rounded border border-[#e4e0d2] hover:bg-[#f2efe6] transition-colors cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingId(addr.id)}
                                    className="text-[12px] text-[#b5482f] hover:underline px-2 py-0.5 rounded border border-[#e4e0d2] hover:bg-[#f7e7e1] transition-colors cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              <span className="text-[#3a382f] text-[13px] block">
                                {[addr.line1, addr.city, addr.state, addr.pincode]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-[#e4e0d2] rounded-[10px] p-6 text-center bg-[#faf8f4]">
                          <p className="text-[13px] text-[#8f8a7a] mb-3">
                            No saved addresses yet. Addresses provided during checkout will appear here.
                          </p>
                          <button
                            type="button"
                            onClick={handleOpenAddModal}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            <span>+</span> Add your first address
                          </button>
                        </div>
                      )}
                    </section>

                    {/* Recent Orders Section */}
                    <section className="pt-2">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="font-['Space_Grotesk'] text-[15px] font-bold text-[#0e0e0c]">
                          Recent orders
                        </h2>
                        <button
                          type="button"
                          onClick={() => handleTabChange("orders")}
                          className="text-[12.5px] text-[#8f8a7a] hover:text-[#0e0e0c] hover:underline cursor-pointer"
                        >
                          View all orders ({orders.length}) →
                        </button>
                      </div>

                      {orders.length > 0 ? (
                        <div className="border-t border-[#e4e0d2]">
                          {orders.slice(0, 3).map((ord) => (
                            <Link
                              key={ord.id}
                              href={`/orders/${ord.id}`}
                              className="flex items-center justify-between py-3.5 border-b border-[#e4e0d2] hover:bg-[#faf8f4] px-2 -mx-2 rounded transition-colors group"
                            >
                              <div className="flex flex-col">
                                <b className="font-mono text-[12.5px] text-[#0e0e0c] group-hover:underline">
                                  #AV-{String(ord.id).slice(0, 5).toUpperCase()}
                                </b>
                                <span className="text-[11.5px] text-[#8f8a7a] mt-0.5">
                                  Placed {formatDate(ord.created_at)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-[13px] font-semibold text-[#0e0e0c]">
                                  {formatPrice((Number(ord.total_amount) || 0) / 100)}
                                </span>
                                <span
                                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full capitalize ${getStatusBadgeClass(
                                    ord.status
                                  )}`}
                                >
                                  {ord.status || "Processing"}
                                </span>
                                <span className="text-[12px] text-[#8f8a7a] group-hover:text-[#0e0e0c]">
                                  →
                                </span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-[#e4e0d2] rounded-[10px] p-6 text-center bg-[#faf8f4]">
                          <p className="text-[13px] text-[#8f8a7a] mb-2">You haven&apos;t placed any orders yet.</p>
                          <Link
                            href="/products"
                            className="inline-block text-[12.5px] font-semibold text-[#0e0e0c] underline hover:opacity-80"
                          >
                            Explore the collection →
                          </Link>
                        </div>
                      )}

                      {orders.length > 0 && (
                        <div className="pt-3">
                          <button
                            type="button"
                            onClick={() => handleTabChange("orders")}
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#0e0e0c] hover:underline cursor-pointer"
                          >
                            View all orders →
                          </button>
                        </div>
                      )}
                    </section>
                  </>
                ) : activeTab === "orders" ? (
                  /* ================= TAB 2: FULL ORDERS VIEW ================= */
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e4e0d2]">
                      <div>
                        <div className="flex items-center gap-3">
                          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-[#0e0e0c]">
                            Order history
                          </h1>
                          <div className="w-[34px] h-[2px] bg-gradient-to-r from-[#5a5744] from-0% to-transparent to-60% bg-[length:10px_2px] opacity-70" />
                          <span className="font-mono text-[12px] text-[#8f8a7a] bg-[#faf8f4] px-2 py-0.5 rounded-full border border-[#e4e0d2]">
                            {orders.length} {orders.length === 1 ? "order" : "orders"}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#8f8a7a] mt-1">
                          Review your past purchases, view order details, and track shipments.
                        </p>
                      </div>

                      <Link
                        href="/products"
                        className="px-5 py-2.5 rounded-full bg-[#0e0e0c] text-[#f2efe6] text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                      >
                        <span>Explore collection</span>
                        <span>→</span>
                      </Link>
                    </div>

                    {orders.length > 0 ? (
                      <div className="divide-y divide-[#e4e0d2] border border-[#e4e0d2] rounded-[14px] bg-white overflow-hidden shadow-2xs">
                        {orders.map((order) => {
                          const priceInRupees = (Number(order.total_amount) || 0) / 100;
                          const dateDisplay = formatDate(order.created_at);
                          const badgeClass = getStatusBadgeClass(order.status);

                          return (
                            <div
                              key={order.id}
                              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-[#faf8f4] transition-colors"
                            >
                              {/* Left: Order ID and Placement Date */}
                              <div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[15px] font-bold text-[#0e0e0c]">
                                    #AV-{order.id}
                                  </span>
                                  {order.shiprocket_awb && (
                                    <span className="font-mono text-[11px] text-[#8f8a7a] bg-[#f2efe6] px-2 py-0.5 rounded">
                                      AWB: {order.shiprocket_awb}
                                    </span>
                                  )}
                                </div>
                                {dateDisplay && (
                                  <div className="text-[12.5px] text-[#8f8a7a] mt-1">
                                    Placed on {dateDisplay}
                                  </div>
                                )}
                              </div>

                              {/* Right: Price, Status Badge, and View Link */}
                              <div className="flex items-center gap-3 sm:gap-5 shrink-0 self-end sm:self-auto">
                                <span className="font-mono text-[15px] font-semibold text-[#0e0e0c]">
                                  {formatPrice(priceInRupees)}
                                </span>

                                <span
                                  className={`inline-flex items-center text-[11.5px] px-2.5 py-1 rounded-full font-semibold capitalize tracking-[0.02em] ${badgeClass}`}
                                >
                                  {order.status || "Processing"}
                                </span>

                                <Link
                                  href={`/orders/${order.id}`}
                                  className="px-4 py-1.5 rounded-full text-[12.5px] font-semibold border border-[#e4e0d2] bg-white text-[#0e0e0c] hover:border-[#0e0e0c] hover:bg-[#faf8f4] transition-colors shadow-2xs"
                                >
                                  View details
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Empty Orders State */
                      <div className="border border-dashed border-[#e4e0d2] rounded-[14px] p-12 text-center bg-[#faf8f4]">
                        <div className="w-14 h-14 rounded-full bg-white border border-[#e4e0d2] flex items-center justify-center mx-auto mb-4 shadow-2xs">
                          <svg className="w-6 h-6 stroke-[#8f8a7a] fill-none stroke-[1.6]" viewBox="0 0 24 24">
                            <path d="M4 4h16v16H4z" />
                            <path d="M4 9h16M9 4v16" />
                          </svg>
                        </div>
                        <h3 className="font-['Space_Grotesk'] font-bold text-[18px] text-[#0e0e0c] mb-2">
                          No orders yet
                        </h3>
                        <p className="text-[13px] text-[#8f8a7a] mb-6 max-w-sm mx-auto leading-relaxed">
                          You haven&apos;t placed any orders yet. Discover our collection of handcrafted footwear.
                        </p>
                        <Link
                          href="/products"
                          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity shadow-xs"
                        >
                          <span>Explore collection</span>
                          <span>→</span>
                        </Link>
                      </div>
                    )}

                    <div className="pt-4 border-t border-[#e4e0d2]">
                      <button
                        type="button"
                        onClick={() => handleTabChange("profile")}
                        className="text-[13px] text-[#8f8a7a] hover:text-[#0e0e0c] font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>←</span> Back to profile
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ================= TAB 3: ADDRESSES DEDICATED VIEW ================= */
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e4e0d2]">
                      <div>
                        <div className="flex items-center gap-3">
                          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold text-[#0e0e0c]">
                            Saved Addresses
                          </h1>
                          <span className="font-mono text-[12px] text-[#8f8a7a] bg-[#faf8f4] px-2 py-0.5 rounded-full border border-[#e4e0d2]">
                            {addresses.length} {addresses.length === 1 ? "address" : "addresses"}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#8f8a7a] mt-1">
                          Manage your shipping and billing addresses for fast and seamless checkout.
                        </p>
                      </div>

                      <button
                        type="button"
                        id="btn-add-address"
                        onClick={handleOpenAddModal}
                        className="px-5 py-2.5 rounded-full bg-[#0e0e0c] text-[#f2efe6] text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-xs cursor-pointer shrink-0"
                      >
                        <span className="text-base leading-none">+</span>
                        <span>Add new address</span>
                      </button>
                    </div>

                    {/* Addresses Grid / List */}
                    {addresses.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {addresses.map((addr, idx) => (
                          <div
                            key={addr.id || idx}
                            className="border border-[#e4e0d2] rounded-[12px] p-5 bg-white hover:border-[#8f8a7a] transition-all shadow-2xs relative group"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-[#f2efe6] flex items-center justify-center text-[12px] font-mono text-[#0e0e0c] font-bold">
                                  {idx + 1}
                                </span>
                                <div>
                                  <b className="text-[14.5px] font-semibold text-[#0e0e0c] block">
                                    {addr.full_name || "Shipping Address"}
                                  </b>
                                  {addr.phone && (
                                    <span className="font-mono text-[12px] text-[#8f8a7a]">
                                      Phone: {addr.phone}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons: Edit & Delete */}
                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditModal(addr)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12.5px] font-medium text-[#0e0e0c] border border-[#e4e0d2] hover:bg-[#f2efe6] transition-colors cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingId(addr.id)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12.5px] font-medium text-[#b5482f] border border-[#ebd0c7] bg-[#fdf8f6] hover:bg-[#f7e7e1] transition-colors cursor-pointer"
                                >
                                  <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[1.8]" viewBox="0 0 24 24">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  <span>Delete</span>
                                </button>
                              </div>
                            </div>

                            <p className="text-[13.5px] text-[#3a382f] pl-0 sm:pl-11 leading-relaxed">
                              {[addr.line1, addr.city, addr.state, addr.pincode]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-[#e4e0d2] rounded-[14px] p-12 text-center bg-[#faf8f4]">
                        <div className="w-12 h-12 rounded-full bg-white border border-[#e4e0d2] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                          <svg className="w-6 h-6 stroke-[#8f8a7a] fill-none stroke-[1.6]" viewBox="0 0 24 24">
                            <path d="M3 16V6h11v10" />
                            <path d="M14 10h4l3 3v3h-7" />
                            <circle cx="7" cy="18" r="1.6" />
                            <circle cx="18" cy="18" r="1.6" />
                          </svg>
                        </div>
                        <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#0e0e0c] mb-1">
                          No saved addresses
                        </h3>
                        <p className="text-[13px] text-[#8f8a7a] max-w-sm mx-auto mb-5">
                          You haven&apos;t added any addresses yet. Add an address now to speed up your future checkouts.
                        </p>
                        <button
                          type="button"
                          onClick={handleOpenAddModal}
                          className="px-5 py-2.5 rounded-full bg-[#0e0e0c] text-[#f2efe6] text-[13px] font-semibold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                        >
                          + Add new address
                        </button>
                      </div>
                    )}

                    <div className="pt-4 border-t border-[#e4e0d2]">
                      <button
                        type="button"
                        onClick={() => handleTabChange("profile")}
                        className="text-[13px] text-[#8f8a7a] hover:text-[#0e0e0c] font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>←</span> Back to profile
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= ADD / EDIT ADDRESS MODAL ================= */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-[#e4e0d2] shadow-2xl max-w-lg w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#e4e0d2] mb-5">
              <h2 className="font-['Space_Grotesk'] text-lg font-bold text-[#0e0e0c]">
                {editingAddress ? "Edit address" : "Add new address"}
              </h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-7 h-7 rounded-full flex items-center justify-center text-[#8f8a7a] hover:text-[#0e0e0c] hover:bg-[#f2efe6] transition-colors cursor-pointer text-base font-mono"
              >
                ✕
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="p-3 mb-4 bg-[#f7e7e1] border border-[#ebd0c7] text-[#b5482f] text-[12.5px] rounded-[8px]">
                {formError}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveAddress} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.fullName}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, fullName: e.target.value })
                    }
                    placeholder="e.g. Marcus Reyes"
                    className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#0e0e0c] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addressFormData.phone}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, phone: e.target.value })
                    }
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#0e0e0c] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  value={addressFormData.line1}
                  onChange={(e) =>
                    setAddressFormData({ ...addressFormData, line1: e.target.value })
                  }
                  placeholder="e.g. 482 Kestrel Lane, Suite 3"
                  className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#0e0e0c] transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.city}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, city: e.target.value })
                    }
                    placeholder="e.g. Austin / Hyderabad"
                    className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#0e0e0c] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.state}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, state: e.target.value })
                    }
                    placeholder="e.g. Texas / Telangana"
                    className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#0e0e0c] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                    PIN code *
                  </label>
                  <input
                    type="text"
                    required
                    value={addressFormData.pincode}
                    onChange={(e) =>
                      setAddressFormData({ ...addressFormData, pincode: e.target.value })
                    }
                    placeholder="e.g. 500081"
                    className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-[#faf8f4] focus:bg-white focus:outline-none focus:border-[#0e0e0c] transition-colors"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e4e0d2]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-full border border-[#e4e0d2] text-[13px] font-semibold text-[#3a382f] hover:bg-[#f2efe6] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2 rounded-full bg-[#0e0e0c] text-[#f2efe6] text-[13px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>{editingAddress ? "Update address" : "Save address"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[16px] border border-[#e4e0d2] shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-11 h-11 rounded-full bg-[#f7e7e1] text-[#b5482f] flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="font-['Space_Grotesk'] text-base font-bold text-[#0e0e0c] mb-1">
              Delete address?
            </h3>
            <p className="text-[12.5px] text-[#8f8a7a] mb-5">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full border border-[#e4e0d2] text-[12.5px] font-semibold text-[#3a382f] hover:bg-[#f2efe6] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAddress(deletingId)}
                disabled={isDeleting}
                className="px-5 py-2 rounded-full bg-[#b5482f] text-white text-[12.5px] font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isDeleting && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-[#e4e0d2] py-8 text-center text-[12px] text-[#8f8a7a] bg-[#faf8f4] mt-16">
        <p>© {new Date().getFullYear()} AVEN Footwear. All rights reserved.</p>
      </footer>
    </main>
  );
}
