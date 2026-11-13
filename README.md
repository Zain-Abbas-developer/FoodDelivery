# 🍔 Food Delivery

A full-stack food delivery platform built for Pakistan. Customers can discover restaurants, place and track orders, and communicate with support. Restaurant owners manage menus and incoming orders, while riders manage deliveries and live location updates.

> **Project status:** This repository is an active development project. Payment providers such as JazzCash, Easypaisa, and Stripe may require additional production credentials and configuration.

## ✨ Features

### Customer experience

- Browse restaurants, menus, Pakistani recipes, and nearby options
- Search and filter restaurants by category, rating, and price
- Add items to a cart, apply promo codes, schedule orders, and add tips
- Track order status and rider location in real time
- Use an AI-assisted chatbot for order and delivery questions

### Restaurant operations

- Create and manage menu items
- Review and update incoming orders
- View restaurant analytics and order activity
- Receive real-time order notifications

### Rider operations

- View and accept available delivery jobs
- Update delivery status and availability
- Share live location during delivery
- Confirm deliveries with OTP and review earnings

### Platform features

- JWT authentication with OTP verification
- Role-based access for customers, restaurant owners, and riders
- Responsive interface for mobile, tablet, and desktop
- Dark/light theme support, animations, and loading states
- Pakistan-focused currency, recipes, and payment options

## 🧰 Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, React Router, Tailwind CSS, Framer Motion |
| Maps and tracking | Mapbox GL, React Map GL, Socket.io |
| Backend | Node.js, Express, Socket.io |
| Data and security | MongoDB, Mongoose, JWT, bcrypt |
| Integrations | Twilio, Cloudinary, Stripe, Nodemailer |

## 📁 Project structure

```text
FoodDelivery/
├── client/                 # React frontend
│   └── src/
│       ├── components/     # Shared and role-specific UI
│       ├── context/        # Auth, cart, and theme state
│       └── pages/          # Customer, restaurant, rider, and auth pages
├── server/                 # Express API and Socket.io server
│   ├── models/             # Mongoose models
│   ├── routes/             # Auth, customer, restaurant, rider, order, and payment APIs
│   └── middleware/         # Authentication and authorization middleware
├── package.json            # Root scripts
├── docs/                   # Setup, feature, deployment, and audit documentation
│   ├── QUICK_START.md      # Short local-development checklist
│   └── SETUP.md            # Detailed setup and troubleshooting guide
└── README.md
```

## 🚀 Quick start

### Prerequisites

- Node.js 16 or newer
- npm
- MongoDB locally or a MongoDB Atlas cluster
- A Mapbox access token for map features

Twilio, Cloudinary, and payment-provider accounts are optional for local development.

### 1. Clone and install

```bash
git clone https://github.com/Zain-Abbas-developer/FoodDelivery.git
cd FoodDelivery
npm run install-all
```

### 2. Configure environment variables

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food-delivery
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRE=7d
MAPBOX_ACCESS_TOKEN=your_mapbox_access_token
NODE_ENV=development
```

Create `client/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_access_token
REACT_APP_SOCKET_URL=http://localhost:5000
```

Optional server variables for production integrations are documented in [SETUP.md](./docs/SETUP.md), including Twilio, Cloudinary, Stripe, JazzCash, Easypaisa, and email configuration.

### 3. Start MongoDB

For a local MongoDB installation:

```bash
mongod
```

Alternatively, set `MONGODB_URI` to your MongoDB Atlas connection string.

### 4. Start the application

From the project root:

```bash
npm run dev
```

The application will be available at:

- Frontend: <http://localhost:3000>
- API: <http://localhost:5000>
- Health check: <http://localhost:5000/api/health>

To run services separately:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm start
```

## 🧪 Test the main flows

Create accounts from the sign-up screen using each role:

1. **Customer:** browse a restaurant, add menu items, place an order, and track it.
2. **Restaurant owner:** add menu items, review incoming orders, and update order status.
3. **Rider:** enable availability, accept an order, update delivery status, and complete delivery.

During development, OTP values are logged in the server terminal when Twilio is not configured.

## 📜 Available commands

| Command | Description |
| --- | --- |
| `npm run install-all` | Install root, server, and client dependencies |
| `npm run dev` | Run the API and React frontend together |
| `npm run server` | Run the API with Nodemon |
| `npm run client` | Run the React development server |
| `cd client && npm run build` | Create a production frontend build |
| `cd client && npm test` | Run frontend tests |

## ☁️ Deploy to Vercel and Render

This repository includes deployment configuration for the split frontend/backend setup:

1. Create a Render Web Service from this repository using `render.yaml`. It runs the Express API from `server` and exposes `/api/health`.
2. Set the Render environment variables, especially `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`.
3. Create a Vercel project from this repository with **Root Directory** set to `client`.
4. Add `REACT_APP_API_URL=https://<your-render-service>.onrender.com/api` to Vercel.
5. Add `REACT_APP_SOCKET_URL=https://<your-render-service>.onrender.com` if socket connections are enabled by the frontend.
6. Set Render `CLIENT_URL` to the Vercel deployment URL, then redeploy the Render service.

Never commit provider credentials or `.env` files. MongoDB Atlas must allow connections from Render.

## 🌍 Pakistan-focused capabilities

- PKR currency and local delivery workflows
- English and Urdu-ready product experience
- Pakistani recipes and restaurant discovery
- Cash on Delivery, JazzCash, and Easypaisa support points

## 🔐 Security and configuration notes

- Never commit `.env` files or real API credentials.
- Use a strong, unique `JWT_SECRET` outside local development.
- Restrict production CORS origins and configure provider credentials before enabling live payments or OTP delivery.
- Keep MongoDB credentials and third-party secrets in environment variables.

## 📚 Additional documentation

- [Quick start](./docs/QUICK_START.md)
- [Detailed setup and troubleshooting](./docs/SETUP.md)
- [Location sharing documentation](./docs/LOCATION_SHARING_DOCUMENTATION_INDEX.md)

## 📄 License

This project is released under the ISC license.
