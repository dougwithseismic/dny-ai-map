# ID.AI White Dot - Event Discovery Platform

## The Problem

ID.AI White Dot is a two-week festival of AI talks spanning across the Czech Republic, featuring meetups, conferences, workshops, and lectures. The original site, built by Brainz Studios in Czech Republic, is beautifully designed and visually impressive. However, it presents several functional challenges:

### Key Pain Points
- **Language Barrier**: No language filtering for English speakers
- **Navigation**: Missing map visualization for event locations
- **User Features**: No wishlist or event tracking capabilities
- **Analytics**: Limited user interaction tracking and registration analytics
- **Discovery**: Difficult to find relevant events based on preferences

## The Solution

Built in a single morning (8:00 AM - 10:37 AM), this platform reimagines the event discovery experience with practical functionality while maintaining the visual appeal of the original.

## Technical Architecture

### 1. GraphQL Integration & Dual-Layer Caching

The original site uses a GraphQL endpoint which we introspected to pull complete event data. This allows us to:
- Access all event information in real-time
- Query with filters and parameters
- Build our own interface on top of existing data

#### Performance Architecture: Dual-Layer Cache

To achieve extremely fast results, we implemented a sophisticated two-tier caching strategy that sits between users and the backend API:

**Architecture Flow:**
```
User Browser → URQL Cache → Next.js API Proxy → Next.js Data Cache → Backend GraphQL API
```

**Layer 1: Client-Side (URQL)**
- Location: `lib/urql/provider.tsx`
- Strategy: `cache-first` policy
- Purpose: Instant UI responses with zero network latency
- Benefit: Navigation between pages feels immediate, deduplicates requests within user sessions

**Layer 2: Server-Side (Next.js Data Cache)**
- Location: `app/api/graphql/route.ts`
- Strategy: `force-cache` with 5-minute revalidation
- Purpose: Shared cache across all users, dramatically reduces backend load
- Benefit: First user pays the cost (~500ms), subsequent users get responses in ~50-100ms

**Why Both Layers?**

The dual-layer approach provides multiple benefits:
1. **Speed**: Cold URQL cache still gets data from Next.js cache (~50-100ms vs. ~500ms from backend)
2. **Scalability**: Backend only hit once every 5 minutes per operation, regardless of user count
3. **Reliability**: If one cache layer fails, the other provides fallback
4. **User Experience**: Navigation feels instant, filters apply immediately

**Smart Caching Features:**
- **Tag-based invalidation**: Each GraphQL operation (`GetEvents`, `GetEventBySlug`, etc.) gets its own cache tag for selective updates
- **Operation tracking**: Automatic extraction of operation names from queries for observability
- **GET request support**: Enables HTTP-level caching and CDN optimization
- **Authorization passthrough**: Secure token forwarding without exposing backend URL

**Technical Implementation:**
```typescript
// Server-side cache with 5-minute TTL
fetch(backendUrl, {
  cache: "force-cache",
  next: {
    revalidate: 300,        // 5 minutes
    tags: [operationName]   // Per-operation tagging
  }
})
```

**Performance Monitoring:**
- Custom headers: `X-GraphQL-Operation`, `X-Response-Time`
- Comprehensive logging with operation names and duration tracking
- Enables performance debugging and optimization

This caching architecture is particularly effective for event data that changes infrequently but needs to feel instant. With ~247 events, the system delivers sub-100ms responses for most user interactions while protecting the backend from excessive load.

#### Technical Gotchas

**Backend Filter Implementation Gap**

Through introspection and testing of the GraphQL API (`https://be.dny.ai/graphql`), we discovered significant gaps in the backend's filter implementation:

**What Works (Backend Filtering):**
- ✅ `cities: [ID!]` - Properly implemented
- ✅ `dates: [String!]` - Properly implemented
- ✅ `topic: [ID!]` - Properly implemented
- ✅ `formats: [ID!]` - Properly implemented
- ✅ `year: [String!]` - Properly implemented

**What Doesn't Work:**
- ❌ `languages: [String!]` - **Parameter doesn't exist in backend schema**
  - Events have a `languages: [String]` field with data
  - Query accepts no language filtering parameter at all
  - Tested: Returns all 247 events regardless of language selection

- ❌ `targets: [ID!]` - **Parameter exists but doesn't filter**
  - Backend accepts the parameter in schema
  - Backend resolver doesn't implement the filtering logic
  - Tested: Returns all 247 events with or without `targets=[1]` filter

**Solution: Client-Side Filtering**

Location: `lib/graphql/hooks.ts` - `useFilteredEvents()` hook

```typescript
// Separate backend-supported from client-side filters
const { languages, targets, ...backendFilters } = variables;

// Fetch with only working filters
const [result] = useQuery({ variables: backendFilters });

// Apply client-side filtering for languages and targets
if (languages?.length > 0) {
  filtered = events.filter(event =>
    event.languages?.some(lang => languages.includes(lang))
  );
}

if (targets?.length > 0) {
  filtered = events.filter(event =>
    event.targets?.some(target => targets.includes(target.id))
  );
}
```

**Trade-offs:**
- ⚠️ Always fetches full event dataset (247 events ≈ bandwidth cost)
- ✅ Filters work reliably regardless of backend issues
- ✅ UI remains responsive with current event count (~247 events)
- ⚠️ Won't scale beyond ~1000 events without backend fixes

**Components Updated:**
- `app/page.tsx` - Uses `useFilteredEvents` instead of `useEvents`
- `components/app-sidebar.tsx` - Uses `useFilteredEvents` for event counts
- Both now properly filter by languages and target audiences

### 2. Translation Mapping System

