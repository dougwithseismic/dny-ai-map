import { NextRequest, NextResponse } from 'next/server';

interface Location {
  locationId: string;
  locationName: string | null;
  address: string | null;
  cityName: string | null;
}

interface GeocodedLocation extends Location {
  latitude: number | null;
  longitude: number | null;
  geocoded: boolean;
  error?: string;
  skipped?: boolean;
}

function isOnlineLocation(
  locationName: string | null,
  address: string | null,
  cityName: string | null
): boolean {
  const onlineKeywords = [
    'online',
    'webinar',
    'webinář',
    'virtual',
    'virtuální',
    'zoom',
    'teams',
    'google meet',
    'microsoft teams',
    'stream',
    'live stream',
  ];

  const textToCheck = [
    locationName?.toLowerCase() || '',
    address?.toLowerCase() || '',
    cityName?.toLowerCase() || '',
  ].join(' ');

  return onlineKeywords.some((keyword) => textToCheck.includes(keyword));
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocodeAddress(
  address: string | null,
  city: string | null,
  country: string = 'Czech Republic'
): Promise<{ latitude: number; longitude: number } | null> {
  if (!address || !city) {
    return null;
  }

  const fullAddress = `${address}, ${city}, ${country}`;
  const encodedAddress = encodeURIComponent(fullAddress);
  const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`;

  const headers = {
    'User-Agent': 'DNY.ai LocationGeocoder/1.0',
  };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data) && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This API route is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { locations } = await request.json();

    if (!Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Invalid request: locations must be an array' },
        { status: 400 }
      );
    }

    // Create a streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const results: GeocodedLocation[] = [];

        try {
          // Send initial progress
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'start',
                total: locations.length,
              })}\n\n`
            )
          );

          // Process locations with rate limiting
          for (let i = 0; i < locations.length; i++) {
            const location = locations[i];

            // Skip online/virtual events
            if (isOnlineLocation(location.locationName, location.address, location.cityName)) {
              const result: GeocodedLocation = {
                ...location,
                latitude: null,
                longitude: null,
                geocoded: false,
                skipped: true,
                error: 'Skipped: Online/Virtual event',
              };
              results.push(result);

              // Send progress update
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: 'progress',
                    current: i + 1,
                    total: locations.length,
                    location: result,
                    successful: results.filter((r) => r.geocoded).length,
                    failed: results.filter((r) => !r.geocoded && !r.skipped).length,
                    skipped: results.filter((r) => r.skipped).length,
                  })}\n\n`
                )
              );
              continue;
            }

            const coords = await geocodeAddress(location.address, location.cityName);

            let result: GeocodedLocation;

            if (coords) {
              result = {
                ...location,
                latitude: coords.latitude,
                longitude: coords.longitude,
                geocoded: true,
              };
            } else {
              result = {
                ...location,
                latitude: null,
                longitude: null,
                geocoded: false,
                error: 'Could not geocode address',
              };
            }

            results.push(result);

            // Send progress update
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: 'progress',
                  current: i + 1,
                  total: locations.length,
                  location: result,
                  successful: results.filter((r) => r.geocoded).length,
                  failed: results.filter((r) => !r.geocoded && !r.skipped).length,
                  skipped: results.filter((r) => r.skipped).length,
                })}\n\n`
              )
            );

            // Rate limiting: 2 requests per second (faster than recommended 1/sec, use with caution)
            if (i < locations.length - 1) {
              await delay(500);
            }
          }

          // Send completion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'complete',
                results,
                total: locations.length,
                successful: results.filter((r) => r.geocoded).length,
                failed: results.filter((r) => !r.geocoded && !r.skipped).length,
                skipped: results.filter((r) => r.skipped).length,
              })}\n\n`
            )
          );

          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
              })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
