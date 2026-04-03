import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  page: number
  totalPages: number
  searchParams: Record<string, string>
}

function pageUrl(params: Record<string, string>, page: number) {
  const p = new URLSearchParams(params)
  p.set('page', String(page))
  return `?${p.toString()}`
}

export function CatalogPagination({ page, totalPages, searchParams }: Props) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
      <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
        {page > 1 ? (
          <Link href={pageUrl(searchParams, page - 1)}>Previous</Link>
        ) : (
          <span>Previous</span>
        )}
      </Button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground">…</span>
        ) : (
          <Button
            key={p}
            variant={p === page ? 'default' : 'outline'}
            size="sm"
            asChild={p !== page}
          >
            {p !== page ? (
              <Link href={pageUrl(searchParams, p)}>{p}</Link>
            ) : (
              <span>{p}</span>
            )}
          </Button>
        )
      )}

      <Button variant="outline" size="sm" disabled={page >= totalPages} asChild={page < totalPages}>
        {page < totalPages ? (
          <Link href={pageUrl(searchParams, page + 1)}>Next</Link>
        ) : (
          <span>Next</span>
        )}
      </Button>
    </div>
  )
}