**Challenge**: All data from the GraphQL endpoint comes in Czech, including:
- Event categories
- Venue locations
- Target audiences
- Event formats
- Filter options

**Solution**: Intelligent AI-powered translation mapping with automatic detection

#### Implementation Details
Location: `lib/translations/`
- `czech-to-english.ts` - Main translation dictionaries (~424 lines)
- `missing-collector.ts` - Automatic detection and export system
- `types.ts` - Type definitions

#### How It Works
1. **Dynamic Registry**: Started with empty mapping, now contains 400+ translations
2. **Auto-Detection**: Missing translations automatically collected during development
3. **Console Helper**: Browser console access via `__translations` object for debugging
4. **Export Options**: Download as TypeScript, JSON, or copy-paste format
5. **AI Translation**: Paste missing terms → AI translates → Copy back in ~10 seconds

#### Technical Gotchas

**1. Czech Accent Variations**
- Each word has multiple spellings: with accents (`angličtina`) and without (`anglictina`)
- Solution: Store ALL variants in dictionary
  ```typescript
  'english': 'English',
  'anglictina': 'English',  // no accent
  'angličtina': 'English',   // with accent
  'angličtina (tlumočení)': 'English (with interpretation)',
  ```

**2. Case-Insensitive Matching**
- Tries exact match first, then lowercase fallback
- Critical for handling user input vs. API data

**3. Language Variants for Filtering**
- `languageVariants` object groups all Czech variants under one English name
- Enables UI to show "English" but send all variants to API
  ```typescript
  'English': ['english', 'anglictina', 'angličtina', 'angličtina (tlumočení)']
  ```

**4. Reverse Translation**
- Need to convert English → Czech for GraphQL API queries
- `reverseTranslate()` function searches dictionaries backwards

**5. Development Tools**
- Browser console commands:
  - `__translations.getStats()` - View missing translation stats
  - `__translations.download()` - Export as .ts file
  - `__translations.export('copypaste')` - Get copy-paste format

### 3. Geocoding & Map Visualization

**Challenge**: Events need to be displayed on a map, but only venue names are provided

**Solution**: Automated location mapping pipeline with one-click UI

#### Implementation Details
Location: `scripts/geocode-locations.ts` (~173 lines)
- Uses OpenStreetMap Nominatim API (free)
- Integration with `lib/locations/missing-locations-collector.ts`
- MapLibre for map rendering

#### How It Works
1. **Missing Location Widget**: Appears in bottom-left during dev when locations lack coordinates
2. **One-Click Geocoding**: "Geocode All" button processes all missing locations
3. **Auto-Download**: Saves `locations-with-coordinates.json` when complete
4. **Database Import**: Update production database with geocoded results

#### Technical Gotchas

**1. API Rate Limiting**
```typescript
await delay(500); // 2 requests/second (pushing the 1 req/sec limit)
```
- OpenStreetMap Nominatim requires 1 req/sec minimum delay
- Script uses 500ms (2 req/sec) - use cautiously
- Time estimates: 10 locations ≈ 11 sec, 100 locations ≈ 2 min

**2. Progress Saving**
```typescript
if ((i + 1) % 10 === 0) {
  writeFileSync(progressFile, JSON.stringify(locations, null, 2));
}
```
- Saves progress every 10 locations to prevent data loss
- Creates `locations-with-coordinates-progress.json`

**3. Skip Already-Geocoded**
```typescript
if (location.latitude && location.longitude) {
  skippedCount++;
}
```
- Won't re-geocode locations that already have coordinates
- Enables incremental updates

**4. Address Construction**
```typescript
const fullAddress = `${address}, ${city}, Czech Republic`;
```
- Always appends "Czech Republic" for better geocoding accuracy
- Czech addresses can be ambiguous without country context

**5. User-Agent Header**
```typescript
'User-Agent': 'DNY.ai LocationGeocoder/1.0'
```
- Required by Nominatim API (rejects requests without it)
- Identifies the application for API usage tracking

#### Benefits
- Visual understanding of event distribution across Czech Republic
- Easy discovery of nearby events
- Shows "X / Y events mapped" counter on map
- Geographic filtering capabilities

## Features Delivered

### For Users
- ✅ Language filtering (Czech/English)
- ✅ Interactive map with event locations
- ✅ Event discovery and search
- ✅ Better UX for English speakers

### For Development
- ✅ Automated translation workflow
- ✅ Geocoding pipeline
- ✅ Scalable mapping registries
- ✅ AI-assisted content management

## Technical Stack

- **Data Source**: GraphQL API from original site
- **Translation**: AI-powered mapping system
- **Geocoding**: Automated location resolution
- **Mapping**: MapLibre
- **Timeline**: Built in ~2.5 hours

## Why This Matters

This project demonstrates how a well-designed but functionally limited site can be enhanced with practical features that improve user experience, especially for international audiences. By leveraging existing APIs and AI-assisted workflows, we can build meaningful improvements rapidly without compromising on quality.

The solution is built for users who want to:
- Attend AI events in Czech Republic
- Filter by language preference
- Visualize event locations
- Track events of interest
- Have a smooth discovery experience

## About the Builder

Built by **Doug**, an early-stage founder/engineer consultant originally from Bristol, UK, now based in Prague for the past 7-8 years.

With a background spanning growth, acquisition, automation, and technical marketing, Doug wanted to get more involved in the Prague development community. The ID.AI White Dot festival presented the perfect "builder's problem" - a real need that could be solved in a morning with practical engineering and AI-assisted workflows.

This project represents the intersection of community involvement, solving a personal pain point, and demonstrating what's possible when you combine existing APIs with intelligent tooling.

---

*Built with the goal of making AI events in Czech Republic accessible to everyone, regardless of language barriers.*
