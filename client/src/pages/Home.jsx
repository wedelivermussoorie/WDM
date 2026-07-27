import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

// ── Quick Category Icons ───────────────────────────────────────────────────
function QuickCategories({ categories }) {
  if (!categories || categories.length === 0) return null;
  return (
    <section className="grid grid-cols-3 md:grid-cols-5 gap-4 lg:gap-10">
      {categories.map((cat) => {
        return (
          <Link key={cat.id} to={`/category/${cat.id}`} className="flex flex-col items-center gap-sm group cursor-pointer no-underline">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform bg-primary-container overflow-hidden">
               {cat.image ? (
                 <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
               ) : (
                 <span className="material-symbols-outlined text-[42px] text-on-primary-container">{cat.icon || 'category'}</span>
               )}
            </div>
            <span className="font-semibold text-body-md text-on-background mt-2 text-center">{cat.title}</span>
          </Link>
        )
      })}
    </section>
  )
}

// ── Hero Bento Grid ────────────────────────────────────────────────────────
function HeroBento({ firstCategory }) {
  const shopLink = firstCategory ? `/category/${firstCategory.id}` : '/'
  return (
    <section>
      <div className="relative h-[300px] md:h-[450px] rounded-xl overflow-hidden shadow-md group w-full">
        <div className="absolute inset-0 bg-[#FFF9E5]"></div>
        <div className="absolute inset-0 flex items-center px-lg md:px-xl z-10">
          <div className="max-w-md space-y-md">
            <span className="px-md py-1 bg-primary text-white text-label-md rounded-full inline-block">FASTEST DELIVERY</span>
            <h2 className="font-display-lg text-on-background leading-tight m-0">
              Order Your <br /><span className="text-primary">Food, Snacks</span>
            </h2>
            <Link to={shopLink} className="inline-block bg-on-background text-background px-xl py-md rounded-lg font-headline-md hover:scale-105 transition-transform no-underline">
              Shop Now
            </Link>
          </div>
        </div>
        <img
          className="absolute right-0 bottom-0 h-4/5 w-1/2 object-contain object-bottom group-hover:translate-x-2 transition-transform duration-700"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWQRtpBME0s1rdFS1zLwcJrMC0Bs0eS5S_CP5ffxte8E7DV9XQOGcD_85cpLKLASeQghsPv3S8x4v1Jo99B05RFsstbbFtCUW5I6d5Sv1ZyAz94Tk2dHNuOPICYhFIcLlgmmaUVVnB_7km5CUUKQQ5tqfZXNIlCyKYtFHQxxq3ven_BcQlK2xyLw9OhsDR_LK0qnIq2VnVsyl4WAHCMVlYNfo5hv5tJzNaYeYkIF2TY-Fp9xvlc6DXLgXVzBfxpIoONlESaGl-UEA"
          alt="Grocery bag overflowing with fresh vegetables and snacks"
        />
      </div>
    </section>
  )
}

// ── Products Section ───────────────────────────────────────────────────────
function ProductsSection({ title, actionLabel, actionPath, products }) {
  if (!products || products.length === 0) return null;
  return (
    <section className="space-y-4">
      <div className="flex justify-between items-end border-b-2 border-outline-variant/20 pb-2">
        <h3 className="font-headline-lg text-on-background m-0">{title}</h3>
        {actionLabel && (
          <Link to={actionPath || '#'} className="text-primary font-label-md hover:underline no-underline">
            {actionLabel}
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((p) => (
          <div key={p.id} className="relative">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Home Page ──────────────────────────────────────────────────────────────
function Home() {
  const [categories, setCategories] = useState([])
  const [categoryProducts, setCategoryProducts] = useState({})

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || ''}/api/categories`)
      .then((r) => r.json())
      .then((cats) => {
        if (Array.isArray(cats)) {
          setCategories(cats)
          // Fetch products for all categories
          Promise.all(
            cats.map((cat) =>
              fetch(`${import.meta.env.VITE_API_URL || ''}/api/products?category=${cat.id}`).then((r) => r.json())
            )
          ).then((results) => {
            const prodMap = {}
            cats.forEach((cat, idx) => {
              prodMap[cat.id] = Array.isArray(results[idx]) ? results[idx] : []
            })
            setCategoryProducts(prodMap)
          })
        }
      })
      .catch((err) => console.error("Failed to load home data", err))
  }, [])

  return (
    <main className="w-full px-4 md:px-8 py-8 space-y-12">
      <QuickCategories categories={categories} />
      <HeroBento firstCategory={categories[0]} />

      {categories.map(cat => {
        const prods = categoryProducts[cat.id] || []
        if (prods.length === 0) return null;
        return (
          <ProductsSection
            key={cat.id}
            title={cat.title}
            actionLabel="View All"
            actionPath={`/category/${cat.id}`}
            products={prods.slice(0, 5)}
          />
        )
      })}
    </main>
  )
}

export default Home
