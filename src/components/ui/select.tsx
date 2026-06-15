'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

type SelectContextValue = {
  value: string
  onChange: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function Select({
  defaultValue = '',
  value: controlledValue,
  onValueChange,
  children,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}) {
  const [internal, setInternal] = React.useState(defaultValue)
  const value = controlledValue ?? internal

  const onChange = React.useCallback(
    (v: string) => {
      setInternal(v)
      onValueChange?.(v)
    },
    [onValueChange]
  )

  return <SelectContext.Provider value={{ value, onChange }}>{children}</SelectContext.Provider>
}

function SelectTrigger({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('relative', className)}>
      {children}
    </div>
  )
}

function SelectValue({ placeholder }: { placeholder?: string; className?: string }) {
  const ctx = React.useContext(SelectContext)
  void placeholder
  void ctx
  return null
}

function SelectContent({ children }: { children: React.ReactNode }) {
  const ctx = React.useContext(SelectContext)!

  const items: { value: string; label: string }[] = []
  React.Children.forEach(children, (child) => {
    if (React.isValidElement<{ value: string; children: React.ReactNode }>(child)) {
      items.push({
        value: child.props.value,
        label: typeof child.props.children === 'string' ? child.props.children : String(child.props.children),
      })
    }
  })

  return (
    <div className="relative">
      <select
        value={ctx.value}
        onChange={(e) => ctx.onChange(e.target.value)}
        className="h-8 w-full appearance-none rounded-lg border border-input bg-transparent pl-2.5 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
      >
        {items.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    </div>
  )
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  void value
  void children
  return null
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
