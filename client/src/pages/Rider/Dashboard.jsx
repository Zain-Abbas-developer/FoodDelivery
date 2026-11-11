import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaMotorcycle, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt, FaSignOutAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RiderDashboard = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [earnings, setEarnings] = useState(null);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    fetchAvailableOrders();
    fetchMyOrders();
    fetchEarnings();
    updateLocation();
    connectSocket();

    const interval = setInterval(() => {
      if (isAvailable) {
        updateLocation();
      }
    }, 30000); // Update location every 30 seconds

    return () => clearInterval(interval);
  }, [isAvailable]);

  const connectSocket = () => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    socket.on('new-order', () => {
      fetchAvailableOrders();
    });
    return () => socket.disconnect();
  };

  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const token = localStorage.getItem('token');
            await axios.post(
              `${API_URL}/rider/update-location`,
              {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          } catch (error) {
            console.error('Error updating location:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const fetchAvailableOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const response = await axios.get(`${API_URL}/rider/available-orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      });
      setAvailableOrders(response.data);
    } catch (error) {
      console.error('Error fetching available orders:', error);
    }
  };

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/rider/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMyOrders(response.data);
    } catch (error) {
      console.error('Error fetching my orders:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/rider/earnings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEarnings(response.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/rider/accept-order`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order accepted!');
      fetchAvailableOrders();
      fetchMyOrders();
    } catch (error) {
      console.error('Error accepting order:', error);
      toast.error('Failed to accept order');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status updated');
      fetchMyOrders();
      if (status === 'delivered') {
        fetchEarnings();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/rider/update-availability`,
        { isAvailable: !isAvailable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIsAvailable(!isAvailable);
      toast.success(`You are now ${!isAvailable ? 'available' : 'unavailable'}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaMotorcycle className="text-primary-500 text-2xl" />
              <span className="text-xl font-bold">Rider Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg glass hover:shadow-lg transition-all"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                onClick={toggleAvailability}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold ${
                  isAvailable ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                }`}
              >
                {isAvailable ? <FaToggleOn /> : <FaToggleOff />}
                <span>{isAvailable ? 'Available' : 'Unavailable'}</span>
              </button>
              <span className="font-medium">{user?.name}</span>
              <button
                onClick={logout}
                className="p-2 rounded-lg glass hover:shadow-lg transition-all text-red-500"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Earnings Summary */}
      {earnings && (
        <div className="container mx-auto px-4 py-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold">PKR {earnings.totalEarnings.toFixed(2)}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Deliveries</p>
              <p className="text-2xl font-bold">{earnings.totalDeliveries}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 dark:text-gray-400 text-sm">Avg per Delivery</p>
              <p className="text-2xl font-bold">PKR {earnings.averageEarningPerDelivery.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'available'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            Available Orders
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'my-orders'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            My Orders
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === 'available' && (
          <div className="space-y-4">
            {availableOrders.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Order #{order.orderNumber}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {order.restaurantId?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} item(s) • PKR {order.total.toFixed(2)}
                    </p>
                    {order.distance && (
                      <p className="text-sm text-gray-500 mt-1">
                        Distance: {order.distance.toFixed(2)} km
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAcceptOrder(order._id)}
                    disabled={!isAvailable}
                    className="btn-primary mt-4 md:mt-0 md:ml-4 disabled:opacity-50"
                  >
                    Accept Order
                  </button>
                </div>
              </motion.div>
            ))}
            {availableOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No available orders</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-orders' && (
          <div className="space-y-4">
            {myOrders.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Order #{order.orderNumber}</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {order.restaurantId?.name} → {order.customerId?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items.length} item(s) • PKR {order.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      Status: {order.status.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-4 flex space-x-2">
                    {order.status === 'rider_assigned' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'rider_picked_up')}
                        className="btn-primary"
                      >
                        Picked Up
                      </button>
                    )}
                    {order.status === 'rider_picked_up' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'on_the_way')}
                        className="btn-primary"
                      >
                        On the Way
                      </button>
                    )}
                    {order.status === 'on_the_way' && (
                      <button
                        onClick={() => handleUpdateStatus(order._id, 'delivered')}
                        className="btn-primary"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            {myOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No orders yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default RiderDashboard;

