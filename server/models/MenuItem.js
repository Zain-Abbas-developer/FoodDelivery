const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameUrdu: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  descriptionUrdu: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Biryani', 'Pizza', 'Desi', 'BBQ', 'Drinks', 'Chinese', 'Burgers', 'Fast Food', 'Desserts', 'Other']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  images: [String],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isVegetarian: {
    type: Boolean,
    default: false
  },
  isSpicy: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  preparationTime: {
    type: Number,
    default: 15 // minutes
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MenuItem', menuItemSchema);

