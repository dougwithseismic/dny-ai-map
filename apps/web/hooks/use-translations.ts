import { useMemo } from 'react';
import {
  translate,
  translateLanguage,
  translateTarget,
  translateFormat,
  translateCategory,
  translateCity,
  translateGeneral,
  translateArray,
  reverseTranslate,
} from '@/lib/translations/czech-to-english';
import type { TranslationOptions } from '@/lib/translations/types';

/**
 * Hook for translating Czech terms to English
 * Provides memoized translation functions for use in React components
 */
export function useTranslations(options?: TranslationOptions) {
  // Memoize translation functions to prevent unnecessary re-renders
  const translationFunctions = useMemo(
    () => ({
      // Generic translation
      t: (term: string | null | undefined) => translate(term, options),

      // Specific translations
      translateLanguage: (term: string | null | undefined) =>
        translateLanguage(term, options),
      translateTarget: (term: string | null | undefined) =>
        translateTarget(term, options),
      translateFormat: (term: string | null | undefined) =>
        translateFormat(term, options),
      translateCategory: (term: string | null | undefined) =>
        translateCategory(term, options),
      translateCity: (term: string | null | undefined) =>
        translateCity(term, options),
      translateGeneral: (term: string | null | undefined) =>
        translateGeneral(term, options),

      // Array translations
      translateLanguages: (terms: (string | null | undefined)[] | null | undefined) =>
        translateArray(terms, translateLanguage, options),
      translateTargets: (terms: (string | null | undefined)[] | null | undefined) =>
        translateArray(terms, translateTarget, options),
      translateFormats: (terms: (string | null | undefined)[] | null | undefined) =>
        translateArray(terms, translateFormat, options),
      translateCategories: (terms: (string | null | undefined)[] | null | undefined) =>
        translateArray(terms, translateCategory, options),
      translateCities: (terms: (string | null | undefined)[] | null | undefined) =>
        translateArray(terms, translateCity, options),

      // Reverse translation (English to Czech)
      reverse: (englishTerm: string | null | undefined, type?: 'language' | 'target' | 'format' | 'category' | 'city' | 'general') =>
        reverseTranslate(englishTerm, type),
    }),
    [options]
  );

  return translationFunctions;
}
