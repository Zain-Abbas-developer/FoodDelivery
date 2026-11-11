import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUtensils, FaPlus, FaEdit, FaTrash, FaSignOutAlt, FaChartBar, FaListAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import MenuManagement from '../../components/Restaurant/MenuManagement';
import OrderManagement from '../../components/Restaurant/OrderManagement';
import Analytics from '../../components/Restaurant/Analytics';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RestaurantDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');
  const [formData, setFormData] = useState({
    name: '',
    location: {
      address: '',
      city: '',
      province: '',
      coordinates: { lat: 0, lng: 0 }
    },
    phone: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/restaurant/info`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurant(response.data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      // Restaurant doesn't exist yet, will show setup form
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/restaurant/info`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurant(response.data);
      toast.success('Restaurant created successfully!');
    } catch (error) {
      console.error('Error creating restaurant:', error);
      toast.error(error.response?.data?.errors?.[0]?.msg || 'Failed to create restaurant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaUtensils className="text-primary-500 text-2xl" />
              <span className="text-xl font-bold">Restaurant Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg glass hover:shadow-lg transition-all"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <span className="font-medium">{user?.name}</span>
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

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      ) : !restaurant ? (
        // Setup Form - Create Restaurant
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <h2 className="text-3xl font-bold mb-6">Set Up Your Restaurant</h2>
            <form onSubmit={handleCreateRestaurant} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Restaurant Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                  placeholder="e.g., Pizza Palace, Biryani House"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  required
                  placeholder="e.g., +92-300-1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Tell customers about your restaurant..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Street Address *</label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, address: e.target.value }
                    })}
                    className="input-field"
                    required
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    value={formData.location.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value }
                    })}
                    className="input-field"
                    required
                    placeholder="e.g., Karachi, Lahore"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Province</label>
                <input
                  type="text"
                  value={formData.location.province}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, province: e.target.value }
                  })}
                  className="input-field"
                  placeholder="e.g., Sindh, Punjab"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Creating...' : 'Create Restaurant'}
              </button>
            </form>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Tabs */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'menu', label: 'Menu', icon: FaListAlt },
              { id: 'orders', label: 'Orders', icon: FaListAlt },
              { id: 'analytics', label: 'Analytics', icon: FaChartBar }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="inline mr-2" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          {activeTab === 'menu' && <MenuManagement restaurant={restaurant} />}
          {activeTab === 'orders' && <OrderManagement restaurant={restaurant} />}
          {activeTab === 'analytics' && <Analytics restaurant={restaurant} />}
        </main>
        </>
      )}
    </div>
  );
};

export default RestaurantDashboard;

