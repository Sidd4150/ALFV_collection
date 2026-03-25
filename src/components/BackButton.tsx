'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BackButton() {
  const router = useRouter()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2 mb-6 -ml-2 text-muted-foreground hover:text-foreground"
      onClick={() => router.back()}
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  )
}
