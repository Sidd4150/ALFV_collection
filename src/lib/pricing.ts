const EXCLUDED_CONDITIONS = new Set([
  'For Parts or Not Working',
  'Acceptable',
])

function medianOf(prices: number[]): number {
  const s = [...prices].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 !== 0 ? s[m] : (s[m - 1] + s[m]) / 2
}

export function computeMarketPrice(
  sales: { price: number; saleDate: Date; condition: string | null }[]
): number | null {
  const filtered = sales.filter(
    (s) => !s.condition || !EXCLUDED_CONDITIONS.has(s.condition)
  )

  if (filtered.length === 0) return null
  if (filtered.length === 1) return filtered[0].price

  const anchor = medianOf(filtered.map((s) => s.price))
  const now = Date.now()

  let weightedSum = 0
  let weightTotal = 0

  for (const sale of filtered) {
    const daysAgo = (now - new Date(sale.saleDate).getTime()) / 86_400_000
    const recencyWeight = Math.exp(-daysAgo / 180)

    const relativeDistance = Math.abs(sale.price - anchor) / (anchor || 1)
    const distanceWeight =
      sale.price < anchor
        ? 1 / (1 + relativeDistance * 3)
        : 1 / (1 + relativeDistance * 1.5)

    const weight = recencyWeight * distanceWeight
    weightedSum += sale.price * weight
    weightTotal += weight
  }

  return weightTotal > 0 ? weightedSum / weightTotal : null
}
