'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NotificationsDropdown } from '@/components/app/notifications-dropdown'
import { SidebarNav } from '@/components/app/sidebar-nav'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { currentUser, mobileNav } from '@/lib/data'
import { cn } from '@/lib/utils'

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        <BrandLogo href="/dashboard" className="px-2 pt-1" />
        <SidebarNav />
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative flex h-full w-72 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4">
            <div className="flex items-center justify-between">
              <BrandLogo href="/dashboard" className="px-2" />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="flex size-8 items-center justify-center rounded-lg hover:bg-muted"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex size-9 items-center justify-center rounded-lg hover:bg-muted lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <form role="search" className="relative hidden max-w-md flex-1 sm:block" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="global-search" className="sr-only">
              Search
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="global-search"
              type="search"
              placeholder="Search anything..."
              className="h-9 w-full rounded-lg border border-input bg-muted/50 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </form>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <NotificationsDropdown />
            <Link
              href="/profile"
              aria-label={`Profile of ${currentUser.name}`}
              className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/40"
            >
              {currentUser.initials}
            </Link>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:pb-8">{children}</main>
      </div>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
      >
        {mobileNav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 text-[11px]',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
