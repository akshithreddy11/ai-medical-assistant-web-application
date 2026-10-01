import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const issue = searchParams.get('issue')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!issue || !lat || !lng) {
      return NextResponse.json(
        { error: 'Health issue and location are required.' },
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

    const response = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.googleMapsUri',
        },
        body: JSON.stringify({
          textQuery: `${issue} hospital`,
          includedType: 'hospital',
          strictTypeFiltering: true,
          pageSize: 10,
          locationBias: {
            circle: {
              center: {
                latitude: Number(lat),
                longitude: Number(lng),
              },
              radius: 10000,
            },
          },
          languageCode: 'en',
          regionCode: 'IN',
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Places API error:', errorText)

      return NextResponse.json(
        { error: 'Unable to search nearby hospitals.' },
        { status: 500 }
      )
    }

    const data = await response.json()

    const hospitals =
      data.places?.map((place: any) => ({
        id: place.id,
        name: place.displayName?.text || 'Hospital',
        address:
          place.formattedAddress || 'Address unavailable',
        mapsUrl:
          place.googleMapsUri ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            place.displayName?.text || 'hospital'
          )}`,
      })) || []

    return NextResponse.json({ hospitals })
  } catch (error) {
    console.error('Hospital search error:', error)

    return NextResponse.json(
      { error: 'Something went wrong while finding hospitals.' },
      { status: 500 }
    )
  }
}