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
