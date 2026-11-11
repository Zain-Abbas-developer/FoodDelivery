import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaRoad, FaUser } from 'react-icons/fa';

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * LiveLocationMap Component
 * Shows a visual representation of locations between customer and rider
 * Displays distance and connection status
 */
const LiveLocationMap = ({
  customerLocation,
  riderLocation,
  deliveryAddress,
  isConnected,
  onManualShare,
  sharingLoading,
  isCheckout = false
}) => {
  // Calculate distance between customer and rider
  const distance = useMemo(() => {
    if (customerLocation && riderLocation) {
      return calculateDistance(
        customerLocation.lat,
        customerLocation.lng,
        riderLocation.lat,
        riderLocation.lng
      );
    }
    return null;
  }, [customerLocation, riderLocation]);

  // Calculate estimated time (assuming average speed of 20 km/h)
  const estimatedTime = useMemo(() => {
    if (distance) {
      const minutes = Math.ceil((distance / 20) * 60);
      return minutes < 1 ? '<1 min' : `${minutes} min`;
    }
    return null;
  }, [distance]);

  const customerLocationAvailable = customerLocation && customerLocation.lat && customerLocation.lng;
  const riderLocationAvailable = riderLocation && riderLocation.lat && riderLocation.lng;

  return (
    <div className="w-full">
      <div className="relative">
        {/* Map Container */}
        <div
          className="relative w-full rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 overflow-hidden"
          style={{ height: isCheckout ? '200px' : '400px' }}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-blue-50 to-blue-100 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900" />

          {/* Map grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                'linear-gradient(0deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0,0,0,.05) 25%, rgba(0,0,0,.05) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.05) 75%, rgba(0,0,0,.05) 76%, transparent 77%, transparent)',
              backgroundSize: '50px 50px'
            }}
          />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
            {/* Main Display */}
            {customerLocationAvailable && riderLocationAvailable ? (
              <div className="flex flex-col items-center space-y-4 w-full">
                {/* Customer Location Marker */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center space-x-2"
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <FaUser className="text-purple-500 text-2xl" />
                    </motion.div>
                    <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                      You
                    </span>
                  </div>
                </motion.div>

                {/* Connecting Line with Distance */}
                <div className="flex items-center space-x-3 w-full max-w-xs">
                  <div className="flex-1 h-1 bg-gradient-to-r from-purple-400 via-blue-400 to-blue-500 rounded-full relative">
                    {/* Animated connector */}
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg"
                      animate={{ x: ['0%', '100%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    />
                  </div>
                  <div className="text-center">
                    {distance && (
                      <div>
                        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {distance.toFixed(1)} km
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {estimatedTime}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rider Location Marker */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-2"
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className="relative">
                        <FaMapMarkerAlt className="text-blue-500 text-2xl" />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-blue-500"
                          animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </div>
                    </motion.div>
                    <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                      Rider
                    </span>
                  </div>
                </motion.div>

                {/* Status indicator */}
                <div className="mt-2">
                  {isConnected ? (
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      </motion.div>
                      <span className="text-xs font-semibold">Live Tracking</span>
                    </div>
                  ) : (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      Connecting...
                    </div>
                  )}
                </div>
              </div>
            ) : customerLocationAvailable ? (
              <div className="flex flex-col items-center justify-center space-y-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <FaUser className="text-purple-500 text-4xl" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Your Location
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isCheckout
                      ? 'Waiting for rider assignment...'
                      : 'Waiting for rider location...'}
                  </p>
                </div>
                {!isCheckout && (
                  <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                    <FaRoad className="text-blue-400 text-xl" />
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <FaMapMarkerAlt className="text-blue-400 text-4xl" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Enable Location
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Share your location to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick actions */}
        {!isCheckout && onManualShare && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={onManualShare}
              disabled={sharingLoading}
              className="flex-1 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white py-2 px-3 rounded-lg text-sm transition flex items-center justify-center space-x-2 font-semibold"
            >
              <FaMapMarkerAlt className={sharingLoading ? 'animate-spin' : ''} />
              <span>{sharingLoading ? 'Updating...' : 'Update My Location'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Info cards below map */}
      {!isCheckout && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Customer info */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <FaUser className="text-purple-500 text-sm" />
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                Your Location
              </span>
            </div>
            {customerLocationAvailable ? (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p className="font-mono">
                  {Math.abs(customerLocation.lat).toFixed(2)}°{customerLocation.lat > 0 ? 'N' : 'S'}
                </p>
                <p className="font-mono">
                  {Math.abs(customerLocation.lng).toFixed(2)}°{customerLocation.lng > 0 ? 'E' : 'W'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(customerLocation.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-500">Waiting for location...</p>
            )}
          </div>

          {/* Rider info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <FaMapMarkerAlt className="text-blue-500 text-sm" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                Rider Location
              </span>
            </div>
            {riderLocationAvailable ? (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                <p className="font-mono">
                  {Math.abs(riderLocation.lat).toFixed(2)}°{riderLocation.lat > 0 ? 'N' : 'S'}
                </p>
                <p className="font-mono">
                  {Math.abs(riderLocation.lng).toFixed(2)}°{riderLocation.lng > 0 ? 'E' : 'W'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(riderLocation.updatedAt).toLocaleTimeString()}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-500">Waiting for rider...</p>
            )}
          </div>
        </div>
      )}

      {/* Distance and time info */}
      {distance && (
        <div className="mt-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 dark:from-blue-500/20 dark:to-purple-500/20 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FaRoad className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Distance
              </span>
            </div>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {distance.toFixed(1)} km
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Est. Time
            </span>
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {estimatedTime}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveLocationMap;
