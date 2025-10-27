# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js 16** application (React 19) built as part of a Turborepo monorepo. It's an event discovery platform for Belgium that uses GraphQL for data fetching, shadcn/ui for components, and MapLibre for maps. The codebase includes custom translation and geocoding utilities for handling Czech-to-English translations and location coordinates.

## Development Commands

```bash
# Start development server on port 3000
pnpm dev

# Build the application
pnpm build

# Run production build
pnpm start

# Lint (ESLint with max 0 warnings)
pnpm lint

# Type checking (generates Next.js types first)
pnpm check-types

# Clean build artifacts and cache
pnpm clean

# Geocode locations from JSON file
pnpm geocode <input-file.json>

# Import coordinates to database
pnpm import-coords
```

## Monorepo Context

This is the `web` app in a Turborepo monorepo managed with **pnpm**. Key dependencies:
- `@repo/ui`: Shared React component library
- `@repo/eslint-config`: Shared ESLint configuration
- `@repo/typescript-config`: Shared TypeScript configuration

When working across packages, use Turbo filters:
```bash
# Run commands from monorepo root
turbo dev --filter=web
turbo build --filter=web
```

## Architecture

### Data Fetching

**URQL (GraphQL Client)**: All data fetching uses URQL with SSR support via `urqlClient` from `lib/urql/client.ts`.

- **GraphQL Backend**: `https://be.dny.ai/graphql` (configurable via `GRAPHQL_BACKEND_URL`)
- **Query Definitions**: `lib/graphql/queries.ts` contains fragments and queries
- **Custom Hooks**: `lib/graphql/hooks.ts` provides typed query/mutation hooks
- **Request Policy**: `cache-and-network` for optimal UX with cache-first, then refetch

**Provider Setup**: `UrqlProvider` wraps the app in `app/layout.tsx` with SSR cache exchange.

### State Management

1. **EventsContext** (`lib/contexts/events-context.tsx`):
   - Manages event filters (cities, dates, topics, targets, formats, years)
   - Syncs filters with URL search params bidirectionally
   - Use `useEventsFilters()` hook to access/update filters

2. **Wishlist Store** (`lib/stores/wishlist-store.ts`):
   - Zustand store with localStorage persistence
   - Manages saved events (add, remove, toggle, check if saved)
   - Storage key: `dny-ai-wishlist`

### Translation System

**Czech-to-English Auto-Translation**: The app receives Czech terms from the GraphQL API and displays them in English.

- **Main Dictionary**: `lib/translations/czech-to-english.ts` - manual translations
- **Auto Translation**: `lib/translations/auto-translate.ts` - uses Google Translate API for fallback
- **Hook**: `useTranslations()` from `hooks/use-translations.ts`
- **Missing Collection**: In development, missing translations are tracked and can be exported via the **Translation Collector Widget** (orange 🌍 button)

**Usage Pattern**:
```typescript
const { translateLanguage, translateTarget, translateFormat } = useTranslations();
// Keep Czech values for API, display English in UI
<Badge>{translateLanguage('cestina')}</Badge> // Shows: "Czech"
```

**See**: `lib/translations/README.md` for complete documentation on adding translations.

### Geocoding System

**Location Coordinates**: MapLibre maps require lat/long coordinates that may be missing from the database.

- **Missing Locations Collector**: `lib/locations/missing-locations-collector.ts` tracks locations without coordinates
- **Geocoding Script**: `scripts/geocode-locations.ts` uses OpenStreetMap Nominatim API (rate-limited to 1 req/sec)
- **Development Widget**: **Missing Locations Widget** (bottom-left) provides one-click geocoding with "Geocode All" button

**Workflow**: Widget appears → Click "Geocode All" → Downloads `locations-with-coordinates.json` → Import to database

**See**: `scripts/README.md` for complete geocoding documentation.

### UI Components

**shadcn/ui**: Component library based on Radix UI with Tailwind CSS styling.

- **Config**: `components.json` (New York style, neutral base color, CSS variables)
- **Components**: `components/ui/` (50+ components: buttons, forms, dialogs, charts, etc.)
- **Custom Components**:
  - `components/app-sidebar.tsx` - Main navigation sidebar
  - `components/app-shell.tsx` - Layout wrapper with sidebar
  - `components/events/` - Event-specific components (cards, maps, filters)
  - `components/wishlist/` - Wishlist calendar and sidebar
  - `components/dev/` - Development widgets (translations, geocoding)

### Routing & Pages

**Next.js App Router**:
- `app/page.tsx` - Home page (events listing)
- `app/[slug]/page.tsx` - Event detail pages (dynamic)
- `app/api/graphql/route.ts` - GraphQL proxy endpoint
- `app/api/translate/route.ts` - Translation API endpoint
- `app/api/dev/geocode-locations/route.ts` - Development geocoding API

