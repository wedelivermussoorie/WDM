import { Link, useLocation } from 'react-router-dom'

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const menuItems = [
    { label: 'GROCERY', path: '/grocery' },
    { label: 'FOOD', path: '/food' },
    { label: 'ESSENTIALS', path: '/essentials' },
    { label: 'BAKERY', path: '/bakery' },
    { label: '18+', path: '/18-plus' },
  ]

  return (
    <>
      <aside className={`fixed top-0 left-0 h-full w-64 bg-surface-container-lowest shadow-xl z-[60] transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 no-underline" onClick={onClose}>
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>delivery_dining</span>
            <span className="font-extrabold text-primary leading-tight text-[18px]">
              WE DELIVER<br /><span className="text-on-background">MUSSOORIE</span>
            </span>
          </Link>
          <button onClick={onClose} className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high border-none cursor-pointer text-on-surface-variant">
             <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center px-4 py-3 rounded-xl font-semibold transition-colors no-underline text-[14px] ${
                location.pathname === item.path 
                  ? 'bg-primary-container text-on-primary-container' 
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-on-background/20 backdrop-blur-sm z-[55] transition-opacity" 
          onClick={onClose}
        />
      )}
    </>
  )
}

export default Sidebar
