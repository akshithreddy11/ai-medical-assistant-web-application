
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const password = String(body.password || '')

    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: 'Please fill in all fields.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase environment variables are missing')

      return NextResponse.json(
        { error: 'Supabase configuration is missing.' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    )

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
        },
      },
    })

    if (error) {
      console.error('Supabase signup error:', error.message)

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful.',
        user: {
          id: data.user?.id,
          name,
          email,
          phone,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration API error:', error)

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}