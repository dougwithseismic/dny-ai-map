#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const csvPath = process.argv[2];
const outputPath = process.argv[3] || 'missing-locations-to-geocode.json';

if (!csvPath) {
  console.error('Usage: node convert-csv-to-json.mjs <csv-file> [output-file]');
  process.exit(1);
}

const csv = readFileSync(csvPath, 'utf-8');
const lines = csv.split('\n').slice(1); // Skip header

const locations = lines
  .filter(line => line.trim())
  .map(line => {
    // Parse CSV with quoted fields
    const regex = /"([^"]*)","([^"]*)","([^"]*)","([^"]*)"/;
    const match = line.match(regex);

    if (match) {
      return {
        locationId: match[1],
        locationName: match[2],
        address: match[3],
        cityName: match[4]
      };
    }
    return null;
  })
  .filter(Boolean);

writeFileSync(outputPath, JSON.stringify(locations, null, 2), 'utf-8');

console.log(`✅ Converted ${locations.length} locations`);
console.log(`📁 Output: ${outputPath}`);
