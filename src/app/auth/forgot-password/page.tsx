'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black text-orange-500">ALFV</Link>
          <h1 className="text-2xl font-bold mt-4 mb-1">Reset password</h1>
          <p className="text-muted-foreground text-sm">
            {sent ? "Check your email for a reset link." : "Enter your email and we'll send you a link."}
          </p>
        </div>

        {!sent && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold"
                disabled={loading}
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/auth/login" className="text-orange-500 hover:underline font-medium">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  )
}
