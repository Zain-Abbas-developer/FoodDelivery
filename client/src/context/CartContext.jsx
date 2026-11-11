import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  const [restaurantId, setRestaurantId] = useState(() => {
    const savedRestaurantId = localStorage.getItem('restaurantId');
    return savedRestaurantId ? savedRestaurantId : null;
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (restaurantId) {
      localStorage.setItem('restaurantId', restaurantId);
    } else {
      localStorage.removeItem('restaurantId');
    }
  }, [restaurantId]);

  const addToCart = (item, restaurant) => {
    if (restaurantId && restaurantId !== restaurant?._id) {
      if (window.confirm('You have items from another restaurant. Clear cart and add this item?')) {
        setCart([{ ...item, menuItemId: item._id, quantity: 1 }]);
        setRestaurantId(restaurant?._id);
      }
    } else {
      setRestaurantId(restaurant?._id);
      const existingItem = cart.find(cartItem => cartItem.menuItemId === item._id);
      
      if (existingItem) {
        setCart(cart.map(cartItem =>
          cartItem.menuItemId === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        ));
      } else {
        setCart([...cart, { ...item, menuItemId: item._id, quantity: 1 }]);
      }
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.menuItemId !== itemId));
    if (cart.length === 1) {
      setRestaurantId(null);
    }
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item =>
        item.menuItemId === itemId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const clearCart = () => {
    setCart([]);
    setRestaurantId(null);
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      restaurantId,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotal,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};

