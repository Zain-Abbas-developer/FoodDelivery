
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaShoppingCart,
  FaArrowLeft,
  FaPlus,
  FaMinus,
  FaMapMarkerAlt,
  FaClock,
  FaStar,
  FaUtensils,
  FaLeaf,
  FaPepperHot,
  FaTrash,
} from 'react-icons/fa';

import axios from 'axios';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';

const API_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const formatPrice = (price) =>
  `PKR ${Number(price || 0).toLocaleString('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { addToCart, removeFromCart, clearCart } = useCart();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cartItems, setCartItems] = useState({});
  const [mobileSummary, setMobileSummary] = useState(false);

  // Fetch restaurant and menu
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('token');

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        };

        const [restaurantResponse, menuResponse] = await Promise.all([
          axios.get(
            `${API_URL}/customer/restaurants/${id}`,
            config
          ),
          axios.get(
            `${API_URL}/customer/restaurants/${id}/menu`,
            config
          ),
        ]);

        setRestaurant(restaurantResponse.data);

        const menuData = menuResponse.data;

        setMenuItems(
          Array.isArray(menuData)
            ? menuData
            : menuData?.menuItems || menuData?.items || []
        );
      } catch (error) {
        if (
          error.name !== 'CanceledError' &&
          error.name !== 'AbortError'
        ) {
          console.error('Restaurant details error:', error);
          toast.error('Unable to load restaurant details');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => controller.abort();
  }, [id]);

  // Generate categories dynamically
  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        menuItems
          .map((item) => item.category)
          .filter(Boolean)
      ),
    ];

    return ['all', ...uniqueCategories];
  }, [menuItems]);

  // Filter menu
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return menuItems;
    }

    return menuItems.filter(
      (item) => item.category === selectedCategory
    );
  }, [menuItems, selectedCategory]);

  // Calculate order summary
  const selectedItems = useMemo(() => {
    return menuItems.filter(
      (item) => Number(cartItems[item._id]) > 0
    );
  }, [menuItems, cartItems]);

  const subtotal = useMemo(() => {
    return selectedItems.reduce((total, item) => {
      return (
        total +
        Number(item.price || 0) *
          Number(cartItems[item._id] || 0)
      );
    }, 0);
  }, [selectedItems, cartItems]);

  const deliveryFee = selectedItems.length > 0 ? 50 : 0;
  const total = subtotal + deliveryFee;

  const totalQuantity = Object.values(cartItems).reduce(
    (sum, quantity) => sum + Number(quantity || 0),
    0
  );

  // Add item to cart
  const handleAddToCart = (item) => {
    setCartItems((prev) => ({
      ...prev,
      [item._id]: (prev[item._id] || 0) + 1,
    }));

    addToCart(item, restaurant);
    toast.success(`${item.name} added to cart`);
  };

  // Remove one item
  const handleRemoveFromCart = (item) => {
    if (!cartItems[item._id]) return;

    setCartItems((prev) => {
      const updated = { ...prev };

      if (updated[item._id] > 1) {
        updated[item._id] -= 1;
      } else {
        delete updated[item._id];
      }

      return updated;
    });

    removeFromCart(item._id);
  };

  // Clear cart
  const handleClearCart = () => {
    setCartItems({});
    clearCart();
    toast.success('Cart cleared');
  };

  // Checkout
  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    navigate('/customer/checkout', {
      state: { restaurant },
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading restaurant menu...
          </p>
        </div>
      </div>
    );
  }

  // Not found
  if (!restaurant) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
          <FaUtensils className="text-3xl" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Restaurant not found
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This restaurant may no longer be available.
        </p>

        <button
          onClick={() => navigate('/customer')}
          className="btn-primary mt-6"
        >
          <FaArrowLeft className="mr-2 inline" />
          Back to Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-7 pb-24 lg:pb-8">

      {/* Back Navigation */}
      <button
        onClick={() => navigate('/customer')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-primary-500 dark:text-gray-400"
      >
        <FaArrowLeft />
        Back to Restaurants
      </button>

      {/* Restaurant Header */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="grid md:grid-cols-[1fr_280px]">
          <div className="p-6 sm:p-8">
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
              <FaUtensils />
              RESTAURANT
            </span>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              {restaurant.name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
              {restaurant.description || 'Explore the menu and order your favourite food.'}
            </p>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <FaMapMarkerAlt className="text-primary-500" />
                <span>
                  {[restaurant.location?.address, restaurant.location?.city]
                    .filter(Boolean)
                    .join(', ') || 'Location unavailable'}
                </span>
              </div>

              {restaurant.rating != null && (
                <div className="flex items-center gap-2">
                  <FaStar className="text-yellow-500" />
                  <span>{restaurant.rating}</span>
                </div>
              )}

              {restaurant.deliveryTime && (
                <div className="flex items-center gap-2">
                  <FaClock className="text-primary-500" />
                  <span>{restaurant.deliveryTime}</span>
                </div>
              )}
            </div>
          </div>

          <div className="relative min-h-48 bg-gray-100 dark:bg-gray-800">
            {restaurant.image ? (
              <img
                src={restaurant.image}
                alt={restaurant.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center text-gray-300 dark:text-gray-600">
                <FaUtensils className="text-5xl" />
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Menu and Order Summary */}
      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">

        {/* Menu Section */}
        <section className="min-w-0">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Explore Menu
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose from our available food items.
            </p>
          </div>

          {/* Category Navigation */}
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const active = selectedCategory === category;

              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                    active
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-primary-300 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }`}
                >
                  {category === 'all'
                    ? 'All Items'
                    : category}
                </button>
              );
            })}
          </div>

          {/* Menu Grid */}
          {filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item, index) => {
                const quantity = cartItems[item._id] || 0;

                return (
                  <motion.article
                    key={item._id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                  >
                    {/* Food Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-gray-300 dark:text-gray-600">
                          <FaUtensils className="text-4xl" />
                        </div>
                      )}

                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        {item.isVegetarian && (
                          <span className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-green-700 shadow-sm">
                            <FaLeaf />
                            Veg
                          </span>
                        )}

                        {item.isSpicy && (
                          <span className="flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-red-600 shadow-sm">
                            <FaPepperHot />
                            Spicy
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Food Information */}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {item.name}
                        </h3>

                        <span className="whitespace-nowrap text-sm font-bold text-primary-600 dark:text-primary-400">
                          {formatPrice(item.price)}
                        </span>
                      </div>

                      <p className="mb-5 min-h-10 text-sm leading-5 text-gray-500 dark:text-gray-400">
                        {item.description || 'No description available.'}
                      </p>

                      {/* Add to Cart */}
                      {item.isAvailable ? (
                        quantity > 0 ? (
                          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-1.5 dark:border-gray-700">
                            <button
                              onClick={() => handleRemoveFromCart(item)}
                              className="flex h-9 w-10 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 dark:hover:bg-red-500/10"
                              aria-label={`Remove ${item.name}`}
                            >
                              <FaMinus />
                            </button>

                            <span className="font-bold text-gray-900 dark:text-white">
                              {quantity}
                            </span>

                            <button
                              onClick={() => handleAddToCart(item)}
                              className="flex h-9 w-10 items-center justify-center rounded-lg bg-primary-500 text-white transition hover:bg-primary-600"
                              aria-label={`Add ${item.name}`}
                            >
                              <FaPlus />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="btn-primary w-full"
                          >
                            <FaShoppingCart className="mr-2 inline" />
                            Add to Cart
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          className="w-full cursor-not-allowed rounded-xl bg-gray-100 py-3 text-sm font-semibold text-gray-400 dark:bg-gray-800"
                        >
                          Currently Unavailable
                        </button>
                      )}
                    </div>
                  </motion.article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
              <FaUtensils className="mx-auto mb-4 text-3xl text-gray-300" />

              <h3 className="font-semibold text-gray-800 dark:text-white">
                No menu items found
              </h3>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Try selecting another category.
              </p>
            </div>
          )}
        </section>

        {/* Desktop Order Summary */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Your Order
              </h2>

              <span className="rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                {totalQuantity} Items
              </span>
            </div>

            {selectedItems.length === 0 ? (
              <div className="py-10 text-center">
                <FaShoppingCart className="mx-auto mb-4 text-3xl text-gray-300" />

                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Your cart is empty
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Add food items to get started.
                </p>
              </div>
            ) : (
              <>
                <div className="max-h-80 space-y-4 overflow-y-auto pr-1">
                  {selectedItems.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4 dark:border-gray-800"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {item.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {cartItems[item._id]} × {formatPrice(item.price)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                          {formatPrice(
                            Number(item.price || 0) *
                              cartItems[item._id]
                          )}
                        </p>

                        <button
                          onClick={() => handleRemoveFromCart(item)}
                          className="mt-1 text-xs text-red-500 hover:text-red-600"
                        >
                          Remove one
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 space-y-3 border-t border-gray-200 pt-4 text-sm dark:border-gray-800">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-gray-500 dark:text-gray-400">
                    <span>Delivery Fee</span>
                    <span>{formatPrice(deliveryFee)}</span>
                  </div>

                  <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-gray-900 dark:border-gray-800 dark:text-white">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="btn-primary mt-5 w-full"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={handleClearCart}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-500/10"
                >
                  <FaTrash />
                  Clear Cart
                </button>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Cart Bar */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <button
            onClick={() => setMobileSummary(!mobileSummary)}
            className="flex w-full items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {totalQuantity} Items · {formatPrice(total)}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {mobileSummary ? 'Hide order summary' : 'View order summary'}
              </p>
            </div>

            <FaShoppingCart className="text-xl text-primary-500" />
          </button>

          {mobileSummary && (
            <div className="mt-4 max-h-64 space-y-3 overflow-y-auto border-t border-gray-200 pt-4 dark:border-gray-800">
              {selectedItems.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.name} × {cartItems[item._id]}
                  </span>

                  <span className="font-semibold">
                    {formatPrice(
                      Number(item.price || 0) * cartItems[item._id]
                    )}
                  </span>
                </div>
              ))}

              <div className="flex justify-between border-t border-gray-200 pt-3 font-bold dark:border-gray-800">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          )}

          <button
            onClick={handleCheckout}
            className="btn-primary mt-3 w-full"
          >
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetails;
