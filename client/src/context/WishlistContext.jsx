import { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlistItems, setWishlistItems] = useState([]);
  const { user } = useAuth();

  const wishlistKey = user ? `wishlistItems_${user.id || user._id}` : 'wishlistItems_guest';

  useEffect(() => {
    const stored = localStorage.getItem(wishlistKey);
    if (stored) {
      setWishlistItems(JSON.parse(stored));
    } else {
      setWishlistItems([]);
    }
  }, [wishlistKey]);

  useEffect(() => {
    if (wishlistItems.length > 0) {
      localStorage.setItem(wishlistKey, JSON.stringify(wishlistItems));
    } else {
      localStorage.removeItem(wishlistKey);
    }
  }, [wishlistItems, wishlistKey]);

  const addToWishlist = (product) => {
    setWishlistItems(prev => {
      if (prev.some(item => item.id === product.id)) return prev;
      return [...prev, { ...product }];
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlistItems(prev => prev.filter(item => item.id !== productId));
  };

  const toggleWishlist = (product) => {
    setWishlistItems(prev => {
      if (prev.some(item => item.id === product.id)) {
        return prev.filter(item => item.id !== product.id);
      }
      return [...prev, { ...product }];
    });
  };

  const isInWishlist = (productId) => wishlistItems.some(item => item.id === productId);

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
