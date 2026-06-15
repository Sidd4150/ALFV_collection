'use client'

import { useState } from 'react'
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'

type Sale = { price: number; saleDate: string }
type Period = '1M' | '3M' | '6M' | '1Y'

function median(prices: number[]) {
  const sorted = [...prices].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function getCutoff(period: Period): Date {
  const d = new Date()
  switch (period) {
    case '1M': d.setMonth(d.getMonth() - 1); break
    case '3M': d.setMonth(d.getMonth() - 3); break
    case '6M': d.setMonth(d.getMonth() - 6); break
    case '1Y': d.setFullYear(d.getFullYear() - 1); break
  }
  return d
}

function bucketKey(date: Date, period: Period): string {
  if (period === '1Y') {
    // Monthly buckets
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }
  // Weekly buckets for 1M/3M/6M
  const day = date.getDay()
  const monday = new Date(date)
  monday.setDate(date.getDate() - ((day + 6) % 7))
  return monday.toISOString().slice(0, 10)
}

function formatBucketLabel(key: string, period: Period): string {
  if (period === '1Y') {
    const d = new Date(key + '-01')
    return d.toLocaleDateString('en-US', { month: 'short' })
  }
  const d = new Date(key)
  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
}

type DataPoint = { label: string; price: number; volume: number }

function buildData(sales: Sale[], period: Period): DataPoint[] {
  const cutoff = getCutoff(period)
  const filtered = sales.filter((s) => new Date(s.saleDate) >= cutoff)
  if (filtered.length === 0) return []

  const buckets = new Map<string, number[]>()
  for (const s of filtered) {
    const key = bucketKey(new Date(s.saleDate), period)
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(s.price)
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, prices]) => ({
      label: formatBucketLabel(key, period),
      price: Math.round(median(prices) * 100) / 100,
      volume: prices.length,
    }))
}

const PERIODS: Period[] = ['1M', '3M', '6M', '1Y']
const LINE_COLOR = '#7c3aed'
const BAR_COLOR = '#c4b5fd'

export function PriceChart({ sales, label = 'Market Price History' }: { sales: Sale[]; label?: string }) {
  const [period, setPeriod] = useState<Period>('3M')

  if (sales.length === 0) return null

  const data = buildData(sales, period)
  if (data.length === 0) return null

  const currentPrice = data[data.length - 1].price
  const firstPrice = data[0].price
  const change = currentPrice - firstPrice
  const changePercent = firstPrice > 0 ? (change / firstPrice) * 100 : 0
  const isUp = change >= 0

  const prices = data.map((d) => d.price)
  const minP = Math.min(...prices)
  const maxP = Math.max(...prices)
  const pad = (maxP - minP) * 0.12 || maxP * 0.08 || 5
  const yMin = Math.max(0, Math.floor((minP - pad) * 100) / 100)
  const yMax = Math.ceil((maxP + pad) * 100) / 100

  const maxVol = Math.max(...data.map((d) => d.volume))
  const hasVolume = maxVol > 1

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <svg width="16" height="12" viewBox="0 0 16 12" className="text-purple-500">
          <polyline points="0,10 4,6 8,8 12,2 16,4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        <span className="text-sm font-bold font-mono tabular-nums">${currentPrice.toFixed(2)}</span>
        {data.length > 1 && (
          <span className={`text-xs font-mono font-semibold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
            ({isUp ? '+' : ''}{changePercent.toFixed(2)}%)
          </span>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 4, right: hasVolume ? 40 : 8, bottom: 0, left: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.4}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))', strokeOpacity: 0.5 }}
            dy={6}
          />
          <YAxis
            yAxisId="price"
            orientation="left"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `$${Number(v).toFixed(2)}`}
            width={55}
            domain={[yMin, yMax]}
          />
          {hasVolume && (
            <YAxis
              yAxisId="volume"
              orientation="right"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              width={35}
              domain={[0, Math.ceil(maxVol * 1.4)]}
            />
          )}
          <Tooltip
            contentStyle={{
              background: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'hsl(var(--foreground))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'hsl(var(--muted-foreground))', fontSize: '10px', marginBottom: '4px' }}
            formatter={(value, name) => {
              const v = Number(value)
              if (name === 'price') return [`$${v.toFixed(2)}`, 'Price']
              if (name === 'volume') return [v, 'Sales']
              return [v, String(name)]
            }}
            cursor={{ stroke: LINE_COLOR, strokeWidth: 1, strokeOpacity: 0.4 }}
          />
          {hasVolume && (
            <Bar
              yAxisId="volume"
              dataKey="volume"
              fill={BAR_COLOR}
              radius={[2, 2, 0, 0]}
              barSize={data.length > 20 ? 8 : 14}
            />
          )}
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="price"
            stroke={LINE_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: LINE_COLOR, stroke: 'hsl(var(--card))', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Period selector */}
      <div className="flex items-center justify-center gap-1 mt-4">
        {PERIODS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              period === p
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}
