// Translation types for Czech to English mapping

export type TranslationType = 'language' | 'target' | 'format' | 'category' | 'city' | 'general';

export interface TranslationDictionary {
  [czechTerm: string]: string;
}

export interface TranslationConfig {
  languages: TranslationDictionary;
  targets: TranslationDictionary;
  formats: TranslationDictionary;
  categories: TranslationDictionary;
  cities: TranslationDictionary;
  general: TranslationDictionary;
}

export interface TranslationOptions {
  fallbackToOriginal?: boolean;
  logMissing?: boolean;
}
