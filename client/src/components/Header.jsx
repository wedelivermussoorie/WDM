import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import CartDrawer from './CartDrawer'

export default function Header({ toggleSidebar }) {
  const { isAuthenticated, logout, user } = useAuth()
  const { cartItemCount } = useCart()
  const { wishlistCount } = useWishlist()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setIsCartOpen(false)
    setIsProfileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!isCartOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isCartOpen])

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)
  const viewFullCart = () => { setIsCartOpen(false); navigate('/cart') }
  const handleLogout = () => { setIsProfileOpen(false); logout(); navigate('/') }

  useEffect(() => {
    if (!isProfileOpen) return
    const onPointerDown = (e) => {
      if (!e.target.closest('[data-profile-menu-root="true"]')) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [isProfileOpen])

  return (
    <>
      <header className="bg-surface shadow-sm sticky top-0 z-50">
        {/* ── Top utility bar ── */}
        <div className="w-full px-4 md:px-8 py-1 flex justify-between items-center text-[12px] border-b border-outline-variant/30">
          <div className="hidden md:flex gap-6">
            <a href="#about" className="text-on-surface-variant hover:text-primary transition-colors">About Us</a>
            <a href="#contact" className="text-on-surface-variant hover:text-primary transition-colors">Contact Us</a>
          </div>
          <div className="flex items-center gap-4 ml-auto">
            <span className="flex items-center gap-1 text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">call</span> 7420097008
            </span>
            <Link to="/wishlist" className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[16px]">favorite</span>
              <span>Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ''}</span>
            </Link>
            {isAuthenticated ? (
              <div
                data-profile-menu-root="true"
                className="relative"
                onMouseEnter={() => setIsProfileOpen(true)}
                onMouseLeave={() => setIsProfileOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors bg-transparent border-none cursor-pointer text-[12px] font-inherit p-0"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  <span>Hello, {user?.name || 'Account'}</span>
                  <span className="material-symbols-outlined text-[16px]">expand_more</span>
                </button>

                <div
                  className={[
                    'absolute right-0 mt-2 w-56 z-[60] bg-surface-container-lowest border border-outline-variant/20 rounded-xl shadow-lg overflow-hidden transition-all origin-top-right',
                    isProfileOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible',
                  ].join(' ')}
                  role="menu"
                >
                  <Link onClick={() => setIsProfileOpen(false)} to="/account" className="block px-4 py-3 text-[13px] text-on-surface-variant hover:bg-surface-container-low transition-colors no-underline">Dashboard</Link>
                  <Link onClick={() => setIsProfileOpen(false)} to="/account/orders" className="block px-4 py-3 text-[13px] text-on-surface-variant hover:bg-surface-container-low transition-colors no-underline">Orders</Link>
                  <Link onClick={() => setIsProfileOpen(false)} to="/account/downloads" className="block px-4 py-3 text-[13px] text-on-surface-variant hover:bg-surface-container-low transition-colors no-underline">Downloads</Link>
                  <Link onClick={() => setIsProfileOpen(false)} to="/account/addresses" className="block px-4 py-3 text-[13px] text-on-surface-variant hover:bg-surface-container-low transition-colors no-underline">Addresses</Link>
                  <Link onClick={() => setIsProfileOpen(false)} to="/account/details" className="block px-4 py-3 text-[13px] text-on-surface-variant hover:bg-surface-container-low transition-colors no-underline">Account details</Link>
                  <Link onClick={() => setIsProfileOpen(false)} to="/account/wishlist" className="block px-4 py-3 text-[13px] text-on-surface-variant hover:bg-surface-container-low transition-colors no-underline">Wishlist</Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-[13px] text-on-surface-variant hover:bg-surface-container-low transition-colors bg-transparent border-none cursor-pointer"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[16px]">person</span> Login / Register
              </Link>
            )}
            {isAuthenticated && user?.isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 text-primary font-semibold hover:text-primary/80 transition-colors">
                <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span> Admin
              </Link>
            )}
          </div>
        </div>

        {/* ── Main branding + search row ── */}
        <div className="w-full px-4 md:px-8 py-3 flex flex-wrap md:flex-nowrap items-center gap-4 justify-between">
          {/* Hamburger — always visible, opens sidebar */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              aria-label="Toggle menu"
              className="flex flex-col justify-center gap-[5px] w-10 h-10 bg-primary-container border border-outline-variant/30 rounded-xl cursor-pointer p-2 flex-shrink-0"
            >
              <span className="block w-full h-[3px] bg-on-primary-container rounded-sm"></span>
              <span className="block w-full h-[3px] bg-on-primary-container rounded-sm"></span>
              <span className="block w-full h-[3px] bg-on-primary-container rounded-sm"></span>
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 no-underline">
              <img src="/logo.png" alt="We Deliver Mussoorie" className="h-10 md:h-14 w-auto max-w-[150px] md:max-w-[200px] object-contain" />
            </Link>
          </div>

          {/* All Categories button (desktop) */}
          <button onClick={() => navigate('/')} className="hidden lg:flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-xl font-semibold text-[13px] hover:brightness-95 transition-all shadow-sm border-none cursor-pointer flex-shrink-0">
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            All Categories
          </button>

          {/* Search bar — grows to fill space */}
          <div className="relative flex-1 w-full order-last md:order-none min-w-[200px] mt-2 md:mt-0">
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none text-[14px]"
              placeholder="Search for groceries, food and more..."
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          </div>

          {/* Cart button */}
          <button
            onClick={openCart}
            aria-label="Open cart"
            className="relative flex-shrink-0 w-10 h-10 bg-surface-container hover:bg-surface-container-high rounded-full cursor-pointer transition-colors border-none flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-on-surface-variant">shopping_cart</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-on-primary text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <CartDrawer open={isCartOpen} onClose={closeCart} onViewCart={viewFullCart} />
    </>
  )
}
