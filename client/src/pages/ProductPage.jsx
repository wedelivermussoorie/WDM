import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function ProductPage() {
  const { productId } = useParams()
  const [product, setProduct] = useState(null)
  const [status, setStatus] = useState('loading')
  const [quantity, setQuantity] = useState(1)
  const { toggleWishlist, isInWishlist } = useWishlist()
  const { addToCart } = useCart()

  useEffect(() => {
    setStatus('loading')

    fetch(`${import.meta.env.VITE_API_URL || ''}/api/products/${encodeURIComponent(productId)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Product not found')
        }
        return response.json()
      })
      .then((data) => {
        setProduct(data)
        setStatus('ready')
      })
      .catch(() => {
        setProduct(null)
        setStatus('error')
      })
  }, [productId])

  const breadcrumbs = useMemo(() => {
    if (!product) return []
    const categoryPath = product.category === '18+' ? '/18-plus' : `/${product.category.toLowerCase()}`
    return [
      { label: 'Home', path: '/' },
      { label: product.category.charAt(0).toUpperCase() + product.category.slice(1), path: categoryPath },
      { label: product.name, path: null },
    ]
  }, [product])

  if (status === 'loading') {
    return <main className="w-full px-4 md:px-8 py-16 flex justify-center"><div className="animate-pulse w-12 h-12 rounded-full bg-surface-container-high"></div></main>
  }

  if (status === 'error' || !product) {
    return (
      <main className="w-full px-4 md:px-8 py-16 flex flex-col items-center gap-4 text-on-surface-variant">
        <span className="material-symbols-outlined text-[64px]">production_quantity_limits</span>
        <h2 className="font-headline-md m-0 text-on-background">Product not found</h2>
        <Link to="/" className="text-primary hover:underline font-semibold mt-4">Return Home</Link>
      </main>
    )
  }

  const inWishlist = isInWishlist(product.id)

  return (
    <main className="w-full px-4 md:px-8 py-8 space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-label-md text-on-surface-variant" aria-label="Breadcrumb">
        {breadcrumbs.map((item, index) => (
          <div key={item.label} className="flex items-center gap-2">
            {item.path ? (
              <Link to={item.path} className="hover:text-primary transition-colors no-underline text-inherit">{item.label}</Link>
            ) : (
              <span className="text-on-background">{item.label}</span>
            )}
            {index < breadcrumbs.length - 1 && <span className="material-symbols-outlined text-[16px]">chevron_right</span>}
          </div>
        ))}
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image Gallery */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-8 relative flex items-center justify-center min-h-[400px]">
          {product.badge && (
            <span className="absolute top-4 left-4 z-10 bg-error text-white text-label-md px-3 py-1 rounded-full font-bold">
              {product.badge}
            </span>
          )}
          <img className="w-full max-w-md h-auto object-contain hover:scale-105 transition-transform duration-300" src={product.imageUrl} alt={product.name} />
        </div>

        {/* Right: Product Details */}
        <div className="space-y-6">
          <div>
            <h1 className="font-headline-lg lg:text-[40px] text-on-background m-0 leading-tight mb-2">{product.name}</h1>
            <p className="text-label-md text-on-surface-variant m-0 flex items-center gap-1">
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span> Guaranteed Quality
            </p>
          </div>

          <div className="flex items-end gap-3 pb-6 border-b border-outline-variant/30">
            <span className="text-[36px] font-extrabold text-primary leading-none">{formatInr(product.price)}</span>
            {product.unit && <span className="text-on-surface-variant text-[16px] mb-1">/ {product.unit}</span>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-on-background">Quantity</span>
              {product.quantity > 0 ? (
                <span className="text-primary bg-primary-container px-2 py-0.5 rounded text-label-sm font-bold">In Stock ({product.quantity})</span>
              ) : (
                <span className="text-error bg-error-container text-on-error-container px-2 py-0.5 rounded text-label-sm font-bold">Out of Stock</span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Stepper */}
              <div className="flex items-center bg-surface-container-low rounded-xl border border-outline-variant/30 h-12 w-32">
                <button
                  type="button"
                  className="flex-1 h-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={product.quantity <= 0}
                >
                  <span className="material-symbols-outlined">remove</span>
                </button>
                <span className="font-semibold text-[16px] text-on-background w-8 text-center">{quantity}</span>
                <button
                  type="button"
                  className="flex-1 h-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border-none bg-transparent cursor-pointer disabled:opacity-50"
                  onClick={() => setQuantity((value) => value + 1)}
                  disabled={product.quantity <= 0 || quantity >= product.quantity}
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>

              {/* Add to Cart */}
              <button
                type="button"
                className={`flex-1 h-12 rounded-xl font-semibold text-[16px] flex items-center justify-center gap-2 border-none transition-all ${
                  product.quantity > 0 
                    ? 'bg-primary text-on-primary hover:brightness-95 cursor-pointer shadow-md shadow-primary/20 hover:shadow-lg hover:-translate-y-0.5' 
                    : 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed opacity-70'
                }`}
                onClick={() => addToCart(product, quantity)}
                disabled={product.quantity <= 0}
              >
                <span className="material-symbols-outlined">shopping_cart</span>
                {product.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
              </button>

              {/* Wishlist */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  inWishlist 
                    ? 'border-error/30 bg-error-container text-error hover:bg-error-container/80' 
                    : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container'
                }`}
                title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: inWishlist ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
              </button>
            </div>
          </div>
          
          {/* Trust badges for product page */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-outline-variant/30">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
                 <span className="material-symbols-outlined text-[20px]">local_shipping</span>
               </div>
               <div>
                 <p className="m-0 text-[13px] font-semibold text-on-background">Fast Delivery</p>
                 <p className="m-0 text-[11px] text-on-surface-variant">Same day in Mussoorie</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-primary">
                 <span className="material-symbols-outlined text-[20px]">assignment_return</span>
               </div>
               <div>
                 <p className="m-0 text-[13px] font-semibold text-on-background">Easy Returns</p>
                 <p className="m-0 text-[11px] text-on-surface-variant">No questions asked</p>
               </div>
             </div>
          </div>

        </div>
      </div>
    </main>
  )
}

export default ProductPage
