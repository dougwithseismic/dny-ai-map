#!/usr/bin/env tsx
/**
 * Geocoding Script for Locations
 * ==============================
 * Adds coordinates to locations using OpenStreetMap Nominatim API
 *
 * Usage:
 *   npm run geocode missing-locations.json
 *
 * This will create: locations-with-coordinates.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface Location {
  locationId: string;
  locationName: string | null;
  address: string | null;
  cityName: string | null;
  count?: number;
  firstSeen?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function geocodeAddress(
  address: string | null,
  city: string | null,
  country: string = 'Czech Republic'
): Promise<GeocodingResult | null> {
  if (!address || !city) {
    console.log('  ⚠️  Missing address or city');
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
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data && Array.isArray(data) && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    } else {
      console.log(`  ⚠️  No results for: ${fullAddress}`);
      return null;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: npm run geocode <input_file.json>');
    console.error('Example: npm run geocode missing-locations.json');
    process.exit(1);
  }

  const inputFileName = args[0]!; // Safe after length check
  const inputFile = resolve(process.cwd(), inputFileName);
  const outputFile = resolve(
    process.cwd(),
    'locations-with-coordinates.json'
  );
  const progressFile = resolve(
    process.cwd(),
    'locations-with-coordinates-progress.json'
  );

  console.log(`\n📍 Loading ${inputFile}...`);

  let locations: Location[];
  try {
    const fileContent = readFileSync(inputFile, 'utf-8');
    locations = JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Failed to read input file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }

  console.log(
    `\n🚀 Starting geocoding for ${locations.length} locations...`
  );
  console.log(
    `⏱️  This will take approximately ${(locations.length * 0.5 / 60).toFixed(1)} minutes.\n`
  );

  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < locations.length; i++) {
    const location = locations[i];
    if (!location) continue;

    const locationName = location.locationName || 'Unnamed Location';
    const address = location.address;
    const city = location.cityName;

    console.log(`[${i + 1}/${locations.length}] ${locationName} (${city || 'No city'})`);

    // Skip if already has coordinates
    if (location.latitude && location.longitude) {
      console.log('  ⏭️  Already has coordinates, skipping');
      skippedCount++;
    } else {
      // Get coordinates
      const coords = await geocodeAddress(address, city);

      if (coords) {
        location.latitude = coords.latitude;
        location.longitude = coords.longitude;
        console.log(`  ✓ ${coords.latitude}, ${coords.longitude}`);
        successCount++;
      } else {
        location.latitude = null;
        location.longitude = null;
        failedCount++;
      }
    }

    // Save progress every 10 locations
    if ((i + 1) % 10 === 0) {
      writeFileSync(progressFile, JSON.stringify(locations, null, 2), 'utf-8');
      console.log(`  💾 Progress saved (${i + 1}/${locations.length})\n`);
    }

    // Rate limiting: 2 requests per second (faster than recommended 1/sec, use with caution)
    if (i < locations.length - 1 && !location.latitude) {
      await delay(500);
    }
  }

  // Save the final results
  writeFileSync(outputFile, JSON.stringify(locations, null, 2), 'utf-8');

  console.log('\n' + '='.repeat(60));
  console.log('✅ Geocoding complete!');
  console.log(`  ✓ Successful: ${successCount}`);
  console.log(`  ⏭️  Skipped (already had coords): ${skippedCount}`);
  console.log(`  ✗ Failed: ${failedCount}`);
  console.log(`  📁 Output saved to: ${outputFile}`);
  console.log('='.repeat(60) + '\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
