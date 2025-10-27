# Czech to English Translation System

Automatic translation system that maps Czech terms from GraphQL API to English for UI display.

## Features

✅ **Automatic Collection**: Missing translations are automatically detected and collected during development
✅ **Type-Safe**: Full TypeScript support with proper types
✅ **Bi-directional**: Keep Czech values for API, display English in UI
✅ **Easy Export**: Export missing translations as TypeScript, JSON, or plain text
✅ **Development Widget**: Floating UI widget to view and export translations

## Quick Start

### Using Translations in Components

```tsx
import { useTranslations } from '@/hooks/use-translations';

function MyComponent() {
  const { translateLanguage, translateTarget, translateFormat } = useTranslations();

  return (
    <div>
      <Badge>{translateLanguage('cestina')}</Badge>  {/* Shows: Czech */}
      <Badge>{translateTarget('deti')}</Badge>      {/* Shows: Children */}
      <Badge>{translateFormat('prednaska')}</Badge> {/* Shows: Lecture */}
    </div>
  );
}
```

### Direct Function Usage

```tsx
import { translateLanguage } from '@/lib/translations/czech-to-english';

const englishLabel = translateLanguage('cestina'); // Returns: "Czech"
```

## Collecting Missing Translations

### Method 1: Visual Widget (Easiest)

1. Run your app in development mode: `npm run dev`
2. Navigate through your app to trigger all translations
3. Look for the orange 🌍 button in the bottom-right corner
4. Click it to open the Translation Collector Widget
5. Click **"Download .ts File"** to get a template file with all missing translations

### Method 2: Browser Console

Open your browser console and use these commands:

```javascript
// View all missing translations
__translations.getAll()

// View statistics
__translations.getStats()

// Log TypeScript template to console
__translations.export()

// Log copy-paste format
__translations.export('copypaste')

// Download as TypeScript file
__translations.download()

// Download as text file
__translations.download('copypaste')

// Clear collected data
__translations.clear()
```

## Adding Translations

### Step 1: Export Missing Translations

Use the widget or console commands to export missing translations.

### Step 2: Add to Dictionary

Open `lib/translations/czech-to-english.ts` and add translations:

```typescript
export const translations: TranslationConfig = {
  languages: {
    'cestina': 'Czech',
    'anglictina': 'English',
    // Add your new translations here:
    'nemcina': 'German',
  },

  targets: {
    'deti': 'Children',
    'rodiny': 'Families',
    // Add your new translations here:
    'studenti': 'Students',
  },

  formats: {
    'prednaska': 'Lecture',
    'workshop': 'Workshop',
    // Add your new translations here:
    'seminar': 'Seminar',
  },
};
```

## Translation Functions

### Specific Type Translations

```typescript
translateLanguage(term)   // For languages
translateTarget(term)      // For target audiences
translateFormat(term)      // For event formats
translateCategory(term)    // For categories
translateGeneral(term)     // For general terms
```

### Generic Translation

```typescript
translate(term)  // Tries all dictionaries
```

### Array Translation

```typescript
const { translateLanguages } = useTranslations();

const languages = ['cestina', 'anglictina'];
const translated = translateLanguages(languages);
// Returns: ['Czech', 'English']
```

## How It Works

1. **Czech Values for API**: When filtering events, the Czech value is sent to GraphQL
   ```typescript
   // Filter with Czech value (sent to API)
   { languages: ['cestina'] }
   ```

2. **English Display in UI**: The UI shows the translated English label
   ```tsx
   <Badge>{translateLanguage('cestina')}</Badge>
   // Displays: "Czech"
   ```

3. **Missing Terms Tracked**: Any untranslated term is logged and collected
   ```
   [Translation] Missing translation for: "nejakyterm"
   ```

4. **Easy Export**: Use the widget or console to export all missing terms

## Production Behavior

In production (`NODE_ENV=production`):
- ❌ No console warnings
- ❌ No collection of missing translations
- ❌ Widget is hidden
- ✅ Fallback to original term if translation missing
- ✅ Zero performance impact

## File Structure

```
lib/translations/
├── types.ts                  # TypeScript types
├── czech-to-english.ts       # Main translation dictionary
├── missing-collector.ts      # Collection system
└── README.md                 # This file

hooks/
└── use-translations.ts       # React hook

components/dev/
└── translation-collector-widget.tsx  # Dev UI widget
```

## Tips

1. **Add Common Terms First**: Focus on frequently-used terms (check the count in the widget)
2. **Group by Type**: Keep similar translations together in their respective sections
3. **Handle Accents**: Add both accented and non-accented versions:
   ```typescript
   'cestina': 'Czech',
   'čeština': 'Czech',  // With accent
   ```
4. **Case Variations**: The system handles lowercase matching automatically
5. **Clear Between Sessions**: Use `__translations.clear()` after adding translations

## Examples

### Complete Component Example

```tsx
import { useTranslations } from '@/hooks/use-translations';
import type { Event } from '@/lib/types/graphql';

export function EventCard({ event }: { event: Event }) {
  const { translateLanguage, translateTarget, translateFormat } = useTranslations();

  return (
    <Card>
      {/* Languages */}
      {event.languages?.map((lang) => (
        <Badge key={lang}>{translateLanguage(lang)}</Badge>
      ))}

      {/* Targets */}
      {event.targets?.map((target) => (
        <Badge key={target.id}>{translateTarget(target.name)}</Badge>
      ))}

      {/* Formats */}
      {event.formats?.map((format) => (
        <Badge key={format.id}>{translateFormat(format.name)}</Badge>
      ))}
    </Card>
  );
}
```

### Filter Example (Keep Czech for API)

```tsx
// Language options for MultiSelect
const languageOptions = useMemo(
  () => allLanguages.map((lang) => ({
    label: translateLanguage(lang),  // English display
    value: lang,                      // Czech value for API
  })),
  [allLanguages, translateLanguage]
);
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify the term exists in the translation dictionary
3. Check the exported file for missing translations
4. Make sure you're in development mode for debugging features
