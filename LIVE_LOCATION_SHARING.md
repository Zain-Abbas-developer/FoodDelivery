# Live Location Sharing Feature

## Overview
The food delivery app now includes real-time, bidirectional location sharing between customers and riders. Both parties can see each other's live location updates during order delivery.

## Features

### Customer Location Sharing
- **Automatic Location Sharing**: Customer's location is automatically shared with the rider when order tracking page is loaded
- **Manual Location Share**: Button to manually refresh and share current location
- **Live Updates**: Uses browser's Geolocation API to track customer position
- **Status Indicator**: Shows whether location is currently being shared
- **High Accuracy**: Enabled high accuracy GPS tracking for precise positioning

### Rider Location Sharing
- **Real-time Updates**: Rider location updates are pushed via WebSocket (Socket.io)
- **Continuous Tracking**: Rider sends location updates while order is in `rider_picked_up` or `on_the_way` status
- **Live Status**: Shows indicator when rider location is actively streaming
- **Timestamp**: Displays when each location was last updated

### Unified Tracking Dashboard
- **Side-by-Side Display**: Both customer and rider locations shown in separate cards
- **Live Map View**: Interactive display showing both locations
- **Status Messages**: Clear feedback about sharing status
- **Animated Indicators**: Pulsing animations when locations are actively updating
- **Coordinates Display**: Shows latitude/longitude with 4 decimal precision

## Backend Implementation

### New Endpoint: POST `/api/customer/share-location`
```javascript
// Request Body
{
  lat: number,        // Latitude
  lng: number,        // Longitude
  orderId: string     // Order ID
}

// Response
{
  message: "Location shared successfully"
}
```

**Features**:
- Validates order ownership (customer can only share location for their own order)
- Stores location in `order.customerLocation`
- Emits WebSocket event `customer-location-updated` to order room
- All riders can receive real-time customer location updates

### Updated Endpoint: POST `/api/rider/update-location`
- Emits `rider-location-updated` event to order room
- Updates active orders with rider coordinates
- Real-time broadcast to all connected customers

### Updated Order Model
Added `customerLocation` field:
```javascript
customerLocation: {
  lat: Number,
  lng: Number,
  updatedAt: Date
}
```

## Frontend Implementation

### OrderTracking Component Enhancements

**New State Variables**:
- `sharingLocation`: Loading state for manual location share
- `customerLocationShared`: Tracks if customer has shared location

**New Functions**:
- `startCustomerLocationSharing()`: Initializes automatic geolocation watching
- `shareCustomerLocation(lat, lng)`: Posts location to server
- `manuallyShareLocation()`: Manual one-time location share button

**New Socket Events**:
- Listens for `customer-location-updated` events
- Updates component state with new customer coordinates

**UI Components**:
- Location Sharing Card: Shows customer and rider locations side-by-side
- Live Tracking Map: Visual display of both parties' locations
- Animated Status Indicators: Shows sharing/tracking status
- Manual Share Button: Purple button to refresh location

## How It Works

### Customer Flow
1. Customer places order and navigates to Order Tracking page
2. Browser requests location permission
3. Customer location is automatically captured and sent to server
4. `✓ Sharing` badge appears next to "Your Location"
5. Coordinates and timestamp are displayed
6. Location updates automatically every few seconds
7. Rider can see customer's location in real-time

### Rider Flow
1. Rider accepts order and gets assigned to delivery
2. Rider's app sends location updates via `/api/rider/update-location`
3. Location updates are broadcast via WebSocket to customer
4. Customer sees rider's coordinates update in real-time
5. Animated `🟢 Live` indicator shows data is flowing

### Real-time Synchronization
1. When either party updates location, server receives it
2. Server broadcasts via `order-{orderId}` WebSocket room
3. All connected clients in that room receive the update
4. React state updates with new coordinates
5. UI re-renders to show new locations

## User Experience

### Location Sharing Card
- **Your Location Section (Purple)**:
  - Shows customer's current coordinates
  - Green badge indicates sharing status
  - Manual share button for one-time refresh
  - Last update timestamp
  
- **Rider Location Section (Blue)**:
  - Shows rider's current coordinates
  - Green "🟢 Live" pulsing badge when connected
  - Last update timestamp
  - Message if waiting for first location

### Live Tracking Map
- Shows both locations side-by-side
- Animated cards with pulsing effect when updating
- Status messages explaining the connection state
- Visual distinction between customer (purple) and rider (blue)

## Privacy & Permissions

### Location Permissions
- Requires HTTPS in production (browsers enforce for Geolocation API)
- Users must grant location permission in browser
- Users can revoke permission anytime
- App handles permission denied gracefully

### Data Security
- Location data only stored while order is active
- Customer location only visible to assigned rider
- Rider location only visible to order customer
- No location history retained after delivery

## Error Handling

- **Geolocation Disabled**: Shows toast error message
- **Network Error**: Console logging for debugging
- **Socket Disconnection**: Automatic reconnection handling
- **Invalid Order**: Returns 403 Unauthorized error
- **Missing Order**: Returns 404 Not Found error

## Browser Compatibility

- **Desktop Chrome/Edge**: Full support with high accuracy
- **Mobile Chrome/Firefox**: Full support with GPS
- **Safari**: Full support on iOS 12.2+
- **Firefox Mobile**: Full support with GPS

## Performance Considerations

- **Geolocation Updates**: Every 5 seconds (configurable `maximumAge`)
- **High Accuracy**: Enabled for ~5-10 meter precision
- **WebSocket**: Real-time updates, minimal latency
- **Location History**: Not stored, only current position

## Testing

### Manual Testing Steps
1. Create test customer and rider accounts
2. Place order as customer
3. Accept order as rider
4. Navigate to tracking page as customer (should see "Waiting for location")
5. Update rider location via `/api/rider/update-location`
6. Observe coordinates appear in real-time on customer's tracking page
7. Enable location sharing as customer
8. Observe rider can see customer location updates

### Browser Console Messages
```javascript
// Socket connection
"Socket connected: socket-id-here"

// Rider location updates
"Rider location received: { orderId, location }"
"Rider location updated in state: { lat, lng }"

// Customer location updates
"Location shared successfully"
"Customer location updated from another device: { orderId, location }"
```

## Future Enhancements

- Integrate actual map library (Google Maps, Mapbox)
- Draw route between customer and rider
- Calculate real-time distance and ETA
- Historical location playback
- Geofencing notifications
- Battery optimization for continuous tracking
- Distance traveled calculation
