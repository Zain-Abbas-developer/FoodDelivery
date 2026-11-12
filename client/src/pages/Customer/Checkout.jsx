import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaCreditCard,
  FaCalendar,
  FaShoppingBag,
  FaCheckCircle,
  FaTag,
  FaMotorcycle,
  FaArrowLeft,
  FaUser,
  FaShieldAlt,
} from "react-icons/fa";

import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

import axios from "axios";
import toast from "react-hot-toast";
import LiveLocationMap from "../../components/LiveLocationMap";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const paymentMethods = [
  {
    value: "cod",
    label: "Cash on Delivery",
    description: "Pay when your order arrives",
  },
  { value: "jazzcash", label: "JazzCash", description: "Pay using JazzCash" },
  {
    value: "easypaisa",
    label: "EasyPaisa",
    description: "Pay using EasyPaisa",
  },
  { value: "stripe", label: "Stripe", description: "Online card payment" },
];

const tips = [0, 50, 100, 200];

const formatPrice = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString("en-PK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const Checkout = () => {
  const { cart, getTotal, clearCart, restaurantId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [promoLoading, setPromoLoading] = useState(false);

  const [restaurant, setRestaurant] = useState(null);
  const [discount, setDiscount] = useState(0);
  const [mobileSummary, setMobileSummary] = useState(false);

  const [formData, setFormData] = useState({
    deliveryAddress: {
      street: "",
      city: "",
      province: "",
      postalCode: "",
      coordinates: {
        lat: 0,
        lng: 0,
      },
    },
    paymentMethod: "cod",
    promoCode: "",
    tip: 0,
    scheduledTime: "",
  });

  // Redirect if cart is empty or restaurant is missing
  useEffect(() => {
    if (cart.length === 0) {
      navigate("/customer", { replace: true });
      return;
    }

    if (!restaurantId) {
      toast.error("No restaurant selected");
      navigate("/customer", { replace: true });
    }
  }, [cart.length, restaurantId, navigate]);

  // Fetch restaurant details
  useEffect(() => {
    if (!restaurantId || cart.length === 0) return;

    const controller = new AbortController();

    const fetchRestaurant = async () => {
      try {
        setRestaurantLoading(true);

        const token = localStorage.getItem("token");

        const response = await axios.get(
          `${API_URL}/customer/restaurants/${restaurantId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        setRestaurant(response.data);
      } catch (error) {
        if (error.name !== "CanceledError" && error.name !== "AbortError") {
          console.error("Restaurant fetch error:", error);
          toast.error("Failed to load restaurant details");
        }
      } finally {
        if (!controller.signal.aborted) {
          setRestaurantLoading(false);
        }
      }
    };

    fetchRestaurant();

    return () => controller.abort();
  }, [restaurantId]);

  // Get customer location
  useEffect(() => {
    const defaultCoords = {
      lat: 31.5204,
      lng: 74.3587,
    };

    const updateCoordinates = (coordinates) => {
      setFormData((prev) => ({
        ...prev,
        deliveryAddress: {
          ...prev.deliveryAddress,
          coordinates,
        },
      }));
    };

    if (!navigator.geolocation) {
      updateCoordinates(defaultCoords);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        updateCoordinates(defaultCoords);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  }, []);

  // Calculate order totals
  const subtotal = Number(getTotal()) || 0;
  const deliveryFee = Number(restaurant?.deliveryFee) || 0;
  const tip = Number(formData.tip) || 0;

  const total = Math.max(0, subtotal + deliveryFee + tip - discount);

  const totalQuantity = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cart],
  );

  // Update delivery address fields
  const updateAddress = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      deliveryAddress: {
        ...prev.deliveryAddress,
        [field]: value,
      },
    }));
  };

  // Verify promo code
  const handleVerifyPromo = async () => {
    const code = formData.promoCode.trim();

    if (!code) {
      toast.error("Please enter a promo code");
      return;
    }

    try {
      setPromoLoading(true);

      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_URL}/customer/verify-promo`,
        {
          code,
          orderAmount: subtotal,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const verifiedDiscount = Number(response.data.discount);

      if (!Number.isFinite(verifiedDiscount) || verifiedDiscount < 0) {
        throw new Error("Invalid discount returned by server");
      }

      setDiscount(verifiedDiscount);
      toast.success("Promo code applied successfully!");
    } catch (error) {
      console.error("Promo verification error:", error);

      setDiscount(0);

      toast.error(
        error.response?.data?.message || error.message || "Invalid promo code",
      );
    } finally {
      setPromoLoading(false);
    }
  };

  // Place order
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!cart.length || !restaurantId) {
      toast.error("Your cart is empty");
      return;
    }

    const address = formData.deliveryAddress;

    if (
      !address.street.trim() ||
      !address.city.trim() ||
      !address.province.trim() ||
      !address.postalCode.trim()
    ) {
      toast.error("Please complete your delivery address");
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const orderData = {
        restaurantId,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId || item._id,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          street: address.street.trim(),
          city: address.city.trim(),
          province: address.province.trim(),
          postalCode: address.postalCode.trim(),
          coordinates: address.coordinates,
        },
        paymentMethod: formData.paymentMethod || "cod",
        tip: Number(formData.tip) || 0,
      };

      if (formData.promoCode.trim()) {
        orderData.promoCode = formData.promoCode.trim();
      }

      if (formData.scheduledTime) {
        orderData.scheduledTime = formData.scheduledTime;
      }

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const orderId = response.data._id;

      if (!orderId) {
        throw new Error("Order was created but no order ID was returned");
      }

      clearCart();

      toast.success("Order placed successfully!");

      // Navigate to customer dashboard tracking route
      navigate(`/customer/orders/${orderId}/track`, {
        replace: true,
      });
    } catch (error) {
      console.error("Order placement error:", error);

      let errorMessage = "Failed to place order";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (
        Array.isArray(error.response?.data?.errors) &&
        error.response.data.errors.length > 0
      ) {
        errorMessage = error.response.data.errors
          .map((err) => err.msg)
          .join(", ");
      } else if (error.response?.status === 401) {
        errorMessage = "Please log in again";
      } else if (error.response?.status === 403) {
        errorMessage = "You are not authorized to place orders";
      } else if (error.response?.status === 404) {
        errorMessage = "Restaurant not found";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!cart.length || !restaurantId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 dark:bg-gray-950 sm:py-10">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/customer")}
            className="mb-5 flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-primary-500 dark:text-gray-400"
          >
            <FaArrowLeft />
            Back to Restaurants
          </button>

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-2 text-sm font-semibold text-primary-500">
                ORDER PLACEMENT
              </p>

              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Checkout
              </h1>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Complete your details to place your order.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <FaUser />
              </div>

              <div>
                <p className="text-xs text-gray-400">Ordering as</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {user?.name || "Customer"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Checkout Layout */}
        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* Checkout Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Delivery Address */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-7"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <FaMapMarkerAlt />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Delivery Address
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Street Address
                  </label>

                  <input
                    type="text"
                    placeholder="House number, street, area..."
                    value={formData.deliveryAddress.street}
                    onChange={(e) => updateAddress("street", e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      City
                    </label>

                    <input
                      type="text"
                      placeholder="Your city"
                      value={formData.deliveryAddress.city}
                      onChange={(e) => updateAddress("city", e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold">
                      Province
                    </label>

                    <input
                      type="text"
                      placeholder="Your province"
                      value={formData.deliveryAddress.province}
                      onChange={(e) =>
                        updateAddress("province", e.target.value)
                      }
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Postal Code
                  </label>

                  <input
                    type="text"
                    placeholder="Postal code"
                    value={formData.deliveryAddress.postalCode}
                    onChange={(e) =>
                      updateAddress("postalCode", e.target.value)
                    }
                    className="input-field"
                    required
                  />
                </div>

                {/* Live Location Map */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 dark:bg-gray-800">
                    <FaMapMarkerAlt className="text-primary-500" />
                    <span className="text-sm font-semibold">
                      Delivery Location
                    </span>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-800">
                    <LiveLocationMap
                      customerLocation={
                        formData.deliveryAddress.coordinates?.lat
                          ? {
                              lat: formData.deliveryAddress.coordinates.lat,
                              lng: formData.deliveryAddress.coordinates.lng,
                              updatedAt: new Date(),
                            }
                          : null
                      }
                      riderLocation={null}
                      deliveryAddress={formData.deliveryAddress}
                      isConnected={false}
                      isCheckout={true}
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Payment Method */}
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-7"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <FaCreditCard />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Payment Method
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Choose how you want to pay.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const active = formData.paymentMethod === method.value;

                  return (
                    <label
                      key={method.value}
                      className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${
                        active
                          ? "border-primary-500 bg-primary-50/60 dark:bg-primary-500/10"
                          : "border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.value}
                        checked={active}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentMethod: e.target.value,
                          }))
                        }
                        className="h-4 w-4 accent-primary-500"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {method.label}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {method.description}
                        </p>
                      </div>

                      {active && <FaCheckCircle className="text-primary-500" />}
                    </label>
                  );
                })}
              </div>
            </motion.section>

            {/* Promo Code */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <FaTag />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Promo Code
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Have a discount code?
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  placeholder="Enter promo code"
                  value={formData.promoCode}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      promoCode: e.target.value,
                    }));
                    setDiscount(0);
                  }}
                  className="input-field flex-1"
                />

                <button
                  type="button"
                  onClick={handleVerifyPromo}
                  disabled={promoLoading}
                  className="btn-secondary min-w-28"
                >
                  {promoLoading ? "Checking..." : "Apply Code"}
                </button>
              </div>

              {discount > 0 && (
                <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-600">
                  <FaCheckCircle />
                  Promo code applied. Discount: {formatPrice(discount)}
                </p>
              )}
            </section>

            {/* Rider Tip */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <FaMotorcycle />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Tip for Rider
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Add an optional tip for your delivery rider.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {tips.map((amount) => {
                  const active = formData.tip === amount;

                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          tip: amount,
                        }))
                      }
                      className={`rounded-xl border py-3 text-sm font-semibold transition ${
                        active
                          ? "border-primary-500 bg-primary-500 text-white"
                          : "border-gray-200 bg-white text-gray-600 hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      }`}
                    >
                      {amount === 0 ? "No Tip" : `Rs. ${amount}`}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Schedule Order */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <FaCalendar />
                </div>

                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">
                    Schedule Your Order
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Optional: Select a preferred delivery time.
                  </p>
                </div>
              </div>

              <input
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    scheduledTime: e.target.value,
                  }))
                }
                className="input-field"
              />
            </section>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || restaurantLoading}
              className="btn-primary flex w-full items-center justify-center gap-3 py-4 text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Placing Your Order..."
                : `Place Order · ${formatPrice(total)}`}
            </button>

            <p className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <FaShieldAlt />
              Your order details are submitted securely.
            </p>
          </form>

          {/* Desktop Order Summary */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Order Summary
                </h2>

                <span className="rounded-lg bg-primary-50 px-3 py-1 text-xs font-bold text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  {totalQuantity} Items
                </span>
              </div>

              {restaurantLoading ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  Loading restaurant...
                </p>
              ) : (
                restaurant && (
                  <div className="mb-5 flex items-center gap-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                    {restaurant.image ? (
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-200 text-gray-500 dark:bg-gray-700">
                        <FaShoppingBag />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                        {restaurant.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Your restaurant
                      </p>
                    </div>
                  </div>
                )
              )}

              <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                {cart.map((item, index) => (
                  <div
                    key={item.menuItemId || item._id || index}
                    className="flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {item.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Quantity: {item.quantity}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                      {formatPrice(
                        Number(item.price || 0) * Number(item.quantity || 0),
                      )}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 border-t border-gray-200 pt-5 text-sm dark:border-gray-800">
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}

                {tip > 0 && (
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Rider Tip</span>
                    <span>{formatPrice(tip)}</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-white">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <FaShieldAlt className="text-green-500" />
                  Order details will be sent securely.
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile Order Summary */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileSummary(!mobileSummary)}
            className="flex w-full items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {totalQuantity} Items · {formatPrice(total)}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mobileSummary ? "Hide order summary" : "View order summary"}
              </p>
            </div>

            <FaShoppingBag className="text-xl text-primary-500" />
          </button>

          {mobileSummary && (
            <div className="mt-4 max-h-60 space-y-3 overflow-y-auto border-t border-gray-200 pt-4 text-sm dark:border-gray-800">
              {cart.map((item, index) => (
                <div
                  key={item.menuItemId || item._id || index}
                  className="flex justify-between gap-3"
                >
                  <span className="text-gray-600 dark:text-gray-300">
                    {item.name} × {item.quantity}
                  </span>

                  <span className="font-semibold">
                    {formatPrice(
                      Number(item.price || 0) * Number(item.quantity || 0),
                    )}
                  </span>
                </div>
              ))}

              <div className="flex justify-between border-t border-gray-200 pt-3 font-bold dark:border-gray-800">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileSummary(!mobileSummary)}
            className="btn-primary mt-3 w-full"
          >
            {mobileSummary ? "Hide Summary" : "Review Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
