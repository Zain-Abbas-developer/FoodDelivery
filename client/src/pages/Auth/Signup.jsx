
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaUtensils,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaArrowRight,
  FaMoon,
  FaSun,
  FaArrowLeft,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const { signup } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = formData;
      const result = await signup(signupData);

      if (result?.success) {
        navigate("/verify-otp", {
          state: { userId: result.userId },
        });
      } else {
        setError(result?.message || "Unable to create your account.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: "customer", label: "Customer" },
    { value: "restaurant_owner", label: "Restaurant" },
    { value: "rider", label: "Rider" },
  ];

  const inputClass =
    "w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex">

      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=85"
          alt="Freshly prepared food"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">

          <Link to="/" className="flex items-center gap-3 w-fit">
            <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center">
              <FaUtensils className="text-primary-600 text-xl" />
            </div>

            <span className="text-xl font-bold tracking-tight">
              FoodDelivery <span className="text-primary-400">PK</span>
            </span>
          </Link>

          <div className="max-w-lg">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary-300 mb-5">
              Join Our Community
            </p>

            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Good food.
              <br />
              Great moments.
              <br />
              Delivered to you.
            </h1>

            <p className="text-gray-200 text-base leading-7 max-w-md">
              Create your account and discover restaurants,
              explore delicious meals, and enjoy convenient
              food delivery.
            </p>
          </div>

          <p className="text-sm text-gray-300">
            © {new Date().getFullYear()} FoodDelivery PK
          </p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">

        {/* Top Navigation */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition"
          >
            <FaArrowLeft />
            Back to home
          </Link>

          <button
            onClick={toggleTheme}
            type="button"
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label="Toggle theme"
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </button>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-10 py-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md"
          >

            {/* Mobile Logo */}
            <Link
              to="/"
              className="lg:hidden flex items-center gap-3 mb-8"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <FaUtensils className="text-white" />
              </div>

              <span className="text-lg font-bold text-gray-900 dark:text-white">
                FoodDelivery PK
              </span>
            </Link>

            <div className="mb-7">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Create your account
              </h2>

              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Enter your details to get started.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Full Name
                </label>

                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Email Address
                </label>

                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>

                <div className="relative">
                  <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+92 300 1234567"
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Account Type
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          role: role.value,
                        })
                      }
                      className={`py-2.5 px-2 text-xs sm:text-sm font-medium rounded-lg border transition ${
                        formData.role === role.value
                          ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary-300"
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Password
                </label>

                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Confirm Password
                </label>

                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400"
                >
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 btn-primary py-3 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
                {!loading && <FaArrowRight />}
              </button>

            </form>

            {/* Login Link */}
            <div className="mt-7 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-primary-600 hover:text-primary-700"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
