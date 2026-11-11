import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaUtensils, FaMotorcycle, FaStore, FaMapMarkerAlt } from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Landing = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'customer':
        return '/customer';
      case 'restaurant_owner':
        return '/restaurant';
      case 'rider':
        return '/rider';
      default:
        return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2"
          >
            <FaUtensils className="text-primary-500 text-2xl" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              FoodDelivery PK
            </span>
          </motion.div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg glass hover:shadow-lg transition-all"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            {isAuthenticated ? (
              <Link to={getDashboardPath()} className="btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <div className="flex space-x-3">
                <Link to="/login" className="btn-secondary">
                  Sign In
                </Link>
                <Link to="/signup" className="btn-primary">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 bg-clip-text text-transparent">
            Delicious Food Delivered to Your Door
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Order from your favorite Pakistani restaurants. Fast, fresh, and delivered with care.
          </p>
          {!isAuthenticated && (
            <div className="flex justify-center space-x-4">
              <Link to="/signup" className="btn-primary text-lg px-8 py-4">
                Get Started
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                Sign In
              </Link>
            </div>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mt-20"
        >
          <div className="card text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaStore className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">Restaurant Owners</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your menu, track orders, and grow your business with our platform.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMotorcycle className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">Riders</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Earn money by delivering orders. Flexible schedule and competitive rates.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMapMarkerAlt className="text-white text-2xl" />
            </div>
            <h3 className="text-xl font-bold mb-2">Live Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Track your order in real-time from restaurant to your doorstep.
            </p>
          </div>
        </motion.div>

        {/* Famous Pakistani Recipes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20"
        >
          <h2 className="text-3xl font-bold text-center mb-8">Famous Pakistani Recipes</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {['Biryani', 'Karahi', 'Nihari', 'BBQ'].map((recipe, index) => (
              <motion.div  //this is making error we make it further
                key={recipe}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                className="card text-center hover:scale-105 transition-transform cursor-pointer"
              >
                <div className="w-full h-32 bg-gradient-to-br from-primary-200 to-primary-400 rounded-lg mb-3 "></div>
                <h3 className="font-semibold">{recipe}</h3>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="glass-strong mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 FoodDelivery PK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

