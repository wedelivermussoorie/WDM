import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// --- BUSINESS RULES ---
const MINIMUM_ORDER_VALUE = 500;
const GST_RATE = 0.18; // 18% GST (Now applied ONLY to delivery fee)

// --- 4-TIER DELIVERY FEES ---
const DELIVERY_TIER_1 = 100; // <= 1 km
const DELIVERY_TIER_2 = 150; // 1 km to 3 km
const DELIVERY_TIER_3 = 250; // 3 km to 5 km
const DELIVERY_TIER_4 = 350; // Beyond 5 km
const DEFAULT_DELIVERY = 150; // Fallback if no location is pinned yet

// --- YOUR STORE COORDINATES (Jhula Ghar Mall Road) ---
// Converted from 30° 27′ 36″ N, 78° 3′ 59″ E
const STORE_LAT = 30.4600; 
const STORE_LNG = 78.0664; 

// Mathematical formula to calculate distance between two GPS coordinates in Kilometers
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useAuth();

  const cartKey = user ? `cartItems_${user.id || user._id}` : 'cartItems_guest';

  useEffect(() => {
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) {
      setCartItems(JSON.parse(storedCart));
    } else {
      setCartItems([]);
    }
  }, [cartKey]);

  useEffect(() => {
    if (cartItems.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
    } else {
      localStorage.removeItem(cartKey);
    }
  }, [cartItems, cartKey]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => (item.id === productId ? { ...item, quantity: newQuantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // --- CALCULATIONS ---
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  // Product Subtotal
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // --- DISTANCE-BASED DELIVERY CHARGE ---
  let deliveryCharge = 0;
  
  if (subtotal > 0) {
    const shippingAddress = user?.addresses?.shipping;
    
    if (shippingAddress?.latitude && shippingAddress?.longitude) {
      // Calculate exact distance from store to customer
      const distance = calculateDistance(
        STORE_LAT, 
        STORE_LNG, 
        parseFloat(shippingAddress.latitude), 
        parseFloat(shippingAddress.longitude)
      );

      // Apply the 4-Tier Pricing
      if (distance <= 1) {
        deliveryCharge = DELIVERY_TIER_1;
      } else if (distance <= 3) {
        deliveryCharge = DELIVERY_TIER_2;
      } else if (distance <= 5) {
        deliveryCharge = DELIVERY_TIER_3;
      } else {
        deliveryCharge = DELIVERY_TIER_4;
      }
    } else {
      // Fallback if the user hasn't set their GPS pin yet
      deliveryCharge = DEFAULT_DELIVERY;
    }
  }

  // GST Calculated ONLY on the Delivery Fee
  const gstAmount = deliveryCharge * GST_RATE;

  // Final Total: Product Subtotal + Delivery Charge + GST on Delivery
  const finalTotal = subtotal + deliveryCharge + gstAmount;
  
  // Minimum Order Check (User cannot checkout if subtotal is below ₹500)
  const isMinimumMet = subtotal >= MINIMUM_ORDER_VALUE;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartItemCount,
        subtotal,
        gstAmount,
        deliveryCharge,
        finalTotal,
        isMinimumMet,
        MINIMUM_ORDER_VALUE
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
