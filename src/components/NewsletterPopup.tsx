'use client'

import { useEffect } from 'react'

interface NewsletterPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewsletterPopup({ isOpen, onClose }: NewsletterPopupProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubscribe = () => {
    window.open('https://the-weekly-slice.beehiiv.com/', '_blank')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏌️‍♂️</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Want to finally get better at golf in 2026?</h3>
            <p className="text-gray-600">
              Join The Weekly Slice - a short, practical golf newsletter for players who want to improve without overthinking it.
            </p>
          </div>

          <button
            onClick={handleSubscribe}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Subscribe now for free
          </button>
        </div>
      </div>
    </div>
  )
}