import { useState, useEffect } from 'react'
import AdminLayout from './AdminLayout'
import { useAuth } from '../context/AuthContext'

const EMPTY_SUBSECTION = { value: '', label: '', image: '' }
const EMPTY_CATEGORY = { id: '', title: '', icon: '', image: '', subsections: [] }

function CategoryModal({ category, onClose, onSave }) {
  const isEdit = !!category
  const initialForm = category ? { ...category } : { ...EMPTY_CATEGORY }
  
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingSubIdx, setUploadingSubIdx] = useState(null)
  
  const { token } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (file, type, subIndex = null) => {
    if (!file) return

    if (type === 'category') setUploadingImage(true)
    else setUploadingSubIdx(subIndex)
    
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
      
      if (type === 'category') {
        setForm(prev => ({ ...prev, image: data.imageUrl }))
      } else {
        setForm(prev => {
          const newSubs = [...prev.subsections]
          newSubs[subIndex].image = data.imageUrl
          return { ...prev, subsections: newSubs }
        })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      if (type === 'category') setUploadingImage(false)
      else setUploadingSubIdx(null)
    }
  }

  const handleAddSubsection = () => {
    setForm(prev => ({ ...prev, subsections: [...prev.subsections, { ...EMPTY_SUBSECTION }] }))
  }

  const handleRemoveSubsection = (idx) => {
    setForm(prev => ({
      ...prev,
      subsections: prev.subsections.filter((_, i) => i !== idx)
    }))
  }

  const handleSubsectionChange = (idx, field, value) => {
    setForm(prev => {
      const newSubs = [...prev.subsections]
      newSubs[idx][field] = value
      // Auto-generate value from label if value is empty
      if (field === 'label' && !newSubs[idx].value) {
        newSubs[idx].value = value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      }
      return { ...prev, subsections: newSubs }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!form.id || !form.title) {
      setError('ID and Title are required.')
      setSaving(false)
      return
    }

    const url = isEdit ? `${import.meta.env.VITE_API_URL || ''}/api/categories/${form.id}` : `${import.meta.env.VITE_API_URL || ''}/api/categories`
    const method = isEdit ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form)
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
    <div className="fixed inset-0 bg-on-background/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-surface-container-lowest w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/50 shrink-0">
          <h2 className="font-headline-sm m-0 text-on-background">{isEdit ? 'Edit Section' : 'Add New Section'}</h2>
          <button type="button" className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high border-none cursor-pointer text-on-surface-variant transition-colors" onClick={onClose}>
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-6">
            {error && <div className="bg-error-container text-on-error-container p-3 rounded-xl text-[14px] font-semibold">{error}</div>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Section ID *</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background disabled:opacity-50 disabled:cursor-not-allowed" name="id" value={form.id} onChange={handleChange} required disabled={isEdit} placeholder="e.g. grocery" />
                {!isEdit && <p className="text-[12px] text-on-surface-variant ml-1">Used in URLs like /category/grocery</p>}
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Title *</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Grocery" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Material Icon</label>
                <input className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="icon" value={form.icon || ''} onChange={handleChange} placeholder="e.g. shopping_basket" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-label-sm font-semibold text-on-surface-variant pl-1">Header Image</label>
                <div className="flex gap-2">
                  <input className="flex-1 px-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[15px] text-on-background" name="image" value={form.image || ''} onChange={handleChange} placeholder="Image URL..." />
                  <label className="bg-primary-container text-on-primary-container px-3 py-2.5 rounded-xl cursor-pointer hover:bg-primary-container/80 transition-colors flex items-center justify-center shrink-0">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], 'category')} />
                    {uploadingImage ? <span className="material-symbols-outlined animate-spin text-[20px]">refresh</span> : <span className="material-symbols-outlined text-[20px]">upload</span>}
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-outline-variant/30 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-title-md m-0 text-on-background">Subsections</h3>
                <button type="button" onClick={handleAddSubsection} className="px-3 py-1.5 bg-secondary-container text-on-secondary-container rounded-lg text-[13px] font-bold border-none cursor-pointer hover:brightness-95 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">add</span> Add
                </button>
              </div>

              {form.subsections.length === 0 ? (
                <div className="text-center py-6 bg-surface-container-low/50 rounded-xl border border-outline-variant/30 border-dashed text-on-surface-variant text-[14px]">
                  No subsections added yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {form.subsections.map((sub, idx) => (
                    <div key={idx} className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center relative">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant pl-1">Label</label>
                          <input className="w-full px-3 py-2 bg-surface border border-outline-variant/40 rounded-lg outline-none text-[14px]" value={sub.label} onChange={(e) => handleSubsectionChange(idx, 'label', e.target.value)} placeholder="e.g. Fresh Vegetables" required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant pl-1">Value (ID)</label>
                          <input className="w-full px-3 py-2 bg-surface border border-outline-variant/40 rounded-lg outline-none text-[14px]" value={sub.value} onChange={(e) => handleSubsectionChange(idx, 'value', e.target.value)} placeholder="e.g. fresh-vegetables" required />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant pl-1">Image</label>
                          <div className="flex gap-2">
                            <input className="flex-1 px-3 py-2 bg-surface border border-outline-variant/40 rounded-lg outline-none text-[14px]" value={sub.image || ''} onChange={(e) => handleSubsectionChange(idx, 'image', e.target.value)} placeholder="Image URL..." />
                            <label className="bg-primary-container text-on-primary-container px-3 py-2 rounded-lg cursor-pointer hover:bg-primary-container/80 transition-colors flex items-center justify-center shrink-0">
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e.target.files[0], 'subsection', idx)} />
                              {uploadingSubIdx === idx ? <span className="material-symbols-outlined animate-spin text-[18px]">refresh</span> : <span className="material-symbols-outlined text-[18px]">upload</span>}
                            </label>
                          </div>
                        </div>
                      </div>
                      <button type="button" onClick={() => handleRemoveSubsection(idx)} className="md:ml-2 w-8 h-8 rounded-full bg-error-container text-error border-none cursor-pointer flex items-center justify-center hover:bg-error/20 transition-colors shrink-0 absolute top-2 right-2 md:static">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6 border-t border-outline-variant/30 bg-surface flex justify-end gap-3 shrink-0">
            <button type="button" className="px-6 py-2.5 rounded-xl font-semibold text-[15px] border-none bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer" onClick={onClose}>Cancel</button>
            <button type="submit" className="px-6 py-2.5 rounded-xl font-semibold text-[15px] border-none bg-primary text-on-primary hover:brightness-95 shadow-md shadow-primary/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" disabled={saving || uploadingImage || uploadingSubIdx !== null}>
              {saving && <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>}
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Section')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminCategories() {
  const { token } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [modalCategory, setModalCategory] = useState(null) // null=closed, false=new, object=edit
  const [deletingId, setDeletingId] = useState(null)

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/categories`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete the section "${title}"? This will NOT delete its products, but they will be left without a valid category.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setCategories(prev => prev.filter(c => c.id !== id))
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

  const handleSave = (savedCategory) => {
    setCategories(prev => {
      const exists = prev.find(c => c.id === savedCategory.id)
      if (exists) return prev.map(c => c.id === savedCategory.id ? savedCategory : c)
      return [...prev, savedCategory]
    })
    setModalCategory(null)
  }

  const filtered = categories.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.id?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AdminLayout title="Sections">
      {error && (
        <div className="bg-error-container text-on-error-container p-4 rounded-xl mb-6 font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-outline-variant/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50">
          <div className="flex items-center gap-3">
            <h2 className="font-headline-sm m-0 text-on-background">Sections & Subsections</h2>
            <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[13px] font-bold">{filtered.length} Sections</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-full sm:w-auto">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
              <input 
                placeholder="Search sections..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/40 rounded-full focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none text-[14px]"
              />
            </div>
            <button 
              className="w-full sm:w-auto px-5 py-2.5 bg-primary text-on-primary rounded-full font-bold text-[14px] border-none shadow-md shadow-primary/20 hover:brightness-95 transition-all cursor-pointer flex items-center justify-center gap-2" 
              onClick={() => setModalCategory(false)}
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Section
            </button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant">
              <span className="material-symbols-outlined animate-spin text-[40px] mb-4">refresh</span>
              <p className="font-semibold text-[16px]">Loading sections...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center text-on-surface-variant mt-10">
              <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[40px] opacity-50">category</span>
              </div>
              <h3 className="font-headline-sm m-0 text-on-background mb-2">No sections found</h3>
              <p className="m-0 max-w-md">{search ? 'Try a different search term.' : 'Add your first section to organize products.'}</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-[12px] uppercase tracking-wider border-b border-outline-variant/30">
                  <th className="p-4 font-semibold">Section</th>
                  <th className="p-4 font-semibold">ID / URL</th>
                  <th className="p-4 font-semibold">Subsections</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20 text-[14px]">
                {filtered.map(cat => (
                  <tr key={cat.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center shrink-0 border border-outline-variant/30 overflow-hidden">
                          {cat.image ? (
                            <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[24px] text-on-surface-variant opacity-70">
                              {cat.icon || 'category'}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-on-background text-[15px]">{cat.title}</div>
                      </div>
                    </td>
                    <td className="p-4 text-on-surface-variant font-mono text-[13px]">
                      {cat.id}
                    </td>
                    <td className="p-4">
                      {cat.subsections && cat.subsections.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {cat.subsections.map(sub => (
                            <span key={sub.value} className="bg-secondary-container/50 text-on-secondary-container px-2 py-1 rounded-md text-[12px] font-semibold border border-secondary/20 flex items-center gap-1">
                              {sub.label}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-on-surface-variant opacity-50 italic">None</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          className="px-3 py-1.5 rounded-lg font-semibold text-[13px] bg-surface-container hover:bg-surface-container-high text-on-surface-variant transition-colors border-none cursor-pointer flex items-center gap-1" 
                          onClick={() => setModalCategory(cat)}
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg font-semibold text-[13px] bg-error-container text-error hover:bg-error-container/80 transition-colors border-none cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          onClick={() => handleDelete(cat.id, cat.title)}
                          disabled={deletingId === cat.id}
                        >
                          {deletingId === cat.id ? <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[16px]">delete</span>}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalCategory !== null && (
        <CategoryModal
          category={modalCategory === false ? null : modalCategory}
          onClose={() => setModalCategory(null)}
          onSave={handleSave}
        />
      )}
    </AdminLayout>
  )
}
