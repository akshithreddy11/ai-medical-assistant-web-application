import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Private, secure and always available
          </span>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            AI Medical <span className="text-primary">Assistant</span>
          </h1>
          <p className="max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            Your intelligent companion for understanding medical information — lab reports, scans, and the questions you
            forgot to ask your doctor.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/register" className={cn(buttonVariants({ size: 'lg' }), 'h-11 gap-2 px-6')}>
              Get Started
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/login"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 border-primary/40 px-6')}
            >
              Login
            </Link>
          </div>
          <dl className="mt-4 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-6">
            {[
              { k: '50k+', v: 'Reports explained' },
              { k: '24/7', v: 'AI availability' },
              { k: '99.9%', v: 'Uptime' },
            ].map((s) => (
              <div key={s.v}>
                <dt className="sr-only">{s.v}</dt>
                <dd className="text-2xl font-semibold text-foreground">{s.k}</dd>
                <dd className="text-xs text-muted-foreground">{s.v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="relative">
          <div className="absolute inset-8 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-2xl border border-primary/20">
            <Image
              src="/images/hero-doctor.png"
              alt="Holographic AI doctor presenting a glowing medical interface"
              width={1200}
              height={900}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
