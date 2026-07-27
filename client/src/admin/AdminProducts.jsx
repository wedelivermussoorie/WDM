import { useState, useEffect, useMemo } from 'react'
import AdminLayout from './AdminLayout'
import { useAuth } from '../context/AuthContext'

const CUSTOM_SUBSECTION_VALUE = '__custom__'
const EMPTY_FORM = { id: '', name: '', category: '', subsection: null, price: '', quantity: '', mrp: '', unit: '', imageUrl: '', badge: '' }

function getSubsectionLabel(categories, categoryId, subsectionValue) {
  if (!subsectionValue) return null
  const cat = categories.find(c => c.id === categoryId)
  if (!cat || !cat.subsections) return subsectionValue
  const match = cat.subsections.find(s => s.value === subsectionValue)
  return match ? match.label : subsectionValue
}

function ProductModal({ product, categories, onClose, onSave }) {
  // Select first category by default if new product
  const defaultCategory = categories.length > 0 ? categories[0].id : ''
  const initialForm = product ? { ...product } : { ...EMPTY_FORM, category: defaultCategory }
  
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState(null)
  const { token } = useAuth()
  const isEdit = !!product

  // Find current category's subsections
  const currentCategoryObj = useMemo(() => categories.find(c => c.id === form.category), [categories, form.category])
  const subsectionOptions = currentCategoryObj?.subsections || []

  // Initialize preset
  const [subsectionPreset, setSubsectionPreset] = useState(() => {
    if (!initialForm.subsection) return ''
    const match = subsectionOptions.some(o => o.value === initialForm.subsection)
    return match ? initialForm.subsection : CUSTOM_SUBSECTION_VALUE
  })
  
  const [customSubsection, setCustomSubsection] = useState(() => {
    if (!initialForm.subsection) return ''
    const match = subsectionOptions.some(o => o.value === initialForm.subsection)
    return match ? '' : initialForm.subsection
  })

  useEffect(() => {
    const nextForm = product ? { ...product } : { ...EMPTY_FORM, category: defaultCategory }
    setForm(nextForm)
    const nextCatObj = categories.find(c => c.id === nextForm.category)
    const nextOptions = nextCatObj?.subsections || []
    
    if (!nextForm.subsection) {
      setSubsectionPreset('')
      setCustomSubsection('')
    } else {
      const match = nextOptions.some(o => o.value === nextForm.subsection)
      if (match) {
        setSubsectionPreset(nextForm.subsection)
        setCustomSubsection('')
      } else {
        setSubsectionPreset(CUSTOM_SUBSECTION_VALUE)
        setCustomSubsection(nextForm.subsection)
      }
    }
  }, [product, categories, defaultCategory])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (e) => {
    const nextCategory = e.target.value
    const nextCatObj = categories.find(c => c.id === nextCategory)
    const nextOptions = nextCatObj?.subsections || []

    const currentNormalizedSubsection = (() => {
      if (subsectionPreset === CUSTOM_SUBSECTION_VALUE) {
        const v = String(customSubsection || '').trim()
        return v ? v : null
      }
      const v = String(subsectionPreset || '').trim()
      return v ? v : null
    })()

    let nextPreset = ''
    let nextCustom = ''

    if (currentNormalizedSubsection) {
      const match = nextOptions.some(o => o.value === currentNormalizedSubsection)
      if (match) {
        nextPreset = currentNormalizedSubsection
      } else {
        nextPreset = CUSTOM_SUBSECTION_VALUE
        nextCustom = currentNormalizedSubsection
      }
    }

    setSubsectionPreset(nextPreset)
    setCustomSubsection(nextCustom)
    setForm((prev) => ({
      ...prev,
      category: nextCategory,
      subsection: nextPreset === CUSTOM_SUBSECTION_VALUE ? (nextCustom || null) : (nextPreset || null),
    }))
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploadingImage(true)
    setError(null)
    
    const formData = new FormData()
    formData.append('image', file)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Image upload failed')
      setForm(prev => ({ ...prev, imageUrl: data.imageUrl }))
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!form.imageUrl || !form.imageUrl.trim()) {
      setError('Please upload an image or provide an image URL.')
      setSaving(false)
      return
    }

    const normalizedSubsection = (() => {
      if (subsectionPreset === CUSTOM_SUBSECTION_VALUE) {
        const v = String(customSubsection || '').trim()
        return v ? v : null
      }
      const v = String(subsectionPreset || '').trim()
      return v ? v : null
    })()

    const payload = {
      ...form,
      subsection: normalizedSubsection,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity || 0, 10),
      mrp: form.mrp ? parseFloat(form.mrp) : null,
    }

    const url = isEdit ? `${import.meta.env.VITE_API_URL || ''}/api/admin/products/${form._id}` : `${import.meta.env.VITE_API_URL || ''}/api/admin/products`
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')
      onSave(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/50">
          <h2 className="font-headline-sm m-0 text-on-background">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high border-none cursor-pointer text-on-surface-variant transition-colors" onClick={onClose}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            {error && <div className="bg-error-container text-on-error-container p-3 rounded-xl mb-6 text-[14px] font-semibold">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Product ID *</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background disabled:opacity-50 disabled:cursor-not-allowed" name="id" value={form.id} onChange={handleChange} required disabled={isEdit} placeholder="e.g. amul-moti-500ml" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Category *</label>
                <select className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background appearance-none capitalize" name="category" value={form.category} onChange={handleCategoryChange} required>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Subsection</label>
                <select
                  className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background appearance-none"
                  value={subsectionPreset || ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setSubsectionPreset(v)
                    if (v !== CUSTOM_SUBSECTION_VALUE) {
                      setCustomSubsection('')
                      setForm((prev) => ({ ...prev, subsection: v || null }))
                    } else {
                      setForm((prev) => ({ ...prev, subsection: prev.subsection || null }))
                    }
                  }}
                >
                  <option value="">—</option>
                  {subsectionOptions.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                  <option value={CUSTOM_SUBSECTION_VALUE}>Custom…</option>
                </select>
              </div>
              {subsectionPreset === CUSTOM_SUBSECTION_VALUE && (
               <div className="space-y-1.5">
                  <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Custom Subsection</label>
                  <input
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background"
                    value={customSubsection}
                    onChange={(e) => {
                      const v = e.target.value
                      setCustomSubsection(v)
                      setForm((prev) => ({ ...prev, subsection: v || null }))
                    }}
                    placeholder="e.g. Fruits"
                  />
                </div>
              )}
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Product Name *</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Amul Moti 500ml" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Price (₹) *</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required placeholder="40" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Quantity *</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} required placeholder="50" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">MRP (₹)</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="mrp" type="number" min="0" step="0.01" value={form.mrp || ''} onChange={handleChange} placeholder="65" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Unit</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="unit" value={form.unit || ''} onChange={handleChange} placeholder="e.g. 500ml, 1kg" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Badge</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="badge" value={form.badge || ''} onChange={handleChange} placeholder="e.g. -20%, Hot, New" />
              </div>
              
              <div className="space-y-1.5 md:col-span-2 mt-4 pt-4 border-t border-outline-variant/30">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">
                  Image <span className="text-error">*</span>
                  <span className="text-on-surface-variant font-normal ml-1">(upload a file OR paste a URL)</span>
                </label>
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-[12px] text-on-surface-variant mb-1.5 pl-1 font-semibold uppercase tracking-wide">Option 1 — Upload to Cloudinary</p>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-[14px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[14px] file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary/20 transition-colors" />
                    {uploadingImage && <div className="text-[13px] text-on-surface-variant mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> Uploading...</div>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-outline-variant/40"></div>
                    <span className="text-[12px] font-bold text-on-surface-variant uppercase tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-outline-variant/40"></div>
                  </div>
                  <div>
                    <p className="text-[12px] text-on-surface-variant mb-1.5 pl-1 font-semibold uppercase tracking-wide">Option 2 — Paste Image URL</p>
                    <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="imageUrl" value={form.imageUrl} onChange={handleChange} placeholder="https://res.cloudinary.com/..." />
                  </div>
                </div>
              </div>
              {form.imageUrl && (
                <div className="md:col-span-2 flex justify-center mt-4">
                  <div className="w-32 h-32 rounded-xl bg-surface-container-low p-2 border border-outline-variant/30 flex items-center justify-center">
                     <img src={form.imageUrl} alt="preview" className="max-w-full max-h-full object-contain rounded-lg" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="p-6 border-t border-outline-variant/30 bg-surface flex justify-end gap-3">
            <button type="button" className="px-6 py-2.5 rounded-xl font-semibold text-[15px] border-none bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl font-semibold text-[15px] border-none bg-primary text-on-primary hover:brightness-95 shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" disabled={saving || uploadingImage}>
              {saving && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminProducts() {
  const { token } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [modalProduct, setModalProduct] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_URL || ''}/api/categories`)
      ])
      const prodData = await prodRes.json()
      const catData = await catRes.json()
      
      setProducts(Array.isArray(prodData) ? prodData : [])
      setCategories(Array.isArray(catData) ? catData : [])
    } catch {
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [token])

  const handleDelete = async (productId) => {
    if (!window.confirm(`Delete this product?`)) return
    setDeletingId(productId)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p._id !== productId))
      } else {
        const d = await res.json()
        alert(d.message)
      }
    } catch {
      alert('Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSave = (savedProduct) => {
    setProducts(prev => {
      const exists = prev.find(p => p.id === savedProduct.id)
      if (exists) return prev.map(p => p.id === savedProduct.id ? savedProduct : p)
      return [savedProduct, ...prev]
    })
    setModalProduct(null)
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.id?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase()) ||
    p.subsection?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout title="Products">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50">
          <div className="flex items-center gap-3">
            <h2 className="font-headline-sm m-0 text-on-background">All Products</h2>
            <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-label-md font-bold">{filtered.length}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                placeholder="Search products..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-full focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[14px]"
              />
            </div>
            <button 
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary rounded-full font-bold text-[14px] border-none shadow-md shadow-primary/20 hover:brightness-95 transition-all cursor-pointer flex items-center justify-center gap-2" 
              onClick={() => setModalProduct(false)}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Product
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[40px] mb-4">refresh</span>
              <p className="font-semibold text-[16px]">Loading products...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-on-surface-variant mt-10">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] opacity-50">inventory_2</span>
              </div>
              <h3 className="font-headline-sm m-0 text-on-background mb-2">No products found</h3>
              <p className="m-0 max-w-md">{search ? 'Try a different search term or clear the filter.' : 'Add your first product to start selling.'}</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="p-4 font-semibold">Product</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Subsection</th>
                  <th className="p-4 font-semibold">Price</th>
                  <th className="p-4 font-semibold">Stock</th>
                  <th className="p-4 font-semibold">MRP</th>
                  <th className="p-4 font-semibold">Badge</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-[14px]">
                {filtered.map(product => {
                  const catObj = categories.find(c => c.id === product.category)
                  const catTitle = catObj ? catObj.title : product.category
                  const subLabel = getSubsectionLabel(categories, product.category, product.subsection)
                  
                  return (
                    <tr key={product.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white rounded-lg p-1 border border-outline-variant/30 flex items-center justify-center shrink-0">
                            <img className="max-w-full max-h-full object-contain rounded" src={product.imageUrl} alt={product.name} />
                          </div>
                          <div>
                            <div className="font-bold text-on-background text-[14px]">{product.name}</div>
                            <div className="text-on-surface-variant text-[12px] font-mono">{product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-primary-container/50 text-on-primary-container px-2.5 py-1 rounded-md text-[12px] font-semibold capitalize border border-primary/20">{catTitle}</span>
                      </td>
                      <td className="p-4 text-on-surface-variant">
                        {subLabel || '—'}
                      </td>
                      <td className="p-4 font-bold text-on-background">₹{product.price}</td>
                      <td className={`p-4 font-bold ${product.quantity > 0 ? 'text-green-600' : 'text-error'}`}>
                        {product.quantity > 0 ? product.quantity : 'Out of Stock'}
                      </td>
                      <td className="p-4 text-on-surface-variant">{product.mrp ? `₹${product.mrp}` : '—'}</td>
                      <td className="p-4">
                        {product.badge ? (
                          <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded text-[11px] font-bold border border-tertiary/20">{product.badge}</span>
                        ) : <span className="text-on-surface-variant opacity-50">—</span>}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            className="px-3 py-1.5 rounded-lg font-semibold text-[13px] bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors border-none cursor-pointer flex items-center gap-1" 
                            onClick={() => setModalProduct(product)}
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                          </button>
                          <button
                            className="px-3 py-1.5 rounded-lg font-semibold text-[13px] bg-error-container text-error hover:bg-error-container/80 transition-colors border-none cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            onClick={() => handleDelete(product._id)}
                            disabled={deletingId === product._id}
                          >
                            {deletingId === product._id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">delete</span>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalProduct !== null && (
        <ProductModal
          product={modalProduct === false ? null : modalProduct}
          categories={categories}
          onClose={() => setModalProduct(null)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  )
}
