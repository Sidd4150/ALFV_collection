import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const rawRedirect = requestUrl.searchParams.get('redirectTo') ?? '/collection'
  const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/collection'

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  if (token_hash && type) {
    // Email OTP flow (email confirmation, magic link)
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      const dest = type === 'recovery' ? '/auth/reset-password' : `${redirectTo}?welcome=1`
      return NextResponse.redirect(new URL(dest, requestUrl.origin))
    }
  } else if (code) {
    // PKCE flow (OAuth, some email flows)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const dest = type === 'recovery' ? '/auth/reset-password' : redirectTo
      return NextResponse.redirect(new URL(dest, requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/auth/login?error=confirmation_failed', requestUrl.origin))
}
