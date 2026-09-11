"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { apiFetch, getToken } from "@/lib/apiClient";
import { notifyCartUpdated } from "@/lib/useCartCount";

// SVG glyph for sneaker items
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

// SVG glyph for boot items
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

export default function CheckoutPage() {
  const router = useRouter();

  // Checkout Stepper State (1: Shipping, 2: Payment, 3: Review)
  const [step, setStep] = useState(1);

  // Cart Data
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  // Addresses State
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressLoading, setAddressLoading] = useState(true);

  // New Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState({
    firstName: "",
    lastName: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Payment Method Selection
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" | "upi" | "netbanking"

  // Order & Razorpay Processing States
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // 1. Fetch Addresses
  const fetchAddresses = useCallback(async () => {
    try {
      setAddressLoading(true);
      const res = await apiFetch("/api/addresses");
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.addresses) ? data.addresses : [];
        setAddresses(list);
        if (list.length > 0) {
          // Keep existing selection if valid, or default to first address
          setSelectedAddressId((prev) => {
            if (prev && list.some((a) => a.id === prev)) return prev;
            return list[0].id;
          });
        } else {
          // If no address exists, automatically open form
          setShowAddressForm(true);
        }
      }
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setAddressLoading(false);
    }
  }, []);

  // 2. Fetch Cart
  const fetchCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const res = await apiFetch("/api/cart");
      if (res.ok) {
        const data = await res.json();
        setCartItems(Array.isArray(data.items) ? data.items : []);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Check auth & initial data load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/auth");
      return;
    }
    fetchAddresses();
    fetchCart();
  }, [router, fetchAddresses, fetchCart]);

  // Derived Totals
  const { subtotalRupees, totalRupees } = useMemo(() => {
    const totalPaise = cartItems.reduce((sum, item) => {
      const unitPaise =
        item.price_override !== null && item.price_override !== undefined
          ? Number(item.price_override)
          : Number(item.base_price) || 0;
      return sum + unitPaise * (Number(item.quantity) || 1);
    }, 0);
    const inRupees = totalPaise / 100;
    return {
      subtotalRupees: inRupees,
      totalRupees: inRupees, // Free shipping
    };
  }, [cartItems]);

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || null;
  }, [addresses, selectedAddressId]);

  // Handle Add New Address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressError("");

    const fullName = `${addressFormData.firstName} ${addressFormData.lastName}`.trim();
    if (
      !fullName ||
      !addressFormData.phone ||
      !addressFormData.line1 ||
      !addressFormData.city ||
      !addressFormData.state ||
      !addressFormData.pincode
    ) {
      setAddressError("Please fill in all required address fields.");
      return;
    }

    try {
      setAddressSubmitting(true);
      const res = await apiFetch("/api/addresses", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          phone: addressFormData.phone.trim(),
          line1: addressFormData.line1.trim(),
          city: addressFormData.city.trim(),
          state: addressFormData.state.trim(),
          pincode: addressFormData.pincode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save address");
      }

      // Reset form and refetch
      setAddressFormData({
        firstName: "",
        lastName: "",
        line1: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
      });
      setShowAddressForm(false);
      await fetchAddresses();
      if (data.id) {
        setSelectedAddressId(data.id);
      }
    } catch (err) {
      console.error("Address save error:", err);
      setAddressError(err.message || "Failed to save address");
    } finally {
      setAddressSubmitting(false);
    }
  };

  // Trigger Razorpay Payment (called from Step 3 "Proceed to Payment" or Step 2)
  const handleProceedToPayment = async () => {
    if (!selectedAddressId) {
      setPaymentError("Please select a shipping address before proceeding.");
      setStep(1);
      return;
    }

    setPaymentError("");
    setProcessingPayment(true);

    try {
      // 1. Create order on backend
      const createRes = await apiFetch("/api/checkout/create-order", {
        method: "POST",
        body: JSON.stringify({ addressId: selectedAddressId }),
      });

      const orderData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(orderData.error || "Failed to create checkout order.");
      }

      const { razorpayOrderId, amount, keyId, addressId } = orderData;

      // 2. Ensure Razorpay checkout script is loaded
      if (typeof window === "undefined" || !window.Razorpay) {
        throw new Error(
          "Payment gateway is loading. Please check your internet connection and try again."
        );
      }

      // 3. Open Razorpay modal
      const options = {
        key: keyId,
        amount: amount,
        currency: "INR",
        name: "AVEN Footwear",
        description: "Secure Order Checkout",
        order_id: razorpayOrderId,
        prefill: {
          name: selectedAddress?.full_name || "",
          contact: selectedAddress?.phone || "",
        },
        theme: {
          color: "#0e0e0c",
        },
        modal: {
          ondismiss: function () {
            setProcessingPayment(false);
          },
        },
        handler: async function (response) {
          try {
            setProcessingPayment(true);
            // 4. Verify payment on backend
            const verifyRes = await apiFetch("/api/checkout/verify", {
              method: "POST",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                addressId: addressId,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }

            // Sync cart count
            notifyCartUpdated();

            // Redirect to confirmation
            router.push(`/order-confirmation/${verifyData.orderId}`);
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            setPaymentError(
              verifyErr.message ||
                "Payment was processed but verification failed. Please contact support."
            );
            setProcessingPayment(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        setPaymentError(
          response.error?.description || "Payment was declined or cancelled. Please try again."
        );
        setProcessingPayment(false);
      });

      rzp.open();
    } catch (err) {
      console.error("Checkout initiation error:", err);
      setPaymentError(err.message || "An unexpected error occurred. Please try again.");
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f2efe6] text-[#0e0e0c] font-['Inter',sans-serif]">
      {/* Load Razorpay script via Next.js <Script> component */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />

      <div className="max-w-[1180px] mx-auto pt-6 pb-16 px-4 sm:px-6">
        <div className="bg-white rounded-[22px] shadow-[0_20px_60px_-30px_rgba(14,14,12,0.35)] border border-[#e4e0d2] overflow-hidden">
          {/* Top Bar matching reference */}
          <div className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-[#e4e0d2]">
            <Link
              href="/"
              className="font-['Space_Grotesk'] font-bold text-[20px] tracking-[0.01em] text-[#0e0e0c]"
            >
              AVEN
            </Link>
            <span className="text-[12px] text-[#8f8a7a] flex items-center gap-1.5 font-medium">
              <svg className="w-3.5 h-3.5 stroke-current fill-none stroke-[2]" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Secure checkout
            </span>
            <Link
              href="/cart"
              className="text-[12.5px] underline text-[#3a382f] hover:text-[#0e0e0c] transition-colors"
            >
              ← Back to cart
            </Link>
          </div>

          {/* Stepper matching reference */}
          <div className="flex items-center px-6 sm:px-10 pt-6 pb-2">
            {/* Step 1: Shipping */}
            <div
              onClick={() => setStep(1)}
              className={`flex items-center gap-2.5 text-[13px] cursor-pointer transition-colors ${
                step === 1
                  ? "text-[#0e0e0c] font-semibold"
                  : step > 1
                  ? "text-[#0e0e0c] font-medium"
                  : "text-[#8f8a7a]"
              }`}
            >
              <div
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center font-mono text-[11.5px] border transition-colors ${
                  step > 1
                    ? "bg-[#0e0e0c] text-[#f2efe6] border-[#0e0e0c]"
                    : step === 1
                    ? "bg-[#0e0e0c] text-[#f2efe6] border-[#0e0e0c]"
                    : "border-[#e4e0d2] text-[#8f8a7a]"
                }`}
              >
                {step > 1 ? "✓" : "1"}
              </div>
              <span>Shipping</span>
            </div>

            <div className="flex-1 h-[1px] bg-[#e4e0d2] mx-3 sm:mx-4" />

            {/* Step 2: Payment */}
            <div
              onClick={() => {
                if (selectedAddressId) setStep(2);
              }}
              className={`flex items-center gap-2.5 text-[13px] ${
                selectedAddressId ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              } transition-colors ${
                step === 2
                  ? "text-[#0e0e0c] font-semibold"
                  : step > 2
                  ? "text-[#0e0e0c] font-medium"
                  : "text-[#8f8a7a]"
              }`}
            >
              <div
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center font-mono text-[11.5px] border transition-colors ${
                  step > 2
                    ? "bg-[#0e0e0c] text-[#f2efe6] border-[#0e0e0c]"
                    : step === 2
                    ? "bg-[#0e0e0c] text-[#f2efe6] border-[#0e0e0c]"
                    : "border-[#e4e0d2] text-[#8f8a7a]"
                }`}
              >
                {step > 2 ? "✓" : "2"}
              </div>
              <span>Payment</span>
            </div>

            <div className="flex-1 h-[1px] bg-[#e4e0d2] mx-3 sm:mx-4" />

            {/* Step 3: Review */}
            <div
              onClick={() => {
                if (selectedAddressId) setStep(3);
              }}
              className={`flex items-center gap-2.5 text-[13px] ${
                selectedAddressId ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              } transition-colors ${
                step === 3 ? "text-[#0e0e0c] font-semibold" : "text-[#8f8a7a]"
              }`}
            >
              <div
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center font-mono text-[11.5px] border transition-colors ${
                  step === 3
                    ? "bg-[#0e0e0c] text-[#f2efe6] border-[#0e0e0c]"
                    : "border-[#e4e0d2] text-[#8f8a7a]"
                }`}
              >
                3
              </div>
              <span>Review</span>
            </div>
          </div>

          {/* Main Checkout Layout: Left Column Forms, Right Column Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 sm:gap-10 p-6 sm:p-10">
            {/* Left Column */}
            <div>
              {/* Payment Error Alert Banner */}
              {paymentError && (
                <div className="mb-6 p-4 rounded-[12px] bg-[#f7e7e1] border border-[#f0c2b4] text-[#b5482f] flex items-start gap-3 text-[13px]">
                  <svg className="w-5 h-5 shrink-0 stroke-current fill-none stroke-[2] mt-0.5" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-semibold mb-0.5">Payment notice</p>
                    <p>{paymentError}</p>
                    <button
                      type="button"
                      onClick={() => setPaymentError("")}
                      className="mt-2 text-[12px] underline font-medium hover:opacity-80"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------- STEP 1: SHIPPING ADDRESS -------------------- */}
              {step === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="font-['Space_Grotesk'] text-[18px] sm:text-[20px] font-bold text-[#0e0e0c]">
                      Shipping address
                    </h2>
                    {addresses.length > 0 && !showAddressForm && (
                      <button
                        type="button"
                        onClick={() => setShowAddressForm(true)}
                        className="text-[12.5px] font-semibold text-[#0e0e0c] hover:underline flex items-center gap-1"
                      >
                        + Add new address
                      </button>
                    )}
                  </div>

                  {addressLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center">
                      <div className="w-7 h-7 border-2 border-[#0e0e0c] border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="font-mono text-[12.5px] text-[#8f8a7a]">Loading saved addresses...</p>
                    </div>
                  ) : (
                    <>
                      {/* Saved Addresses List */}
                      {addresses.length > 0 && (
                        <div className="space-y-3 mb-6">
                          {addresses.map((addr) => {
                            const isSelected = selectedAddressId === addr.id;
                            return (
                              <div
                                key={addr.id}
                                onClick={() => setSelectedAddressId(addr.id)}
                                className={`p-4 sm:p-4.5 rounded-[12px] border cursor-pointer transition-all ${
                                  isSelected
                                    ? "border-[#0e0e0c] bg-[#faf8f4] shadow-xs"
                                    : "border-[#e4e0d2] hover:border-[#8f8a7a] bg-white"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="radio"
                                      name="selectedAddress"
                                      checked={isSelected}
                                      onChange={() => setSelectedAddressId(addr.id)}
                                      className="mt-1 accent-[#0e0e0c] cursor-pointer"
                                    />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[14px] text-[#0e0e0c]">
                                          {addr.full_name}
                                        </span>
                                        <span className="font-mono text-[12px] text-[#8f8a7a]">
                                          {addr.phone}
                                        </span>
                                      </div>
                                      <p className="text-[13px] text-[#3a382f] mt-1 leading-relaxed">
                                        {addr.line1}, {addr.city}, {addr.state} - {addr.pincode}
                                      </p>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#0e0e0c] text-white shrink-0">
                                      Deliver here
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add New Address Form */}
                      {showAddressForm && (
                        <form
                          onSubmit={handleSaveAddress}
                          className="bg-[#faf8f4] border border-[#e4e0d2] rounded-[14px] p-5 sm:p-6 mb-6"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-[14px] text-[#0e0e0c]">
                              Add a new shipping address
                            </h3>
                            {addresses.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAddressForm(false);
                                  setAddressError("");
                                }}
                                className="text-[12px] text-[#8f8a7a] hover:text-[#0e0e0c] underline"
                              >
                                Cancel
                              </button>
                            )}
                          </div>

                          {addressError && (
                            <p className="text-[12px] text-[#b5482f] mb-4 bg-[#f7e7e1] p-2.5 rounded-[8px]">
                              {addressError}
                            </p>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                            <div>
                              <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                                First name *
                              </label>
                              <input
                                type="text"
                                required
                                value={addressFormData.firstName}
                                onChange={(e) =>
                                  setAddressFormData({ ...addressFormData, firstName: e.target.value })
                                }
                                placeholder="Marcus"
                                className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white focus:outline-none focus:border-[#0e0e0c]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                                Last name *
                              </label>
                              <input
                                type="text"
                                required
                                value={addressFormData.lastName}
                                onChange={(e) =>
                                  setAddressFormData({ ...addressFormData, lastName: e.target.value })
                                }
                                placeholder="Reyes"
                                className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white focus:outline-none focus:border-[#0e0e0c]"
                              />
                            </div>
                          </div>

                          <div className="mb-3.5">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                              Address (Street, House/Flat No.) *
                            </label>
                            <input
                              type="text"
                              required
                              value={addressFormData.line1}
                              onChange={(e) =>
                                setAddressFormData({ ...addressFormData, line1: e.target.value })
                              }
                              placeholder="482 Kestrel Lane, Apartment 4B"
                              className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white focus:outline-none focus:border-[#0e0e0c]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-3.5">
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
                                placeholder="Austin / Mumbai"
                                className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white focus:outline-none focus:border-[#0e0e0c]"
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
                                placeholder="Texas / Maharashtra"
                                className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white focus:outline-none focus:border-[#0e0e0c]"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                                PIN / ZIP code *
                              </label>
                              <input
                                type="text"
                                required
                                value={addressFormData.pincode}
                                onChange={(e) =>
                                  setAddressFormData({ ...addressFormData, pincode: e.target.value })
                                }
                                placeholder="78701 / 400001"
                                className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white focus:outline-none focus:border-[#0e0e0c]"
                              />
                            </div>
                          </div>

                          <div className="mb-5">
                            <label className="block text-[11px] uppercase tracking-[0.08em] text-[#8f8a7a] mb-1.5 font-medium">
                              Phone number *
                            </label>
                            <input
                              type="tel"
                              required
                              value={addressFormData.phone}
                              onChange={(e) =>
                                setAddressFormData({ ...addressFormData, phone: e.target.value })
                              }
                              placeholder="+91 9876543210"
                              className="w-full px-3.5 py-2.5 border border-[#e4e0d2] rounded-[8px] text-[13.5px] bg-white focus:outline-none focus:border-[#0e0e0c]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={addressSubmitting}
                            className="px-6 py-2.5 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            {addressSubmitting ? "Saving address..." : "Save & deliver here"}
                          </button>
                        </form>
                      )}

                      {/* Step 1 Actions */}
                      <div className="flex justify-end pt-4 border-t border-[#e4e0d2]">
                        <button
                          type="button"
                          disabled={!selectedAddressId || cartItems.length === 0}
                          onClick={() => setStep(2)}
                          className="px-7 py-3 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          <span>Continue to payment</span>
                          <span>→</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* -------------------- STEP 2: PAYMENT METHOD -------------------- */}
              {step === 2 && (
                <div>
                  <h2 className="font-['Space_Grotesk'] text-[18px] sm:text-[20px] font-bold text-[#0e0e0c] mb-5">
                    Payment method
                  </h2>

                  {/* Payment Options Selector matching reference */}
                  <div className="grid grid-cols-3 gap-2.5 mb-6">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-3.5 text-center text-[13px] font-medium rounded-[8px] border transition-all ${
                        paymentMethod === "card"
                          ? "border-[#0e0e0c] bg-[#f2efe6] text-[#0e0e0c] font-semibold shadow-2xs"
                          : "border-[#e4e0d2] text-[#3a382f] hover:border-[#8f8a7a]"
                      }`}
                    >
                      Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("upi")}
                      className={`p-3.5 text-center text-[13px] font-medium rounded-[8px] border transition-all ${
                        paymentMethod === "upi"
                          ? "border-[#0e0e0c] bg-[#f2efe6] text-[#0e0e0c] font-semibold shadow-2xs"
                          : "border-[#e4e0d2] text-[#3a382f] hover:border-[#8f8a7a]"
                      }`}
                    >
                      UPI / QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("netbanking")}
                      className={`p-3.5 text-center text-[13px] font-medium rounded-[8px] border transition-all ${
                        paymentMethod === "netbanking"
                          ? "border-[#0e0e0c] bg-[#f2efe6] text-[#0e0e0c] font-semibold shadow-2xs"
                          : "border-[#e4e0d2] text-[#3a382f] hover:border-[#8f8a7a]"
                      }`}
                    >
                      NetBanking
                    </button>
                  </div>

                  {/* Razorpay Integration Notice Box */}
                  <div className="border border-[#e4e0d2] rounded-[12px] p-5 mb-6 bg-[#faf8f4]">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-7 h-7 rounded-full bg-[#e7efe3] text-[#3f6b46] flex items-center justify-center font-bold text-[12px]">
                        ✓
                      </div>
                      <h4 className="font-semibold text-[13.5px] text-[#0e0e0c]">
                        Razorpay Secure Checkout
                      </h4>
                    </div>
                    <p className="text-[12.5px] text-[#8f8a7a] leading-relaxed mb-3">
                      Your payment will be securely processed by Razorpay. All major Credit/Debit
                      Cards (Visa, Mastercard, RuPay), UPI apps (Google Pay, PhonePe, Paytm), and
                      Indian NetBanking are supported.
                    </p>
                    <div className="flex items-center gap-4 text-[11.5px] font-mono text-[#8f8a7a]">
                      <span className="flex items-center gap-1">🔒 256-bit encryption</span>
                      <span>•</span>
                      <span>RBI compliant</span>
                    </div>
                  </div>

                  {/* Step 2 Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#e4e0d2]">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-[#0e0e0c] hover:bg-[#f2efe6] transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-7 py-3 rounded-full text-[13px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity flex items-center gap-1.5"
                    >
                      <span>Review order</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* -------------------- STEP 3: REVIEW & PLACE ORDER -------------------- */}
              {step === 3 && (
                <div>
                  <h2 className="font-['Space_Grotesk'] text-[18px] sm:text-[20px] font-bold text-[#0e0e0c] mb-5">
                    Review &amp; place order
                  </h2>

                  {/* Review Block 1: Shipping to */}
                  <div className="border border-[#e4e0d2] rounded-[10px] p-4.5 mb-3.5 bg-white">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.06em] text-[#8f8a7a] mb-2 font-medium">
                      <span>Shipping to</span>
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-[12px] lowercase tracking-normal text-[#3a382f] hover:text-[#0e0e0c] underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    {selectedAddress ? (
                      <div className="text-[13.5px] text-[#0e0e0c]">
                        <span className="font-semibold">{selectedAddress.full_name}</span> ·{" "}
                        {selectedAddress.line1}, {selectedAddress.city}, {selectedAddress.state}{" "}
                        {selectedAddress.pincode}
                        <div className="text-[12px] text-[#8f8a7a] mt-0.5 font-mono">
                          Ph: {selectedAddress.phone}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[13px] text-[#b5482f]">No address selected.</div>
                    )}
                  </div>

                  {/* Review Block 2: Payment */}
                  <div className="border border-[#e4e0d2] rounded-[10px] p-4.5 mb-3.5 bg-white">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.06em] text-[#8f8a7a] mb-2 font-medium">
                      <span>Payment</span>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="text-[12px] lowercase tracking-normal text-[#3a382f] hover:text-[#0e0e0c] underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="text-[13.5px] text-[#0e0e0c]">
                      Razorpay Gateway ·{" "}
                      <span className="capitalize font-medium">
                        {paymentMethod === "card"
                          ? "Debit / Credit Card"
                          : paymentMethod === "upi"
                          ? "UPI / QR Code"
                          : "NetBanking"}
                      </span>
                    </div>
                  </div>

                  {/* Review Block 3: Delivery */}
                  <div className="border border-[#e4e0d2] rounded-[10px] p-4.5 mb-6 bg-white">
                    <div className="text-[11px] uppercase tracking-[0.06em] text-[#8f8a7a] mb-2 font-medium">
                      Delivery
                    </div>
                    <div className="text-[13.5px] text-[#0e0e0c]">
                      Standard Delivery · Arrives in 3–5 business days
                    </div>
                  </div>

                  {/* Step 3 Actions: Back and Final Trigger */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#e4e0d2]">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={processingPayment}
                      className="px-5 py-2.5 rounded-full text-[13px] font-semibold text-[#0e0e0c] hover:bg-[#f2efe6] transition-colors disabled:opacity-50"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={processingPayment || !selectedAddressId || cartItems.length === 0}
                      className="px-8 py-3.5 rounded-full text-[13.5px] font-semibold bg-[#0e0e0c] text-[#f2efe6] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
                    >
                      {processingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing payment...</span>
                        </>
                      ) : (
                        <span>Proceed to Payment — {formatPrice(totalRupees)}</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Order Summary Card matching reference */}
            <div>
              <div className="bg-[#f2efe6] border border-[#e4e0d2] rounded-[16px] p-6 sticky top-6">
                <h3 className="font-['Space_Grotesk'] font-bold text-[16px] text-[#0e0e0c] mb-3.5">
                  Order summary
                </h3>

                {cartLoading ? (
                  <div className="py-8 text-center text-[12px] font-mono text-[#8f8a7a]">
                    Loading cart items...
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="py-6 text-center text-[13px] text-[#8f8a7a]">
                    Your cart is currently empty.
                  </div>
                ) : (
                  <>
                    {/* Mini Order Items List */}
                    <div className="divide-y divide-[#e4e0d2] max-h-[320px] overflow-y-auto pr-1">
                      {cartItems.map((item) => {
                        const rawPrice =
                          item.price_override !== null && item.price_override !== undefined
                            ? item.price_override
                            : item.base_price;
                        const unitRupees = (Number(rawPrice) || 0) / 100;
                        const lineTotalRupees = unitRupees * (Number(item.quantity) || 1);

                        return (
                          <div
                            key={item.id}
                            className="py-3 flex items-center gap-3 text-[12.5px]"
                          >
                            <div className="w-[52px] h-[52px] rounded-[10px] bg-[#eae5d5] overflow-hidden flex items-center justify-center shrink-0 border border-[#e4e0d2]">
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
                              <p className="font-medium text-[#0e0e0c] truncate">{item.name}</p>
                              <span className="text-[11.5px] text-[#8f8a7a]">
                                Qty {item.quantity} · EU {item.size || "41"}{" "}
                                {item.color ? `· ${item.color}` : ""}
                              </span>
                            </div>
                            <div className="font-mono text-[12.5px] font-semibold text-[#0e0e0c] shrink-0">
                              {formatPrice(lineTotalRupees)}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="pt-3.5 space-y-2.5 border-t border-[#e4e0d2] mt-3">
                      <div className="flex justify-between text-[13px] text-[#3a382f]">
                        <span>Subtotal</span>
                        <span className="font-mono font-medium">{formatPrice(subtotalRupees)}</span>
                      </div>
                      <div className="flex justify-between text-[13px] text-[#3a382f] items-center">
                        <span>Shipping</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#e7efe3] text-[#3f6b46]">
                          Free
                        </span>
                      </div>
                      <div className="flex justify-between text-[15.5px] font-bold text-[#0e0e0c] border-t border-[#e4e0d2] pt-3 mt-2">
                        <span>Total</span>
                        <span className="font-mono">{formatPrice(totalRupees)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
