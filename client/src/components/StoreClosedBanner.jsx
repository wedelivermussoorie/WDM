import { useState, useEffect } from 'react'
import { getStoreStatus } from '../utils/storeHours'

export default function StoreClosedBanner() {
  const [status, setStatus] = useState(() => getStoreStatus())

  useEffect(() => {
    // Re-check store status every 30 seconds
    const interval = setInterval(() => {
      setStatus(getStoreStatus())
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (status.isOpen) return null

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[990] bg-slate-900/95 backdrop-blur-md border-t border-amber-500/30 text-white shadow-2xl px-4 py-3 sm:px-6 transition-all animate-slide-up"
      role="alert"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
            <span className="material-symbols-outlined text-[24px]">nightlight</span>
          </div>
          <div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h4 className="font-bold text-[15px] sm:text-[16px] text-amber-300 m-0 tracking-wide">
                Store Currently Closed
              </h4>
            </div>
            <p className="text-[13px] sm:text-[14px] text-slate-300 m-0 mt-0.5 leading-snug">
              We operate daily from <span className="font-semibold text-white">9:00 AM to 11:30 PM IST</span>. Order booking will reopen tomorrow morning at <span className="font-semibold text-amber-300">9:00 AM</span>.
            </p>
          </div>
        </div>
        
        <div className="shrink-0 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-[12px] text-slate-300 font-medium whitespace-nowrap">
          ⏰ Hours: 9:00 AM – 11:30 PM IST
        </div>
      </div>
    </div>
  )
}
