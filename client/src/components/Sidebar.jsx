import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'

function Sidebar({ isOpen, onClose }) {
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [expandedCat, setExpandedCat] = useState(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/categories`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data)
        }
      })
      .catch(err => console.error("Failed to fetch categories:", err))
  }, [])

  // Auto-expand the category that matches the current URL
  useEffect(() => {
    const match = categories.find(c => location.pathname === `/category/${c.id}` || location.pathname.startsWith(`/category/${c.id}`))
    if (match) setExpandedCat(match.id)
  }, [location.pathname, categories])

  const toggleCat = (catId) => {
    setExpandedCat(prev => prev === catId ? null : catId)
  }

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
        
        <nav className="flex-1 overflow-y-auto py-4 px-4 flex flex-col gap-1">
          {categories.map((cat) => {
            const catPath = `/category/${cat.id}`
            const isCatActive = location.pathname === catPath
            const isExpanded = expandedCat === cat.id
            const hasSubsections = cat.subsections && cat.subsections.length > 0

            return (
              <div key={cat.id}>
                {/* Section row */}
                <div className={`flex items-center rounded-xl transition-colors ${isCatActive ? 'bg-primary-container' : 'hover:bg-surface-container'}`}>
                  <Link
                    to={catPath}
                    onClick={onClose}
                    className={`flex-1 flex items-center px-4 py-3 font-semibold no-underline text-[14px] rounded-xl transition-colors ${
                      isCatActive
                        ? 'text-on-primary-container'
                        : 'text-on-surface-variant hover:text-on-background'
                    }`}
                  >
                    {cat.icon && (
                      <span className="material-symbols-outlined mr-3 text-[20px]">{cat.icon}</span>
                    )}
                    {cat.title}
                  </Link>

                  {/* Expand/collapse toggle — only show if subsections exist */}
                  {hasSubsections && (
                    <button
                      type="button"
                      onClick={() => toggleCat(cat.id)}
                      className="pr-3 py-3 bg-transparent border-none cursor-pointer text-on-surface-variant hover:text-on-background transition-colors"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <span
                        className="material-symbols-outlined text-[18px] transition-transform duration-200"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', display: 'block' }}
                      >
                        expand_more
                      </span>
                    </button>
                  )}
                </div>

                {/* Subsection list */}
                {hasSubsections && isExpanded && (
                  <div className="ml-4 mt-0.5 mb-1 border-l-2 border-outline-variant/30 pl-3 flex flex-col gap-0.5">
                    {cat.subsections.map((sub) => {
                      const subPath = `/category/${cat.id}?sub=${sub.value}`
                      // Match by just comparing the subsection value in the query param
                      const isSubActive = location.pathname === catPath && location.search === `?sub=${sub.value}`
                      return (
                        <Link
                          key={sub.value}
                          to={subPath}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium no-underline transition-colors ${
                            isSubActive
                              ? 'bg-primary-container/60 text-on-primary-container font-semibold'
                              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-background'
                          }`}
                        >
                          {sub.icon && (
                            <span className="material-symbols-outlined text-[16px] opacity-70">{sub.icon}</span>
                          )}
                          {sub.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
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
