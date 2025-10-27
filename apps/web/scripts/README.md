# Scripts

This directory contains utility scripts for the project.

## Geocoding Script

The geocoding script adds latitude and longitude coordinates to locations using the OpenStreetMap Nominatim API.

### Quick Start (Recommended)

The easiest way to geocode locations is using the **one-click button** in the Missing Locations Widget:

1. Open your app in development mode (`npm run dev`)
2. The widget appears in the bottom-left corner when missing locations are detected
3. Click the **"Geocode All"** button
4. Wait while it processes (shows progress toast)
5. Automatically downloads `locations-with-coordinates.json` when complete

### Manual Usage (Alternative)

1. **Collect missing locations** during development using the Missing Locations Widget
2. **Export locations** as JSON (click the JSON download button in the widget)
3. **Run the geocoding script**:

```bash
npm run geocode missing-locations.json
```

This will create a new file: `locations-with-coordinates.json`

### Features

- ✅ Uses free OpenStreetMap Nominatim API
- ✅ Respects API rate limits (1 request per second)
- ✅ Saves progress every 10 locations
- ✅ Skips locations that already have coordinates
- ✅ Detailed console output with progress tracking

### Example Workflow

```bash
# 1. Start your dev server and collect locations
npm run dev

# 2. Download the JSON from the widget (bottom-left corner)
# The file will be saved as "missing-locations.json"

# 3. Run the geocoding script
npm run geocode missing-locations.json

# 4. Import the coordinates into your database
# You'll have locations-with-coordinates.json ready to use
```

### API Rate Limits

The script respects OpenStreetMap Nominatim's rate limit of 1 request per second. For large datasets:

- 10 locations ≈ 11 seconds
- 50 locations ≈ 55 seconds
- 100 locations ≈ 2 minutes

### Output Format

The output JSON maintains the same structure as your input, with added `latitude` and `longitude` fields:

```json
[
  {
    "locationId": "123",
    "locationName": "Example Venue",
    "address": "123 Main Street",
    "cityName": "Prague",
    "latitude": 50.0755,
    "longitude": 14.4378
  }
]
```

### MapLibre Integration

The geocoding system is already integrated with your EventsMap component:

1. **Automatic Detection**: When the map renders events, any location without coordinates is automatically tracked by the `missingLocationsCollector`
2. **One-Click Fix**: Click "Geocode All" in the widget to get coordinates for all missing locations
3. **Import to Database**: Use the downloaded `locations-with-coordinates.json` to update your database

Example database update query:

```sql
-- PostgreSQL example
UPDATE locations
SET
  latitude = geocoded.latitude,
  longitude = geocoded.longitude
FROM (
  -- Insert your JSON data here
  SELECT
    location_id::uuid,
    latitude::numeric,
    longitude::numeric
  FROM json_to_recordset('[your_json_here]')
  AS t(location_id text, latitude numeric, longitude numeric)
) AS geocoded
WHERE locations.id = geocoded.location_id
  AND geocoded.latitude IS NOT NULL
  AND geocoded.longitude IS NOT NULL;
```

### Complete Workflow Example

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to a page with the events map
# Example: /events or /wishlist

# 3. Widget appears automatically with missing locations

# 4. Click "Geocode All" button in the widget
# - Shows progress toast with estimated time
# - Geocodes all locations using OpenStreetMap
# - Automatically downloads locations-with-coordinates.json

# 5. Import the coordinates into your database
# Use your preferred method (SQL, Prisma, etc.)
```
