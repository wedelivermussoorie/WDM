import { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'

// Mapping categories to material icons
const CATEGORY_ICONS = {
  grocery: 'shopping_basket',
  food: 'restaurant',
  essentials: 'inventory_2',
  bakery: 'cake',
  '18+': 'warning'
}

function CategoryPage({ category }) {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/products?category=${category}`)
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

      {/* Filter/Sort bar (Placeholder) */}
      <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-lg">
        <span className="text-on-surface-variant text-[14px]">Showing all {title}</span>
        <select className="bg-surface border border-outline-variant/30 rounded-lg px-3 py-1.5 text-[14px] text-on-background outline-none">
          <option>Sort by: Default</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
        </select>
      </div>

      {/* Product Grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => (
            <div key={p.id} className="relative">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
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
