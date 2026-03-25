'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'

type DataPoint = {
  date: string
  price: number
}

type Props = {
  data: DataPoint[]
  msrp: number | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-muted-foreground text-xs mb-1">{new Date(label).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      <p className="font-bold text-orange-500">${payload[0].value.toFixed(2)}</p>
    </div>
  )
}

export function PriceChart({ data, msrp }: Props) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        Not enough data yet — submit more sales to see the chart.
      </p>
    )
  }

  const prices = data.map((d) => d.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const padding = (max - min) * 0.2 || 10

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[Math.max(0, min - padding), max + padding]}
          tickFormatter={(v) => `$${v}`}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          width={50}
        />
        <Tooltip content={<CustomTooltip />} />
        {msrp && (
          <ReferenceLine
            y={msrp}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="4 4"
            label={{ value: 'MSRP', position: 'insideTopRight', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
        )}
        <Line
          type="monotone"
          dataKey="price"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ r: 3, fill: '#f97316', strokeWidth: 0 }}
          activeDot={{ r: 5, fill: '#f97316' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
