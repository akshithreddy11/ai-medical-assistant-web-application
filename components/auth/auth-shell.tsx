
import type { ReactNode } from 'react'

type AuthShellProps = {
  children: ReactNode
  variant: 'login' | 'register'
  title: string
  subtitle: string
}

export function AuthShell({
  children,
  variant,
  title,
  subtitle,
}: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020d1c] px-4 py-10 text-white">

      {/* Background glow effects */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}
        <a
          href="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20" />
              <path d="M2 12h20" />
              <path d="M5 5l14 14" />
              <path d="M19 5L5 19" />
            </svg>
          </div>

          <span className="text-lg font-semibold tracking-wide">
            AI Medical <span className="text-cyan-400">Assistant</span>
          </span>
        </a>

        {/* Auth Card */}
        <div className="rounded-2xl border border-cyan-900/80 bg-[#07182b]/95 p-6 shadow-[0_0_50px_rgba(0,180,220,0.08)] sm:p-8">

          {/* Card Heading */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {title}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {subtitle}
            </p>
          </div>

          {/* Login / Register Form */}
          <div className="auth-form-dark">
            {children}
          </div>

          {/* Bottom Link */}
          <div className="mt-6 border-t border-slate-700/70 pt-5 text-center text-sm text-slate-400">
            {variant === 'login' ? (
              <p>
                Don&apos;t have an account?{' '}
                <a
                  href="/register"
                  className="font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Register
                </a>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <a
                  href="/login"
                  className="font-semibold text-cyan-400 hover:text-cyan-300"
                >
                  Login
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500">
          For informational purposes only. Not a substitute for professional medical advice.
        </p>
      </div>
    </main>
  )
}