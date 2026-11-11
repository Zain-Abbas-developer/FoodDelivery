const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  riderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  items: [{
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    image: String
  }],
  subtotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  tip: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  promoCode: {
    code: String,
    discount: Number
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: [
      'pending',
      'restaurant_accepted',
      'preparing',
      'rider_assigned',
      'rider_picked_up',
      'on_the_way',
      'delivered',
      'cancelled'
    ],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  deliveryAddress: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    instructions: String
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'jazzcash', 'easypaisa', 'stripe'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: String,
  scheduledTime: Date,
  estimatedDeliveryTime: Date,
  deliveredAt: Date,
  deliveryOTP: {
    code: String,
    expiresAt: Date
  },
  riderLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  customerLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  rating: {
    food: Number,
    delivery: Number,
    comment: String
  }
}, {
  timestamps: true
});

// Generate order number before validation so required check passes
orderSchema.pre('validate', async function(next) {
  try {
    if (!this.orderNumber) {
      const count = await mongoose.model('Order').countDocuments();
      this.orderNumber = `ORD${Date.now()}${count.toString().padStart(4, '0')}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Order', orderSchema);

