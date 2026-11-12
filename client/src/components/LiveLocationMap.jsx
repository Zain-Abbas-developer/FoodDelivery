import React, { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaMapMarkerAlt,
  FaUser,
  FaMotorcycle,
  FaRoute,
  FaClock,
  FaLocationArrow,
  FaExclamationCircle,
  FaCrosshairs,
} from "react-icons/fa";

// Helper function to calculate distance (straight line)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const isValidLocation = (location) =>
  location &&
  Number.isFinite(Number(location.lat)) &&
  Number.isFinite(Number(location.lng));

const formatTime = (date) => {
  if (!date) return "Not available";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Not available";
  return parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// Custom Icons
const riderIcon = L.divIcon({
  className: "custom-rider-icon",
  html: `<div class="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-xl">
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M280 48c0-26.5 21.5-48 48-48s48 21.5 48 48-21.5 48-48 48-48-21.5-48-48zm-7.4 86.4L217.5 218c-6.2 14.6-19.6 24.5-35.3 26.2l-74.6 8.3c-13.3 1.5-24.1 11.4-26.1 24.6-2.2 14.7 8 28.2 22.7 30.2l76.7 9.8c29.5 3.1 56.8-13.6 67.4-41.4l17-44.4 47.4 37.9c19.9 15.9 47.4 17.1 68.6 2.9l42-28c13-8.7 16.7-26.2 8.4-39.4l-32.7-51.2c-16.3-25.6-49.2-33.8-75.2-19.1L316 201.4l-10-55.6c-2.5-13.9-15.1-23.8-29.2-22.9l-4.2.2v11.3zM176 352c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64zm256 0c-35.3 0-64 28.7-64 64s28.7 64 64 64 64-28.7 64-64-28.7-64-64-64z"></path></svg>
          <span class="absolute inset-[-4px] rounded-full border border-blue-500 animate-ping opacity-75"></span>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const customerIcon = L.divIcon({
  className: "custom-customer-icon",
  html: `<div class="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-purple-600 text-white shadow-xl">
          <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="18" width="18" xmlns="http://www.w3.org/2000/svg"><path d="M224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4z"></path></svg>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const MapUpdater = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
};

const LiveLocationMap = ({
  customerLocation,
  riderLocation,
  deliveryAddress,
  isConnected = false,
  onManualShare,
  sharingLoading = false,
  isCheckout = false,
}) => {
  const customerAvailable = isValidLocation(customerLocation);
  const riderAvailable = isValidLocation(riderLocation);
  
  const [routeCoords, setRouteCoords] = useState([]);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const defaultCenter = [20.5937, 78.9629]; 
  const mapCenter = customerAvailable 
    ? [Number(customerLocation.lat), Number(customerLocation.lng)] 
    : defaultCenter;

  const distance = useMemo(() => {
    if (!customerAvailable || !riderAvailable) return null;
    return calculateDistance(
      Number(customerLocation.lat),
      Number(customerLocation.lng),
      Number(riderLocation.lat),
      Number(riderLocation.lng)
    );
  }, [customerAvailable, riderAvailable, customerLocation, riderLocation]);

  const estimatedTime = useMemo(() => {
    if (distance === null) return null;
    const minutes = Math.ceil((distance / 20) * 60);
    return minutes < 1 ? "Less than 1 min" : `${minutes} min`;
  }, [distance]);

  const bothLocationsAvailable = customerAvailable && riderAvailable;

  // FETCH ACTUAL ROAD ROUTE FROM OSRM API
  useEffect(() => {
    if (!bothLocationsAvailable) {
      setRouteCoords([]);
      return;
    }

    const fetchRoute = async () => {
      setIsRouteLoading(true);
      try {
        const startLng = Number(riderLocation.lng);
        const startLat = Number(riderLocation.lat);
        const endLng = Number(customerLocation.lng);
        const endLat = Number(customerLocation.lat);

        // OSRM API call for driving route
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();

        if (data.code === "Ok" && data.routes.length > 0) {
          // OSRM returns [longitude, latitude], Leaflet needs [latitude, longitude]
          const coordinates = data.routes[0].geometry.coordinates.map(
            (coord) => [coord[1], coord[0]]
          );
          setRouteCoords(coordinates);
        } else {
          // Fallback to straight line if API fails
          setRouteCoords([
            [Number(riderLocation.lat), Number(riderLocation.lng)],
            [Number(customerLocation.lat), Number(customerLocation.lng)],
          ]);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
        // Fallback
        setRouteCoords([
          [Number(riderLocation.lat), Number(riderLocation.lng)],
          [Number(customerLocation.lat), Number(customerLocation.lng)],
        ]);
      } finally {
        setIsRouteLoading(false);
      }
    };

    fetchRoute();
  }, [riderLocation, customerLocation, bothLocationsAvailable]);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            Live Delivery Tracking
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Follow your delivery in real time
          </p>
        </div>

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
            isConnected
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-amber-500"
            }`}
          />
          {isConnected ? "Live connection" : "Reconnecting"}
        </div>
      </div>

      {/* Map */}
      <div
        className={`relative isolate overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 z-0 ${
          isCheckout ? "h-[230px]" : "h-[360px] sm:h-[430px]"
        }`}
      >
        <MapContainer
          center={mapCenter}
          zoom={15}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater center={mapCenter} />

          {/* Route Line (Follows Roads) */}
          {bothLocationsAvailable && routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              color="#3b82f6" // blue-500
              weight={5}
              opacity={0.8}
              // Agar aap dashed line chahte hain to dashArray use karein, warna hata dein
              // dashArray="10, 10" 
            />
          )}

          {/* Rider Marker */}
          {riderAvailable && (
            <Marker
              position={[Number(riderLocation.lat), Number(riderLocation.lng)]}
              icon={riderIcon}
            >
              <Popup>Delivery Partner</Popup>
            </Marker>
          )}

          {/* Customer Marker */}
          {customerAvailable && (
            <Marker
              position={[Number(customerLocation.lat), Number(customerLocation.lng)]}
              icon={customerIcon}
            >
              <Popup>Your Location</Popup>
            </Marker>
          )}
        </MapContainer>

        {/* Footer Overlay */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between rounded-xl border border-white/70 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-gray-600 dark:bg-gray-900/90">
          <div className="flex items-center gap-2">
            <FaCrosshairs className="text-blue-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
              {isRouteLoading ? "Calculating route..." : bothLocationsAvailable
                ? "Locations synchronized"
                : "Waiting for location updates"}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {formatTime(riderLocation?.updatedAt || customerLocation?.updatedAt)}
          </span>
        </div>
      </div>

      {/* Rest of the UI (Metrics, Address, etc.) */}
      <AnimatePresence>
        {bothLocationsAvailable && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FaRoute className="text-blue-500" />
                <span className="text-xs font-medium">Distance</span>
              </div>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                {distance.toFixed(1)} km
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <FaClock className="text-green-500" />
                <span className="text-xs font-medium">Estimated time</span>
              </div>
              <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                {estimatedTime}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Baaki ka code same rahega... (Location Info, Address, Button) */}
      {!isCheckout && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-purple-100 bg-purple-50/70 p-4 dark:border-purple-900/50 dark:bg-purple-900/10">
            <div className="flex items-center gap-2">
              <FaUser className="text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                Customer Location
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {customerAvailable
                ? `Updated at ${formatTime(customerLocation.updatedAt)}`
                : "Waiting for customer location"}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-900/50 dark:bg-blue-900/10">
            <div className="flex items-center gap-2">
              <FaMotorcycle className="text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-gray-800 dark:text-white">
                Rider Location
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {riderAvailable
                ? `Updated at ${formatTime(riderLocation.updatedAt)}`
                : "Waiting for rider location"}
            </p>
          </div>
        </div>
      )}

      {deliveryAddress && (
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <FaMapMarkerAlt className="mt-1 text-red-500" />
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              DELIVERY ADDRESS
            </p>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white">
              {typeof deliveryAddress === "string"
                ? deliveryAddress
                : [
                    deliveryAddress.street,
                    deliveryAddress.city,
                    deliveryAddress.province,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address not available"}
            </p>
          </div>
        </div>
      )}

      {!isCheckout && onManualShare && (
        <button
          type="button"
          onClick={onManualShare}
          disabled={sharingLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaLocationArrow className={sharingLoading ? "animate-spin" : ""} />
          {sharingLoading ? "Updating Location..." : "Update My Location"}
        </button>
      )}

      {!isConnected && !isCheckout && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          <FaExclamationCircle className="mt-0.5 shrink-0" />
          <p>
            Live connection is temporarily unavailable. Location updates may
            be delayed until the connection is restored.
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveLocationMap;