import type { TranslationConfig, TranslationOptions } from './types';
import { missingTranslationsCollector } from './missing-collector';

// Czech to English translation dictionaries
export const translations: TranslationConfig = {
  // Language translations
  languages: {
    'cestina': 'Czech',
    'čeština': 'Czech',
    'english': 'English',
    'anglictina': 'English',
    'angličtina': 'English',
    'angličtina (tlumočení)': 'English (with interpretation)',
    'nemcina': 'German',
    'němčina': 'German',
    'francouztina': 'French',
    'francouzština': 'French',
    'spanelstina': 'Spanish',
    'španělština': 'Spanish',
    'italstina': 'Italian',
    'italština': 'Italian',
    'rustina': 'Russian',
    'ruština': 'Russian',
    'polstina': 'Polish',
    'polština': 'Polish',
    'slovenstina': 'Slovak',
    'slovenština': 'Slovak',
    'madarska': 'Hungarian',
    'maďarská': 'Hungarian',
    'rumunstina': 'Romanian',
    'rumunština': 'Romanian',
    'ukrainska': 'Ukrainian',
    'ukrajinská': 'Ukrainian',
  },

  // Target audience translations
  targets: {
    'deti': 'Children',
    'děti': 'Children',
    'rodiny': 'Families',
    'rodina': 'Family',
    'seniori': 'Seniors',
    'senioři': 'Seniors',
    'senior': 'Senior',
    'dospeli': 'Adults',
    'dospělí': 'Adults',
    'mladez': 'Youth',
    'mládež': 'Youth',
    'studenti': 'Students',
    'student': 'Student',
    'ucitele': 'Teachers',
    'učitelé': 'Teachers',
    'ucitel': 'Teacher',
    'učitel': 'Teacher',
    'zaci': 'Pupils',
    'žáci': 'Pupils',
    'zak': 'Pupil',
    'žák': 'Pupil',
    'verejnost': 'General Public',
    'veřejnost': 'General Public',
    'široká veřejnost': 'General Public',
    'odbornici': 'Professionals',
    'odborníci': 'Professionals',
    'odbornik': 'Professional',
    'odborník': 'Professional',
    'vzdelavani': 'Education',
    'vzdělávání': 'Education',
    'byznys': 'Business',
    'AI odborníci': 'AI Experts',
    'kreativci': 'Creatives',
    'akademici': 'Academics',
    'veřejná správa': 'Public Administration',
  },

  // Event format translations
  formats: {
    'prednaska': 'Lecture',
    'přednáška': 'Lecture',
    'workshop': 'Workshop',
    'seminar': 'Seminar',
    'seminář': 'Seminar',
    'konference': 'Conference',
    'festival': 'Festival',
    'vylet': 'Trip',
    'výlet': 'Trip',
    'exkurze': 'Excursion',
    'kurz': 'Course',
    'skoleni': 'Training',
    'školení': 'Training',
    'diskuze': 'Discussion',
    'debata': 'Debate',
    'beseda': 'Talk',
    'vystava': 'Exhibition',
    'výstava': 'Exhibition',
    'divadlo': 'Theater',
    'koncert': 'Concert',
    'promitani': 'Screening',
    'promítání': 'Screening',
    'projekce': 'Projection',
    'online': 'Online',
    'prezenčně': 'In-Person',
    'prezencne': 'In-Person',
    'hybridní': 'Hybrid',
    'hybridni': 'Hybrid',
    'jiné - ostatní': 'Other',
    'zabava': 'Entertainment',
    'zábava': 'Entertainment',
    'Google školení': 'Google Training',
    'meetup': 'Meetup',
    'veletrh': 'Fair',
    'kulatý stůl': 'Roundtable',
  },

  // Event category translations
  categories: {
    'kultura': 'Culture',
    'vzdelani': 'Education',
    'vzdělání': 'Education',
    'vzdelavani': 'Education',
    'vzdělávání': 'Education',
    'sport': 'Sport',
    'zdravi': 'Health',
    'zdraví': 'Health',
    'umeni': 'Art',
    'umění': 'Art',
    'veda': 'Science',
    'věda': 'Science',
    'technika': 'Technology',
    'technologie': 'Technology',
    'priroda': 'Nature',
    'příroda': 'Nature',
    'historie': 'History',
    'literatura': 'Literature',
    'hudba': 'Music',
    'film': 'Film',
    'divadlo': 'Theater',
    'tanec': 'Dance',
    'fotografie': 'Photography',
    'architektura': 'Architecture',
  },

  // City name translations
  cities: {
    // Major cities
    'Praha': 'Prague',
    'praha': 'Prague',
    'Brno': 'Brno',
    'brno': 'Brno',
    'Ostrava': 'Ostrava',
    'ostrava': 'Ostrava',
    'Plzeň': 'Pilsen',
    'plzeň': 'Pilsen',
    'Plzen': 'Pilsen',
    'plzen': 'Pilsen',
    'Liberec': 'Liberec',
    'liberec': 'Liberec',
    'Olomouc': 'Olomouc',
    'olomouc': 'Olomouc',
    'České Budějovice': 'České Budějovice',
    'české budějovice': 'České Budějovice',
    'ceske budejovice': 'České Budějovice',
    'Hradec Králové': 'Hradec Králové',
    'hradec králové': 'Hradec Králové',
    'hradec kralove': 'Hradec Králové',
    'Pardubice': 'Pardubice',
    'pardubice': 'Pardubice',
    'Ústí nad Labem': 'Ústí nad Labem',
    'ústí nad labem': 'Ústí nad Labem',
    'usti nad labem': 'Ústí nad Labem',
    'Zlín': 'Zlín',
    'zlín': 'Zlín',
    'zlin': 'Zlín',
    'Karlovy Vary': 'Karlovy Vary',
    'karlovy vary': 'Karlovy Vary',
    'Jihlava': 'Jihlava',
    'jihlava': 'Jihlava',

    // Medium cities
    'Žďár nad Sázavou': 'Žďár nad Sázavou',
    'žďár nad sázavou': 'Žďár nad Sázavou',
    'Přerov': 'Přerov',
    'přerov': 'Přerov',
    'Šumperk': 'Šumperk',
    'šumperk': 'Šumperk',
    'Jeseník': 'Jeseník',
    'jeseník': 'Jeseník',
    'jesenik': 'Jeseník',
    'Ústí nad Orlicí': 'Ústí nad Orlicí',
    'ústí nad orlicí': 'Ústí nad Orlicí',
    'usti nad orlici': 'Ústí nad Orlicí',
    'Hodonín': 'Hodonín',
    'hodonín': 'Hodonín',
    'hodonin': 'Hodonín',
    'Teplice': 'Teplice',
    'teplice': 'Teplice',
    'Kutná hora': 'Kutná Hora',
    'Kutná Hora': 'Kutná Hora',
    'kutná hora': 'Kutná Hora',
    'kutna hora': 'Kutná Hora',
    'Sokolov': 'Sokolov',
    'sokolov': 'Sokolov',
    'Valašské Klobouky': 'Valašské Klobouky',
    'valašské klobouky': 'Valašské Klobouky',
    'valaské klobouky': 'Valašské Klobouky',
    'Pelhřimov': 'Pelhřimov',
    'pelhřimov': 'Pelhřimov',
    'pelhrimov': 'Pelhřimov',
    'Havlíčkův Brod': 'Havlíčkův Brod',
    'havlíčkův brod': 'Havlíčkův Brod',
    'havlickuv brod': 'Havlíčkův Brod',
    'Ždírec nad Doubravou': 'Ždírec nad Doubravou',
    'ždírec nad doubravou': 'Ždírec nad Doubravou',
    'zdirec nad doubravou': 'Ždírec nad Doubravou',
    'Prostějov': 'Prostějov',
    'prostějov': 'Prostějov',
    'prostejov': 'Prostějov',
    'Mladá Boleslav': 'Mladá Boleslav',
    'mladá boleslav': 'Mladá Boleslav',
    'mlada boleslav': 'Mladá Boleslav',
    'Chodov': 'Chodov',
    'chodov': 'Chodov',
    'Cheb': 'Cheb',
    'cheb': 'Cheb',
    'Jičín': 'Jičín',
    'jičín': 'Jičín',
    'Jicin': 'Jičín',
    'jicin': 'Jičín',
    'Hanušovice': 'Hanušovice',
    'hanušovice': 'Hanušovice',
    'Hanusovice': 'Hanušovice',
    'hanusovice': 'Hanušovice',
    'Česká Třebová': 'Česká Třebová',
    'česká třebová': 'Česká Třebová',
    'Ceska Trebova': 'Česká Třebová',
    'ceska trebova': 'Česká Třebová',
    'Dolní Břežany': 'Dolní Břežany',
    'dolní břežany': 'Dolní Břežany',
    'Dolni Brezany': 'Dolní Břežany',
    'dolni brezany': 'Dolní Břežany',
  },

  // General terms
  general: {
    'zdarma': 'Free',
    'placeno': 'Paid',
    'placené': 'Paid',
    'potvrzeno': 'Confirmed',
    'zruseno': 'Cancelled',
    'zrušeno': 'Cancelled',
    'obsazeno': 'Full',
    'volna': 'Available',
    'volná': 'Available',
    'mista': 'Places',
    'místa': 'Places',
    'misto': 'Place',
    'místo': 'Place',
  },
};

