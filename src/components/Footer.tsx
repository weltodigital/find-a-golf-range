import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-gray-700 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <Image
                src="/logo.png"
                alt="Find A Golf Range Logo"
                width={100}
                height={100}
                className="rounded-lg"
              />
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              The UK&apos;s most comprehensive directory of golf driving ranges.
              Find the perfect practice facility near you with detailed information
              and up-to-date listings.
            </p>
            <p className="text-gray-300">
              Contact: <a href="mailto:findagolfrange@weltodigital.com" className="text-primary hover:text-primary/80 transition-colors">findagolfrange@weltodigital.com</a>
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/uk" className="text-gray-300 hover:text-primary transition-colors">
                  UK Ranges
                </Link>
              </li>
              <li>
                <Link href="/australia" className="text-gray-300 hover:text-primary transition-colors">
                  Australia Ranges
                </Link>
              </li>
              <li>
                <Link href="/sitemap.xml" className="text-gray-300 hover:text-primary transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-gray-300 hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 Find A Golf Range. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}