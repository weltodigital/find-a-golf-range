'use client'

import { useNewsletterPopup } from '@/hooks/useNewsletterPopup'
import NewsletterPopup from './NewsletterPopup'

interface ClientWrapperProps {
  children: React.ReactNode
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
  const { isPopupOpen, closePopup } = useNewsletterPopup()

  return (
    <>
      {children}
      <NewsletterPopup isOpen={isPopupOpen} onClose={closePopup} />
    </>
  )
}