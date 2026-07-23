import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import CategoryPage from './CategoryPage'
import { useAuth } from '../context/AuthContext'

function AdultsOnly() {
  const { user, token, updateUser } = useAuth()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If not logged in, redirect to login
    if (!user) {
      navigate('/login?redirect=/18-plus')
      return
    }

    // Check if user is already verified
    if (!user.isAdultVerified) {
      setShowModal(true)
    }
  }, [user, navigate])

  const handleConfirm = async () => {
    if (!agreed) return

    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/me/verify-age`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const data = await res.json()
      if (res.ok) {
        updateUser(data.user)
        setShowModal(false)
      } else {
        alert(data.message || 'Failed to verify age')
      }
    } catch (err) {
      console.error(err)
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <CategoryPage category="18+" />

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center transform transition-all">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-red-600 text-3xl">warning</span>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Age Verification Required</h2>
            <p className="text-gray-600 mb-6">
              This section contains items intended for adults only (18 years and above). 
              By proceeding, you confirm that you meet the age requirement.
            </p>

            <div className="flex items-start gap-3 mb-6 text-left bg-gray-50 p-4 rounded-xl border border-gray-100">
              <input 
                type="checkbox" 
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <label htmlFor="agree" className="text-sm text-gray-700 cursor-pointer">
                Yes, I am 18 years or older and I agree to the Terms & Conditions to view this content.
              </label>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/')}
                className="flex-1 py-3 px-4 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold transition-colors"
                disabled={loading}
              >
                Go Back
              </button>
              <button 
                onClick={handleConfirm}
                disabled={!agreed || loading}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                  agreed && !loading
                    ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200' 
                    : 'bg-red-300 text-white cursor-not-allowed'
                }`}
              >
                {loading ? 'Verifying...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdultsOnly
