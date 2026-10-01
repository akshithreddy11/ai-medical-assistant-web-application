
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Phone, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { IconField } from '@/components/auth/icon-field'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

export function RegisterForm() {
  const router = useRouter()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const data = new FormData(e.currentTarget)

    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim()
    const phone = String(data.get('phone') || '').trim()
    const password = String(data.get('password') || '')
    const confirm = String(data.get('confirm') || '')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setError(null)
    setLoading(true)

    try {
      const { data: result, error: signupError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
            },
          },
        })

      if (signupError) {
        setError(signupError.message)
        return
      }

      if (result.user && result.session) {
        // Save registered user details
        // using the same key as login-form.tsx
        localStorage.setItem(
          'user',
          JSON.stringify({
            id: result.user.id,
            name: name,
            email: result.user.email || email,
            phone: phone,
          })
        )

        router.push('/dashboard')
        router.refresh()
      } else {
        setError(
          'Registration successful! Please verify your email before logging in.'
        )

        router.push('/login')
      }
    } catch (err) {
      console.error('Registration error:', err)

      setError(
        'Registration failed. Please check your Supabase configuration.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit}
    >
      <IconField
        label="Full Name"
        icon={User}
        name="name"
        placeholder="Enter your full name"
        autoComplete="name"
        required
      />

      <IconField
        label="Email"
        icon={Mail}
        type="email"
        name="email"
        placeholder="Enter your email address"
        autoComplete="email"
        required
      />

      <IconField
        label="Mobile Number"
        icon={Phone}
        type="tel"
        name="phone"
        placeholder="Enter your mobile number"
        autoComplete="tel"
        required
      />

      <IconField
        label="Password"
        icon={Lock}
        type="password"
        name="password"
        placeholder="Enter your password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <IconField
        label="Confirm Password"
        icon={Lock}
        type="password"
        name="confirm"
        placeholder="Confirm your password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      {error && (
        <p
          role="alert"
          className="text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Button
        type="submit"
        className="mt-2 h-10 w-full"
        disabled={loading}
      >
        {loading ? 'Creating Account...' : 'Register'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-primary hover:underline"
        >
          Login
        </Link>
      </p>
    </form>
  )
}