### Maps

**MapLibre GL**: Open-source map rendering for event locations.

- **Component**: `components/events/events-map.tsx`
- **Detail Map**: `components/events/event-detail-map.tsx`
- **Coordinates Mapping**: `lib/locations/coordinates-mapping.ts` provides hardcoded fallback coordinates
- **Location Utils**: `lib/locations/location-utils.ts` for coordinate extraction and validation

## TypeScript Configuration

- **Extends**: `@repo/typescript-config/nextjs.json` (shared config)
- **Path Alias**: `@/*` maps to root directory (e.g., `@/components`, `@/lib`)
- **Strict Mode**: Enabled via shared config

## Important Patterns

### Filters & URL Syncing

Filters are always synced with URL search params:
```typescript
// Update filters (automatically updates URL)
updateFilters({ cities: ['brussels'] });

// Filters are available in EventsContext
const { filters, updateFilters, clearFilters } = useEventsFilters();
```

**Utility Functions**: `lib/utils/url-params.ts` handles conversion between `URLSearchParams` and `EventsQueryVariables`.

### GraphQL Query Variables

All event queries use `EventsQueryVariables` type from `lib/types/graphql.ts`:
```typescript
{
  cities?: string[];
  dates?: string[];
  topic?: string[];
  targets?: string[];
  formats?: string[];
  year?: string[];
}
```

### Event Export

**Export to iCal**: `lib/utils/export-events.ts` provides `.ics` file generation for calendar imports.

### SEO & Metadata

- **JSON-LD**: `lib/seo/json-ld.ts` generates structured data for Organization and WebSite schemas
- **Metadata**: Static metadata in `app/layout.tsx` with OpenGraph and Twitter cards

## Environment Variables

```bash
# GraphQL backend (defaults to https://be.dny.ai/graphql)
GRAPHQL_BACKEND_URL=https://be.dny.ai/graphql

# Next.js will detect NODE_ENV automatically
NODE_ENV=development  # or production
```

## Development Features

**Only in Development** (`NODE_ENV !== 'production'`):

1. **Translation Collector Widget** - Tracks and exports missing translations
2. **Missing Locations Widget** - Geocodes locations without coordinates
3. Console warnings for missing translations
4. Development-only API routes in `app/api/dev/`

## Testing & Type Checking

```bash
# Type checking includes Next.js type generation
pnpm check-types  # Runs: next typegen && tsc --noEmit

# Linting enforces zero warnings
pnpm lint  # Runs: eslint --max-warnings 0
```

## Scripts & Utilities

### Geocoding Script

```bash
# Basic usage
pnpm geocode missing-locations.json

# Creates: locations-with-coordinates.json
```

**Features**:
- Rate-limited to 1 request/second (OpenStreetMap compliance)
- Saves progress every 10 locations
- Skips locations with existing coordinates
- Detailed console output with progress

### Coordinate Import Script

```bash
pnpm import-coords
```

Imports coordinates from `locations-with-coordinates.json` to database (implementation in `scripts/import-coordinates.ts`).

## Key Libraries & Versions

- **Next.js**: 16.0.0 (App Router, React Server Components)
- **React**: 19.2.0
- **URQL**: 5.0.1 (GraphQL client with SSR)
- **Zustand**: 5.0.8 (state management)
- **Zod**: 4.1.12 (schema validation)
- **Radix UI**: Latest (headless components)
- **Tailwind CSS**: 4.1.16 (with PostCSS)
- **MapLibre GL**: 5.10.0 (open-source maps)
- **date-fns**: 4.1.0 (date utilities)
- **AI SDK**: 6.0.0-beta.73 (Vercel AI SDK)

## Common Tasks

### Adding a New Translation

1. Use app in dev mode to collect missing translations
2. Click orange 🌍 button → Download `.ts` file
3. Add translations to `lib/translations/czech-to-english.ts`
4. Clear collection: `__translations.clear()` in console

### Adding a New Event Filter

1. Update `EventsQueryVariables` type in `lib/types/graphql.ts`
2. Update GraphQL query in `lib/graphql/queries.ts`
3. Update URL param conversion in `lib/utils/url-params.ts`
4. Add filter UI in `components/events/event-filters.tsx`

### Geocoding Locations

1. Navigate to page with map (triggers missing location detection)
2. Widget appears with "Geocode All" button
3. Click button → wait for geocoding → downloads JSON
4. Import to database using `pnpm import-coords` or custom SQL

## Notes

- The app uses **pnpm** (v9.0.0) as package manager - always use `pnpm` not `npm` or `yarn`
- Requires **Node.js >= 18**
- The monorepo uses Turbo for build orchestration with caching
- GraphQL queries return Czech terms - always use translation functions for display
- Maps require coordinates - use geocoding system for missing locations
