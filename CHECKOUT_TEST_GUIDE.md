# Checkout Flow Test Guide

## What was fixed:
1. ✅ Removed problematic Mapbox/Map component that required invalid token
2. ✅ Replaced with simple location display showing coordinates
3. ✅ Enhanced error logging to show exact server validation errors
4. ✅ Added form validation checks before submission

## Testing Steps:

### Step 1: Start the Application
```bash
# Terminal 1 - Start Backend
cd f:\Food-Delivery\server
npm start

# Terminal 2 - Start Frontend
cd f:\Food-Delivery\client
npm start
```

### Step 2: Setup Test Data

**Create a Restaurant Account:**
1. Go to `http://localhost:3000`
2. Click "Sign Up" → Choose "Restaurant Owner"
3. Fill in details:
   - Email: `restaurant@test.com`
   - Password: `Test@123`
   - Restaurant Name: `Pizza Palace`
4. Click Sign Up

**Create Menu Items:**
1. Go to Restaurant Dashboard
2. Navigate to "Menu Management" tab
3. Add items:
   - Item 1: Margherita Pizza - 500 PKR
   - Item 2: Biryani - 400 PKR
4. Mark items as "Available"

### Step 3: Create Customer Account

1. Logout from restaurant account
2. Sign Up → Choose "Customer"
3. Fill in details:
   - Email: `customer@test.com`
   - Password: `Test@123`
4. Complete signup

### Step 4: Browse and Add to Cart

1. Go to Customer Dashboard
2. Click on "Pizza Palace" restaurant
3. See menu items displayed
4. Click "Add to Cart" on items
5. Verify cart shows items and total

### Step 5: Proceed to Checkout

1. Click "Proceed to Checkout" button
2. You should see:
   - Delivery Address form (Street, City, Province, Postal Code)
   - Location display showing coordinates
   - Payment Method selection (COD, Jazz Cash, etc.)
   - Promo Code input
   - Tip amount selection
   - Scheduled time (optional)

### Step 6: Fill Checkout Form

```
Delivery Address:
- Street: 123 Main Street
- City: Lahore
- Province: Punjab
- Postal Code: 54000

Payment Method: COD (Cash on Delivery)
Tip: 50 PKR (optional)
```

### Step 7: Place Order

1. Click "Place Order" button
2. **IMPORTANT**: Open browser DevTools (F12):
   - Go to Console tab
   - Look for:
     - `"Submitting order:"` - shows what's being sent
     - `"Order created:"` - shows server response
     - Any error messages

### Step 8: Expected Success Response

If order is placed successfully:
- Green toast: "Order placed successfully!"
- You'll be redirected to order tracking page
- Check browser console for order ID

### Step 9: Verify Restaurant Receives Order

1. Open another browser tab
2. Login as restaurant owner
3. Go to "Order Management" tab
4. You should see the new order with:
   - Order number
   - Customer name (from customer account)
   - Items ordered
   - Delivery address
   - Total amount

## Debugging Information

### If Order Fails:

**Check Browser Console (F12):**
```
Look for "Error placing order:" message
Should show server response with specific error:
- "Restaurant ID is required" → Cart didn't load restaurantId
- "At least one item is required" → Items not being sent
- "Delivery address is required" → Form not collecting address
- Field validation errors → Missing required fields
```

**Common Issues & Fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| "No restaurant selected" | RestaurantDetails didn't set restaurantId in cart | Clear localStorage, refresh page, re-add items to cart |
| "Please fill in complete delivery address" | Empty street or city field | Fill all address fields |
| 400 Bad Request with no message | Invalid restaurantId or items format | Check console for detailed error array |
| 401 Unauthorized | Token expired or missing | Logout and login again |
| 404 Restaurant not found | Wrong restaurantId sent | Verify restaurant ID is correct in network tab |

### Network Tab Inspection:

1. Open DevTools → Network tab
2. Place order
3. Find `POST` request to `orders`
4. Click on it and check:
   - **Request payload**: Should show all form data
   - **Response**: Should show created order with `_id`, `orderNumber`, `status: 'pending'`
   - **Status code**: Should be 201 (Created)

## Expected Order Response

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "orderNumber": "ORD-2024-001",
  "customerId": "...",
  "restaurantId": "...",
  "items": [
    {
      "menuItemId": "...",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 500
    }
  ],
  "subtotal": 1000,
  "deliveryFee": 150,
  "discount": 0,
  "tip": 50,
  "total": 1200,
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "Lahore",
    "province": "Punjab",
    "postalCode": "54000",
    "coordinates": {
      "lat": 31.5204,
      "lng": 74.3587
    }
  },
  "paymentMethod": "cod",
  "status": "pending",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Next Steps After Order

1. **Order Tracking**: Checkout will redirect to `/customer/orders/{orderId}/track`
2. **Restaurant Side**: Restaurant owner can:
   - View order details
   - Change order status (pending → accepted → preparing → ready → completed)
   - Contact customer about order
3. **Socket Updates**: Order updates should appear in real-time (once Socket.io is connected)

## Quick Verification Checklist

- [ ] Backend server is running on port 5000
- [ ] Frontend running on port 3000
- [ ] Restaurant account created with menu items
- [ ] Customer account created and logged in
- [ ] Items added to cart from RestaurantDetails page
- [ ] Checkout form displays all fields
- [ ] Delivery address is complete (street + city required minimum)
- [ ] Order submission shows "Submitting order:" in console
- [ ] Order successfully created shows order number

## Need More Help?

If you encounter errors:
1. Share the exact error from browser console
2. Share the server-side error (if visible)
3. Check if server is actually running (`npm start` in server folder)
4. Verify database connection in server logs
