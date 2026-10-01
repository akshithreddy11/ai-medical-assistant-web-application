'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

const subscribe = () => () => {}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)
  const isDark = !mounted || resolvedTheme === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-border bg-secondary p-0.5 transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        className,
      )}
    >
      <Sun className="absolute left-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
      <Moon className="absolute right-1.5 size-3.5 text-muted-foreground" aria-hidden="true" />
      <span
        className={cn(
          'relative z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition-transform',
          isDark ? 'translate-x-6' : 'translate-x-0',
        )}
      >
        {isDark ? <Moon className="size-3.5" aria-hidden="true" /> : <Sun className="size-3.5" aria-hidden="true" />}
      </span>
    </button>
  )
}
