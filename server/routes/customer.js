const express = require('express');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');
const User = require('../models/User');
const { auth, authorize } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// @route   GET /api/customer/restaurants
// @desc    Get nearby restaurants
// @access  Private
router.get('/restaurants', auth, authorize('customer'), async (req, res) => {
  try {
    const { lat, lng, maxDistance = 10000, category, minRating, maxPrice } = req.query;

    let query = { isOpen: true };

    if (category) {
      query.cuisine = { $in: [category] };
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    let restaurants = await Restaurant.find(query);

    // Filter by location if coordinates provided
    if (lat && lng) {
      restaurants = restaurants.filter(restaurant => {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          restaurant.location.coordinates.lat,
          restaurant.location.coordinates.lng
        );
        return distance <= (maxDistance / 1000); // Convert to km
      });
    }

    // Sort by distance if coordinates provided
    if (lat && lng) {
      restaurants.sort((a, b) => {
        const distA = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          a.location.coordinates.lat,
          a.location.coordinates.lng
        );
        const distB = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          b.location.coordinates.lat,
          b.location.coordinates.lng
        );
        return distA - distB;
      });
    }

    res.json(restaurants);
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/customer/restaurants/:id
// @desc    Get restaurant details
// @access  Private
router.get('/restaurants/:id', auth, authorize('customer'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/customer/restaurants/:id/menu
// @desc    Get restaurant menu
// @access  Private
router.get('/restaurants/:id/menu', auth, authorize('customer'), async (req, res) => {
  try {
    const { category, maxPrice, isVegetarian, isSpicy } = req.query;
    
    let query = { restaurantId: req.params.id, isAvailable: true };

    if (category) {
      query.category = category;
    }

    if (maxPrice) {
      query.price = { $lte: parseFloat(maxPrice) };
    }

    if (isVegetarian !== undefined) {
      query.isVegetarian = isVegetarian === 'true';
    }

    if (isSpicy !== undefined) {
      query.isSpicy = isSpicy === 'true';
    }

    const menuItems = await MenuItem.find(query).sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/customer/famous-recipes
// @desc    Get famous Pakistani recipes
// @access  Private
router.get('/famous-recipes', auth, authorize('customer'), async (req, res) => {
  try {
    const famousCategories = ['Biryani', 'BBQ', 'Desi', 'Fast Food'];
    const recipes = await MenuItem.find({
      category: { $in: famousCategories },
      isAvailable: true
    })
    .populate('restaurantId', 'name location rating')
    .sort({ rating: -1, totalReviews: -1 })
    .limit(20);

    res.json(recipes);
  } catch (error) {
    console.error('Get famous recipes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/customer/verify-promo
// @desc    Verify promo code
// @access  Private
router.post('/verify-promo', auth, authorize('customer'), async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    const promoCode = await PromoCode.findOne({ 
      code: code.toUpperCase(),
      isActive: true
    });

    if (!promoCode) {
      return res.status(400).json({ message: 'Invalid promo code' });
    }

    const now = new Date();
    if (now < promoCode.validFrom || now > promoCode.validUntil) {
      return res.status(400).json({ message: 'Promo code has expired' });
    }

    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      return res.status(400).json({ message: 'Promo code usage limit reached' });
    }

    if (orderAmount < promoCode.minimumOrder) {
      return res.status(400).json({ 
        message: `Minimum order amount is PKR ${promoCode.minimumOrder}` 
      });
    }

    let discount = 0;
    if (promoCode.discountType === 'percentage') {
      discount = (orderAmount * promoCode.discountValue) / 100;
      if (promoCode.maxDiscount) {
        discount = Math.min(discount, promoCode.maxDiscount);
      }
    } else {
      discount = promoCode.discountValue;
    }

    res.json({
      valid: true,
      discount,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue
    });
  } catch (error) {
    console.error('Verify promo error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to calculate distance
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

// @route   POST /api/customer/share-location
// @desc    Customer shares their live location for active order
// @access  Private (Customer)
router.post('/share-location', auth, authorize('customer'), [
  body('lat').isFloat().withMessage('Latitude is required'),
  body('lng').isFloat().withMessage('Longitude is required'),
  body('orderId').notEmpty().withMessage('Order ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng, orderId } = req.body;

    // Verify order exists and belongs to this customer
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.customerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update order with customer location
    order.customerLocation = {
      lat,
      lng,
      updatedAt: new Date()
    };
    await order.save();

    // Emit socket event for real-time tracking
    const io = req.app.get('io');
    io.to(`order-${orderId}`).emit('customer-location-updated', {
      orderId,
      location: { lat, lng },
      timestamp: new Date()
    });

    console.log(`Customer location updated for order ${orderId}:`, { lat, lng });
    res.json({ message: 'Location shared successfully' });
  } catch (error) {
    console.error('Share location error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

