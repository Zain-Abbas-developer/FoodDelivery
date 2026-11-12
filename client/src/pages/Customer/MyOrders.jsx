import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaClock, FaCheckCircle, FaTimesCircle, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <FaCheckCircle className="text-green-500" />;
      case 'cancelled':
        return <FaTimesCircle className="text-red-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={150} className="mb-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No orders yet</p>
          <Link to="/customer" className="btn-primary">
            Browse Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="card"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-xl font-bold">Order #{order.orderNumber}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="capitalize">{order.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {order.restaurantId?.name || 'Restaurant'}
                  </p>
                  <div className="flex items-center space-x-1 text-gray-500 text-sm mb-2">
                    <FaMapMarkerAlt />
                    <span>{order.deliveryAddress?.city || 'N/A'}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {order.items.length} item(s) • PKR {order.total.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Ordered on {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-4 md:mt-0 md:ml-4">
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <Link
                      to={`/customer/orders/${order._id}/track`}
                      className="btn-primary"
                    >
                      Track Order
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyOrders;