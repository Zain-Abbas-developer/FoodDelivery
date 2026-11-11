const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const PromoCode = require('../models/PromoCode');
const { generateOTP } = require('../utils/sendOTP');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/orders
// @desc    Create a new order
// @access  Private (Customer)
router.post('/', auth, authorize('customer'), [
  body('restaurantId').notEmpty().withMessage('Restaurant ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('deliveryAddress').notEmpty().withMessage('Delivery address is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    console.log('Order request received:', req.body);
    const { restaurantId, items, deliveryAddress, paymentMethod, promoCode, scheduledTime, tip } = req.body;

    // Get restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      console.log('Restaurant not found with ID:', restaurantId);
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    console.log('Restaurant found:', restaurant._id);

    // Calculate subtotal
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      console.log('Processing item:', item);
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        console.log('Menu item not found:', item.menuItemId);
        return res.status(400).json({ message: `Menu item ${item.menuItemId} not found` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ message: `Item '${menuItem.name}' is not available` });
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
        image: menuItem.image
      });
    }

    console.log('All items validated, subtotal:', subtotal);

    // Apply promo code if provided
    let discount = 0;
    let promoCodeData = null;
    if (promoCode) {
      const promo = await PromoCode.findOne({ 
        code: promoCode.toUpperCase(),
        isActive: true
      });

      if (promo && new Date() >= promo.validFrom && new Date() <= promo.validUntil) {
        if (subtotal >= promo.minimumOrder) {
          if (promo.discountType === 'percentage') {
            discount = (subtotal * promo.discountValue) / 100;
            if (promo.maxDiscount) {
              discount = Math.min(discount, promo.maxDiscount);
            }
          } else {
            discount = promo.discountValue;
          }
          promoCodeData = {
            code: promo.code,
            discount
          };
          promo.usedCount += 1;
          await promo.save();
        }
      }
    }

    // Calculate totals
    const deliveryFee = restaurant.deliveryFee || 0;
    const tipAmount = tip || 0;
    const total = subtotal + deliveryFee + tipAmount - discount;

    // Generate delivery OTP
    const deliveryOTP = generateOTP();
    const otpExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

    // Create order
    const order = new Order({
      customerId: req.user.id,
      restaurantId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tip: tipAmount,
      discount,
      promoCode: promoCodeData,
      total,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cod',
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      deliveryOTP: {
        code: deliveryOTP,
        expiresAt: otpExpires
      },
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        message: 'Order placed'
      }]
    });

    await order.save();

    console.log('Order created successfully:', order._id);
    
    // Emit socket event (use string ids to avoid room mismatch for ObjectId vs populated docs)
    const io = req.app.get('io');
    try {
      const restIdStr = restaurantId && restaurantId.toString ? restaurantId.toString() : String(restaurantId);
      io.to(`restaurant-${restIdStr}`).emit('new-order', order);
    } catch (e) {
      io.emit('new-order', order);
    }

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server error creating order', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @route   GET /api/orders
// @desc    Get user orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query.customerId = req.user.id;
    } else if (req.user.role === 'restaurant_owner') {
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
      if (restaurant) {
        query.restaurantId = restaurant._id;
      } else {
        return res.json([]);
      }
    } else if (req.user.role === 'rider') {
      query.riderId = req.user.id;
    }

    const orders = await Order.find(query)
      .populate('restaurantId', 'name location')
      .populate('customerId', 'name phone')
      .populate('riderId', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/orders/:id
// @desc    Get order details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name location contact')
      .populate('customerId', 'name phone address')
      .populate('riderId', 'name phone riderInfo');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check authorization
    if (req.user.role === 'customer' && order.customerId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private (Restaurant Owner or Rider)
router.patch('/:id/status', auth, [
  body('status').isIn([
    'restaurant_accepted',
    'preparing',
    'rider_assigned',
    'rider_picked_up',
    'on_the_way',
    'delivered',
    'cancelled'
  ]).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, riderId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization checks
    if (req.user.role === 'restaurant_owner') {
      const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
      if (!restaurant || order.restaurantId.toString() !== restaurant._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    } else if (req.user.role === 'rider') {
      if (order.riderId && order.riderId.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    // Update status
    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      message: getStatusMessage(status)
    });

    if (status === 'rider_assigned' && riderId) {
      order.riderId = riderId;
    }

    if (status === 'delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Emit socket event (normalize ids)
    const io = req.app.get('io');
    try {
      const orderIdStr = order._id.toString();
      const customerIdStr = order.customerId && order.customerId._id ? order.customerId._id.toString() : order.customerId.toString();
      io.to(`order-${orderIdStr}`).emit('order-status-updated', order);
      io.to(`customer-${customerIdStr}`).emit('order-status-updated', order);
    } catch (e) {
      io.emit('order-status-updated', order);
    }

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/orders/:id/verify-delivery
// @desc    Verify delivery with OTP
// @access  Private (Customer)
router.post('/:id/verify-delivery', auth, authorize('customer'), [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], async (req, res) => {
  try {
    const { otp } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!order.deliveryOTP || order.deliveryOTP.code !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > order.deliveryOTP.expiresAt) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    order.status = 'delivered';
    order.deliveredAt = new Date();
    order.paymentStatus = 'paid';
    order.statusHistory.push({
      status: 'delivered',
      timestamp: new Date(),
      message: 'Order delivered and verified'
    });

    await order.save();

    // Emit socket event (normalize ids)
    const io = req.app.get('io');
    try {
      const orderIdStr = order._id.toString();
      io.to(`order-${orderIdStr}`).emit('order-delivered', order);
    } catch (e) {
      io.emit('order-delivered', order);
    }

    res.json({ message: 'Delivery verified successfully', order });
  } catch (error) {
    console.error('Verify delivery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function getStatusMessage(status) {
  const messages = {
    'restaurant_accepted': 'Restaurant accepted your order',
    'preparing': 'Restaurant is preparing your order',
    'rider_assigned': 'Rider assigned to your order',
    'rider_picked_up': 'Rider picked up your order',
    'on_the_way': 'Your order is on the way',
    'delivered': 'Order delivered',
    'cancelled': 'Order cancelled'
  };
  return messages[status] || 'Status updated';
}

module.exports = router;

