
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaUtensils,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaArrowLeft,
  FaShieldAlt,
} from 'react-icons/fa';

import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(
        formData.email,
        formData.password
      );

      if (!result.success) {
        setError(result.message || 'Unable to sign in. Please check your credentials.');
        return;
      }

      switch (result.user.role) {
        case 'customer':
          navigate('/customer');
          break;
        case 'restaurant_owner':
          navigate('/restaurant');
          break;
        case 'rider':
          navigate('/rider');
          break;
        default:
          navigate('/');
      }
    } catch (err) {
      setError(
        err.message || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white dark:bg-gray-950">

      {/* LEFT - BRAND SECTION */}

      <div className="hidden lg:block relative overflow-hidden bg-gray-950">

        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1400&q=85"
          alt="Freshly prepared food"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

        <div className="relative z-10 h-full flex flex-col justify-between p-12 text-white">

          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center">
              <FaUtensils className="text-xl" />
            </div>

            <div>
              <h2 className="text-xl font-bold">
                FoodDelivery
              </h2>
              <p className="text-xs text-gray-300">
                Pakistan
              </p>
            </div>
          </Link>

          <div className="max-w-lg mb-12">

            <span className="text-sm font-semibold text-primary-300">
              GOOD FOOD, BETTER MOMENTS
            </span>

            <h1 className="text-5xl font-extrabold leading-tight mt-4">
              Your next favorite meal is just a few clicks away.
            </h1>

            <p className="text-gray-300 mt-6 text-lg leading-relaxed">
              Discover great restaurants, explore delicious meals
              and enjoy convenient food delivery wherever you are.
            </p>

            <div className="flex items-center gap-3 mt-9 pt-7 border-t border-white/20">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <FaShieldAlt className="text-primary-300" />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  A better way to order
                </p>
                <p className="text-xs text-gray-400">
                  Simple, convenient and reliable.
                </p>
              </div>
            </div>

          </div>

          <p className="text-xs text-gray-400">
            © 2026 FoodDelivery PK. All rights reserved.
          </p>

        </div>
      </div>

      {/* RIGHT - LOGIN FORM */}

      <div className="relative flex items-center justify-center px-5 py-12 sm:px-10">

        {/* Theme Toggle */}

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="absolute top-6 right-6 w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-800 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 transition"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >

          {/* Mobile Brand */}

          <Link
            to="/"
            className="lg:hidden flex items-center gap-3 mb-12"
          >
            <div className="w-11 h-11 rounded-xl bg-primary-600 flex items-center justify-center">
              <FaUtensils className="text-white text-lg" />
            </div>

            <span className="text-xl font-bold text-gray-900 dark:text-white">
              FoodDelivery
            </span>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 transition mb-10"
          >
            <FaArrowLeft className="text-xs" />
            Back to home
          </Link>

          {/* Heading */}

          <div className="mb-8">
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-3">
              WELCOME BACK
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Sign in to your account
            </h1>

            <p className="text-gray-500 dark:text-gray-400 mt-3">
              Enter your details to continue ordering your
              favorite food.
            </p>
          </div>

          {/* Form */}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
              >
                Email address
              </label>

              <div className="relative">
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  className="w-full h-12 pl-11 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition text-sm"
                />
              </div>
            </div>

            {/* Password */}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="password"
                  className="text-sm font-semibold"
                >
                  Password
                </label>
              </div>

              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full h-12 pl-11 pr-12 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 transition text-sm"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-600"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Error Message */}

            {error && (
              <div
                role="alert"
                className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-600 dark:text-red-400"
              >
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold flex items-center justify-center gap-2 transition"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  Sign in
                  <FaArrowRight className="text-xs" />
                </>
              )}
            </button>

          </form>

          {/* Register Link */}

          <div className="mt-8 pt-7 border-t border-gray-200 dark:border-gray-800 text-center">

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="font-semibold text-primary-600 hover:text-primary-700"
              >
                Create an account
              </Link>
            </p>

          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            By continuing, you agree to our Terms of Service
            and Privacy Policy.
          </p>

        </motion.div>
      </div>
    </div>
  );
};

export default Login;
