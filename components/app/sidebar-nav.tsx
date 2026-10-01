'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutNav, primaryNav } from '@/lib/data'
import { cn } from '@/lib/utils'

export function SidebarNav({
  onNavigate,
}: {
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const LogoutIcon = logoutNav.icon

  return (
    <nav
      aria-label="App"
      className="flex flex-1 flex-col gap-1"
    >
      {primaryNav.map(({ label, href, icon: Icon }) => {
        const active =
          pathname === href ||
          pathname.startsWith(`${href}/`)

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              active
                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground ring-1 ring-primary/25'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
            )}
          >
            <Icon
              className="size-4 shrink-0"
              aria-hidden="true"
            />
            {label}
          </Link>
        )
      })}

      <div className="mt-auto border-t border-sidebar-border pt-2">
        <Link
          href={logoutNav.href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogoutIcon
            className="size-4"
            aria-hidden="true"
          />
          {logoutNav.label}
        </Link>
      </div>
    </nav>
  )
}