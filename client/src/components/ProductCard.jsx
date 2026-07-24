import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  const inWishlist = isInWishlist(product.id)
  const productDetailId = product._id || product.id?.trim()

  return (
    <div className="group bg-surface-container-lowest rounded-lg overflow-hidden border border-outline-variant/20 shadow-sm hover:shadow-lg transition-all flex flex-col h-full">
      <Link to={`/product/${encodeURIComponent(productDetailId || '')}`} className="block no-underline text-on-background flex-1 relative">
        {/* Badge */}
        {product.badge && (
          <span className="absolute top-2 left-2 z-10 bg-error text-white text-label-sm px-2 py-0.5 rounded-full">
            {product.badge}
          </span>
        )}
        
        {/* Wishlist Toggle */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product) }}
          className={`absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/80 border border-outline-variant/30 cursor-pointer transition-colors ${inWishlist ? 'text-error' : 'text-on-surface-variant hover:text-error'}`}
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: inWishlist ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
        </button>
        
        {/* Image */}
        <div className="h-52 overflow-hidden relative">
          <img
            className="w-full h-full object-contain bg-surface-container-low group-hover:scale-105 transition-transform duration-500 p-3"
            src={product.imageUrl}
            alt={product.name}
          />
        </div>
        
        {/* Info */}
        <div className="p-4 space-y-2">
          <h4 className="font-semibold text-[15px] leading-tight m-0 text-on-background line-clamp-2 min-h-[40px]">{product.name}</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-primary font-bold text-[18px]">{formatInr(product.price)}</span>
            {product.unit && <span className="text-on-surface-variant text-[12px]">/ {product.unit}</span>}
          </div>
        </div>
      </Link>
      
      {/* Add to cart */}
      <div className="mt-auto">
        {product.quantity > 0 ? (
          <button
            className="mx-4 mb-4 py-2.5 bg-primary text-on-primary rounded-xl font-semibold text-[14px] border-none cursor-pointer hover:brightness-95 transition-all text-center w-[calc(100%-2rem)]"
            onClick={() => addToCart(product)}
          >
            Add to Cart
          </button>
        ) : (
          <button disabled className="mx-4 mb-4 py-2.5 bg-surface-container text-on-surface-variant rounded-xl font-semibold text-[14px] border-none cursor-not-allowed text-center w-[calc(100%-2rem)]">
            Out of Stock
          </button>
        )}
      </div>
    </div>
  )
}
