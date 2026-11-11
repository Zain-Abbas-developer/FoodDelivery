const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create Stripe payment intent
// @access  Private (Customer)
router.post('/create-payment-intent', auth, authorize('customer'), [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'pkr',
      metadata: {
        orderId: orderId.toString()
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment
// @access  Private (Customer)
router.post('/confirm-payment', auth, authorize('customer'), [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('paymentMethod').isIn(['cod', 'jazzcash', 'easypaisa', 'stripe']).withMessage('Invalid payment method'),
  body('paymentId').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, paymentMethod, paymentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update payment status
    order.paymentMethod = paymentMethod;
    order.paymentId = paymentId || null;

    if (paymentMethod === 'cod') {
      order.paymentStatus = 'pending';
    } else {
      order.paymentStatus = 'paid';
    }

    await order.save();

    res.json({ message: 'Payment confirmed', order });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/payments/jazzcash
// @desc    Process JazzCash payment
// @access  Private (Customer)
router.post('/jazzcash', auth, authorize('customer'), [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, transactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // In production, verify transaction with JazzCash API
    // For now, we'll just mark it as paid
    order.paymentMethod = 'jazzcash';
    order.paymentId = transactionId;
    order.paymentStatus = 'paid';

    await order.save();

    res.json({ message: 'JazzCash payment processed', order });
  } catch (error) {
    console.error('JazzCash payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/payments/easypaisa
// @desc    Process Easypaisa payment
// @access  Private (Customer)
router.post('/easypaisa', auth, authorize('customer'), [
  body('orderId').notEmpty().withMessage('Order ID is required'),
  body('transactionId').notEmpty().withMessage('Transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId, transactionId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // In production, verify transaction with Easypaisa API
    // For now, we'll just mark it as paid
    order.paymentMethod = 'easypaisa';
    order.paymentId = transactionId;
    order.paymentStatus = 'paid';

    await order.save();

    res.json({ message: 'Easypaisa payment processed', order });
  } catch (error) {
    console.error('Easypaisa payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