// Default options for translation
const defaultOptions: TranslationOptions = {
  fallbackToOriginal: true,
  logMissing: process.env.NODE_ENV === 'development',
};

// Utility function to translate a term from a specific dictionary
function translateFromDictionary(
  term: string | null | undefined,
  dictionary: Record<string, string>,
  options: TranslationOptions = {},
  type: 'language' | 'target' | 'format' | 'category' | 'city' | 'general' | 'unknown' = 'unknown'
): string {
  if (!term) return '';

  const opts = { ...defaultOptions, ...options };
  const normalizedTerm = term.trim();

  // Try exact match first
  if (dictionary[normalizedTerm]) {
    return dictionary[normalizedTerm];
  }

  // Try lowercase match
  const lowerTerm = normalizedTerm.toLowerCase();
  if (dictionary[lowerTerm]) {
    return dictionary[lowerTerm];
  }

  // Log and collect missing translation in development
  if (opts.logMissing && process.env.NODE_ENV === 'development') {
    console.warn(`[Translation] Missing translation for: "${normalizedTerm}"`);
    missingTranslationsCollector.add(normalizedTerm, type);
  }

  // Return original if fallback is enabled
  return opts.fallbackToOriginal ? normalizedTerm : '';
}

// Specific translation functions for each type
export function translateLanguage(
  language: string | null | undefined,
  options?: TranslationOptions
): string {
  return translateFromDictionary(language, translations.languages, options, 'language');
}

