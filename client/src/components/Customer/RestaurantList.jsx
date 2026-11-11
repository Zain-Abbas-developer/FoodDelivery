import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaStar, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const RestaurantList = ({ restaurants, loading }) => {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="card">
            <Skeleton height={200} className="mb-4" />
            <Skeleton height={24} className="mb-2" />
            <Skeleton height={16} width="60%" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Nearby Restaurants</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {restaurants.map((restaurant, index) => (
          <motion.div
            key={restaurant._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Link to={`restaurant/${restaurant._id}`}>
              <div className="card hover:scale-105 transition-transform cursor-pointer">
                <div className="w-full h-48 bg-gradient-to-br from-primary-200 to-primary-400 rounded-lg mb-4 relative overflow-hidden">
                  {restaurant.image && (
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  {restaurant.featured && (
                    <span className="absolute top-2 right-2 bg-primary-500 text-white px-2 py-1 rounded text-xs font-semibold">
                      Featured
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{restaurant.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {restaurant.description || 'Delicious food awaits you'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <FaStar className="text-yellow-400" />
                    <span className="font-semibold">{restaurant.rating.toFixed(1)}</span>
                    <span className="text-gray-500">({restaurant.totalReviews})</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <FaClock />
                    <span>{restaurant.estimatedDeliveryTime} min</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-gray-500 text-sm mt-2">
                  <FaMapMarkerAlt />
                  <span>{restaurant.location.city}</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
      {restaurants.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No restaurants found</p>
        </div>
      )}
    </div>
  );
};

export default RestaurantList;

