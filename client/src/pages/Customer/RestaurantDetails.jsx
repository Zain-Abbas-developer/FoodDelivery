import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaShoppingCart, FaArrowLeft, FaPlus, FaMinus } from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, removeFromCart, clearCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartItems, setCartItems] = useState({});

  useEffect(() => {
    fetchRestaurantDetails();
    fetchMenuItems();
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/customer/restaurants/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRestaurant(response.data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load restaurant details');
    }
  };

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/customer/restaurants/${id}/menu`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuItems(response.data);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  const handleAddToCart = (item) => {
    setCartItems(prev => ({
      ...prev,
      [item._id]: (prev[item._id] || 0) + 1
    }));
    addToCart(item, restaurant);
    toast.success(`${item.name} added to cart`);
  };

  const handleRemoveFromCart = (item) => {
    if (cartItems[item._id] > 1) {
      setCartItems(prev => ({
        ...prev,
        [item._id]: prev[item._id] - 1
      }));
    } else {
      setCartItems(prev => {
        const updated = { ...prev };
        delete updated[item._id];
        return updated;
      });
    }
    removeFromCart(item._id);
    toast.success(`${item.name} removed from cart`);
  };

  const handleCheckout = () => {
    if (Object.keys(cartItems).length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    navigate('/customer/checkout', { state: { restaurant } });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-gray-600 dark:text-gray-400">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-red-500">Restaurant not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <FaArrowLeft />
            <span>Back to Restaurants</span>
          </button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{restaurant.name}</h1>
              <p className="text-gray-600 dark:text-gray-400 mb-2">{restaurant.description}</p>
              <p className="text-sm text-gray-500">{restaurant.location?.address}, {restaurant.location?.city}</p>
            </div>
            {restaurant.image && (
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="w-32 h-32 rounded-lg object-cover mt-4 md:mt-0"
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Menu Items */}
          <div className="md:col-span-2">
            {/* Category Filter */}
            <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'btn-primary'
                      : 'btn-secondary'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card"
                >
                  <div className="w-full h-40 bg-gradient-to-br from-primary-200 to-primary-400 rounded-lg mb-3 overflow-hidden">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {item.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-bold text-primary-600">PKR {item.price.toFixed(2)}</p>
                    <div className="flex space-x-1">
                      {item.isVegetarian && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Veg</span>}
                      {item.isSpicy && <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Spicy</span>}
                    </div>
                  </div>
                  {item.isAvailable ? (
                    <div className="flex items-center space-x-2">
                      {cartItems[item._id] > 0 ? (
                        <div className="flex items-center space-x-2 flex-1">
                          <button
                            onClick={() => handleRemoveFromCart(item)}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition-all"
                          >
                            <FaMinus className="inline" />
                          </button>
                          <span className="w-8 text-center font-bold">{cartItems[item._id]}</span>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-all"
                          >
                            <FaPlus className="inline" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="btn-primary w-full"
                        >
                          <FaShoppingCart className="inline mr-2" />
                          Add to Cart
                        </button>
                      )}
                    </div>
                  ) : (
                    <button disabled className="btn-secondary w-full opacity-50 cursor-not-allowed">
                      Not Available
                    </button>
                  )}
                </motion.div>
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No items available in this category</p>
              </div>
            )}
          </div>

          {/* Cart Summary */}
          <div className="md:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-2xl font-bold mb-4">Order Summary</h2>
              <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                {Object.keys(cartItems).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Your cart is empty</p>
                ) : (
                  menuItems
                    .filter(item => cartItems[item._id] > 0)
                    .map(item => (
                      <div key={item._id} className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cartItems[item._id]} x PKR {item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold">PKR {(item.price * cartItems[item._id]).toFixed(2)}</p>
                      </div>
                    ))
                )}
              </div>

              {Object.keys(cartItems).length > 0 && (
                <>
                  <div className="border-t pt-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span>Subtotal</span>
                      <span className="font-semibold">
                        PKR {menuItems
                          .filter(item => cartItems[item._id] > 0)
                          .reduce((sum, item) => sum + (item.price * cartItems[item._id]), 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between mb-2">
                      <span>Delivery Fee</span>
                      <span className="font-semibold">PKR 50.00</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span>
                        PKR {(menuItems
                          .filter(item => cartItems[item._id] > 0)
                          .reduce((sum, item) => sum + (item.price * cartItems[item._id]), 0) + 50)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="btn-primary w-full"
                  >
                    <FaShoppingCart className="inline mr-2" />
                    Proceed to Checkout
                  </button>
                  <button
                    onClick={() => {
                      setCartItems({});
                      clearCart();
                      toast.success('Cart cleared');
                    }}
                    className="btn-secondary w-full mt-2"
                  >
                    Clear Cart
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
