import Link from 'next/link'
import { Bot, FileText, History, ScanLine, ShieldCheck } from 'lucide-react'

const features = [
  { icon: Bot, title: 'AI Medical Chat', body: 'Get answers to your health questions in plain language.', href: '/chat' },
  { icon: FileText, title: 'Medical Report Analyzer', body: 'Understand your lab values and medical reports.', href: '/reports' },
  { icon: ScanLine, title: 'Medical Image Analyzer', body: 'Analyze X-rays, scans and other medical images.', href: '/images' },
  { icon: History, title: 'Health History', body: 'Track every chat, report and scan in one timeline.', href: '/history' },
  { icon: ShieldCheck, title: 'Secure Data', body: 'Your data, your control — private by default.', href: '/settings' },
]

export function FeatureGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-16 sm:px-6">
      <h2 className="sr-only">Features</h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {features.map(({ icon: Icon, title, body, href }) => (
          <li key={title}>
            <Link
              href={href}
              className="glass-card group flex h-full flex-col items-center gap-3 p-6 text-center transition-colors hover:bg-accent/40"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25 transition-transform group-hover:scale-105">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
