'use client'

import { useState, useEffect } from 'react'

const POPUP_DELAY = 8000 // 8 seconds
const POPUP_STORAGE_KEY = 'newsletter_popup_shown'
const POPUP_DISMISSED_KEY = 'newsletter_popup_dismissed'

export function useNewsletterPopup() {
  const [isPopupOpen, setIsPopupOpen] = useState(false)

  useEffect(() => {
    // Check if popup was already shown or dismissed
    const wasShown = localStorage.getItem(POPUP_STORAGE_KEY)
    const wasDismissed = localStorage.getItem(POPUP_DISMISSED_KEY)

    if (wasShown || wasDismissed) {
      return
    }

    // Set timer to show popup after delay
    const timer = setTimeout(() => {
      setIsPopupOpen(true)
      localStorage.setItem(POPUP_STORAGE_KEY, 'true')
    }, POPUP_DELAY)

    return () => clearTimeout(timer)
  }, [])

  const closePopup = () => {
    setIsPopupOpen(false)
    localStorage.setItem(POPUP_DISMISSED_KEY, 'true')
  }

  return {
    isPopupOpen,
    closePopup
  }
}