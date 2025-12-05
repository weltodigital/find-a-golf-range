import { NextResponse } from 'next/server'

export async function GET() {
  const adsContent = `google.com, pub-9111708018377400, DIRECT, f08c47fec0942fa0`

  return new NextResponse(adsContent, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}