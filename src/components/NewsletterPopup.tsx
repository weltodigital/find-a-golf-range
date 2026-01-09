'use client'

import { useState, useEffect } from 'react'

interface NewsletterPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function NewsletterPopup({ isOpen, onClose }: NewsletterPopupProps) {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubmitting(true)

    try {
      const response = await fetch('https://embeds.beehiiv.com/v2/publications/1c7a8c38-6833-42c5-aa9a-b0b1b8b76a9b/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          reactivate_existing: false,
          send_welcome_email: true,
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setTimeout(() => {
          onClose()
          setIsSubmitted(false)
          setEmail('')
        }, 2000)
      } else {
        console.error('Newsletter signup failed')
      }
    } catch (error) {
      console.error('Error submitting newsletter signup:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onClose()
    setTimeout(() => {
      setIsSubmitted(false)
      setEmail('')
    }, 300)
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
          {isSubmitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome to The Weekly Slice!</h3>
              <p className="text-gray-600">Thank you for subscribing. Check your email for confirmation.</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏌️‍♂️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Join The Weekly Slice!</h3>
                <p className="text-gray-600">
                  Get the best golf tips, range reviews, and weekly insights delivered straight to your inbox.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !email}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe to The Weekly Slice'}
                </button>
              </form>

              <p className="text-xs text-gray-500 text-center mt-4">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}