import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Golf Driving Ranges in Australia | Find A Golf Range',
  description: 'Discover Australia\'s premier golf driving ranges across major cities. From Sydney\'s bustling range scene to Newcastle\'s quality facilities, find the perfect place to practice your swing.',
  keywords: 'golf driving ranges Australia, golf practice Sydney, golf ranges Newcastle, Australian golf facilities',
}

export default function AustraliaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}