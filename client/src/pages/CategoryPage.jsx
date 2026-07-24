import { useEffect, useMemo, useState } from 'react'
import ProductCard from '../components/ProductCard'

// Mapping categories to material icons
const CATEGORY_ICONS = {
  grocery: 'shopping_basket',
  food: 'restaurant',
  essentials: 'inventory_2',
  bakery: 'cake',
  '18+': '18_up_rating'
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

const CATEGORY_COVER = {
  grocery: '/wdm-images/cat-groceries.jpg',
  food: '/wdm-images/cat-groceries.jpg',
  essentials: '/wdm-images/cat-party.jpg',
  bakery: '/wdm-images/cat-cakes.jpg',
  '18+': '/wdm-images/cat-party.jpg',
}

const SUBSECTION_MEDIA = {
  grocery: {
    'fresh-vegetables': { image: '/wdm-images/cat-groceries.jpg', icon: 'eco' },
    'atta-dal-rice': { image: '/wdm-images/cat-groceries.jpg', icon: 'grocery' },
    'masalas-oils': { image: '/wdm-images/cat-groceries.jpg', icon: 'soup_kitchen' },
    'party-celebrations': { image: '/wdm-images/cat-party.jpg', icon: 'celebration' },
  },
  food: {
    'drinks-beverages': { image: '/wdm-images/cat-groceries.jpg', icon: 'local_drink' },
    'chips-namkeens': { image: '/wdm-images/cat-groceries.jpg', icon: 'local_pizza' },
    'sweets-chocolates': { image: '/wdm-images/cat-cakes.jpg', icon: 'candy' },
    'instant-food-noodles': { image: '/wdm-images/cat-groceries.jpg', icon: 'ramen_dining' },
  },
  essentials: {
    'personal-care': { image: '/wdm-images/cat-party.jpg', icon: 'self_care' },
    'home-cleaning': { image: '/wdm-images/cat-party.jpg', icon: 'cleaning_services' },
    'baby-care': { image: '/wdm-images/cat-party.jpg', icon: 'child_care' },
    'stationery': { image: '/wdm-images/cat-party.jpg', icon: 'edit_note' },
  },
  bakery: {
    'dairy-bread-milk': { image: '/wdm-images/cat-groceries.jpg', icon: 'bakery_dining' },
    'bakery-biscuits': { image: '/wdm-images/cat-cakes.jpg', icon: 'cookie' },
  },
  '18+': {
    'female-wellness': { image: '/wdm-images/cat-party.jpg', icon: 'female' },
    'pleasure-protection': { image: '/wdm-images/cat-party.jpg', icon: 'favorite' },
  },
}

function getSubsectionOptions(category) {
  const key = typeof category === 'string' ? category : ''
  return SUBSECTIONS_BY_CATEGORY[key] || []
}

function getSubsectionMedia(category, subsection) {
  const bucket = SUBSECTION_MEDIA[category]
  if (bucket && subsection && bucket[subsection]) return bucket[subsection]
  return { image: CATEGORY_COVER[category] || '/wdm-images/cat-groceries.jpg', icon: 'category' }
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

  const counts = useMemo(() => {
    const map = new Map()
    subsectionOptions.forEach((s) => map.set(s.value, 0))
    let otherCount = 0

    for (const p of products) {
      const key = typeof p?.subsection === 'string' ? p.subsection : null
      if (key && map.has(key)) {
        map.set(key, map.get(key) + 1)
      } else {
        otherCount += 1
      }
    }

    return { map, otherCount }
  }, [products, subsectionOptions])

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

    const ordered = subsectionOptions.map((s) => ({ ...s, products: buckets.get(s.value) || [] }))

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
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-on-background m-0">Browse sections</h3>
            <div className="text-on-surface-variant text-[13px] font-semibold">{products.length} products</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => { setActiveSubsection('all'); scrollToGroup('all') }}
              className={`relative overflow-hidden rounded-2xl border text-left p-4 transition-all cursor-pointer min-h-[92px] ${
                activeSubsection === 'all'
                  ? 'border-primary shadow-md shadow-primary/15'
                  : 'border-outline-variant/30 hover:border-outline-variant/50 hover:-translate-y-0.5'
              }`}
            >
              <img
                src={CATEGORY_COVER[category] || '/wdm-images/cat-groceries.jpg'}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-70"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-background/70 via-on-background/20 to-transparent"></div>
              <div className="relative flex items-start justify-between gap-3">
                <div>
                  <div className="text-white font-bold text-[15px] leading-tight">All</div>
                  <div className="text-white/90 text-[12px] font-semibold">{products.length} items</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">grid_view</span>
                </div>
              </div>
            </button>

            {subsectionOptions.map((s) => {
              const count = counts.map.get(s.value) || 0
              const media = getSubsectionMedia(category, s.value)
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => { setActiveSubsection(s.value); scrollToGroup(s.value) }}
                  className={`relative overflow-hidden rounded-2xl border text-left p-4 transition-all cursor-pointer min-h-[92px] ${
                    activeSubsection === s.value
                      ? 'border-primary shadow-md shadow-primary/15'
                      : 'border-outline-variant/30 hover:border-outline-variant/50 hover:-translate-y-0.5'
                  }`}
                >
                  <img
                    src={media.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-on-background/70 via-on-background/20 to-transparent"></div>
                  <div className="relative flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white font-bold text-[15px] leading-tight">{s.label}</div>
                      <div className="text-white/90 text-[12px] font-semibold">{count} items</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined">{media.icon}</span>
                    </div>
                  </div>
                </button>
              )
            })}

            {counts.otherCount > 0 && (
              <button
                type="button"
                onClick={() => { setActiveSubsection('__other__'); scrollToGroup('__other__') }}
                className={`relative overflow-hidden rounded-2xl border text-left p-4 transition-all cursor-pointer min-h-[92px] ${
                  activeSubsection === '__other__'
                    ? 'border-primary shadow-md shadow-primary/15'
                    : 'border-outline-variant/30 hover:border-outline-variant/50 hover:-translate-y-0.5'
                }`}
              >
                <img
                  src={CATEGORY_COVER[category] || '/wdm-images/cat-groceries.jpg'}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-on-background/70 via-on-background/20 to-transparent"></div>
                <div className="relative flex items-start justify-between gap-3">
                  <div>
                    <div className="text-white font-bold text-[15px] leading-tight">Other</div>
                    <div className="text-white/90 text-[12px] font-semibold">{counts.otherCount} items</div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined">inventory_2</span>
                  </div>
                </div>
              </button>
            )}
          </div>

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
            const count = counts.map.get(s.value) || 0
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
                {s.label}{typeof count === 'number' ? ` (${count})` : ''}
              </button>
            )
          })}

          {counts.otherCount > 0 && (
            <button
              type="button"
              onClick={() => { setActiveSubsection('__other__'); scrollToGroup('__other__') }}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-colors ${
                activeSubsection === '__other__'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              Other ({counts.otherCount})
            </button>
          )}
          </div>
        </section>
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

      {products.length > 0 && groups.ordered.every((g) => g.products.length === 0) && groups.other.length > 0 && (
        <div className="bg-primary-container text-on-primary-container p-4 rounded-xl border border-outline-variant/20 text-[13px] font-semibold">
          Products are not assigned to subsections yet. Go to Admin → Products and set a subsection to organize items into the sections above.
        </div>
      )}

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
                {g.products.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {g.products.map((p) => (
                      <div key={p.id} className="relative">
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-on-surface-variant bg-surface-container-lowest rounded-xl border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[40px] mb-2 opacity-50">inventory_2</span>
                    <p className="m-0 text-body-md">No products in this section yet</p>
                  </div>
                )}
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
