import type { Metadata } from 'next'
import { AuthShell } from '@/components/auth/auth-shell'
import { RegisterForm } from '@/components/auth/register-form'

export const metadata: Metadata = { title: 'Create Account — AI Medical Assistant' }

export default function RegisterPage() {
  return (
    <AuthShell variant="register" title="Create Your Account" subtitle="Join to get started">
      <RegisterForm />
    </AuthShell>
  )
}
