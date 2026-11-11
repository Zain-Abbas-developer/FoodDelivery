# 🚀 Setup Guide - Food Delivery Application

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Mapbox account (for maps)
- Twilio account (for OTP - optional for development)

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables

#### Server (.env)
Create `server/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food-delivery
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Twilio (OTP) - Optional for development
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Cloudinary (Image Upload) - Optional
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Payment Gateways - Optional
STRIPE_SECRET_KEY=your_stripe_secret_key
JAZZCASH_MERCHANT_ID=your_jazzcash_merchant_id
JAZZCASH_PASSWORD=your_jazzcash_password
EASYPAISA_STORE_ID=your_easypaisa_store_id
EASYPAISA_HASH_KEY=your_easypaisa_hash_key

# Mapbox
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token

NODE_ENV=development
```

#### Client (.env)
Create `client/.env` file:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_access_token_here
```

### 3. Start MongoDB

If using local MongoDB:
```bash
mongod
```

Or use MongoDB Atlas and update `MONGODB_URI` in `server/.env`.

### 4. Run the Application

#### Development Mode (Both servers)
From root directory:
```bash
npm run dev
```

#### Or run separately:

Terminal 1 - Server:
```bash
cd server
npm run dev
```

Terminal 2 - Client:
```bash
cd client
npm start
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## Features Overview

### ✅ Implemented Features

1. **Authentication System**
   - JWT-based authentication
   - OTP verification (via Twilio or console log in dev)
   - Role-based access (Customer, Restaurant Owner, Rider)

2. **Customer Dashboard**
   - Browse nearby restaurants
   - View famous Pakistani recipes
   - Advanced filters (category, rating, price)
   - Restaurant details and menu
   - Shopping cart
   - Order placement

3. **Restaurant Owner Dashboard**
   - Menu management (Add/Edit/Delete)
   - Order management
   - Analytics dashboard
   - Real-time order notifications

4. **Rider Dashboard**
   - View available orders
   - Accept/reject orders
   - Update order status
   - Live location tracking
   - Earnings dashboard

5. **Order Tracking**
   - Real-time order status updates
   - Live map tracking
   - Status timeline
   - OTP-based delivery confirmation

6. **Payment Integration**
   - Cash on Delivery (COD)
   - JazzCash (placeholder)
   - Easypaisa (placeholder)
   - Stripe (placeholder)

7. **AI Chatbot**
   - Order status queries
   - Rider location queries
   - Delivery time queries

8. **UI/UX**
   - Modern glass-morphism design
   - Dark/Light mode toggle
   - Responsive design (Mobile, Tablet, Desktop)
   - Smooth animations
   - Loading skeletons

## Testing the Application

### 1. Create Test Accounts

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Create accounts for:
   - Customer
   - Restaurant Owner
   - Rider

### 2. For OTP Verification (Development)

In development mode, OTP codes are logged to the console. Check your server terminal for the OTP code.

### 3. Test Flow

1. **Customer Flow:**
   - Sign up as Customer
   - Browse restaurants
   - Add items to cart
   - Place order
   - Track order

2. **Restaurant Owner Flow:**
   - Sign up as Restaurant Owner
   - Add restaurant info
   - Add menu items
   - Accept orders
   - View analytics

3. **Rider Flow:**
   - Sign up as Rider
   - Toggle availability
   - Accept orders
   - Update order status
   - View earnings

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGODB_URI` in `server/.env`
- For Atlas, whitelist your IP address

### Mapbox Not Loading
- Get a free token from https://mapbox.com
- Add it to `client/.env` as `REACT_APP_MAPBOX_TOKEN`

### Socket.io Connection Issues
- Ensure server is running on port 5000
- Check CORS settings in `server/index.js`

### OTP Not Received
- In development, check server console
- For production, configure Twilio credentials

## Production Deployment

1. Build the client:
```bash
cd client
npm run build
```

2. Set `NODE_ENV=production` in `server/.env`

3. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start server/index.js
```

4. Serve the built client using a web server (nginx, Apache, etc.)

## Support

For issues or questions, please check the code comments or create an issue in the repository.

