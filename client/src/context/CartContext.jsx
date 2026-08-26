import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [pincode, setPincode] = useState('');

  // The 3 delivery charge tiers (Minimum to Maximum)
  const DELIVERY_FEES = {
    MIN: 30,
    MID: 50,
    MAX: 80
  };
  
  // Mapping the 3 numbers to specific Mussoorie pincodes
  // You can add as many pincodes as you need and assign them one of the 3 tiers
  const deliveryZones = {
    "248179": DELIVERY_FEES.MIN, // Closest zone, cheapest delivery
    "248122": DELIVERY_FEES.MID, // Medium distance
    "248178": DELIVERY_FEES.MAX, // Farthest zone, maximum delivery
  };

  // Core Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const gstAmount = subtotal * 0.18; 
  
  // Pincode Validation & Delivery Logic
  let deliveryCharge = 0;
  let deliveryError = '';

  if (pincode) {
    if (deliveryZones[pincode] !== undefined) {
      deliveryCharge = deliveryZones[pincode];
    } else {
      deliveryError = 'Sorry, we do not deliver to this pincode yet.';
    }
  }

  // Calculate final total (GST is calculated only on the food/items, not the delivery fee)
  const grandTotal = subtotal + gstAmount + (deliveryError ? 0 : deliveryCharge);

  return (
    <CartContext.Provider value={{
      cartItems, setCartItems,
      pincode, setPincode,
      subtotal, gstAmount, deliveryCharge, grandTotal,
      deliveryError, DELIVERY_FEES
    }}>
      {children}
    </CartContext.Provider>
  );
};
