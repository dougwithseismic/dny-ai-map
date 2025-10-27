#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

// Load existing locations with coordinates
const existingLocations = JSON.parse(
  readFileSync('lib/locations/locations-with-coordinates.json', 'utf-8')
);

// Load new locations to geocode
const newLocations = JSON.parse(
  readFileSync('/tmp/missing-locations-to-geocode.json', 'utf-8')
);

// Create a map of existing location IDs
const existingIds = new Set(existingLocations.map(loc => loc.locationId));

// Filter to only truly new locations
const locationsToGeocode = newLocations.filter(
  loc => !existingIds.has(loc.locationId)
);

console.log(`📊 Summary:`);
console.log(`   Existing locations: ${existingLocations.length}`);
console.log(`   New locations from CSV: ${newLocations.length}`);
console.log(`   Already have coordinates: ${newLocations.length - locationsToGeocode.length}`);
console.log(`   Need geocoding: ${locationsToGeocode.length}`);

// Save the locations that need geocoding
writeFileSync(
  '/tmp/locations-need-geocoding.json',
  JSON.stringify(locationsToGeocode, null, 2),
  'utf-8'
);

console.log(`\n✅ Saved ${locationsToGeocode.length} locations to geocode`);
console.log(`📁 Output: /tmp/locations-need-geocoding.json`);
console.log(`\n💡 Next: Run geocoding script on this file`);
