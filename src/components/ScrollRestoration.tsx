'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function ScrollRestoration() {
  const pathname = usePathname()
  const lastPathname = useRef(pathname)
  const lastScrollY = useRef(0)

  // Continuously track scroll position
  useEffect(() => {
    const onScroll = () => { lastScrollY.current = window.scrollY }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (lastPathname.current !== pathname) {
      // Save scroll position of the page we just left
      sessionStorage.setItem(`scroll:${lastPathname.current}`, String(lastScrollY.current))
      lastPathname.current = pathname
    }

    // Restore scroll position for current page if there is one
    const saved = sessionStorage.getItem(`scroll:${pathname}`)
    if (saved) {
      const y = parseInt(saved)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, y)
        })
      })
    }
  }, [pathname])

  return null
}
