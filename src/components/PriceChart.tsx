'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function resolveVar(variable: string): string {
  const el = document.createElement('div')
  el.style.display = 'none'
  el.style.color = `hsl(var(${variable}))`
  document.body.appendChild(el)
  const color = getComputedStyle(el).color
  document.body.removeChild(el)
  return color
}

function useChartColors() {
  const [colors, setColors] = useState({ muted: '#888888', border: '#333333' })

  useEffect(() => {
    const update = () => {
      setColors({
        muted: resolveVar('--muted-foreground'),
        border: resolveVar('--border'),
      })
    }
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return colors
}

type DataPoint = { date: string; price: number }

function median(prices: number[]) {
  const sorted = [...prices].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function PriceChart({ sales, label = 'Market Price History' }: { sales: { price: number; saleDate: string }[]; label?: string }) {
  const { muted, border } = useChartColors()
  if (sales.length === 0) return null

  const byMonth: Record<string, number[]> = {}
  for (const s of sales) {
    const month = s.saleDate.slice(0, 7)
    if (!byMonth[month]) byMonth[month] = []
    byMonth[month].push(s.price)
  }

  const data: DataPoint[] = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, prices]) => ({
      date: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      price: Math.round(median(prices) * 100) / 100,
    }))

  const maxPrice = data.length > 0 ? Math.max(...data.map((d) => d.price)) : 0
  const yMax = Math.ceil(maxPrice * 1.3)

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{label}</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: muted }}
            tickLine={false}
            axisLine={{ stroke: border }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: muted }}
            tickLine={false}
            axisLine={{ stroke: border }}
            tickFormatter={(v) => `$${v}`}
            width={45}
            domain={[0, yMax]}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              color: 'hsl(var(--foreground))',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            itemStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(v: number) => [`$${v}`, 'Median price']}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="text-xs text-muted-foreground mt-2">{sales.length} sale{sales.length !== 1 ? 's' : ''} recorded · Estimates only — do your own research before buying or selling.</p>
    </div>
  )
}
