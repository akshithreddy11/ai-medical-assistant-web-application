import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase configuration is missing.' },
        { status: 500 }
      )
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseKey
    )

    const body = await request.json()

    const identifier = String(body.identifier || '').trim()
    const password = String(body.password || '')

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      )
    }

    if (!identifier.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter your registered email.' },
        { status: 400 }
      )
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: identifier,
        password,
      })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || '',
        phone: data.user.user_metadata?.phone || '',
      },
      session: data.session,
    })
  } catch (error) {
    console.error('Login API error:', error)

    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}