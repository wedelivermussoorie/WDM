import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'

function formatInr(value) {
  if (typeof value !== 'number') return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

// ── Quick Category Icons ───────────────────────────────────────────────────
const CATEGORY_ICONS = [
  { label: 'Groceries', icon: 'shopping_basket', path: '/grocery' },
  { label: 'Food',      icon: 'restaurant',       path: '/food' },
  { label: 'Essentials',icon: 'inventory_2',      path: '/essentials' },
  { label: 'Bakery',    icon: 'cake',             path: '/bakery' },
  { label: '18+',       icon: '18_up_rating',     path: '/18-plus' },
]

function QuickCategories() {
  return (
    <section className="grid grid-cols-3 md:grid-cols-5 gap-4 lg:gap-10">
      {CATEGORY_ICONS.map((cat) => {
        return (
          <Link key={cat.label} to={cat.path} className="flex flex-col items-center gap-sm group cursor-pointer no-underline">
            <div className="w-20 h-20 md:w-28 md:h-28 rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform bg-primary-container">
              <span className="material-symbols-outlined text-[42px] text-on-primary-container">{cat.icon}</span>
            </div>
            <span className="font-semibold text-body-md text-on-background">{cat.label}</span>
          </Link>
        )
      })}
    </section>
  )
}

// ── Hero Bento Grid ────────────────────────────────────────────────────────
function HeroBento() {
  return (
    <section>
      {/* Main hero card */}
      <div className="relative h-[300px] md:h-[450px] rounded-xl overflow-hidden shadow-md group w-full">
        <div className="absolute inset-0 bg-[#FFF9E5]"></div>
        <div className="absolute inset-0 flex items-center px-lg md:px-xl z-10">
          <div className="max-w-md space-y-md">
            <span className="px-md py-1 bg-primary text-white text-label-md rounded-full inline-block">FASTEST DELIVERY</span>
            <h2 className="font-display-lg text-on-background leading-tight m-0">
              Order Your <br /><span className="text-primary">Food, Snacks</span>
            </h2>
            <Link to="/grocery" className="inline-block bg-on-background text-background px-xl py-md rounded-lg font-headline-md hover:scale-105 transition-transform no-underline">
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
  const [groceries, setGroceries] = useState([])
  const [food, setFood] = useState([])
  const [essentials, setEssentials] = useState([])
  const [bakery, setBakery] = useState([])

  useEffect(() => {
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/products?category=grocery`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/products?category=food`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/products?category=essentials`).then((r) => r.json()),
      fetch(`${import.meta.env.VITE_API_URL || ''}/api/products?category=bakery`).then((r) => r.json()),
    ])
      .then(([groceryData, foodData, essentialsData, bakeryData]) => {
        setGroceries(Array.isArray(groceryData) ? groceryData : [])
        setFood(Array.isArray(foodData) ? foodData : [])
        setEssentials(Array.isArray(essentialsData) ? essentialsData : [])
        setBakery(Array.isArray(bakeryData) ? bakeryData : [])
      })
      .catch(() => {
        setGroceries([])
        setFood([])
        setEssentials([])
        setBakery([])
      })
  }, [])

  return (
    <main className="w-full px-4 md:px-8 py-8 space-y-12">
      <QuickCategories />
      <HeroBento />

      {groceries.length > 0 && (
        <ProductsSection
          title="Groceries"
          actionLabel="View All"
          actionPath="/grocery"
          products={groceries.slice(0, 5)}
        />
      )}

      {food.length > 0 && (
        <ProductsSection
          title="Food"
          actionLabel="View All"
          actionPath="/food"
          products={food.slice(0, 5)}
        />
      )}

      {essentials.length > 0 && (
        <ProductsSection
          title="Essentials"
          actionLabel="View All"
          actionPath="/essentials"
          products={essentials.slice(0, 5)}
        />
      )}

      {bakery.length > 0 && (
        <ProductsSection
          title="Bakery"
          actionLabel="View All"
          actionPath="/bakery"
          products={bakery.slice(0, 5)}
        />
      )}
    </main>
  )
}

export default Home
