# ⚡ Quick Start Guide

## 1. Install Dependencies

```bash
npm run install-all
```

## 2. Set Up Environment Variables

### Server
Create `server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/food-delivery
JWT_SECRET=your_secret_key_here
MAPBOX_ACCESS_TOKEN=your_mapbox_token
NODE_ENV=development
```

### Client
Create `client/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 3. Start MongoDB

```bash
# If using local MongoDB
mongod
```

## 4. Run the Application

```bash
npm run dev
```

This will start both the server (port 5000) and client (port 3000).

## 5. Access the App

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 6. Test Accounts

1. Sign up as **Customer** → Browse restaurants → Place order
2. Sign up as **Restaurant Owner** → Add menu → Accept orders
3. Sign up as **Rider** → Accept orders → Deliver

**Note:** In development, OTP codes are logged to the server console.

## 🎉 You're all set!

For detailed setup instructions, see [SETUP.md](./SETUP.md)

