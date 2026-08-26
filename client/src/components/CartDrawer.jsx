import { useEffect } from 'react'
import { useCart } from '../context/CartContext'

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export default function CartDrawer({ open, onClose, onViewCart }) {
  const {
    cartItems: items,
    cartItemCount: count,
    subtotal,
    gstAmount,
    deliveryCharge,
    finalTotal,
    isMinimumMet,
    MINIMUM_ORDER_VALUE,
  } = useCart()

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <>
      <div 
        className={`fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[999] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose} 
      />
      
      <aside 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-surface-container-lowest shadow-2xl z-[1000] flex flex-col transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog" 
        aria-modal="true" 
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/30">
          <div className="flex items-center gap-2 text-on-background">
            <span className="material-symbols-outlined text-primary text-[28px]">shopping_cart</span>
            <h2 className="font-headline-sm m-0 leading-tight">Your Cart</h2>
          </div>
          <button 
            type="button" 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high border-none cursor-pointer text-on-surface-variant" 
            onClick={onClose} 
            aria-label="Close cart drawer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items?.length ? (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
                <div className="w-16 h-16 bg-white rounded-lg p-1 flex-shrink-0 flex items-center justify-center">
                   <img className="max-w-full max-h-full object-contain" src={item.imageUrl} alt={item.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15px] text-on-background truncate">{item.name}</div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-on-surface-variant text-[13px] font-medium">Qty: {item.quantity}</span>
                    <span className="text-primary font-bold text-[16px]">{formatInr(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-on-surface-variant mt-10">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[40px] opacity-50">shopping_cart</span>
              </div>
              <p className="font-headline-sm m-0 text-on-background mb-2">Cart is empty</p>
              <p className="text-[14px]">Add some products to your cart.</p>
            </div>
          )}
        </div>

        {items?.length > 0 && (
          <div className="p-6 border-t border-outline-variant/30 bg-surface flex flex-col gap-2">
            <div className="flex justify-between items-center text-[14px] text-on-surface-variant">
              <span>Subtotal ({count} items)</span>
              <span>{formatInr(subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-[14px] text-on-surface-variant">
              <span>GST (18%)</span>
              <span>{formatInr(gstAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-[14px] text-on-surface-variant">
              <span>Delivery Charge</span>
              <span>{deliveryCharge > 0 ? formatInr(deliveryCharge) : 'Free'}</span>
            </div>

            <div className="flex justify-between items-center mt-2 mb-4 text-[16px]">
              <span className="font-bold text-on-background">Total</span>
              <span className="font-bold text-[20px] text-primary">{formatInr(finalTotal)}</span>
            </div>

            {!isMinimumMet && (
              <div className="text-red-500 text-sm mb-2 text-center font-medium">
                Add {formatInr(MINIMUM_ORDER_VALUE - subtotal)} more to reach the minimum order value.
              </div>
            )}

            <button 
              type="button" 
              disabled={!isMinimumMet}
              className={`w-full py-4 rounded-xl font-bold text-[16px] border-none flex items-center justify-center gap-2 transition-all shadow-md ${
                isMinimumMet 
                  ? 'bg-primary text-on-primary cursor-pointer hover:brightness-95' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              onClick={onViewCart}
            >
              <span>View Full Cart</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
