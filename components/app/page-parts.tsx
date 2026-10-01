import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-balance text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('glass-card p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

type Tone = 'success' | 'warning' | 'danger' | 'primary' | 'muted'

const toneCls: Record<Tone, string> = {
  success: 'bg-success/15 text-success ring-success/30',
  warning: 'bg-warning/15 text-warning ring-warning/30',
  danger: 'bg-destructive/15 text-destructive ring-destructive/30',
  primary: 'bg-primary/15 text-primary ring-primary/30',
  muted: 'bg-muted text-muted-foreground ring-border',
}

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1', toneCls[tone])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

export function Disclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground/80',
        className,
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
      This analysis is for educational purposes only and does not constitute a medical diagnosis. Always consult a
      qualified healthcare professional.
    </p>
  )
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 sm:gap-3" aria-label="Progress">
      {steps.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'todo'
        return (
          <li key={step} className="flex items-center gap-2 sm:gap-3" aria-current={state === 'active' ? 'step' : undefined}>
            <span
              className={cn(
                'flex size-7 items-center justify-center rounded-full text-xs font-semibold ring-1',
                state === 'active' && 'bg-primary text-primary-foreground ring-primary',
                state === 'done' && 'bg-primary/20 text-primary ring-primary/40',
                state === 'todo' && 'bg-muted text-muted-foreground ring-border',
              )}
            >
              {i + 1}
            </span>
            <span className={cn('text-sm', state === 'todo' ? 'text-muted-foreground' : 'text-foreground')}>{step}</span>
            {i < steps.length - 1 && <span className="hidden h-px w-6 bg-border sm:block" aria-hidden="true" />}
          </li>
        )
      })}
    </ol>
  )
}
