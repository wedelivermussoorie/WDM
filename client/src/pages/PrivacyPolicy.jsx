import React, { useEffect } from 'react'
import { privacyPolicyContent } from '../data/legalDocs'

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const rawText = privacyPolicyContent[0] || ''
  
  // Clean up initial header jamming
  let cleanedText = rawText.replace(
    'Privacy PolicyIntroductionThis Privacy Policy describes',
    'Introduction\n\nThis Privacy Policy describes'
  )

  // Split by main sections
  const sectionKeywords = [
    'Collection-',
    'Usage-',
    'Sharing-',
    'Security Precautions-',
    'Data Deletion and Retention-',
    'Your Rights-',
    'Consent-',
    'Changes to this Privacy Policy-'
  ]
  
  // Construct regex to split by these sections
  const regex = new RegExp(`(?=${sectionKeywords.join('|')})`, 'g')
  const rawSections = cleanedText.split(regex)

  const parsedSections = rawSections.map((sec, idx) => {
    let title = ''
    let body = sec

    // Find if the section starts with any of our keywords
    const matchingKeyword = sectionKeywords.find(keyword => sec.startsWith(keyword))
    
    if (matchingKeyword) {
      title = matchingKeyword.replace('-', '')
      body = sec.substring(matchingKeyword.length)
    } else if (idx === 0) {
      // First section is the introduction
      if (sec.startsWith('Introduction\n\n')) {
        title = 'Introduction'
        body = sec.replace('Introduction\n\n', '')
      } else {
        title = 'Overview'
      }
    }

    return { title, body }
  })

  return (
    <div className="max-w-[900px] mx-auto px-6 py-12 md:py-20 animate-fade-in">
      {/* Premium Gradient Header */}
      <div className="text-center mb-12 md:mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
          Legal Agreement
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-on-background tracking-tight mb-4 animate-slide-up">
          Privacy Policy
        </h1>
        <p className="text-on-surface-variant text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
          We value your trust and privacy. This policy outlines how we handle and protect your personal information on our platform.
        </p>
      </div>

      {/* Glassmorphic Document Card */}
      <div className="bg-surface-container-lowest border border-outline-variant/35 rounded-3xl shadow-xl overflow-hidden p-6 md:p-12 space-y-10 leading-relaxed text-on-surface-variant">
        
        {parsedSections.map((section, idx) => (
          <section key={idx} className="group border-b border-outline-variant/20 last:border-0 pb-8 last:pb-0">
            <h2 className="text-xl font-bold text-on-background mb-4 flex items-center gap-2 group-hover:text-primary transition-colors">
              <span className="w-1.5 h-6 bg-primary rounded-full transition-all group-hover:h-8" />
              {section.title}
            </h2>
            <div className="text-[15px] md:text-[16px] text-on-surface-variant leading-loose space-y-4 whitespace-pre-line">
              {section.body.trim()}
            </div>
          </section>
        ))}

        <div className="pt-6 text-center text-xs text-on-surface-variant/60 border-t border-outline-variant/20">
          Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
  )
}
