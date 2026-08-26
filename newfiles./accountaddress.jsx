import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'

function emptyAddress() {
  return {
    fullName: '',
    phone: '',
    line1: '',
    line2: '',
    landmark: '',
    // NEW: Permanently fixed local delivery details
    city: 'Mussoorie',
    state: 'Uttarakhand',
    pincode: '248179',
    country: 'India',
    latitude: '',
    longitude: '',
  }
}

function formatAddress(a) {
  if (!a) return ''
  const parts = [
    a.fullName,
    a.phone,
    a.line1,
    a.line2,
    a.landmark,
    a.city,
    a.state,
    a.pincode,
    a.country,
  ].filter(Boolean)
  return parts.join(', ')
}

function Field({ label, value, onChange, name, required = false, type = 'text', readOnly = false }) {
  return (
    <label className="block space-y-1">
      <div className="text-[12px] font-semibold text-on-surface-variant">
        {label}{required ? ' *' : ''}
      </div>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl outline-none focus:ring-2 focus:ring-primary text-[14px] ${readOnly ? 'opacity-70 bg-gray-100 cursor-not-allowed' : ''}`}
      />
    </label>
  )
}

export default function AccountAddresses() {
  const { user, token, updateUser } = useAuth()
  const [editing, setEditing] = useState(null)
  const [billing, setBilling] = useState(emptyAddress())
  const [shipping, setShipping] = useState(emptyAddress())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [isLocating, setIsLocating] = useState(false)

  useEffect(() => {
    const b = user?.addresses?.billing
    const s = user?.addresses?.shipping
    
    // Ensure existing users who didn't have these set still get the fixed Mussoorie values
    if (b) setBilling({ ...emptyAddress(), ...b, city: 'Mussoorie', state: 'Uttarakhand', pincode: '248179', country: 'India' })
    if (s) setShipping({ ...emptyAddress(), ...s, city: 'Mussoorie', state: 'Uttarakhand', pincode: '248179', country: 'India' })
  }, [user?.addresses?.billing, user?.addresses?.shipping])

  const active = useMemo(() => {
    if (editing === 'billing') return { value: billing, setValue: setBilling, title: 'Billing address' }
    if (editing === 'shipping') return { value: shipping, setValue: setShipping, title: 'Shipping address' }
    return null
  }, [billing, shipping, editing])

  const startEdit = (type) => {
    setError('')
    setEditing(type)
  }

  const cancel = () => {
    setError('')
    setEditing(null)
  }

  const onChange = (e) => {
    if (!active) return
    const { name, value } = e.target
    active.setValue((prev) => ({ ...prev, [name]: value }))
  }

  const handleGetLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        active.setValue((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }))
        setIsLocating(false)
      },
      (err) => {
        setIsLocating(false)
        setError('Unable to retrieve your location. Please check your browser permissions.')
      }
    )
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')

    const a = editing === 'billing' ? billing : shipping
    const required = ['fullName', 'phone', 'line1', 'city', 'state', 'pincode']
    const missing = required.filter((k) => !String(a[k] || '').trim())
    if (missing.length) {
      setError('Please fill all required fields.')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me/addresses`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billing: editing === 'billing' ? billing : user?.addresses?.billing || null,
          shipping: editing === 'shipping' ? shipping : user?.addresses?.shipping || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to save address')
      updateUser(data.user)
      setEditing(null)
    } catch (err) {
      setError(err.message || 'Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const billingSaved = user?.addresses?.billing
  const shippingSaved = user?.addresses?.shipping

  return (
    <div className="space-y-6">
      <div className="text-on-surface-variant text-[13px]">
        The following addresses will be used on the checkout page by default.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Billing Address Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="font-semibold text-on-surface">Billing address</div>
            <button
              type="button"
              onClick={() => startEdit('billing')}
              className="text-primary underline bg-transparent border-none cursor-pointer p-0 text-[13px]"
            >
              {billingSaved ? 'Edit' : 'Add Billing address'}
            </button>
          </div>
          {billingSaved ? (
            <div className="text-[13px] text-on-surface-variant">
              {formatAddress(billingSaved)}
              {billingSaved.latitude && (
                <div className="mt-2 text-green-600 font-medium">📍 Location Pin Saved</div>
              )}
            </div>
          ) : (
            <div className="text-[13px] text-on-surface-variant">You have not set up this type of address yet.</div>
          )}
        </div>

        {/* Shipping Address Card */}
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="font-semibold text-on-surface">Shipping address</div>
            <button
              type="button"
              onClick={() => startEdit('shipping')}
              className="text-primary underline bg-transparent border-none cursor-pointer p-0 text-[13px]"
            >
              {shippingSaved ? 'Edit' : 'Add Shipping address'}
            </button>
          </div>
          {shippingSaved ? (
            <div className="text-[13px] text-on-surface-variant">
              {formatAddress(shippingSaved)}
              {shippingSaved.latitude && (
                <div className="mt-2 text-green-600 font-medium">📍 Location Pin Saved</div>
              )}
            </div>
          ) : (
            <div className="text-[13px] text-on-surface-variant">You have not set up this type of address yet.</div>
          )}
        </div>
      </div>

      {active && (
        <form onSubmit={save} className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="font-semibold text-on-surface">{active.title}</div>
            <button
              type="button"
              onClick={cancel}
              className="text-on-surface-variant hover:text-on-surface bg-transparent border-none cursor-pointer p-0 text-[13px] underline"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="p-3 bg-error-container text-on-error-container rounded-xl font-semibold text-[13px]">{error}</div>
          )}

          <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[13px] text-on-surface-variant">
              Ensure accurate delivery by pinning your exact location in Mussoorie.
            </div>
            <button
              type="button"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-[13px] font-bold border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              {isLocating ? 'Locating...' : '📍 Auto-Detect Pin'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Full name" name="fullName" value={active.value.fullName} onChange={onChange} required />
            <Field label="Phone" name="phone" value={active.value.phone} onChange={onChange} required />
            <div className="md:col-span-2">
              <Field label="Address line 1" name="line1" value={active.value.line1} onChange={onChange} required />
            </div>
            <div className="md:col-span-2">
              <Field label="Address line 2" name="line2" value={active.value.line2} onChange={onChange} />
            </div>
            <Field label="Landmark" name="landmark" value={active.value.landmark} onChange={onChange} />
            
            {/* NEW: Locked location fields */}
            <Field label="City" name="city" value={active.value.city} onChange={onChange} required readOnly />
            <Field label="State" name="state" value={active.value.state} onChange={onChange} required readOnly />
            <Field label="Pincode" name="pincode" value={active.value.pincode} onChange={onChange} required readOnly />
            <Field label="Country" name="country" value={active.value.country} onChange={onChange} readOnly />
            
            {active.value.latitude && (
              <>
                <Field label="Latitude" name="latitude" value={active.value.latitude} readOnly />
                <Field label="Longitude" name="longitude" value={active.value.longitude} readOnly />
              </>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-semibold border-none cursor-pointer disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save address'}
          </button>
        </form>
      )}
    </div>
  )
}