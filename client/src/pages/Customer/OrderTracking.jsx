import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaCircle, FaMotorcycle, FaMapMarkerAlt, FaShareAlt, FaUser } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';
import LiveLocationMap from '../../components/LiveLocationMap';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OrderTracking = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [customerLocationShared, setCustomerLocationShared] = useState(false);

  useEffect(() => {
    fetchOrder();
    connectSocket();
    
    // Start sharing customer location if order is active
    startCustomerLocationSharing();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [id]);

  const connectSocket = () => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
    newSocket.emit('join-room', `order-${id}`);
    
    newSocket.on('order-status-updated', (updatedOrder) => {
      console.log('Order status updated:', updatedOrder.status);
      setOrder(updatedOrder);
    });
    
    newSocket.on('rider-location-updated', (data) => {
      console.log('Rider location received:', data);
      if (data.orderId === id && data.location) {
        setOrder(prev => ({
          ...prev,
          riderLocation: {
            lat: data.location.lat || data.location.latitude,
            lng: data.location.lng || data.location.longitude,
            updatedAt: new Date()
          }
        }));
        console.log('Rider location updated in state:', data.location);
      }
    });

    newSocket.on('customer-location-updated', (data) => {
      console.log('Customer location updated from another device:', data);
      if (data.orderId === id && data.location) {
        setOrder(prev => ({
          ...prev,
          customerLocation: {
            lat: data.location.lat || data.location.latitude,
            lng: data.location.lng || data.location.longitude,
            updatedAt: new Date()
          }
        }));
      }
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setSocketConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });
    
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setSocketConnected(false);
    });
    
    setSocket(newSocket);
  };

  const startCustomerLocationSharing = () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    // Watch customer location and share with rider
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        shareCustomerLocation(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === 1) {
          toast.error('Please enable location sharing');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    // Clean up watch on component unmount
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  const shareCustomerLocation = async (lat, lng) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/customer/share-location`,
        { lat, lng, orderId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCustomerLocationShared(true);
    } catch (error) {
      console.error('Error sharing location:', error);
    }
  };

  const manuallyShareLocation = async () => {
    setSharingLocation(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            await shareCustomerLocation(latitude, longitude);
            toast.success('Location shared with rider');
            setSharingLocation(false);
          },
          (error) => {
            console.error('Geolocation error:', error);
            toast.error('Could not get your location');
            setSharingLocation(false);
          }
        );
      } else {
        toast.error('Geolocation not supported');
        setSharingLocation(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setSharingLocation(false);
    }
  };

  const fetchOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(response.data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const statuses = [
    { key: 'pending', label: 'Order Placed' },
    { key: 'restaurant_accepted', label: 'Restaurant Accepted' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'rider_assigned', label: 'Rider Assigned' },
    { key: 'rider_picked_up', label: 'Rider Picked Up' },
    { key: 'on_the_way', label: 'On the Way' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const getStatusIndex = (status) => {
    return statuses.findIndex(s => s.key === status);
  };

  if (loading || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mx-auto"></div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Track Your Order</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          <div className="card">
            <h2 className="text-xl font-bold mb-6">Order Status</h2>
            <div className="space-y-4">
              {statuses.map((status, index) => {
                const isCompleted = index <= currentStatusIndex;
                const isCurrent = index === currentStatusIndex;

                return (
                  <div key={status.key} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      {isCompleted ? (
                        <FaCheckCircle className="text-green-500 text-xl" />
                      ) : (
                        <FaCircle className="text-gray-300 text-xl" />
                      )}
                      {index < statuses.length - 1 && (
                        <div className={`w-0.5 h-8 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <h3 className={`font-semibold ${isCompleted ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                        {status.label}
                      </h3>
                      {isCurrent && order.statusHistory && order.statusHistory.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                          {order.statusHistory[order.statusHistory.length - 1]?.message}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order Details */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Order Details</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Order Number</span>
                <span className="font-semibold">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Restaurant</span>
                <span className="font-semibold">{order.restaurantId?.name}</span>
              </div>
              {order.riderId && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Rider</span>
                  <span className="font-semibold flex items-center space-x-1">
                    <FaMotorcycle />
                    <span>{order.riderId.name}</span>
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total</span>
                <span className="font-semibold">PKR {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Live Location Tracking - Visual Map Display */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
              <FaMapMarkerAlt className="text-blue-500 animate-pulse" />
              <span>Live Location</span>
            </h2>
            
            <LiveLocationMap
              customerLocation={order.customerLocation}
              riderLocation={order.riderLocation}
              deliveryAddress={order.deliveryAddress}
              isConnected={socketConnected}
              onManualShare={manuallyShareLocation}
              sharingLoading={sharingLocation}
              isCheckout={false}
            />
          </div>
        </div>

        {/* Order Items */}
        <div className="lg:col-span-1">
          <div className="card sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.menuItemId} className="flex items-center space-x-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-200 to-primary-400 rounded-lg flex-shrink-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {item.quantity} × PKR {item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>PKR {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;

