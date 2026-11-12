
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FaUtensils,
  FaSignOutAlt,
  FaChartBar,
  FaListAlt,
  FaClipboardList,
  FaMoon,
  FaSun,
  FaBars,
  FaTimes,
  FaStore,
  FaMapMarkerAlt,
  FaPhone,
  FaArrowRight,
  FaPlus,
  FaExclamationCircle,
  FaHome,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import axios from "axios";
import toast from "react-hot-toast";

import MenuManagement from "../../components/Restaurant/MenuManagement";
import OrderManagement from "../../components/Restaurant/OrderManagement";
import Analytics from "../../components/Restaurant/Analytics";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const RestaurantDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchError, setFetchError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    location: {
      address: "",
      city: "",
      province: "",
      coordinates: { lat: 0, lng: 0 },
    },
    phone: "",
    description: "",
  });

  const navigation = [
    { id: "overview", label: "Overview", icon: FaHome },
    { id: "menu", label: "Menu Management", icon: FaListAlt },
    { id: "orders", label: "Orders", icon: FaClipboardList },
    { id: "analytics", label: "Analytics", icon: FaChartBar },
  ];

  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");

      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_URL}/restaurant/info`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRestaurant(response.data);
    } catch (error) {
      console.error("Error fetching restaurant:", error);

      if (error.response?.status === 404) {
        setRestaurant(null);
      } else {
        setFetchError(
          error.response?.data?.message ||
            "Unable to load restaurant information."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    if (["address", "city", "province"].includes(name)) {
      setFormData((prev) => ({
        ...prev,
        location: {
          ...prev.location,
          [name]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${API_URL}/restaurant/info`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setRestaurant(response.data);
      setActiveTab("overview");
      toast.success("Restaurant created successfully!");
    } catch (error) {
      console.error("Error creating restaurant:", error);

      toast.error(
        error.response?.data?.errors?.[0]?.msg ||
          error.response?.data?.message ||
          "Failed to create restaurant."
      );
    } finally {
      setSubmitting(false);
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

  const inputClass =
    "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10";

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading restaurant dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Fetch Error
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <div className="max-w-md text-center">
          <FaExclamationCircle className="text-4xl text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Unable to load dashboard
          </h2>
          <p className="text-sm text-gray-500 mb-6">{fetchError}</p>
          <button onClick={fetchRestaurant} className="btn-primary px-6 py-3">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Restaurant Setup
  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <FaUtensils className="text-primary-600 text-xl" />
            <span className="font-bold text-gray-900 dark:text-white">
              FoodDelivery PK
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-sm text-red-500 flex items-center gap-2"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </header>

        <main className="max-w-3xl mx-auto px-5 py-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 sm:p-9 shadow-sm"
          >
            <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-6">
              <FaStore className="text-primary-600 text-2xl" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Set up your restaurant
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              Add your restaurant information to start managing your
              menu and customer orders.
            </p>

            <form onSubmit={handleCreateRestaurant} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className={inputClass}
                  placeholder="e.g. Biryani House"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className={inputClass}
                  placeholder="+92 300 1234567"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className={inputClass}
                  rows={4}
                  placeholder="Tell customers about your restaurant..."
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Restaurant Location
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.location.address}
                      onChange={handleFormChange}
                      className={inputClass}
                      placeholder="Street address"
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.location.city}
                        onChange={handleFormChange}
                        className={inputClass}
                        placeholder="Lahore"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Province
                      </label>
                      <input
                        type="text"
                        name="province"
                        value={formData.location.province}
                        onChange={handleFormChange}
                        className={inputClass}
                        placeholder="Punjab"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full py-3 disabled:opacity-60"
              >
                {submitting ? "Creating Restaurant..." : "Create Restaurant"}
              </button>
            </form>
          </motion.div>
        </main>
      </div>
    );
  }

  // Main Dashboard
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
              <FaUtensils className="text-white" />
            </div>

            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                FoodDelivery
              </h2>
              <p className="text-xs text-gray-400">Restaurant Panel</p>
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
                  <Icon className="text-base" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-5 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 font-bold">
              {user?.name?.charAt(0)?.toUpperCase() || "R"}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.name || "Restaurant Owner"}
              </p>
              <p className="text-xs text-gray-400">Restaurant Owner</p>
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

      {/* Main Area */}
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
                Manage your restaurant operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </button>

            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400">Restaurant Owner</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-5 sm:p-8 max-w-7xl mx-auto">
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-7"
            >
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Welcome back,
                </p>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.name || "Restaurant Owner"}
                </h2>
              </div>

              {/* Restaurant Profile */}
              <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 shrink-0 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                      <FaStore className="text-primary-600 text-2xl" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {restaurant.name || "My Restaurant"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Restaurant Profile
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-3 py-2 rounded-full bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 w-fit">
                    Profile Created
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 mt-7 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <FaPhone className="text-primary-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Phone</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {restaurant.phone || "Not provided"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-primary-500 mt-1" />
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Location</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {[
                          restaurant.location?.city,
                          restaurant.location?.province,
                        ]
                          .filter(Boolean)
                          .join(", ") || "Not provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {restaurant.description && (
                  <p className="text-sm text-gray-500 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
                    {restaurant.description}
                  </p>
                )}
              </section>

              {/* Management Shortcuts */}
              <section>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Restaurant Management
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Quickly access your restaurant tools.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {[
                    {
                      id: "menu",
                      title: "Manage Menu",
                      description: "Add, update and organize your food items.",
                      icon: FaListAlt,
                    },
                    {
                      id: "orders",
                      title: "Manage Orders",
                      description: "Review and process customer orders.",
                      icon: FaClipboardList,
                    },
                    {
                      id: "analytics",
                      title: "View Analytics",
                      description: "Review your restaurant performance.",
                      icon: FaChartBar,
                    },
                  ].map((item) => {
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        onClick={() => changeTab(item.id)}
                        className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-primary-400 dark:hover:border-primary-500 transition group"
                      >
                        <div className="flex items-center justify-between mb-5">
                          <div className="w-11 h-11 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                            <Icon className="text-primary-600 text-lg" />
                          </div>

                          <FaArrowRight className="text-gray-300 group-hover:text-primary-500 transition" />
                        </div>

                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {item.title}
                        </h4>

                        <p className="text-sm text-gray-500 leading-6">
                          {item.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === "menu" && (
            <MenuManagement restaurant={restaurant} />
          )}

          {activeTab === "orders" && (
            <OrderManagement restaurant={restaurant} />
          )}

          {activeTab === "analytics" && (
            <Analytics restaurant={restaurant} />
          )}
        </main>
      </div>
    </div>
  );
};

export default RestaurantDashboard;
