import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OrderManagement = ({ restaurant }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
    connectSocket();
  }, [filter]);

  const connectSocket = () => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const socket = io(socketUrl);
    if (restaurant) {
      socket.emit('join-room', `restaurant-${restaurant._id}`);
    }
    socket.on('new-order', (order) => {
      setOrders(prev => [order, ...prev]);
      toast.success('New order received!');
    });
    return () => socket.disconnect();
  };

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await axios.get(`${API_URL}/restaurant/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `${API_URL}/orders/${orderId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Order Management</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field"
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="restaurant_accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="rider_assigned">Rider Assigned</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-2">
                  <h3 className="text-xl font-bold">Order #{order.orderNumber}</h3>
                  <span className="flex items-center space-x-1">
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status.replace('_', ' ')}</span>
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Customer: {order.customerId?.name}
                </p>
                <p className="text-sm text-gray-500">
                  {order.items.length} item(s) • PKR {order.total.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="mt-4 md:mt-0 md:ml-4 flex space-x-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="btn-secondary"
                >
                  View Details
                </button>
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => updateOrderStatus(order._id, 'restaurant_accepted')}
                      className="btn-primary"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => updateOrderStatus(order._id, 'cancelled')}
                      className="btn-secondary text-red-500"
                    >
                      Reject
                    </button>
                  </>
                )}
                {order.status === 'restaurant_accepted' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'preparing')}
                    className="btn-primary"
                  >
                    Start Preparing
                  </button>
                )}
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'rider_assigned')}
                    className="btn-primary"
                  >
                    Ready for Pickup
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedOrder(null)} />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl z-10"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">Order #{selectedOrder.orderNumber}</h3>
                  <p className="text-sm text-gray-500">{selectedOrder.customerId?.name} • {selectedOrder.customerId?.phone}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="btn-secondary">Close</button>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold">Items</h4>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  {selectedOrder.items.map((it) => (
                    <li key={it._id || it.id}>
                      {it.name} x {it.quantity} • PKR {it.price}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h5 className="font-semibold">Total</h5>
                  <p>PKR {selectedOrder.total.toFixed(2)}</p>
                </div>
                <div>
                  <h5 className="font-semibold">Address</h5>
                  <p>{selectedOrder.deliveryAddress || selectedOrder.address || 'N/A'}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                {selectedOrder.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => { 
                        updateOrderStatus(selectedOrder._id, 'restaurant_accepted'); 
                        setSelectedOrder(null);
                      }} 
                      className="btn-primary"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => { 
                        updateOrderStatus(selectedOrder._id, 'cancelled'); 
                        setSelectedOrder(null);
                      }} 
                      className="btn-secondary text-red-500"
                    >
                      Reject
                    </button>
                  </>
                )}
                {selectedOrder.status === 'restaurant_accepted' && (
                  <button 
                    onClick={() => { 
                      updateOrderStatus(selectedOrder._id, 'preparing'); 
                      setSelectedOrder(null);
                    }} 
                    className="btn-primary"
                  >
                    Start Preparing
                  </button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <button 
                    onClick={() => { 
                      updateOrderStatus(selectedOrder._id, 'rider_assigned'); 
                      setSelectedOrder(null);
                    }} 
                    className="btn-primary"
                  >
                    Ready for Pickup
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {orders.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">No orders found</p>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;

