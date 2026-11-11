import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUtensils, FaShoppingCart, FaUser, FaMapMarkerAlt, 
  FaSearch, FaFilter, FaMoon, FaSun, FaSignOutAlt,
  FaHome, FaListAlt, FaHistory
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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    minRating: '',
    maxPrice: '',
    search: ''
  });
  const [userLocation, setUserLocation] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Lahore, Pakistan
          setUserLocation({ lat: 31.5204, lng: 74.3587 });
        }
      );
    } else {
      // Default to Lahore, Pakistan
      setUserLocation({ lat: 31.5204, lng: 74.3587 });
    }
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchRestaurants();
    }
  }, [userLocation, filters]);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const params = {
        lat: userLocation.lat,
        lng: userLocation.lng,
        ...filters
      };
      const response = await axios.get(`${API_URL}/customer/restaurants`, { params });
      setRestaurants(response.data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/customer" className="flex items-center space-x-2">
              <FaUtensils className="text-primary-500 text-2xl" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                FoodDelivery PK
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg glass hover:shadow-lg transition-all"
              >
                {theme === 'light' ? <FaMoon /> : <FaSun />}
              </button>

              <Link to="/customer/my-orders" className="p-2 rounded-lg glass hover:shadow-lg transition-all relative">
                <FaHistory className="text-xl" />
              </Link>

              <button
                onClick={() => setShowCart(true)}
                className="p-2 rounded-lg glass hover:shadow-lg transition-all relative"
              >
                <FaShoppingCart className="text-xl" />
                {getItemCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getItemCount()}
                  </span>
                )}
              </button>

              <div className="flex items-center space-x-2">
                <FaUser className="text-gray-600 dark:text-gray-400" />
                <span className="font-medium">{user?.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-lg glass hover:shadow-lg transition-all text-red-500"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* Search and Filters */}
                <div className="mb-8">
                  <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1 relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search restaurants..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="input-field pl-10"
                      />
                    </div>
                    <select
                      value={filters.category}
                      onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                      className="input-field"
                    >
                      <option value="">All Categories</option>
                      <option value="Biryani">Biryani</option>
                      <option value="Pizza">Pizza</option>
                      <option value="Desi">Desi</option>
                      <option value="BBQ">BBQ</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Chinese">Chinese</option>
                      <option value="Burgers">Burgers</option>
                    </select>
                    <select
                      value={filters.minRating}
                      onChange={(e) => setFilters({ ...filters, minRating: e.target.value })}
                      className="input-field"
                    >
                      <option value="">All Ratings</option>
                      <option value="4">4+ Stars</option>
                      <option value="3">3+ Stars</option>
                      <option value="2">2+ Stars</option>
                    </select>
                  </div>
                </div>

                {/* Famous Recipes */}
                <FamousRecipes />

                {/* Restaurants */}
                <RestaurantList restaurants={restaurants} loading={loading} />
              </>
            }
          />
          <Route path="restaurant/:id" element={<RestaurantDetails />} />
          <Route path="my-orders" element={<MyOrders />} />
        </Routes>
      </main>

      {/* Cart Sidebar */}
      {showCart && <Cart onClose={() => setShowCart(false)} />}

      {/* Chatbot */}
      <Chatbot />
    </div>
  );
};

export default CustomerDashboard;

