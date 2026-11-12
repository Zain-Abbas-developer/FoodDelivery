
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import OtpInput from "react-otp-input";
import {
  FaUtensils,
  FaCheckCircle,
  FaShieldAlt,
  FaArrowLeft,
  FaMoon,
  FaSun,
  FaRedo,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

import axios from "axios";
import toast from "react-hot-toast";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  const { verifyOTP } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const userId = location.state?.userId;

  useEffect(() => {
    if (!userId) {
      navigate("/signup", { replace: true });
    }
  }, [userId, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await verifyOTP(userId, otp);

      if (result?.success) {
        toast.success("Your account has been verified!");

        switch (result.user?.role) {
          case "customer":
            navigate("/customer", { replace: true });
            break;

          case "restaurant_owner":
            navigate("/restaurant", { replace: true });
            break;

          case "rider":
            navigate("/rider", { replace: true });
            break;

          default:
            navigate("/", { replace: true });
        }
      } else {
        setError(result?.message || "Invalid or expired OTP.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || loading) return;

    setResending(true);
    setError("");

    try {
      await axios.post(`${API_URL}/auth/resend-otp`, {
        userId,
      });

      setOtp("");
      toast.success("A new verification code has been sent.");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to resend OTP. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

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
              Account Security
            </p>

            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              One more step.
              <br />
              Then enjoy your
              <br />
              favourite food.
            </h1>

            <p className="text-gray-200 text-base leading-7 max-w-md">
              We use verification codes to help protect your account
              and make your FoodDelivery experience more secure.
            </p>

          </div>

          <div className="flex items-center gap-3 text-sm text-gray-300">
            <FaShieldAlt className="text-primary-400 text-lg" />
            Secure account verification
          </div>

        </div>
      </div>

      {/* Right Side - OTP Verification */}
      <div className="w-full lg:w-1/2 flex flex-col min-h-screen">

        {/* Top Navigation */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-6">

          <Link
            to="/signup"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition"
          >
            <FaArrowLeft />
            Back to signup
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

        {/* Verification Content */}
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
              className="lg:hidden flex items-center gap-3 mb-10"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <FaUtensils className="text-white" />
              </div>

              <span className="text-lg font-bold text-gray-900 dark:text-white">
                FoodDelivery PK
              </span>
            </Link>

            {/* Verification Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-7">
              <FaCheckCircle className="text-primary-600 dark:text-primary-400 text-3xl" />
            </div>

            <div className="mb-8">

              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Verify your account
              </h2>

              <p className="text-gray-500 dark:text-gray-400 text-sm leading-6">
                We've sent a 6-digit verification code to your
                registered phone number. Enter the code below
                to complete your registration.
              </p>

            </div>

            <form onSubmit={handleVerify}>

              {/* OTP Input */}
              <div className="mb-6">

                <label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">
                  Verification Code
                </label>

                <div className="flex justify-start">
                  <OtpInput
                    value={otp}
                    onChange={(value) => {
                      setOtp(value);
                      setError("");
                    }}
                    numInputs={6}
                    shouldAutoFocus
                    inputType="tel"
                    renderSeparator={<span className="w-2" />}
                    renderInput={(props) => (
                      <input
                        {...props}
                        className="!w-11 sm:!w-14 !h-12 sm:!h-14 text-center text-xl font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none transition focus:!border-primary-500 focus:!ring-2 focus:!ring-primary-500/10"
                        aria-label="OTP digit"
                      />
                    )}
                  />
                </div>

              </div>

              {/* Error Message */}
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-600 dark:text-red-400 mb-5"
                >
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Verify Account"}
                {!loading && <FaCheckCircle />}
              </button>

            </form>

            {/* Resend OTP */}
            <div className="mt-8 text-center">

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Didn't receive the verification code?
              </p>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending || loading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50 transition"
              >
                <FaRedo className={resending ? "animate-spin" : ""} />

                {resending ? "Sending code..." : "Resend verification code"}
              </button>

            </div>

            <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Keep your verification code private. Never share it with anyone.
              </p>
            </div>

          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
