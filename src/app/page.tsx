import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-[70vh] px-4 text-center bg-gradient-to-b from-muted/50 to-background">
        <Badge variant="outline" className="mb-6 border-orange-500 text-orange-500 text-sm px-4 py-1">
          S.H. Figuarts Dragon Ball — Now Tracking
        </Badge>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tight">
          Action Legends
          <br />
          <span className="text-orange-500">Figure Vault</span>
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mb-10">
          Track your collection, discover market prices, and catalog every official S.H. Figuarts Dragon Ball figure.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Button asChild size="lg" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8">
            <Link href="/catalog">Browse Catalog</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/collection">My Collection</Link>
          </Button>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-6 text-center px-4">
          <div>
            <p className="text-3xl font-black text-orange-500">33</p>
            <p className="text-muted-foreground text-sm mt-1">Figures Cataloged</p>
          </div>
          <div>
            <p className="text-3xl font-black text-orange-500">1</p>
            <p className="text-muted-foreground text-sm mt-1">Line Tracked</p>
          </div>
          <div>
            <p className="text-3xl font-black text-orange-500">Free</p>
            <p className="text-muted-foreground text-sm mt-1">Always</p>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-5xl mx-auto px-4 py-20 grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {[
          { title: 'Full Catalog', desc: 'Every official SHF Dragon Ball figure with release dates, accessories, and MSRP.' },
          { title: 'Track Collection', desc: 'Mark figures as Owned, Wishlisted, or For Sale. Track what you paid vs. market value.' },
          { title: 'Market Prices', desc: 'Community-reported sale prices. Know the real value of every figure.' },
        ].map((f) => (
          <div key={f.title} className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-muted-foreground text-sm">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
