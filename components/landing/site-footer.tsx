import { Info } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer id="about" className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-8 text-center sm:px-6">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
          This application provides educational information and is not a substitute for professional medical diagnosis
          or treatment.
        </p>
        <p className="text-xs text-muted-foreground/70">© 2026 AI Medical Assistant</p>
      </div>
    </footer>
  )
}
