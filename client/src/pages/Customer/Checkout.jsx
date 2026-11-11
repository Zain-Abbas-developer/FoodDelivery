import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaCreditCard, FaCalendar } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import LiveLocationMap from '../../components/LiveLocationMap';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Checkout = () => {
  const { cart, getTotal, clearCart, restaurantId } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: {
      street: '',
      city: '',
      province: '',
      postalCode: '',
      coordinates: { lat: 0, lng: 0 }
    },
    paymentMethod: 'cod',
    promoCode: '',
    tip: 0,
    scheduledTime: ''
  });
  const [discount, setDiscount] = useState(0);
  const [restaurant, setRestaurant] = useState(null);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/customer');
      return;
    }

    if (!restaurantId) {
      toast.error('No restaurant selected. Please add items to your cart.');
      navigate('/customer');
      return;
    }

    fetchRestaurant();
    getUserLocation();
  }, [restaurantId, navigate, cart.length]);

  const fetchRestaurant = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching restaurant with ID:', restaurantId);
      const response = await axios.get(`${API_URL}/customer/restaurants/${restaurantId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Restaurant fetched:', response.data);
      setRestaurant(response.data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to load restaurant details');
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('User location obtained:', coords);
          setFormData(prev => ({
            ...prev,
            deliveryAddress: {
              ...prev.deliveryAddress,
              coordinates: coords
            }
          }));
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Default to Lahore
          const defaultCoords = {
            lat: 31.5204,
            lng: 74.3587
          };
          setFormData(prev => ({
            ...prev,
            deliveryAddress: {
              ...prev.deliveryAddress,
              coordinates: defaultCoords
            }
          }));
        }
      );
    }
  };

  const handleVerifyPromo = async () => {
    if (!formData.promoCode) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/customer/verify-promo`,
        { code: formData.promoCode, orderAmount: getTotal() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDiscount(response.data.discount);
      toast.success('Promo code applied!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid promo code');
      setDiscount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!restaurantId) {
        toast.error('No restaurant selected');
        setLoading(false);
        return;
      }

      if (!formData.deliveryAddress.street || !formData.deliveryAddress.city) {
        toast.error('Please fill in complete delivery address');
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const orderData = {
        restaurantId,
        items: cart.map(item => ({
          menuItemId: item.menuItemId || item._id,
          quantity: item.quantity
        })),
        deliveryAddress: {
          street: formData.deliveryAddress.street,
          city: formData.deliveryAddress.city,
          province: formData.deliveryAddress.province,
          postalCode: formData.deliveryAddress.postalCode,
          coordinates: formData.deliveryAddress.coordinates
        },
        paymentMethod: formData.paymentMethod || 'cod',
        tip: formData.tip || 0
      };

      // Only add optional fields if they have values
      if (formData.promoCode) {
        orderData.promoCode = formData.promoCode;
      }
      if (formData.scheduledTime) {
        orderData.scheduledTime = formData.scheduledTime;
      }

      console.log('Submitting order:', orderData);
      console.log('Cart items:', cart);

      const response = await axios.post(
        `${API_URL}/orders`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Order created:', response.data);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/customer/orders/${response.data._id}/track`);
    } catch (error) {
      console.error('Error placing order:', error);
      console.error('Error response:', error.response?.data);
      console.error('Cart items:', cart);
      
      let errorMessage = 'Failed to place order';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errorArray = error.response.data.errors;
        if (Array.isArray(errorArray) && errorArray.length > 0) {
          errorMessage = errorArray.map(err => err.msg).join(', ');
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Only customers can place orders.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Restaurant not found.';
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getTotal();
  const deliveryFee = restaurant?.deliveryFee || 0;
  const tip = formData.tip || 0;
  const total = subtotal + deliveryFee + tip - discount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Debug Info - Remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p>RestaurantId: {restaurantId || 'NOT SET'}</p>
            <p>Cart Items: {cart.length}</p>
            <p>Cart: {JSON.stringify(cart.slice(0, 1))}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Address */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <FaMapMarkerAlt />
                  <span>Delivery Address</span>
                </h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={formData.deliveryAddress.street}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, street: e.target.value }
                    })}
                    className="input-field"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="City"
                      value={formData.deliveryAddress.city}
                      onChange={(e) => setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress, city: e.target.value }
                      })}
                      className="input-field"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Province"
                      value={formData.deliveryAddress.province}
                      onChange={(e) => setFormData({
                        ...formData,
                        deliveryAddress: { ...formData.deliveryAddress, province: e.target.value }
                      })}
                      className="input-field"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={formData.deliveryAddress.postalCode}
                    onChange={(e) => setFormData({
                      ...formData,
                      deliveryAddress: { ...formData.deliveryAddress, postalCode: e.target.value }
                    })}
                    className="input-field"
                    required
                  />
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-900 rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700">
                    <LiveLocationMap
                      customerLocation={formData.deliveryAddress.coordinates?.lat ? {
                        lat: formData.deliveryAddress.coordinates.lat,
                        lng: formData.deliveryAddress.coordinates.lng,
                        updatedAt: new Date()
                      } : null}
                      riderLocation={null}
                      deliveryAddress={formData.deliveryAddress}
                      isConnected={false}
                      isCheckout={true}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <FaCreditCard />
                  <span>Payment Method</span>
                </h2>
                <div className="space-y-2">
                  {['cod', 'jazzcash', 'easypaisa', 'stripe'].map((method) => (
                    <label key={method} className="flex items-center space-x-2 p-3 glass rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={formData.paymentMethod === method}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className="capitalize">{method === 'cod' ? 'Cash on Delivery' : method}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Promo Code */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Promo Code</h2>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPromo}
                    className="btn-secondary"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Tip */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4">Tip for Rider</h2>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 50, 100, 200].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setFormData({ ...formData, tip: amount })}
                      className={`p-3 rounded-lg font-semibold transition-all ${
                        formData.tip === amount
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      PKR {amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Order */}
              <div className="card">
                <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <FaCalendar />
                  <span>Schedule Order (Optional)</span>
                </h2>
                <input
                  type="datetime-local"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg py-4"
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                {cart.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between text-sm">
                    <span>{item.name} × {item.quantity}</span>
                    <span>PKR {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>PKR {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>PKR {deliveryFee.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-PKR {discount.toFixed(2)}</span>
                  </div>
                )}
                {tip > 0 && (
                  <div className="flex justify-between">
                    <span>Tip</span>
                    <span>PKR {tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span>Total</span>
                  <span>PKR {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

