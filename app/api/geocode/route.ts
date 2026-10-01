import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location')

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key is not configured.' },
        { status: 500 }
      )
    }

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(location)}` +
      `&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (
      data.status !== 'OK' ||
      !data.results ||
      data.results.length === 0
    ) {
      return NextResponse.json(
        { error: 'Location not found.' },
        { status: 404 }
      )
    }

    const result = data.results[0]

    return NextResponse.json({
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    })
  } catch (error) {
    console.error('Geocoding error:', error)

    return NextResponse.json(
      { error: 'Unable to search location.' },
      { status: 500 }
    )
  }
}