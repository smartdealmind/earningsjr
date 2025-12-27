import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

export function Tabs({ 
  defaultValue, 
  value: controlledValue, 
  onValueChange: controlledOnValueChange,
  className,
  children 
}: { 
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  children: ReactNode 
}) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue
  const onValueChange = isControlled ? controlledOnValueChange : setInternalValue

  return (
    <TabsContext.Provider value={{ value: value || '', onValueChange: onValueChange || (() => {}) }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('inline-flex h-10 items-center justify-center rounded-md bg-zinc-800/50 p-1 text-zinc-400', className)}>
      {children}
    </div>
  )
}

export function TabsTrigger({ 
  value, 
  className, 
  children 
}: { 
  value: string
  className?: string
  children: ReactNode 
}) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be inside Tabs')
  
  const isActive = context.value === value
  
  return (
    <button
      onClick={() => context.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-zinc-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive 
          ? 'bg-zinc-900 text-emerald-400 shadow-sm' 
          : 'text-zinc-400 hover:text-zinc-300',
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ 
  value, 
  className, 
  children 
}: { 
  value: string
  className?: string
  children: ReactNode 
}) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be inside Tabs')
  
  if (context.value !== value) return null
  
  return (
    <div className={cn('mt-2 ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2', className)}>
      {children}
    </div>
  )
}

