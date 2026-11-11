const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/rider/available-orders
// @desc    Get available orders for rider
// @access  Private (Rider)
router.get('/available-orders', auth, authorize('rider'), async (req, res) => {
  try {
    const { lat, lng } = req.query;

    // Get orders that need a rider
    const orders = await Order.find({
      status: { $in: ['preparing', 'rider_assigned'] },
      riderId: { $exists: false }
    })
      .populate('restaurantId', 'name location')
      .populate('customerId', 'name address')
      .sort({ createdAt: 1 });

    // Calculate distance if coordinates provided
    if (lat && lng) {
      orders.forEach(order => {
        const restaurantLat = order.restaurantId.location.coordinates.lat;
        const restaurantLng = order.restaurantId.location.coordinates.lng;
        order.distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          restaurantLat,
          restaurantLng
        );
      });

      orders.sort((a, b) => a.distance - b.distance);
    }

    res.json(orders);
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/rider/accept-order
// @desc    Accept an order
// @access  Private (Rider)
router.post('/accept-order', auth, authorize('rider'), [
  body('orderId').notEmpty().withMessage('Order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.riderId) {
      return res.status(400).json({ message: 'Order already assigned to a rider' });
    }

    if (!['preparing', 'rider_assigned'].includes(order.status)) {
      return res.status(400).json({ message: 'Order is not available for pickup' });
    }

    // Assign rider to order
    order.riderId = req.user.id;
    order.status = 'rider_assigned';
    order.statusHistory.push({
      status: 'rider_assigned',
      timestamp: new Date(),
      message: 'Rider assigned to order'
    });

    await order.save();

    // Update rider availability
    await User.findByIdAndUpdate(req.user.id, {
      'riderInfo.isAvailable': false
    });

    // Emit socket event (normalize ids)
    const io = req.app.get('io');
    try {
      const orderIdStr = order._id.toString();
      const customerIdStr = order.customerId && order.customerId._id ? order.customerId._id.toString() : order.customerId.toString();
      io.to(`order-${orderIdStr}`).emit('rider-assigned', order);
      io.to(`customer-${customerIdStr}`).emit('rider-assigned', order);
    } catch (e) {
      io.emit('rider-assigned', order);
    }

    res.json(order);
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rider/my-orders
// @desc    Get rider's orders
// @access  Private (Rider)
router.get('/my-orders', auth, authorize('rider'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = { riderId: req.user.id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('restaurantId', 'name location')
      .populate('customerId', 'name phone address')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get rider orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/rider/update-location
// @desc    Update rider's current location
// @access  Private (Rider)
router.post('/update-location', auth, authorize('rider'), [
  body('lat').isFloat().withMessage('Latitude is required'),
  body('lng').isFloat().withMessage('Longitude is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng } = req.body;

    // Update rider location
    await User.findByIdAndUpdate(req.user.id, {
      'riderInfo.currentLocation': { lat, lng }
    });

    // Update active orders with rider location
    const activeOrders = await Order.find({
      riderId: req.user.id,
      status: { $in: ['rider_picked_up', 'on_the_way'] }
    });

    for (const order of activeOrders) {
      order.riderLocation = {
        lat,
        lng,
        updatedAt: new Date()
      };
      await order.save();

      // Emit socket event for real-time tracking
      const io = req.app.get('io');
      io.to(`order-${order._id}`).emit('rider-location-updated', {
        orderId: order._id,
        location: { lat, lng }
      });
    }

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/rider/update-availability
// @desc    Update rider availability
// @access  Private (Rider)
router.post('/update-availability', auth, authorize('rider'), [
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean')
], async (req, res) => {
  try {
    const { isAvailable } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      'riderInfo.isAvailable': isAvailable
    });

    res.json({ message: 'Availability updated successfully', isAvailable });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/rider/earnings
// @desc    Get rider earnings
// @access  Private (Rider)
router.get('/earnings', auth, authorize('rider'), async (req, res) => {
  try {
    const orders = await Order.find({
      riderId: req.user.id,
      status: 'delivered'
    });

    const totalEarnings = orders.reduce((sum, order) => {
      return sum + (order.deliveryFee || 0) + (order.tip || 0);
    }, 0);

    const totalDeliveries = orders.length;

    const user = await User.findById(req.user.id);
    const riderInfo = user.riderInfo || {};

    res.json({
      totalEarnings,
      totalDeliveries,
      averageEarningPerDelivery: totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0,
      currentEarnings: riderInfo.totalEarnings || 0,
      currentDeliveries: riderInfo.totalDeliveries || 0
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

module.exports = router;

