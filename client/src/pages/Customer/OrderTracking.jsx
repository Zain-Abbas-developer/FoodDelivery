
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import {
  FaCheckCircle,
  FaCircle,
  FaMotorcycle,
  FaMapMarkerAlt,
  FaShareAlt,
  FaUser,
  FaStore,
  FaReceipt,
  FaClock,
  FaArrowLeft,
  FaSyncAlt,
  FaPhoneAlt,
  FaBoxOpen,
  FaExclamationCircle,
  FaWifi,
  FaTimesCircle,
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

import LiveLocationMap from '../../components/LiveLocationMap';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

const ORDER_STATUSES = [
  {
    key: 'pending',
    label: 'Order Placed',
    description: 'Your order has been successfully placed.',
    icon: FaReceipt,
  },
  {
    key: 'restaurant_accepted',
    label: 'Restaurant Accepted',
    description: 'The restaurant has accepted your order.',
    icon: FaStore,
  },
  {
    key: 'preparing',
    label: 'Preparing Your Food',
    description: 'Your food is being freshly prepared.',
    icon: FaBoxOpen,
  },
  {
    key: 'rider_assigned',
    label: 'Rider Assigned',
    description: 'A delivery rider has been assigned.',
    icon: FaMotorcycle,
  },
  {
    key: 'rider_picked_up',
    label: 'Order Picked Up',
    description: 'The rider has collected your order.',
    icon: FaCheckCircle,
  },
  {
    key: 'on_the_way',
    label: 'On The Way',
    description: 'Your order is on its way to you.',
    icon: FaMotorcycle,
  },
  {
    key: 'delivered',
    label: 'Delivered',
    description: 'Your order has been delivered.',
    icon: FaCheckCircle,
  },
];

const TERMINAL_STATUSES = ['delivered', 'cancelled', 'rejected'];

const formatPrice = (amount) =>
  `PKR ${Number(amount || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (date) => {
  if (!date) return 'Not available';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Not available';
  }

  return parsedDate.toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [socketConnected, setSocketConnected] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [customerLocationShared, setCustomerLocationShared] =
    useState(false);

  const lastLocationShare = useRef(0);

  // Fetch order details
  const fetchOrder = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(false);

      const token = localStorage.getItem('token');

      const response = await axios.get(
        `${API_URL}/orders/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal,
        }
      );

      setOrder(response.data);
    } catch (err) {
      if (
        err.name === 'CanceledError' ||
        err.name === 'AbortError'
      ) {
        return;
      }

      console.error('Order fetch error:', err);

      setError(true);

      toast.error(
        err.response?.data?.message ||
          'Unable to load order details'
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();

    fetchOrder(controller.signal);

    return () => controller.abort();
  }, [fetchOrder]);

  // Live Socket.IO connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    const joinOrderRoom = () => {
      newSocket.emit('join-room', `order-${id}`);
    };

    newSocket.on('connect', () => {
      setSocketConnected(true);
      joinOrderRoom();
    });

    newSocket.on('disconnect', () => {
      setSocketConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setSocketConnected(false);
    });

    newSocket.on('order-status-updated', (updatedOrder) => {
      if (updatedOrder && typeof updatedOrder === 'object') {
        setOrder((prev) => ({
          ...prev,
          ...updatedOrder,
        }));
      }
    });

    newSocket.on('rider-location-updated', (data) => {
      if (data?.orderId !== id || !data.location) return;

      const lat = data.location.lat ?? data.location.latitude;
      const lng = data.location.lng ?? data.location.longitude;

      if (!Number.isFinite(Number(lat)) ||
          !Number.isFinite(Number(lng))) {
        return;
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              riderLocation: {
                lat: Number(lat),
                lng: Number(lng),
                updatedAt: new Date(),
              },
            }
          : prev
      );
    });

    newSocket.on('customer-location-updated', (data) => {
      if (data?.orderId !== id || !data.location) return;

      const lat = data.location.lat ?? data.location.latitude;
      const lng = data.location.lng ?? data.location.longitude;

      if (!Number.isFinite(Number(lat)) ||
          !Number.isFinite(Number(lng))) {
        return;
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              customerLocation: {
                lat: Number(lat),
                lng: Number(lng),
                updatedAt: new Date(),
              },
            }
          : prev
      );
    });

    return () => {
      newSocket.removeAllListeners();
      newSocket.disconnect();
      setSocketConnected(false);
    };
  }, [id]);

  // Share customer location with the rider
  const shareCustomerLocation = useCallback(
    async (lat, lng, force = false) => {
      const now = Date.now();

      // Avoid unnecessary API requests while moving.
      if (!force && now - lastLocationShare.current < 15000) {
        return;
      }

      lastLocationShare.current = now;

      try {
        const token = localStorage.getItem('token');

        await axios.post(
          `${API_URL}/customer/share-location`,
          {
            lat,
            lng,
            orderId: id,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setCustomerLocationShared(true);
      } catch (err) {
        console.error('Location sharing error:', err);
      }
    },
    [id]
  );

  // Automatically share location only while order is active
  useEffect(() => {
    if (!order || TERMINAL_STATUSES.includes(order.status)) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        shareCustomerLocation(latitude, longitude);
      },
      (err) => {
        console.warn('Customer location unavailable:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [order?.status, id, shareCustomerLocation]);

  // Manually share location
  const manuallyShareLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setSharingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        await shareCustomerLocation(
          latitude,
          longitude,
          true
        );

        toast.success('Location shared with rider');
        setSharingLocation(false);
      },
      (err) => {
        console.error('Location error:', err);

        toast.error(
          err.code === 1
            ? 'Please allow location permission in your browser'
            : 'Unable to get your current location'
        );

        setSharingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-100 border-t-primary-500" />

        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Loading your order details...
        </p>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <FaExclamationCircle className="mb-4 text-4xl text-red-500" />

        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Unable to Load Order
        </h2>

        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          We could not retrieve your order information. Please try again.
        </p>

        <button
          onClick={() => fetchOrder()}
          className="btn-primary mt-6 flex items-center gap-2"
        >
          <FaSyncAlt />
          Try Again
        </button>
      </div>
    );
  }

  const currentStatusIndex = ORDER_STATUSES.findIndex(
    (status) => status.key === order.status
  );

  const isCancelled = ['cancelled', 'rejected'].includes(order.status);
  const isDelivered = order.status === 'delivered';

  const restaurantName =
    order.restaurantId?.name ||
    order.restaurantName ||
    'Restaurant';

  const riderName =
    order.riderId?.name || 'Waiting for rider assignment';

  const orderItems = Array.isArray(order.items) ? order.items : [];

  const latestStatusMessage =
    order.statusHistory?.[order.statusHistory.length - 1]?.message;

  return (
    <div className="space-y-6 pb-6">

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => navigate('/customer/my-orders')}
            className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-primary-500 dark:text-gray-400"
          >
            <FaArrowLeft />
            Back to My Orders
          </button>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-500">
            Order Management
          </p>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Track Your Order
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Follow your order from preparation to delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${
            socketConnected
              ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-400'
              : 'border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            <FaWifi />
            {socketConnected ? 'Live Connected' : 'Reconnecting...'}
          </div>

          <button
            onClick={() => fetchOrder()}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-primary-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>
      </div>

      {/* Order Overview */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
            <FaReceipt />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Order Number
          </p>

          <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
            #{order.orderNumber || order._id?.slice(-8)}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <FaStore />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Restaurant
          </p>

          <h3 className="mt-2 truncate text-lg font-bold text-gray-900 dark:text-white">
            {restaurantName}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
            <FaClock />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Order Date
          </p>

          <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
            {formatDate(order.createdAt)}
          </h3>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
            <FaReceipt />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Total Amount
          </p>

          <h3 className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(order.total)}
          </h3>
        </div>
      </motion.div>

      {/* Cancelled / Rejected State */}
      {isCancelled && (
        <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-900/10">
          <FaTimesCircle className="mt-1 text-2xl text-red-500" />

          <div>
            <h2 className="font-bold text-red-700 dark:text-red-400">
              Order {order.status}
            </h2>

            <p className="mt-1 text-sm text-red-600 dark:text-red-300">
              This order is no longer being processed.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* Left Column */}
        <div className="space-y-6">

          {/* Order Progress */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-7">
            <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Order Progress
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Real-time updates on your delivery.
                </p>
              </div>

              {!isCancelled && (
                <span className={`w-fit rounded-lg px-3 py-2 text-xs font-bold ${
                  isDelivered
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                }`}>
                  {order.status?.replace(/_/g, ' ').toUpperCase()}
                </span>
              )}
            </div>

            {isCancelled ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tracking timeline is unavailable for this order.
              </p>
            ) : (
              <div className="space-y-0">
                {ORDER_STATUSES.map((status, index) => {
                  const completed = index <= currentStatusIndex;
                  const current = index === currentStatusIndex;
                  const StatusIcon = status.icon;

                  return (
                    <div key={status.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                          completed
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                        } ${
                          current ? 'ring-4 ring-primary-100 dark:ring-primary-900/30' : ''
                        }`}>
                          {completed ? (
                            <StatusIcon />
                          ) : (
                            <FaCircle className="text-xs" />
                          )}
                        </div>

                        {index !== ORDER_STATUSES.length - 1 && (
                          <div className={`my-1 min-h-12 w-0.5 flex-1 ${
                            index < currentStatusIndex
                              ? 'bg-green-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                          }`} />
                        )}
                      </div>

                      <div className="flex-1 pb-7">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-sm font-bold ${
                            completed
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}>
                            {status.label}
                          </h3>

                          {current && (
                            <span className="rounded-md bg-primary-50 px-2 py-1 text-[10px] font-bold uppercase text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                              Current
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {status.description}
                        </p>

                        {current && latestStatusMessage && (
                          <p className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400">
                            {latestStatusMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isDelivered && (
              <div className="mt-2 rounded-xl bg-green-50 p-4 dark:bg-green-900/20">
                <p className="flex items-center gap-2 text-sm font-bold text-green-700 dark:text-green-400">
                  <FaCheckCircle />
                  Your order has been delivered successfully!
                </p>
              </div>
            )}
          </section>

          {/* Live Location */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 dark:border-gray-800 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                  <FaMapMarkerAlt className="text-primary-500" />
                  Live Delivery Location
                </h2>

                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  View the delivery location on the map.
                </p>
              </div>

              <span className={`flex items-center gap-2 text-xs font-semibold ${
                socketConnected
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-400'
              }`}>
                <span className={`h-2 w-2 rounded-full ${
                  socketConnected ? 'animate-pulse bg-green-500' : 'bg-gray-400'
                }`} />
                {socketConnected ? 'Live updates active' : 'Live updates unavailable'}
              </span>
            </div>

            <div className="p-3 sm:p-5">
              {isCancelled ? (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl bg-gray-50 text-center dark:bg-gray-800">
                  <FaMapMarkerAlt className="mb-3 text-3xl text-gray-400" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    Location tracking is unavailable for this order.
                  </p>
                </div>
              ) : (
                <LiveLocationMap
                  customerLocation={order.customerLocation}
                  riderLocation={order.riderLocation}
                  deliveryAddress={order.deliveryAddress}
                  isConnected={socketConnected}
                  onManualShare={manuallyShareLocation}
                  sharingLoading={sharingLocation}
                  isCheckout={false}
                />
              )}
            </div>

            {!isCancelled && !isDelivered && (
              <div className="flex flex-col justify-between gap-3 border-t border-gray-200 p-5 dark:border-gray-800 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    Share your current location
                  </p>

                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Help your rider find your delivery address.
                  </p>

                  {customerLocationShared && (
                    <p className="mt-1 text-xs font-semibold text-green-600">
                      Location shared successfully.
                    </p>
                  )}
                </div>

                <button
                  onClick={manuallyShareLocation}
                  disabled={sharingLocation}
                  className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <FaShareAlt />
                  {sharingLocation ? 'Sharing...' : 'Share Location'}
                </button>
              </div>
            )}
          </section>

          {/* Delivery Information */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
            <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">
              Delivery Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <FaStore />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Restaurant
                  </p>

                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {restaurantName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                  <FaMotorcycle />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Delivery Rider
                  </p>

                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {riderName}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:col-span-2">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400">
                  <FaMapMarkerAlt />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-gray-400">
                    Delivery Address
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                    {[
                      order.deliveryAddress?.street,
                      order.deliveryAddress?.city,
                      order.deliveryAddress?.province,
                      order.deliveryAddress?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Address not available'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <aside className="space-y-6">

          {/* Order Items */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Order Items
              </h2>

              <span className="rounded-lg bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                {orderItems.length} Items
              </span>
            </div>

            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div
                  key={item.menuItemId?._id || item.menuItemId || item._id || index}
                  className="flex items-center gap-3"
                >
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name || 'Food item'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <FaBoxOpen className="text-xl" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                      {item.name || item.menuItemId?.name || 'Food Item'}
                    </h3>

                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>

                  <p className="whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                    {formatPrice(
                      Number(item.quantity || 0) *
                      Number(item.price || 0)
                    )}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-gray-200 pt-5 text-sm dark:border-gray-800">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Delivery Fee</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>

              {Number(order.tip) > 0 && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Rider Tip</span>
                  <span>{formatPrice(order.tip)}</span>
                </div>
              )}

              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-white">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </section>

          {/* Customer Card */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <FaUser />
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Ordering Customer
                </p>

                <p className="font-bold text-gray-900 dark:text-white">
                  {user?.name || 'Customer'}
                </p>
              </div>
            </div>

            {user?.phone && (
              <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <FaPhoneAlt />
                {user.phone}
              </p>
            )}
          </section>

          {/* Help Card */}
          <section className="rounded-2xl bg-gray-900 p-5 text-white dark:bg-gray-800">
            <h3 className="font-bold">
              Need Help?
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              If you have any questions about your order, please contact our support team.
            </p>

            <button
              onClick={() => navigate('/customer/my-orders')}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
            >
              <FaReceipt />
              View My Orders
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default OrderTracking;
