import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  {
    path: '/admin',
    label: 'Dashboard',
    exact: true,
    icon: 'dashboard'
  },
  {
    path: '/admin/products',
    label: 'Products',
    icon: 'inventory_2'
  },
  {
    path: '/admin/orders',
    label: 'Orders',
    icon: 'list_alt'
  },
  {
    path: '/admin/users',
    label: 'Users',
    icon: 'group'
  },
  {
    path: '/admin/categories',
    label: 'Sections',
    icon: 'category'
  }
]

export default function AdminLayout({ children, title }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="min-h-screen bg-surface flex">
      {/* Sidebar Overlay (Mobile) */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-[60] md:hidden"
          onClick={closeMobileMenu}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col sticky top-0 h-screen z-[70] fixed md:relative transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/50">
          <Link to="/admin" className="flex items-center justify-center flex-1 hover:bg-surface-container-low transition-colors" onClick={closeMobileMenu}>
            <img src="/logo.png" alt="We Deliver Mussoorie" className="h-10 object-contain" />
          </Link>
          <button onClick={closeMobileMenu} className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border-none cursor-pointer text-on-surface-variant">
             <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto space-y-1 text-[14px]">
          <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 px-3 mt-2">Main Menu</div>
          {navItems.map(item => {
            const isActive = item.exact
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer no-underline ${
                  isActive 
                    ? 'bg-primary-container text-on-primary-container shadow-sm' 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}

          <div className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider mb-3 px-3 mt-8">Quick Links</div>
          <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer no-underline text-on-surface-variant hover:bg-surface-container hover:text-on-background">
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            View Store
          </Link>
        </nav>

        <div className="p-4 border-t border-outline-variant/30">
          <button 
            type="button" 
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all cursor-pointer border-none bg-transparent text-error hover:bg-error-container"
            onClick={handleLogout}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        
        {/* Mobile Header (Only visible on small screens) */}
        <div className="md:hidden flex items-center justify-between p-4 bg-surface-container-lowest border-b border-outline-variant/30 sticky top-0 z-50">
           <div className="flex items-center gap-3">
             <button onClick={toggleMobileMenu} className="flex items-center justify-center p-1 bg-transparent border-none text-on-background">
               <span className="material-symbols-outlined">menu</span>
             </button>
             <Link to="/admin"><img src="/logo.png" alt="WDM" className="h-8" /></Link>
             <span className="font-bold text-on-background">Admin</span>
           </div>
           <Link to="/" className="text-on-surface-variant flex items-center"><span className="material-symbols-outlined">storefront</span></Link>
        </div>

        {/* Top Header */}
        <header className="bg-surface-container-lowest border-b border-outline-variant/30 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 md:top-0 z-40 hidden md:flex">
          <h1 className="font-headline-md text-on-background m-0">{title}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-surface-container px-3 py-1.5 rounded-full border border-outline-variant/20">
              <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[14px]">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col pr-2">
                <span className="text-[13px] font-semibold text-on-background leading-tight">{user?.name}</span>
                <span className="text-[11px] font-bold text-primary tracking-wide leading-tight">ADMIN</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 flex-1 overflow-x-auto w-full">
          <div className="md:hidden mb-6 flex justify-between items-center">
            <h1 className="font-headline-md text-on-background m-0">{title}</h1>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
