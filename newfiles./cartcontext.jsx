import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// --- BUSINESS RULES ---
const MINIMUM_ORDER_VALUE = 500;
const GST_RATE = 0.18; // 18% GST

// --- DELIVERY TIERS ---
const DELIVERY_TIER_1 = 30; // 0 to 2 km
const DELIVERY_TIER_2 = 50; // 2 to 5 km
const DELIVERY_TIER_3 = 80; // Above 5 km
const DEFAULT_DELIVERY = 50; // Fallback if no location is pinned yet

// --- YOUR STORE COORDINATES ---
// IMPORTANT: Replace these with the exact latitude/longitude of your Mussoorie store/kitchen
const STORE_LAT = 30.4598; 
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
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstAmount = subtotal * GST_RATE;
  
  // --- DISTANCE-BASED DELIVERY CHARGE ---
  let deliveryCharge = 0;
  
  // Only calculate delivery if cart has items and they haven't met a free delivery threshold (if you have one)
  if (subtotal > 0 && subtotal < MINIMUM_ORDER_VALUE) {
    const shippingAddress = user?.addresses?.shipping;
    
    if (shippingAddress?.latitude && shippingAddress?.longitude) {
      // Calculate exact distance from store to customer
      const distance = calculateDistance(
        STORE_LAT, 
        STORE_LNG, 
        parseFloat(shippingAddress.latitude), 
        parseFloat(shippingAddress.longitude)
      );

      // Apply the 3-Tier Pricing
      if (distance <= 2) {
        deliveryCharge = DELIVERY_TIER_1;
      } else if (distance <= 5) {
        deliveryCharge = DELIVERY_TIER_2;
      } else {
        deliveryCharge = DELIVERY_TIER_3;
      }
    } else {
      // Fallback if the user hasn't set their GPS pin yet
      deliveryCharge = DEFAULT_DELIVERY;
    }
  }

  const finalTotal = subtotal + gstAmount + deliveryCharge;
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