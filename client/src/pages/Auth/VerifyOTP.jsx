import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import OtpInput from 'react-otp-input';
import { FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const userId = location.state?.userId;

  useEffect(() => {
    if (!userId) {
      navigate('/signup');
    }
  }, [userId, navigate]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setLoading(true);
    const result = await verifyOTP(userId, otp);
    
    if (result.success) {
      // Redirect based on role
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
    }
    
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await axios.post(`${API_URL}/auth/resend-otp`, { userId });
      toast.success('OTP sent successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg glass hover:shadow-lg transition-all"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="card text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mb-4">
            <FaCheckCircle className="text-white text-2xl" />
          </div>
          
          <h1 className="text-3xl font-bold mb-2">Verify Your Phone</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            We've sent a 6-digit code to your phone number. Please enter it below.
          </p>

          <div className="flex justify-center mb-6">
            <OtpInput
              value={otp}
              onChange={setOtp}
              numInputs={6}
              renderInput={(props) => (
                <input
                  {...props}
                  className="w-12 h-12 mx-1 text-center text-xl font-semibold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-primary-500 focus:outline-none bg-white dark:bg-gray-800"
                />
              )}
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={loading || otp.length !== 6}
            className="btn-primary w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="text-primary-600 hover:text-primary-700 font-semibold disabled:opacity-50"
          >
            {resending ? 'Resending...' : "Didn't receive? Resend OTP"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;

