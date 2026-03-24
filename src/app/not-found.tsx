import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-black text-orange-500 mb-4">404</h1>
        <p className="text-xl font-bold mb-2">Figure not found</p>
        <p className="text-gray-400 mb-8">This figure may have escaped from the vault.</p>
        <Button asChild className="bg-orange-500 hover:bg-orange-600">
          <Link href="/catalog">Back to Catalog</Link>
        </Button>
      </div>
    </div>
  )
}
