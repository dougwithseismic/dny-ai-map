/**
 * Coordinates Mapping
 * ===================
 * Client-side mapping to supplement missing location coordinates
 * from geocoded data without requiring database updates
 */

import coordinatesData from './locations-with-coordinates.json';

interface CoordinatesMapping {
  [locationId: string]: {
    latitude: number;
    longitude: number;
  };
}

// Build a quick lookup map from the geocoded data
const coordinatesMap: CoordinatesMapping = coordinatesData.reduce(
  (acc, location) => {
    if (location.geocoded && location.latitude && location.longitude) {
      acc[location.locationId] = {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    }
    return acc;
  },
  {} as CoordinatesMapping
);

/**
 * Get coordinates for a location ID
 * Returns the geocoded coordinates if available, otherwise null
 */
export function getLocationCoordinates(locationId: string | number): {
  latitude: number;
  longitude: number;
} | null {
  const id = String(locationId);
  return coordinatesMap[id] || null;
}

/**
 * Enhance a location object with geocoded coordinates if missing
 * Mutates the location object in place
 */
export function enhanceLocationWithCoordinates<
  T extends { id: string | number; latitude?: number | null; longitude?: number | null }
>(location: T): T {
  // Only enhance if coordinates are missing
  if (location.latitude == null || location.longitude == null) {
    const coords = getLocationCoordinates(location.id);
    if (coords) {
      location.latitude = coords.latitude;
      location.longitude = coords.longitude;
    }
  }
  return location;
}

/**
 * Enhance an array of locations with geocoded coordinates
 * Returns a new array with enhanced locations
 */
export function enhanceLocationsWithCoordinates<
  T extends { id: string | number; latitude?: number | null; longitude?: number | null }
>(locations: T[]): T[] {
  return locations.map((location) => ({
    ...location,
    ...(() => {
      if (location.latitude == null || location.longitude == null) {
        const coords = getLocationCoordinates(location.id);
        if (coords) {
          return coords;
        }
      }
      return {};
    })(),
  }));
}

/**
 * Get statistics about the coordinates mapping
 */
export function getCoordinatesMappingStats() {
  return {
    totalLocations: Object.keys(coordinatesMap).length,
    locationIds: Object.keys(coordinatesMap),
  };
}

// Log stats in development
if (process.env.NODE_ENV === 'development') {
  const stats = getCoordinatesMappingStats();
  console.log(
    '%c📍 Coordinates Mapping Loaded',
    'background: #10b981; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;',
    `\n\n${stats.totalLocations} locations with geocoded coordinates available`
  );
}
