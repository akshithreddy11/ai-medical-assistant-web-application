import { FileText, MessageSquare, RefreshCw, ScanLine } from 'lucide-react'
import type { NotificationKind } from '@/lib/data'
import { cn } from '@/lib/utils'

const map = {
  report: { icon: FileText, cls: 'bg-primary/15 text-primary' },
  message: { icon: MessageSquare, cls: 'bg-primary/15 text-primary' },
  image: { icon: ScanLine, cls: 'bg-success/15 text-success' },
  system: { icon: RefreshCw, cls: 'bg-warning/15 text-warning' },
} satisfies Record<NotificationKind, { icon: typeof FileText; cls: string }>

export function NotificationIcon({ kind }: { kind: NotificationKind }) {
  const { icon: Icon, cls } = map[kind]
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', cls)}>
      <Icon className="size-4" aria-hidden="true" />
    </span>
  )
}
