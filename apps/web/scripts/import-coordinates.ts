#!/usr/bin/env tsx
/**
 * Import Geocoded Coordinates
 * ===========================
 * Imports coordinates from locations-with-coordinates.json into the database
 *
 * Usage:
 *   npm run import-coords locations-with-coordinates.json
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --graphql    Generate GraphQL mutations (default)
 *   --sql        Generate SQL UPDATE statements
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

interface GeocodedLocation {
  locationId: string;
  locationName: string | null;
  address: string | null;
  cityName: string | null;
  latitude: number | null;
  longitude: number | null;
  geocoded: boolean;
  count?: number;
  firstSeen?: string;
  error?: string;
}

function generateGraphQLMutations(locations: GeocodedLocation[]) {
  const successful = locations.filter((loc) => loc.geocoded && loc.latitude && loc.longitude);

  console.log('\n📝 GraphQL Mutations\n');
  console.log('Copy and paste these into your GraphQL playground or backend:\n');
  console.log('mutation UpdateLocationCoordinates {');

  successful.forEach((loc, index) => {
    console.log(`  updateLocation${index}: updateLocation(
    id: "${loc.locationId}"
    data: {
      latitude: ${loc.latitude}
      longitude: ${loc.longitude}
    }
  ) {
    id
    name
    latitude
    longitude
  }`);
  });

  console.log('}\n');

  console.log(`\n✅ Generated ${successful.length} mutations`);
}

function generateSQLStatements(locations: GeocodedLocation[]) {
  const successful = locations.filter((loc) => loc.geocoded && loc.latitude && loc.longitude);

  console.log('\n📝 SQL UPDATE Statements\n');
  console.log('-- Run these in your database client:\n');
  console.log('BEGIN;\n');

  successful.forEach((loc) => {
    console.log(`UPDATE locations
SET
  latitude = ${loc.latitude},
  longitude = ${loc.longitude},
  updated_at = NOW()
WHERE id = '${loc.locationId}';
`);
  });

  console.log('COMMIT;\n');

  console.log(`\n✅ Generated ${successful.length} SQL statements`);
}

function generateJSONPatch(locations: GeocodedLocation[]) {
  const successful = locations.filter((loc) => loc.geocoded && loc.latitude && loc.longitude);

  const updates = successful.map((loc) => ({
    id: loc.locationId,
    latitude: loc.latitude,
    longitude: loc.longitude,
  }));

  console.log('\n📝 JSON Batch Update Format\n');
  console.log('Use this with your backend API:\n');
  console.log(JSON.stringify(updates, null, 2));

  console.log(`\n✅ Generated ${successful.length} updates`);
}

function showStatistics(locations: GeocodedLocation[]) {
  const total = locations.length;
  const successful = locations.filter((loc) => loc.geocoded).length;
  const failed = locations.filter((loc) => !loc.geocoded).length;
  const withCoords = locations.filter((loc) => loc.latitude && loc.longitude).length;

  console.log('\n📊 Import Statistics\n');
  console.log(`Total locations:        ${total}`);
  console.log(`✓ Successfully geocoded: ${successful}`);
  console.log(`✗ Failed geocoding:      ${failed}`);
  console.log(`📍 Ready to import:      ${withCoords}\n`);

  if (failed > 0) {
    console.log('❌ Failed locations:\n');
    locations
      .filter((loc) => !loc.geocoded)
      .forEach((loc) => {
        console.log(`  - ${loc.locationName || 'Unnamed'} (${loc.cityName || 'No city'})`);
        console.log(`    ${loc.address || 'No address'}`);
      });
    console.log();
  }
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
  const flags = process.argv.slice(2).filter((arg) => arg.startsWith('--'));

  const dryRun = flags.includes('--dry-run');
  const format = flags.includes('--sql')
    ? 'sql'
    : flags.includes('--json')
    ? 'json'
    : 'graphql';

  if (args.length < 1) {
    console.error('Usage: npm run import-coords <input_file.json> [--dry-run] [--graphql|--sql|--json]');
    console.error('Example: npm run import-coords locations-with-coordinates.json --dry-run');
    process.exit(1);
  }

  const inputFileName = args[0]!; // Safe after length check
  const inputFile = resolve(process.cwd(), inputFileName);

  console.log(`\n📍 Loading ${inputFile}...`);

  let locations: GeocodedLocation[];
  try {
    const fileContent = readFileSync(inputFile, 'utf-8');
    locations = JSON.parse(fileContent);
  } catch (error) {
    console.error(`❌ Failed to read input file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }

  showStatistics(locations);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  switch (format) {
    case 'sql':
      generateSQLStatements(locations);
      break;
    case 'json':
      generateJSONPatch(locations);
      break;
    case 'graphql':
    default:
      generateGraphQLMutations(locations);
      break;
  }

  console.log('\n💡 Next Steps:\n');
  console.log('1. Review the generated statements/mutations above');
  console.log('2. Test with a single location first');
  console.log('3. Run the full import via your backend or database client');
  console.log('4. Verify the coordinates appear correctly on your map\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
