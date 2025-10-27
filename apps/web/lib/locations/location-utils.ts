/**
 * Location Utilities
 * ==================
 * Helper functions for working with location data
 */

/**
 * Check if a location is online/virtual (no physical coordinates needed)
 */
export function isOnlineLocation(
  locationName: string | null | undefined,
  address: string | null | undefined,
  cityName: string | null | undefined
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

/**
 * Check if a location should be tracked as missing coordinates
 * Returns false for online events, true for physical locations
 */
export function shouldTrackMissingLocation(
  locationName: string | null | undefined,
  address: string | null | undefined,
  cityName: string | null | undefined
): boolean {
  return !isOnlineLocation(locationName, address, cityName);
}

/**
 * Parse city coordinates from string format
 * Expected formats: "50.0755,14.4378" or "50.0755, 14.4378"
 * Returns null if parsing fails
 */
export function parseCityCoordinates(
  coordinates: string | null | undefined
): { latitude: number; longitude: number } | null {
  if (!coordinates) return null;

  try {
    const parts = coordinates.split(',').map((part) => part.trim());
    if (parts.length !== 2) return null;

    const latStr = parts[0];
    const lngStr = parts[1];
    if (!latStr || !lngStr) return null;

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    if (isNaN(latitude) || isNaN(longitude)) return null;

    // Validate coordinates are within reasonable bounds
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return null;
    }

    return { latitude, longitude };
  } catch (error) {
    return null;
  }
}
