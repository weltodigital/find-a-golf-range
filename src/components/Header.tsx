'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Find A Golf Range Logo"
                width={100}
                height={100}
                className="rounded-lg"
              />
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <div className="relative">
              <button
                className="text-gray-700 hover:text-primary font-medium flex items-center"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                Driving Ranges
                <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <Link
                    href="/uk"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    UK Ranges
                  </Link>
                  <Link
                    href="/australia"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Australia Ranges
                  </Link>
                </div>
              )}
            </div>
          </nav>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <div className={`h-0.5 bg-gray-700 transition-all ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></div>
              <div className={`h-0.5 bg-gray-700 transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`h-0.5 bg-gray-700 transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></div>
            </div>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              <div className="py-2">
                <span className="text-gray-700 font-medium block mb-2">Driving Ranges</span>
                <Link href="/uk" className="text-gray-600 hover:text-primary font-medium py-1 pl-4 block">
                  UK Ranges
                </Link>
                <Link href="/australia" className="text-gray-600 hover:text-primary font-medium py-1 pl-4 block">
                  Australia Ranges
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}