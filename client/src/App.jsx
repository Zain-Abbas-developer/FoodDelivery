import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Signup from './pages/Auth/Signup';
import VerifyOTP from './pages/Auth/VerifyOTP';
import CustomerDashboard from './pages/Customer/Dashboard';
import RestaurantDashboard from './pages/Restaurant/Dashboard';
import RiderDashboard from './pages/Rider/Dashboard';
import Checkout from './pages/Customer/Checkout';
import OrderTracking from './pages/Customer/OrderTracking';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              
              {/* Customer Routes */}
              <Route
                path="/customer/*"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Restaurant Routes */}
              <Route
                path="/restaurant/*"
                element={
                  <ProtectedRoute allowedRoles={['restaurant_owner']}>
                    <RestaurantDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Rider Routes */}
              <Route
                path="/rider/*"
                element={
                  <ProtectedRoute allowedRoles={['rider']}>
                    <RiderDashboard />
                  </ProtectedRoute>
                }
              />
              
              {/* Common Routes */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orders/:id/track"
                element={
                  <ProtectedRoute allowedRoles={['customer']}>
                    <OrderTracking />
                  </ProtectedRoute>
                }
              />
              
              {/* 404 Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

