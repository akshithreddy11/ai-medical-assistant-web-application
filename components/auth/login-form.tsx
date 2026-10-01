
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        if (
          error.message.toLowerCase().includes('email not confirmed')
        ) {
          const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: email.trim(),
            options: {
              emailRedirectTo: `${window.location.origin}/login`,
            },
          })

          if (resendError) {
            setError(
              'Email confirmation pending. Please check your Supabase settings or try again later.'
            )
          } else {
            setMessage(
              'Confirmation email sent! Please check your inbox and spam folder, confirm your email, then login again.'
            )
          }

          return
        }

        setError(error.message)
        return
      }

      if (data.user) {
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: data.user.id,
            name:
              data.user.user_metadata?.full_name ||
              data.user.user_metadata?.name ||
              '',
            email: data.user.email || email,
            phone: data.user.user_metadata?.phone || '',
          })
        )
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="mb-1 block text-sm font-medium"
        >
          Email
        </label>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          autoComplete="email"
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium"
        >
          Password
        </label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border px-4 py-3"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="text-sm text-green-600" role="status">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Please wait...' : 'Login'}
      </button>
    </form>
  )
}