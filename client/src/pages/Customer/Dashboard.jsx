
import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Link,
  NavLink,
  useNavigate,
} from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaUtensils,
  FaShoppingCart,
  FaUser,
  FaMapMarkerAlt,
  FaSearch,
  FaFilter,
  FaMoon,
  FaSun,
  FaSignOutAlt,
  FaHome,
  FaHistory,
  FaBars,
  FaTimes,
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';

import axios from 'axios';
import toast from 'react-hot-toast';

import RestaurantList from '../../components/Customer/RestaurantList';
import FamousRecipes from '../../components/Customer/FamousRecipes';
import Cart from '../../components/Customer/Cart';
import Chatbot from '../../components/Chatbot';

import RestaurantDetails from './RestaurantDetails';
import MyOrders from './MyOrders';
import Checkout from './Checkout';
import OrderTracking from './OrderTracking.jsx';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const categories = [
  'Biryani',
  'Pizza',
  'Desi',
  'BBQ',
  'Drinks',
  'Chinese',
  'Burgers',
];

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const [userLocation, setUserLocation] = useState(null);

  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    maxPrice: '',
    search: '',
  });

  // Get customer location
  useEffect(() => {
    const defaultLocation = {
      lat: 31.5204,
      lng: 74.3587,
    };

    if (!navigator.geolocation) {
      setUserLocation(defaultLocation);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.error('Location error:', error);
        setUserLocation(defaultLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  }, []);

  // Fetch restaurants with debounce and request cancellation
  useEffect(() => {
    if (!userLocation) return;

    const controller = new AbortController();

    const fetchRestaurants = async () => {
      try {
        setLoading(true);

        const params = {
          lat: userLocation.lat,
          lng: userLocation.lng,
          ...filters,
        };

        const response = await axios.get(
          `${API_URL}/customer/restaurants`,
          {
            params,
            signal: controller.signal,
          }
        );

        const data = response.data;

        setRestaurants(
          Array.isArray(data)
            ? data
            : data?.restaurants || []
        );
      } catch (error) {
        if (
          error.name !== 'CanceledError' &&
          error.name !== 'AbortError'
        ) {
          console.error('Restaurant fetching error:', error);
          toast.error('Failed to load restaurants');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const timeout = setTimeout(fetchRestaurants, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [userLocation, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minRating: '',
      maxPrice: '',
      search: '',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-500 text-white shadow-sm'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  const DashboardSidebar = () => (
    <aside className="flex h-full flex-col">
      <div className="mb-10 flex items-center gap-3 px-2">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-white">
          <FaUtensils className="text-xl" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            FoodDelivery
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Customer Portal
          </p>
        </div>
      </div>

      <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
        Menu
      </p>

      <nav className="space-y-2">
        <NavLink to="/customer" end className={navLinkClass}>
          <FaHome />
          <span>Discover</span>
        </NavLink>

        <NavLink
          to="/customer/my-orders"
          className={navLinkClass}
        >
          <FaHistory />
          <span>My Orders</span>
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-gray-200 pt-5 dark:border-gray-800">
        <div className="mb-4 flex items-center gap-3 px-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-gray-800 dark:text-primary-400">
            <FaUser />
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
              {user?.name || 'Customer'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Customer Account
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <FaSignOutAlt />
          Sign Out
        </button>
      </div>
    </aside>
  );

  const DashboardHome = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <p className="mb-2 text-sm font-medium text-primary-500">
            CUSTOMER DASHBOARD
          </p>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Discover restaurants and order your favourite food.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
          <FaMapMarkerAlt className="text-primary-500" />

          <div>
            <p className="text-xs text-gray-400">Delivery location</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">
              {userLocation ? 'Location available' : 'Finding location...'}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Search and Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Find your food
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Search restaurants and filter your choices.
            </p>
          </div>

          <FaFilter className="text-gray-400" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="relative xl:col-span-2">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search restaurants..."
              value={filters.search}
              onChange={(e) =>
                handleFilterChange('search', e.target.value)
              }
              className="input-field pl-11"
            />
          </div>

          <select
            value={filters.category}
            onChange={(e) =>
              handleFilterChange('category', e.target.value)
            }
            className="input-field"
          >
            <option value="">All Categories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={filters.minRating}
            onChange={(e) =>
              handleFilterChange('minRating', e.target.value)
            }
            className="input-field"
          >
            <option value="">All Ratings</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <select
            value={filters.maxPrice}
            onChange={(e) =>
              handleFilterChange('maxPrice', e.target.value)
            }
            className="input-field max-w-xs"
          >
            <option value="">Any Price</option>
            <option value="500">Under Rs. 500</option>
            <option value="1000">Under Rs. 1,000</option>
            <option value="2000">Under Rs. 2,000</option>
          </select>

          <button
            onClick={clearFilters}
            className="text-sm font-semibold text-primary-500 hover:text-primary-600"
          >
            Clear filters
          </button>
        </div>
      </section>

      {/* Famous Recipes */}
      <section>
        <FamousRecipes />
      </section>

      {/* Restaurant Listing */}
      <section>
        <RestaurantList
          restaurants={restaurants}
          loading={loading}
        />
      </section>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden w-64 shrink-0 border-r border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:block">
          <DashboardSidebar />
        </div>

        {/* Main Area */}
        <div className="min-w-0 flex-1">
          {/* Top Header */}
          <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
            <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMobileMenu(!mobileMenu)}
                  className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 lg:hidden"
                  aria-label="Toggle navigation"
                >
                  {mobileMenu ? <FaTimes /> : <FaBars />}
                </button>

                <div className="lg:hidden">
                  <Link
                    to="/customer"
                    className="flex items-center gap-2 font-bold"
                  >
                    <FaUtensils className="text-primary-500" />
                    FoodDelivery PK
                  </Link>
                </div>

                <div className="hidden lg:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Customer Portal
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Order something delicious today
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={toggleTheme}
                  className="rounded-xl border border-gray-200 p-3 text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Toggle theme"
                >
                  {theme === 'light' ? <FaMoon /> : <FaSun />}
                </button>

                <button
                  onClick={() => setShowCart(true)}
                  className="relative rounded-xl border border-gray-200 p-3 text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label="Open cart"
                >
                  <FaShoppingCart />

                  {getItemCount() > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-500 px-1 text-xs font-bold text-white">
                      {getItemCount()}
                    </span>
                  )}
                </button>

                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-gray-800 dark:text-primary-400">
                    <FaUser />
                  </div>

                  <span className="max-w-32 truncate text-sm font-semibold">
                    {user?.name || 'Customer'}
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* Mobile Navigation */}
          {mobileMenu && (
            <div className="border-b border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 lg:hidden">
              <DashboardSidebar />
            </div>
          )}

          {/* Page Content */}
          <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route
                path="restaurant/:id"
                element={<RestaurantDetails />}
              />
              <Route path="checkout" element={<Checkout/>} />
              <Route path="orders/:id/track" element={<OrderTracking/>} />
              <Route path="my-orders" element={<MyOrders />} />
            </Routes>
          </main>
        </div>
      </div>

      {/* Cart */}
      {showCart && (
        <Cart onClose={() => setShowCart(false)} />
      )}

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default CustomerDashboard;
