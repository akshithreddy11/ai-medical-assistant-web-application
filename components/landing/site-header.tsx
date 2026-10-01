import Link from 'next/link'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const links = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLogo />
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'border-primary/40')}>
            Login
          </Link>
          <Link href="/register" className={cn(buttonVariants({ size: 'sm' }), 'hidden sm:inline-flex')}>
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
