import './App.css'
import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import LoginRegister from './pages/LoginRegister'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import ProductPage from './pages/ProductPage'
import VerifyEmail from './pages/VerifyEmail'
import AdminDashboard from './admin/AdminDashboard'
import AdminProducts from './admin/AdminProducts'
import AdminOrders from './admin/AdminOrders'
import AdminUsers from './admin/AdminUsers'
import AdminCategories from './admin/AdminCategories'
import AdminRoute from './admin/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'
import AccountLayout from './pages/account/AccountLayout'
import AccountDashboard from './pages/account/AccountDashboard'
import AccountOrders from './pages/account/AccountOrders'
import AccountDownloads from './pages/account/AccountDownloads'
import AccountAddresses from './pages/account/AccountAddresses'
import AccountDetails from './pages/account/AccountDetails'
import AccountWishlist from './pages/account/AccountWishlist'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Routes — full page, no store layout */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/categories" element={<AdminRoute><AdminCategories /></AdminRoute>} />

        {/* Store Routes */}
        <Route path="/*" element={
          <div className="min-h-screen flex flex-col bg-background">
            <Header toggleSidebar={toggleSidebar} />
            <div className="flex flex-1">
              <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
              <main className="flex-1 min-w-0">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/category/:categoryId" element={<CategoryPage />} />
                  <Route path="/login" element={<LoginRegister />} />
                  <Route path="/verify-email" element={<VerifyEmail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/account" element={<ProtectedRoute><AccountLayout /></ProtectedRoute>}>
                    <Route index element={<AccountDashboard />} />
                    <Route path="orders" element={<AccountOrders />} />
                    <Route path="downloads" element={<AccountDownloads />} />
                    <Route path="addresses" element={<AccountAddresses />} />
                    <Route path="details" element={<AccountDetails />} />
                    <Route path="wishlist" element={<AccountWishlist />} />
                  </Route>
                  <Route path="/product/:productId" element={<ProductPage />} />
                </Routes>
              </main>
            </div>
            <Footer />
          </div>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
