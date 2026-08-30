import React, { useEffect } from 'react'
import { termsOfServiceContent } from '../data/legalDocs'

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Filter out empty paragraphs
  const paragraphs = termsOfServiceContent.filter(p => p && p.trim())

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12 md:py-20 animate-fade-in">
      {/* Premium Header */}
      <div className="text-center mb-12 md:mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
          Legal Agreement
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-on-background tracking-tight mb-4">
          Terms & Conditions
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          Please read these terms and conditions carefully before using our platform and availing our services.
        </p>
      </div>

      {/* Glassmorphic Document Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-3xl shadow-xl overflow-hidden p-6 md:p-12 space-y-8 leading-relaxed text-on-surface-variant">
        
        {paragraphs.map((p, idx) => {
          const isMainTitle = p === 'Terms & Conditions'
          const isWarning = p.startsWith('ACCESSING, BROWSING OR OTHERWISE USING')
          
          if (isMainTitle) return null // Handled in page header

          if (isWarning) {
            return (
              <div 
                key={idx} 
                className="p-6 bg-error-container/10 border border-error/20 rounded-2xl text-error text-[14px] md:text-[15px] font-semibold leading-relaxed my-6"
              >
                {p}
              </div>
            )
          }

          // Check if it's a standard bullet list item (often starts with space or specific numbers)
          const isBulletLike = p.match(/^\s*[\u2022\-\*]|\s*[a-zA-Z0-9]+\.\s+/)

          return (
            <p 
              key={idx} 
              className={`text-[15px] md:text-[16px] text-on-surface-variant leading-loose ${
                isBulletLike ? 'pl-6 relative before:content-["•"] before:absolute before:left-2 before:text-primary font-medium' : ''
              }`}
            >
              {p}
            </p>
          )
        })}

        <div className="pt-6 text-center text-xs text-on-surface-variant/60 border-t border-outline-variant/20">
          Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
