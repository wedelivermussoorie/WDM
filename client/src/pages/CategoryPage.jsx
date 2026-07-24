import { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'

// Mapping categories to material icons
const CATEGORY_ICONS = {
  grocery: 'shopping_basket',
  food: 'restaurant',
  essentials: 'inventory_2',
  bakery: 'cake',
  '18+': 'warning'
}

const SUBSECTIONS_BY_CATEGORY = {
  grocery: [
    { value: 'fresh-vegetables', label: 'Fresh Vegetables' },
    { value: 'atta-dal-rice', label: 'Atta, Dal & Rice' },
    { value: 'masalas-oils', label: 'Masalas & Oils' },
    { value: 'party-celebrations', label: 'Party & Celebrations' },
  ],
  food: [
    { value: 'drinks-beverages', label: 'Drinks & Beverages' },
    { value: 'chips-namkeens', label: 'Chips & Namkeens' },
    { value: 'sweets-chocolates', label: 'Sweets & Chocolates' },
    { value: 'instant-food-noodles', label: 'Instant Food & Noodles' },
  ],
  essentials: [
    { value: 'personal-care', label: 'Personal Care' },
    { value: 'home-cleaning', label: 'Home & Cleaning' },
    { value: 'baby-care', label: 'Baby Care' },
    { value: 'stationery', label: 'Stationery' },
  ],
  bakery: [
    { value: 'dairy-bread-milk', label: 'Dairy, Bread & Milk' },
    { value: 'bakery-biscuits', label: 'Bakery & Biscuits' },
  ],
  '18+': [
    { value: 'female-wellness', label: 'Female Wellness' },
    { value: 'pleasure-protection', label: 'Pleasure & Protection' },
  ],
}

function getSubsectionOptions(category) {
  const key = typeof category === 'string' ? category : ''
  return SUBSECTIONS_BY_CATEGORY[key] || []
}

function CategoryPage({ category }) {
  const [products, setProducts] = useState([])
  const [activeSubsection, setActiveSubsection] = useState('all')

  useEffect(() => {
    setActiveSubsection('all')
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/products?category=${encodeURIComponent(category)}`)
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        setProducts([])
      })
  }, [category])

  const title = category.charAt(0).toUpperCase() + category.slice(1)
  const icon = CATEGORY_ICONS[category.toLowerCase()] || 'category'
  const subsectionOptions = useMemo(() => getSubsectionOptions(category), [category])

  const groups = useMemo(() => {
    const buckets = new Map()
    subsectionOptions.forEach((s) => buckets.set(s.value, []))
    const other = []

    for (const p of products) {
      const key = typeof p?.subsection === 'string' ? p.subsection : null
      if (key && buckets.has(key)) {
        buckets.get(key).push(p)
      } else {
        other.push(p)
      }
    }

    const ordered = subsectionOptions
      .map((s) => ({ ...s, products: buckets.get(s.value) || [] }))
      .filter((g) => g.products.length > 0)

    return { ordered, other }
  }, [products, subsectionOptions])

  const activeLabel = useMemo(() => {
    if (activeSubsection === 'all') return 'All'
    if (activeSubsection === '__other__') return 'Other'
    const match = subsectionOptions.find((s) => s.value === activeSubsection)
    return match ? match.label : 'All'
  }, [activeSubsection, subsectionOptions])

  const activeProducts = useMemo(() => {
    if (activeSubsection === 'all') return products
    if (activeSubsection === '__other__') return groups.other
    const match = groups.ordered.find((g) => g.value === activeSubsection)
    return match ? match.products : products
  }, [activeSubsection, groups.other, groups.ordered, products])

  const scrollToGroup = (key) => {
    if (!key || key === 'all') {
      document.getElementById('subsection-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    document.getElementById(`subsection-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="w-full px-4 md:px-8 py-8 space-y-8">
      {/* Category Header */}
      <div className="flex items-center gap-4 border-b-2 border-outline-variant/20 pb-4">
        <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-on-primary-container text-[32px]">{icon}</span>
        </div>
        <div>
          <h2 className="font-headline-lg text-on-background m-0 leading-tight">{title}</h2>
          <p className="text-on-surface-variant text-label-md m-0">{products.length} Products</p>
        </div>
      </div>

      <div id="subsection-top" />

      {subsectionOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setActiveSubsection('all'); scrollToGroup('all') }}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
              activeSubsection === 'all'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            All
          </button>

          {subsectionOptions.map((s) => {
            const count = products.filter((p) => p?.subsection === s.value).length
            if (count === 0) return null
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => { setActiveSubsection(s.value); scrollToGroup(s.value) }}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                  activeSubsection === s.value
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {s.label} ({count})
              </button>
            )
          })}

          {groups.other.length > 0 && (
            <button
              type="button"
              onClick={() => { setActiveSubsection('__other__'); scrollToGroup('__other__') }}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                activeSubsection === '__other__'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              Other ({groups.other.length})
            </button>
          )}
        </div>
      )}

      {/* Filter/Sort bar (Placeholder) */}
      <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-lg">
        <span className="text-on-surface-variant text-[14px]">Showing {activeLabel} · {activeProducts.length} products</span>
        <select className="bg-surface border border-outline-variant/30 rounded-lg px-3 py-1.5 text-[14px] text-on-background outline-none">
          <option>Sort by: Default</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
        </select>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        activeSubsection === 'all' ? (
          <div className="space-y-10">
            {groups.ordered.map((g) => (
              <section key={g.value} id={`subsection-${g.value}`} className="space-y-4 scroll-mt-24">
                <div className="flex items-end justify-between border-b border-outline-variant/30 pb-2">
                  <h3 className="font-headline-md text-on-background m-0">{g.label}</h3>
                  <div className="text-on-surface-variant text-[13px] font-semibold">{g.products.length} items</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {g.products.map((p) => (
                    <div key={p.id} className="relative">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </section>
            ))}

            {groups.other.length > 0 && (
              <section id="subsection-__other__" className="space-y-4 scroll-mt-24">
                <div className="flex items-end justify-between border-b border-outline-variant/30 pb-2">
                  <h3 className="font-headline-md text-on-background m-0">Other</h3>
                  <div className="text-on-surface-variant text-[13px] font-semibold">{groups.other.length} items</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {groups.other.map((p) => (
                    <div key={p.id} className="relative">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {activeProducts.map((p) => (
              <div key={p.id} className="relative">
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="py-12 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant/20">
          <span className="material-symbols-outlined text-[48px] mb-4 opacity-50">inventory_2</span>
          <p className="text-body-lg">No products found in {title}</p>
        </div>
      )}
    </main>
  )
}

export default CategoryPage
