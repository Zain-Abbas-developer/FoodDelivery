
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaMotorcycle,
  FaCheckCircle,
  FaSignOutAlt,
  FaChartBar,
  FaClipboardList,
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
  FaMapMarkerAlt,
  FaToggleOn,
  FaToggleOff,
  FaWallet,
  FaBox,
  FaArrowRight,
  FaRedo,
  FaClock,
  FaStore,
  FaUser,
  FaHome,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import axios from "axios";
import toast from "react-hot-toast";
import io from "socket.io-client";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);

  const [isAvailable, setIsAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [processingOrder, setProcessingOrder] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { id: "overview", label: "Overview", icon: FaHome },
    { id: "available", label: "Available Orders", icon: FaBox },
    { id: "my-orders", label: "My Deliveries", icon: FaClipboardList },
    { id: "earnings", label: "Earnings", icon: FaChartBar },
  ];

  const getToken = () => localStorage.getItem("token");

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  // Fetch Available Orders
  const fetchAvailableOrders = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser.");
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 15000,
        });
      });

      const response = await axios.get(
        `${API_URL}/rider/available-orders`,
        {
          ...getAuthConfig(),
          params: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
        }
      );

      setAvailableOrders(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Error fetching available orders:", error);

      if (error.code === 1) {
        toast.error("Please allow location access to find nearby orders.");
      }
    }
  }, []);

  // Fetch My Orders
  const fetchMyOrders = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/rider/my-orders`,
        getAuthConfig()
      );

      setMyOrders(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (error) {
      console.error("Error fetching my orders:", error);
    }
  }, []);

  // Fetch Earnings
  const fetchEarnings = useCallback(async () => {
    try {
      const response = await axios.get(
        `${API_URL}/rider/earnings`,
        getAuthConfig()
      );

      setEarnings(response.data);
    } catch (error) {
      console.error("Error fetching earnings:", error);
    }
  }, []);

  // Update Rider Location
  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await axios.post(
            `${API_URL}/rider/update-location`,
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            getAuthConfig()
          );
        } catch (error) {
          console.error("Error updating location:", error);
        }
      },
      (error) => {
        console.error("Location permission/error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  }, []);

  // Initial Data Fetch
  const loadDashboard = useCallback(async () => {
    setLoading(true);

    await Promise.all([
      fetchAvailableOrders(),
      fetchMyOrders(),
      fetchEarnings(),
    ]);

    setLoading(false);
  }, [fetchAvailableOrders, fetchMyOrders, fetchEarnings]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Socket Connection
  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("new-order", () => {
      fetchAvailableOrders();
    });

    return () => {
      socket.off("new-order");
      socket.disconnect();
    };
  }, [fetchAvailableOrders]);

  // Location Updates When Available
  useEffect(() => {
    if (!isAvailable) return;

    updateLocation();

    const interval = setInterval(() => {
      updateLocation();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAvailable, updateLocation]);

  // Refresh Dashboard
  const handleRefresh = async () => {
    setRefreshing(true);

    await Promise.all([
      fetchAvailableOrders(),
      fetchMyOrders(),
      fetchEarnings(),
    ]);

    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  // Change Availability
  const toggleAvailability = async () => {
    if (updatingAvailability) return;

    setUpdatingAvailability(true);

    try {
      const nextAvailability = !isAvailable;

      await axios.post(
        `${API_URL}/rider/update-availability`,
        { isAvailable: nextAvailability },
        getAuthConfig()
      );

      setIsAvailable(nextAvailability);

      toast.success(
        `You are now ${nextAvailability ? "available" : "unavailable"}`
      );

      if (nextAvailability) {
        fetchAvailableOrders();
      }
    } catch (error) {
      console.error("Error updating availability:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update availability"
      );
    } finally {
      setUpdatingAvailability(false);
    }
  };

  // Accept Order
  const handleAcceptOrder = async (orderId) => {
    if (!isAvailable || processingOrder) return;

    setProcessingOrder(orderId);

    try {
      await axios.post(
        `${API_URL}/rider/accept-order`,
        { orderId },
        getAuthConfig()
      );

      toast.success("Order accepted successfully!");

      await Promise.all([
        fetchAvailableOrders(),
        fetchMyOrders(),
      ]);

      setActiveTab("my-orders");
    } catch (error) {
      console.error("Error accepting order:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to accept order"
      );
    } finally {
      setProcessingOrder(null);
    }
  };

  // Update Order Status
  const handleUpdateStatus = async (orderId, status) => {
    if (processingOrder) return;

    setProcessingOrder(orderId);

    try {
      await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        getAuthConfig()
      );

      toast.success("Order status updated!");

      await fetchMyOrders();

      if (status === "delivered") {
        await fetchEarnings();
      }
    } catch (error) {
      console.error("Error updating order status:", error);

      toast.error(
        error.response?.data?.message ||
          "Failed to update order status"
      );
    } finally {
      setProcessingOrder(null);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  const changeTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const formatCurrency = (value) => {
    return `PKR ${Number(value || 0).toLocaleString("en-PK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getStatusLabel = (status) => {
    return (status || "unknown")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusStyle = (status) => {
    const styles = {
      rider_assigned:
        "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
      rider_picked_up:
        "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400",
      on_the_way:
        "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
      delivered:
        "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    };

    return styles[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  };

  const getNextAction = (order) => {
    switch (order.status) {
      case "rider_assigned":
        return {
          label: "Picked Up",
          nextStatus: "rider_picked_up",
        };

      case "rider_picked_up":
        return {
          label: "Start Delivery",
          nextStatus: "on_the_way",
        };

      case "on_the_way":
        return {
          label: "Mark Delivered",
          nextStatus: "delivered",
        };

      default:
        return null;
    }
  };

  const activeDeliveries = myOrders.filter(
    (order) => order.status !== "delivered"
  );

  const totalEarnings = earnings?.totalEarnings ?? 0;
  const totalDeliveries = earnings?.totalDeliveries ?? 0;
  const averageEarning = earnings?.averageEarningPerDelivery ?? 0;

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading rider dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="h-20 px-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <FaMotorcycle className="text-white" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                FoodDelivery
              </h2>
              <p className="text-xs text-gray-400">Rider Panel</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500"
            aria-label="Close sidebar"
          >
            <FaTimes />
          </button>
        </div>

        <div className="px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => changeTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${
                    active
                      ? "bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400"
                      : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  <Icon />
                  {item.label}

                  {item.id === "available" &&
                    availableOrders.length > 0 && (
                      <span className="ml-auto text-xs bg-primary-100 dark:bg-primary-500/20 text-primary-600 rounded-full px-2 py-0.5">
                        {availableOrders.length}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rider Profile */}
        <div className="mt-auto p-5 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "R"}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || "Rider"}
              </p>
              <p className="text-xs text-gray-400">Delivery Partner</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
          >
            <FaSignOutAlt />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 min-h-screen">

        {/* Header */}
        <header className="h-20 sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 px-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 dark:text-gray-300"
              aria-label="Open sidebar"
            >
              <FaBars className="text-xl" />
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {navigation.find((item) => item.id === activeTab)?.label}
              </h1>

              <p className="hidden sm:block text-xs text-gray-400 mt-1">
                Manage your delivery activities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Availability */}
            <button
              onClick={toggleAvailability}
              disabled={updatingAvailability}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition disabled:opacity-60 ${
                isAvailable
                  ? "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              }`}
            >
              {isAvailable ? <FaToggleOn className="text-lg" /> : <FaToggleOff className="text-lg" />}

              <span className="hidden sm:inline">
                {updatingAvailability
                  ? "Updating..."
                  : isAvailable
                    ? "Available"
                    : "Unavailable"}
              </span>
            </button>

            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </button>
          </div>
        </header>

        <main className="p-5 sm:p-8 max-w-7xl mx-auto">

          {/* Overview */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-7"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Welcome back,
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.name || "Rider"}
                  </h2>

                  <p className="text-sm text-gray-500 mt-2">
                    Here's your delivery activity overview.
                  </p>
                </div>

                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <FaRedo className={refreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>

              {/* Availability Card */}
              <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isAvailable
                        ? "bg-green-50 dark:bg-green-500/10 text-green-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}>
                      <FaMotorcycle className="text-xl" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        Your Availability
                      </h3>

                      <p className="text-sm text-gray-500 mt-1">
                        {isAvailable
                          ? "You can receive new delivery requests."
                          : "You are currently not receiving new requests."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={toggleAvailability}
                    disabled={updatingAvailability}
                    className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
                      isAvailable
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        : "bg-primary-600 text-white hover:bg-primary-700"
                    }`}
                  >
                    {updatingAvailability
                      ? "Updating..."
                      : isAvailable
                        ? "Go Unavailable"
                        : "Go Available"}
                  </button>
                </div>
              </section>

              {/* Earnings Statistics */}
              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Earnings Overview
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Your delivery performance.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[
                    {
                      label: "Total Earnings",
                      value: formatCurrency(totalEarnings),
                      icon: FaWallet,
                    },
                    {
                      label: "Total Deliveries",
                      value: totalDeliveries,
                      icon: FaBox,
                    },
                    {
                      label: "Average per Delivery",
                      value: formatCurrency(averageEarning),
                      icon: FaChartBar,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.label}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <p className="text-sm text-gray-500">
                            {item.label}
                          </p>

                          <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                            <Icon className="text-primary-600" />
                          </div>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {item.value}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Delivery Shortcuts */}
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Delivery Management
                </h3>

                <div className="grid sm:grid-cols-2 gap-5">
                  <button
                    onClick={() => changeTab("available")}
                    className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-primary-400 transition group"
                  >
                    <div className="flex justify-between mb-5">
                      <div className="w-11 h-11 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                        <FaBox className="text-primary-600 text-lg" />
                      </div>

                      <FaArrowRight className="text-gray-300 group-hover:text-primary-500" />
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Available Orders
                    </h4>

                    <p className="text-sm text-gray-500">
                      {availableOrders.length} delivery requests available.
                    </p>
                  </button>

                  <button
                    onClick={() => changeTab("my-orders")}
                    className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-primary-400 transition group"
                  >
                    <div className="flex justify-between mb-5">
                      <div className="w-11 h-11 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                        <FaClipboardList className="text-primary-600 text-lg" />
                      </div>

                      <FaArrowRight className="text-gray-300 group-hover:text-primary-500" />
                    </div>

                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      My Deliveries
                    </h4>

                    <p className="text-sm text-gray-500">
                      {activeDeliveries.length} active deliveries.
                    </p>
                  </button>
                </div>
              </section>
            </motion.div>
          )}

          {/* Available Orders */}
          {activeTab === "available" && (
            <section className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    Available Orders
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Nearby delivery requests.
                  </p>
                </div>

                <button
                  onClick={fetchAvailableOrders}
                  className="text-sm text-primary-600 font-semibold flex items-center gap-2"
                >
                  <FaRedo />
                  Refresh
                </button>
              </div>

              {!isAvailable && (
                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-sm text-orange-700 dark:text-orange-400">
                  You are currently unavailable. Go online to accept delivery requests.
                </div>
              )}

              {availableOrders.length > 0 ? (
                <div className="space-y-4">
                  {availableOrders.map((order) => (
                    <motion.div
                      key={order._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="font-bold text-gray-900 dark:text-white">
                              Order #{order.orderNumber}
                            </h3>

                            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              Available
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <FaStore className="text-primary-500" />
                            {order.restaurantId?.name || "Restaurant"}
                          </div>

                          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                            <span>
                              {order.items?.length || 0} item(s)
                            </span>

                            <span>
                              {formatCurrency(order.total)}
                            </span>

                            {order.distance != null && (
                              <span className="flex items-center gap-1">
                                <FaMapMarkerAlt />
                                {Number(order.distance).toFixed(2)} km
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleAcceptOrder(order._id)}
                          disabled={!isAvailable || processingOrder === order._id || processingOrder !== null}
                          className="btn-primary px-5 py-3 disabled:opacity-50"
                        >
                          {processingOrder === order._id
                            ? "Accepting..."
                            : "Accept Order"}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-16 text-center">
                  <FaBox className="text-4xl text-gray-300 mx-auto mb-4" />

                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No available orders
                  </h3>

                  <p className="text-sm text-gray-500">
                    New delivery requests will appear here.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* My Deliveries */}
          {activeTab === "my-orders" && (
            <section className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  My Deliveries
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Track and update your assigned orders.
                </p>
              </div>

              {myOrders.length > 0 ? (
                <div className="space-y-4">
                  {myOrders.map((order) => {
                    const nextAction = getNextAction(order);
                    const busy = processingOrder === order._id;

                    return (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-4">
                              <h3 className="font-bold text-gray-900 dark:text-white">
                                Order #{order.orderNumber}
                              </h3>

                              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${getStatusStyle(order.status)}`}>
                                {getStatusLabel(order.status)}
                              </span>
                            </div>

                            <div className="space-y-3 text-sm text-gray-500">
                              <div className="flex items-center gap-2">
                                <FaStore className="text-primary-500" />
                                {order.restaurantId?.name || "Restaurant"}
                              </div>

                              <div className="flex items-center gap-2">
                                <FaUser className="text-primary-500" />
                                {order.customerId?.name || "Customer"}
                              </div>

                              <div className="flex items-center gap-2">
                                <FaBox className="text-primary-500" />
                                {order.items?.length || 0} item(s)
                                <span>•</span>
                                {formatCurrency(order.total)}
                              </div>
                            </div>
                          </div>

                          {nextAction && (
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  order._id,
                                  nextAction.nextStatus
                                )
                              }
                              disabled={busy || processingOrder !== null}
                              className="btn-primary px-5 py-3 disabled:opacity-50"
                            >
                              {busy ? "Updating..." : nextAction.label}
                            </button>
                          )}

                          {!nextAction && order.status === "delivered" && (
                            <div className="flex items-center gap-2 text-sm text-green-600 font-semibold">
                              <FaCheckCircle />
                              Delivered
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl py-16 text-center">
                  <FaClipboardList className="text-4xl text-gray-300 mx-auto mb-4" />

                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    No deliveries yet
                  </h3>

                  <p className="text-sm text-gray-500">
                    Your accepted orders will appear here.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Earnings */}
          {activeTab === "earnings" && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Earnings Overview
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Review your delivery earnings.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[
                  {
                    label: "Total Earnings",
                    value: formatCurrency(totalEarnings),
                    icon: FaWallet,
                  },
                  {
                    label: "Total Deliveries",
                    value: totalDeliveries,
                    icon: FaBox,
                  },
                  {
                    label: "Average per Delivery",
                    value: formatCurrency(averageEarning),
                    icon: FaChartBar,
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6"
                    >
                      <div className="w-11 h-11 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-5">
                        <Icon className="text-primary-600 text-lg" />
                      </div>

                      <p className="text-sm text-gray-500 mb-2">
                        {item.label}
                      </p>

                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {item.value}
                      </h3>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Earnings Information
                </h3>

                <p className="text-sm text-gray-500 leading-6">
                  Your earnings are based on the delivery records
                  returned by the platform. Completed delivery totals
                  are refreshed after successful order completion.
                </p>
              </div>
            </section>
          )}

        </main>
      </div>
    </div>
  );
};

export default RiderDashboard;
