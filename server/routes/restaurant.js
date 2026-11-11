const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// @route   GET /api/restaurant/info
// @desc    Get restaurant info
// @access  Private (Restaurant Owner)
router.get('/info', auth, authorize('restaurant_owner'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Get restaurant info error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/restaurant/info
// @desc    Create or update restaurant
// @access  Private (Restaurant Owner)
router.post('/info', auth, authorize('restaurant_owner'), [
  body('name').notEmpty().withMessage('Restaurant name is required'),
  body('location.address').notEmpty().withMessage('Address is required'),
  body('location.city').notEmpty().withMessage('City is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let restaurant = await Restaurant.findOne({ ownerId: req.user.id });

    if (restaurant) {
      // Update existing restaurant
      Object.assign(restaurant, req.body);
      await restaurant.save();
    } else {
      // Create new restaurant
      restaurant = new Restaurant({
        ownerId: req.user.id,
        ...req.body
      });
      await restaurant.save();

      // Update user's restaurantId
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user.id, { restaurantId: restaurant._id });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Create/update restaurant error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/restaurant/menu
// @desc    Get restaurant menu
// @access  Private (Restaurant Owner)
router.get('/menu', auth, authorize('restaurant_owner'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.find({ restaurantId: restaurant._id })
      .sort({ category: 1, name: 1 });

    res.json(menuItems);
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/restaurant/menu
// @desc    Add menu item
// @access  Private (Restaurant Owner)
router.post('/menu', auth, authorize('restaurant_owner'), upload.single('image'), [
  body('name').notEmpty().withMessage('Item name is required'),
  body('category').isIn(['Biryani', 'Pizza', 'Desi', 'BBQ', 'Drinks', 'Chinese', 'Burgers', 'Fast Food', 'Desserts', 'Other']).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItem = new MenuItem({
      restaurantId: restaurant._id,
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : ''
    });

    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PATCH /api/restaurant/menu/:id
// @desc    Update menu item
// @access  Private (Restaurant Owner)
router.patch('/menu/:id', auth, authorize('restaurant_owner'), upload.single('image'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem || menuItem.restaurantId.toString() !== restaurant._id.toString()) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (req.file) {
      req.body.image = `/uploads/${req.file.filename}`;
    }

    Object.assign(menuItem, req.body);
    await menuItem.save();

    res.json(menuItem);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/restaurant/menu/:id
// @desc    Delete menu item
// @access  Private (Restaurant Owner)
router.delete('/menu/:id', auth, authorize('restaurant_owner'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem || menuItem.restaurantId.toString() !== restaurant._id.toString()) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await menuItem.deleteOne();
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/restaurant/orders
// @desc    Get restaurant orders
// @access  Private (Restaurant Owner)
router.get('/orders', auth, authorize('restaurant_owner'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const { status } = req.query;
    let query = { restaurantId: restaurant._id };

    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'name phone address')
      .populate('riderId', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/restaurant/analytics
// @desc    Get restaurant analytics
// @access  Private (Restaurant Owner)
router.get('/analytics', auth, authorize('restaurant_owner'), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const orders = await Order.find({ restaurantId: restaurant._id });

    const totalSales = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.total, 0);

    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const pendingOrders = orders.filter(o => ['pending', 'restaurant_accepted', 'preparing'].includes(o.status)).length;

    const averageOrderValue = completedOrders > 0 ? totalSales / completedOrders : 0;

    res.json({
      totalSales,
      totalOrders,
      completedOrders,
      pendingOrders,
      averageOrderValue,
      ordersByStatus: {
        pending: orders.filter(o => o.status === 'pending').length,
        restaurant_accepted: orders.filter(o => o.status === 'restaurant_accepted').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        rider_assigned: orders.filter(o => o.status === 'rider_assigned').length,
        rider_picked_up: orders.filter(o => o.status === 'rider_picked_up').length,
        on_the_way: orders.filter(o => o.status === 'on_the_way').length,
        delivered: completedOrders,
        cancelled: orders.filter(o => o.status === 'cancelled').length
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

