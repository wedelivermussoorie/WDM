import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { isStoreOpen } from '../utils/storeHours'

function loadScript(src) {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal, gstAmount, deliveryCharge, finalTotal, isMinimumMet, MINIMUM_ORDER_VALUE } = useCart()
  const { token, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const storeOpen = isStoreOpen()

  const handleCheckout = async () => {
    if (!storeOpen) {
      setError('Our store is currently closed. Order booking is available daily from 9:00 AM to 11:30 PM IST.')
      return
    }

    if (!isAuthenticated) {
      navigate('/login')
      return
    }

    if (!isMinimumMet) {
      setError(`Minimum order value is ${formatInr(MINIMUM_ORDER_VALUE)}. Please add ${formatInr(MINIMUM_ORDER_VALUE - subtotal)} more to proceed.`)
      return
    }

    setLoading(true)
    setError(null)
    
    const chosenAddress = user?.addresses?.shipping || user?.addresses?.billing
    if (!chosenAddress) {
      setError('Please add your address in My Account → Addresses before checkout.')
      setLoading(false)
      navigate('/account/addresses')
      return
    }

    const shippingAddress = {
      fullName: chosenAddress.fullName || user?.name || '',
      phone: chosenAddress.phone || user?.phone || '',
      street: chosenAddress.line1 || chosenAddress.street || '',
      line1: chosenAddress.line1 || '',
      line2: chosenAddress.line2 || '',
      landmark: chosenAddress.landmark || '',
      city: chosenAddress.city || '',
      state: chosenAddress.state || '',
      pincode: chosenAddress.pincode || '',
      country: chosenAddress.country || 'India',
    }

    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.pincode) {
      setError('Your saved address is incomplete. Please update it in My Account → Addresses.')
      setLoading(false)
      navigate('/account/addresses')
      return
    }

    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js')
    if (!res) {
      setError('Razorpay SDK failed to load. Are you online?')
      setLoading(false)
      return
    }

    try {
      const keyRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/razorpay/key`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const keyData = await keyRes.json()
      if (!keyRes.ok) {
        throw new Error(keyData.message || 'Failed to load Razorpay key')
      }

      const orderResponse = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/razorpay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: finalTotal })
      })

      const orderData = await orderResponse.json()
      if (!orderResponse.ok) {
        throw new Error(orderData.message || 'Failed to initialize payment')
      }

      const options = {
        key: keyData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'We Deliver Mussoorie',
        description: 'Grocery Delivery Payment',
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/orders/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                items: cartItems.map(item => ({
                  productId: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  image: item.imageUrl
                })),
                totalAmount: finalTotal,
                shippingAddress
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.message || 'Payment Verification failed')

            clearCart()
            alert('Payment Successful! Order Placed.')
            navigate('/')
          } catch (err) {
            alert('Payment Verification Error: ' + err.message)
          }
        },
        theme: { color: '#705d00' } // Updated to match primary brand color
      }

      const paymentObject = new window.Razorpay(options)
      paymentObject.open()
      
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalMrp = cartItems.reduce((sum, item) => sum + ((item.mrp || item.price) * item.quantity), 0)
  const savings = totalMrp - subtotal
  const remainingToMinimum = Math.max(0, MINIMUM_ORDER_VALUE - subtotal)

  return (
    <main className="w-full px-4 md:px-8 py-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4 border-b-2 border-outline-variant/20 pb-4">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-on-primary-container text-[32px]">shopping_cart</span>
        </div>
        <div>
          <h2 className="font-headline-lg text-on-background m-0 leading-tight">Your Cart</h2>
          <p className="text-on-surface-variant text-label-md m-0">{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</p>
        </div>
      </div>
      
      {error && <div className="p-4 bg-error-container text-on-error-container rounded-xl font-semibold">{error}</div>}

      {cartItems.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left: Cart Items (2/3 width on desktop) */}
          <div className="w-full lg:w-2/3 space-y-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm relative pr-12">
                <button 
                  onClick={() => removeFromCart(item.id)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container rounded-full border-none bg-transparent cursor-pointer transition-colors"
                  title="Remove item"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
                
                <Link to={`/product/${item.id}`} className="shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 bg-surface-container-low rounded-lg p-2 flex items-center justify-center">
                    <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
                  </div>
                </Link>
                
                <div className="flex-1 flex flex-col justify-center space-y-2 text-center sm:text-left w-full sm:w-auto">
                  <Link to={`/product/${item.id}`} className="no-underline">
                    <h3 className="font-semibold text-[16px] text-on-background m-0 hover:text-primary transition-colors">{item.name}</h3>
                  </Link>
                  <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                    <span className="text-primary font-bold text-[18px]">{formatInr(item.price)}</span>
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-on-surface-variant text-[14px] line-through">{formatInr(item.mrp)}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div className="flex items-center bg-surface-container-low rounded-lg border border-outline-variant/30 h-10 w-28">
                    <button 
                      className="flex-1 h-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border-none bg-transparent cursor-pointer" 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <span className="material-symbols-outlined text-[18px]">remove</span>
                    </button>
                    <span className="font-semibold text-[14px] text-on-background w-8 text-center">{item.quantity}</span>
                    <button 
                      className="flex-1 h-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors border-none bg-transparent cursor-pointer" 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                    </button>
                  </div>
                  <div className="font-bold text-on-background text-[16px]">
                    {formatInr(item.price * item.quantity)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Order Summary (1/3 width on desktop) */}
          <div className="w-full lg:w-1/3 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm p-6 sticky top-24">
            <h3 className="font-headline-sm text-on-background m-0 mb-6 pb-4 border-b border-outline-variant/20">Order Summary</h3>
            
            <div className="space-y-4 mb-6 text-[15px]">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="text-on-background font-semibold">{formatInr(totalMrp)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between items-center text-primary font-medium">
                  <span>Product Discount</span>
                  <span>-{formatInr(savings)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Items Total</span>
                <span className="text-on-background font-semibold">{formatInr(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>GST (18%)</span>
                <span className="text-on-background font-semibold">{formatInr(gstAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant pb-4 border-b border-outline-variant/20">
                <span>Delivery Fee</span>
                <span className="text-on-background font-semibold">{deliveryCharge > 0 ? formatInr(deliveryCharge) : 'Free'}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-[20px] text-on-background pt-2">
                <span>Total Amount</span>
                <span>{formatInr(finalTotal)}</span>
              </div>
              {!storeOpen && (
                <div className="text-center text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 py-2.5 px-3 rounded-lg text-label-sm font-bold mt-4 flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">bedtime</span>
                  <span>Store closed for orders (9:00 AM – 11:30 PM IST)</span>
                </div>
              )}
              {storeOpen && !isMinimumMet && (
                <div className="text-center text-error bg-error-container text-on-error-container py-2 rounded-lg text-label-sm font-bold mt-4">
                  Add {formatInr(remainingToMinimum)} more to reach the minimum order value
                </div>
              )}
              {savings > 0 && (
                <div className="text-center text-primary bg-primary-container py-2 rounded-lg text-label-sm font-bold mt-4">
                  You will save {formatInr(savings)} on this order
                </div>
              )}
            </div>
            
            <button 
              className={`w-full py-4 rounded-xl font-bold text-[16px] border-none transition-all flex justify-center items-center gap-2 ${
                loading || !isMinimumMet || !storeOpen ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed' : 'bg-primary text-on-primary hover:brightness-95 cursor-pointer shadow-md'
              }`} 
              onClick={handleCheckout} 
              disabled={loading || !isMinimumMet || !storeOpen}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span>
                  Processing...
                </>
              ) : !storeOpen ? (
                'Store Closed'
              ) : (
                'Proceed to Checkout'
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant/20">
          <div className="w-24 h-24 mx-auto bg-surface-container-low rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-[48px] opacity-50">shopping_cart</span>
          </div>
          <h3 className="font-headline-md text-on-background m-0 mb-2">Your cart is empty</h3>
          <p className="text-body-lg mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Discover our fresh groceries and meals.</p>
          <Link to="/" className="inline-block px-8 py-3 bg-primary text-on-primary rounded-xl font-semibold no-underline hover:brightness-95 transition-all">
            Start Shopping
          </Link>
        </div>
      )}
    </main>
  )
}

export default Cart
