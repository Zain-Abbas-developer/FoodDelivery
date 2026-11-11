const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Simple AI chatbot logic (can be enhanced with OpenAI API or similar)
const chatbotResponses = {
  greetings: [
    'Hello! How can I help you today?',
    'Hi there! What can I do for you?',
    'Assalam-o-Alaikum! How may I assist you?'
  ],
  orderStatus: async (orderId, userId) => {
    try {
      const order = await Order.findById(orderId)
        .populate('restaurantId', 'name')
        .populate('riderId', 'name phone');

      if (!order || order.customerId.toString() !== userId) {
        return 'Sorry, I could not find your order.';
      }

      const statusMessages = {
        'pending': 'Your order is pending and waiting for restaurant confirmation.',
        'restaurant_accepted': 'Restaurant has accepted your order.',
        'preparing': 'Your order is being prepared by the restaurant.',
        'rider_assigned': `A rider has been assigned to your order. ${order.riderId ? `Rider name: ${order.riderId.name}` : ''}`,
        'rider_picked_up': 'The rider has picked up your order from the restaurant.',
        'on_the_way': 'Your order is on the way! The rider is delivering it to you.',
        'delivered': 'Your order has been delivered! Enjoy your meal!',
        'cancelled': 'Your order has been cancelled.'
      };

      let response = `Order #${order.orderNumber}: ${statusMessages[order.status] || 'Unknown status'}`;

      if (order.status === 'on_the_way' && order.riderLocation) {
        response += ' The rider is currently on the way to your location.';
      }

      if (order.estimatedDeliveryTime) {
        const timeLeft = Math.round((new Date(order.estimatedDeliveryTime) - new Date()) / 60000);
        if (timeLeft > 0) {
          response += ` Estimated delivery time: ${timeLeft} minutes.`;
        }
      }

      return response;
    } catch (error) {
      return 'Sorry, I encountered an error while fetching your order status.';
    }
  },
  riderLocation: async (orderId, userId) => {
    try {
      const order = await Order.findById(orderId)
        .populate('riderId', 'name phone');

      if (!order || order.customerId.toString() !== userId) {
        return 'Sorry, I could not find your order.';
      }

      if (!order.riderId) {
        return 'No rider has been assigned to your order yet.';
      }

      if (order.status === 'delivered') {
        return 'Your order has already been delivered!';
      }

      if (order.riderLocation) {
        return `The rider is currently at the location. Your order is ${order.status === 'on_the_way' ? 'on the way' : 'being prepared'}.`;
      }

      return `Rider ${order.riderId.name} has been assigned to your order. They will pick it up soon.`;
    } catch (error) {
      return 'Sorry, I could not fetch the rider location.';
    }
  },
  default: [
    'I\'m here to help! You can ask me about your order status, rider location, or any other questions.',
    'How can I assist you? I can help with order tracking, delivery information, and more.',
    'Feel free to ask me anything about your orders or delivery!'
  ]
};

// @route   POST /api/chatbot/message
// @desc    Send message to chatbot
// @access  Private
router.post('/message', auth, [
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;
    const lowerMessage = message.toLowerCase();

    let response = '';

    // Greeting detection
    if (lowerMessage.match(/hello|hi|hey|assalam|salam/)) {
      response = chatbotResponses.greetings[
        Math.floor(Math.random() * chatbotResponses.greetings.length)
      ];
    }
    // Order status detection
    else if (lowerMessage.match(/order status|where is my order|order tracking|track order/)) {
      // Try to extract order ID or get latest order
      const orderIdMatch = message.match(/ORD\d+/);
      if (orderIdMatch) {
        const order = await Order.findOne({ orderNumber: orderIdMatch[0] });
        if (order) {
          response = await chatbotResponses.orderStatus(order._id, req.user.id);
        } else {
          response = 'I could not find an order with that number.';
        }
      } else {
        // Get latest order
        const latestOrder = await Order.findOne({ customerId: req.user.id })
          .sort({ createdAt: -1 });
        if (latestOrder) {
          response = await chatbotResponses.orderStatus(latestOrder._id, req.user.id);
        } else {
          response = 'You don\'t have any orders yet.';
        }
      }
    }
    // Rider location detection
    else if (lowerMessage.match(/where is rider|rider location|where is delivery|delivery location/)) {
      const latestOrder = await Order.findOne({ 
        customerId: req.user.id,
        status: { $in: ['rider_assigned', 'rider_picked_up', 'on_the_way'] }
      }).sort({ createdAt: -1 });

      if (latestOrder) {
        response = await chatbotResponses.riderLocation(latestOrder._id, req.user.id);
      } else {
        response = 'You don\'t have any active orders with a rider assigned.';
      }
    }
    // Delivery time detection
    else if (lowerMessage.match(/delivery time|when will it arrive|how long|eta/)) {
      const latestOrder = await Order.findOne({ 
        customerId: req.user.id,
        status: { $ne: 'delivered' }
      }).sort({ createdAt: -1 });

      if (latestOrder) {
        if (latestOrder.estimatedDeliveryTime) {
          const timeLeft = Math.round((new Date(latestOrder.estimatedDeliveryTime) - new Date()) / 60000);
          if (timeLeft > 0) {
            response = `Your order is estimated to arrive in ${timeLeft} minutes.`;
          } else {
            response = 'Your order should arrive soon!';
          }
        } else {
          response = 'Delivery time estimation is not available for this order.';
        }
      } else {
        response = 'You don\'t have any active orders.';
      }
    }
    // Default response
    else {
      response = chatbotResponses.default[
        Math.floor(Math.random() * chatbotResponses.default.length)
      ];
    }

    res.json({ response });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

