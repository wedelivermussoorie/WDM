import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-surface-container-highest mt-12">
      <div className="w-full px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-md">
            <div className="flex items-center gap-sm">
              <span className="material-symbols-outlined text-primary text-headline-md">delivery_dining</span>
              <h2 className="font-black text-headline-md m-0">WE DELIVER MUSSOORIE</h2>
            </div>
            <p className="text-on-surface-variant text-body-md">
              Delivering happiness to your doorstep in Mussoorie. Fresh groceries, delicious food, and everyday essentials.
            </p>
          </div>

          <div>
            <h5 className="font-headline-md text-body-md mb-md">Quick Links</h5>
            <ul className="space-y-xs text-on-surface-variant list-none p-0 m-0">
              <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Shipping Info</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Returns</a></li>
            </ul>
          </div>

          <div>
            <h5 className="font-headline-md text-body-md mb-md">Contact Info</h5>
            <ul className="space-y-xs text-on-surface-variant list-none p-0 m-0">
              <li className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">location_on</span> Mussoorie, Uttarakhand
              </li>
              <li className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">call</span> +91 7420097008
              </li>
              <li className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px]">mail</span> info@wedelivermussoorie.com
              </li>
            </ul>
          </div>

          <div className="space-y-md">
            <h5 className="font-headline-md text-body-md">Newsletter</h5>
            <p className="text-label-sm text-on-surface-variant">Subscribe to get special offers and delivery updates.</p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email Address"
                className="flex-grow rounded-l-lg border-none bg-surface-container-low px-md py-sm outline-none"
              />
              <button className="bg-primary text-on-primary px-md py-sm rounded-r-lg font-label-md border-none cursor-pointer hover:brightness-95 transition-all">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-label-sm text-on-surface-variant">© {new Date().getFullYear()} WE DELIVER MUSSOORIE. All rights reserved.</p>
          <div className="flex gap-md">
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary-container cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center hover:bg-primary-container cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[20px]">public</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