export function translateTarget(
  target: string | null | undefined,
  options?: TranslationOptions
): string {
  return translateFromDictionary(target, translations.targets, options, 'target');
}

export function translateFormat(
  format: string | null | undefined,
  options?: TranslationOptions
): string {
  return translateFromDictionary(format, translations.formats, options, 'format');
}

export function translateCategory(
  category: string | null | undefined,
  options?: TranslationOptions
): string {
  return translateFromDictionary(category, translations.categories, options, 'category');
}

export function translateCity(
  city: string | null | undefined,
  options?: TranslationOptions
): string {
  return translateFromDictionary(city, translations.cities, options, 'city');
}

export function translateGeneral(
  term: string | null | undefined,
  options?: TranslationOptions
): string {
  return translateFromDictionary(term, translations.general, options, 'general');
}

// Generic translate function that tries all dictionaries
export function translate(
  term: string | null | undefined,
  options?: TranslationOptions
): string {
  if (!term) return '';

  // Try each dictionary in order
  const dictionaries = [
    translations.languages,
    translations.targets,
    translations.formats,
    translations.categories,
    translations.cities,
    translations.general,
  ];

  for (const dictionary of dictionaries) {
    const translated = translateFromDictionary(term, dictionary, {
      ...options,
      fallbackToOriginal: false,
      logMissing: false,
    }, 'unknown');
    if (translated) return translated;
  }

  // If no translation found, use default behavior
  return translateFromDictionary(term, {}, options, 'unknown');
}

// Helper to translate arrays
export function translateArray(
  terms: (string | null | undefined)[] | null | undefined,
  translateFn: (term: string | null | undefined, options?: TranslationOptions) => string,
  options?: TranslationOptions
): string[] {
  if (!terms) return [];
  return terms.map((term) => translateFn(term, options)).filter(Boolean);
}

// Reverse lookup: English to Czech (useful for API queries)
export function reverseTranslate(
  englishTerm: string | null | undefined,
  type: 'language' | 'target' | 'format' | 'category' | 'city' | 'general' = 'general'
): string {
  if (!englishTerm) return '';

  const dictionary = translations[`${type}s` as keyof TranslationConfig];
  const normalizedTerm = englishTerm.trim().toLowerCase();

  // Find the Czech key for the English value
  for (const [czechTerm, englishValue] of Object.entries(dictionary)) {
    if (englishValue.toLowerCase() === normalizedTerm) {
      return czechTerm;
    }
  }

  return englishTerm; // Return original if not found
}

// Language variants mapping - groups all variants of the same language together
// This is useful for UI filters where we want to show one option but send all variants to the API
export const languageVariants: Record<string, string[]> = {
  'English': ['english', 'anglictina', 'angličtina', 'angličtina (tlumočení)'],
  'Czech': ['cestina', 'čeština'],
  'German': ['nemcina', 'němčina'],
  'French': ['francouztina', 'francouzština'],
  'Spanish': ['spanelstina', 'španělština'],
  'Italian': ['italstina', 'italština'],
  'Russian': ['rustina', 'ruština'],
  'Polish': ['polstina', 'polština'],
  'Slovak': ['slovenstina', 'slovenština'],
  'Hungarian': ['madarska', 'maďarská'],
  'Romanian': ['rumunstina', 'rumunština'],
  'Ukrainian': ['ukrainska', 'ukrajinská'],
};

// Get all Czech variants for a given English language name
export function getLanguageVariants(englishName: string): string[] {
  return languageVariants[englishName] || [];
}

// Get unique languages from a list (merging variants)
// Returns a map of English name -> all Czech variants found
export function getUniqueLanguages(languages: string[]): Map<string, string[]> {
  const uniqueMap = new Map<string, string[]>();

  languages.forEach((lang) => {
    const englishName = translateLanguage(lang);

    if (!uniqueMap.has(englishName)) {
      uniqueMap.set(englishName, []);
    }

    const variants = uniqueMap.get(englishName);
    if (variants && !variants.includes(lang)) {
      variants.push(lang);
    }
  });

  return uniqueMap;
}
