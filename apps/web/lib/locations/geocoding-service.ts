/**
 * Runtime Geocoding Service
 * =========================
 * Geocodes city names on-the-fly using Nominatim API with rate limiting and caching
 */

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const RATE_LIMIT_MS = 1000; // 1 second between requests (Nominatim policy)
const CACHE_KEY = "dny-ai-geocoded-cities";
const CACHE_VERSION = "v1";

interface CachedCity {
  name: string;
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface GeocodeCache {
  version: string;
  cities: Record<string, CachedCity>;
}

/**
 * Load geocode cache from localStorage
 */
function loadCache(): GeocodeCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return { version: CACHE_VERSION, cities: {} };
    }
    const parsed = JSON.parse(cached) as GeocodeCache;
    // Check version compatibility
    if (parsed.version !== CACHE_VERSION) {
      return { version: CACHE_VERSION, cities: {} };
    }
    return parsed;
  } catch (error) {
    console.error("Error loading geocode cache:", error);
    return { version: CACHE_VERSION, cities: {} };
  }
}

/**
 * Save geocode cache to localStorage
 */
function saveCache(cache: GeocodeCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error("Error saving geocode cache:", error);
  }
}

/**
 * Normalize city name for cache key
 */
function normalizeCityName(cityName: string): string {
  return cityName.toLowerCase().trim();
}

/**
 * Geocode a single city using Nominatim API
 */
async function geocodeCityViaAPI(
  cityName: string,
  countryCode: string = "cz"
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const query = `${cityName}, Czech Republic`;
    const url = `${NOMINATIM_ENDPOINT}?q=${encodeURIComponent(
      query
    )}&format=json&limit=1&countrycodes=${countryCode}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "DNY.AI Events Platform (https://dny.ai)",
      },
    });

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      console.warn(`No results found for city: ${cityName}`);
      return null;
    }

    const result = data[0];
    const latitude = parseFloat(result.lat);
    const longitude = parseFloat(result.lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      console.error(`Invalid coordinates for ${cityName}:`, result);
      return null;
    }

    return { latitude, longitude };
  } catch (error) {
    console.error(`Error geocoding city ${cityName}:`, error);
    return null;
  }
}

/**
 * Get cached coordinates for a city
 */
export function getCachedCityCoordinates(
  cityName: string | null | undefined
): { latitude: number; longitude: number } | null {
  if (!cityName) return null;

  const cache = loadCache();
  const normalizedName = normalizeCityName(cityName);
  const cached = cache.cities[normalizedName];

  if (cached) {
    return {
      latitude: cached.latitude,
      longitude: cached.longitude,
    };
  }

  return null;
}

/**
 * Geocode multiple cities with rate limiting
 * Returns a map of city name -> coordinates
 */
export async function geocodeCities(
  cityNames: string[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<string, { latitude: number; longitude: number }>> {
  const cache = loadCache();
  const results = new Map<string, { latitude: number; longitude: number }>();
  const toGeocode: string[] = [];

  // Check cache first
  for (const cityName of cityNames) {
    const normalizedName = normalizeCityName(cityName);
    const cached = cache.cities[normalizedName];

    if (cached) {
      results.set(cityName, {
        latitude: cached.latitude,
        longitude: cached.longitude,
      });
    } else {
      toGeocode.push(cityName);
    }
  }

  // Geocode missing cities with rate limiting
  for (let i = 0; i < toGeocode.length; i++) {
    const cityName = toGeocode[i];
    if (!cityName) continue;

    if (onProgress) {
      onProgress(i + 1, toGeocode.length);
    }

    const coords = await geocodeCityViaAPI(cityName);
    if (coords) {
      results.set(cityName, coords);

      // Update cache
      const normalizedName = normalizeCityName(cityName);
      cache.cities[normalizedName] = {
        name: cityName,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: Date.now(),
      };
      saveCache(cache);
    }

    // Rate limiting: wait 1 second between requests
    if (i < toGeocode.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS));
    }
  }

  return results;
}

/**
 * Clear geocode cache
 */
export function clearGeocodeCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error("Error clearing geocode cache:", error);
  }
}
