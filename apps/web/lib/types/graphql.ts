// Generated TypeScript types from GraphQL schema

export interface City {
  id: string;
  name: string | null;
  coordinates: string | null;
  locations: Location[] | null;
}

export interface Location {
  id: string;
  name: string | null;
  address: string | null;
  city: City | null;
  latitude: number | null;
  longitude: number | null;
}

export interface EventCategory {
  id: string;
  name: string | null;
}

export interface EventTarget {
  id: string;
  name: string | null;
  color: string | null;
}

export interface EventFormat {
  id: string;
  name: string | null;
}

export interface Organiser {
  id: string | null;
  name: string | null;
  map_link: string | null;
  social_networks: SocialNetwork[] | null;
}

export interface SocialNetwork {
  link: string | null;
  type: string | null;
}

export interface Partner {
  id: string;
  name: string | null;
  link: string | null;
  type: PartnerRole | null;
  hero: Media[] | null;
  size: number | null;
}

export interface PartnerRole {
  id: number | null;
  label: string | null;
}

export interface Media {
  original_url: string | null;
  preview_url: string | null;
  responsive_images: ResponsiveImage[] | null;
}

export interface ResponsiveImage {
  url: string | null;
  size: string | null;
}

export interface Promoter {
  name: string | null;
  email: string | null;
  phone: string | null;
}

export interface Program {
  anchor: string | null;
  name: string | null;
  start_time: string | null;
  end_time: string | null;
  speaker: string | null;
  content: string | null;
}

export interface Event {
  id: string;
  eventCategory: EventCategory | null;
  organisers: Organiser[] | null;
  location: Location | null;
  name: string | null;
  slug: string | null;
  term: string | null; // Date scalar
  start_time: string | null;
  end_time: string | null;
  content: string | null;
  price: number | null;
  maxPrice: number | null;
  attend: number | null;
  registration_link: string | null;
  languages: string[] | null;
  targets: EventTarget[] | null;
  formats: EventFormat[] | null;
  tags: string[] | null;
  partners: Partner[] | null;
  program: Program[] | null;
  categories: EventCategory[] | null;
  promoters: Promoter[] | null;
}

// Query input types
export interface EventsQueryVariables {
  cities?: string[];
  dates?: string[];
  topic?: string[];
  targets?: string[];
  formats?: string[];
  year?: string[];
  languages?: string[];
  priceFilter?: "all" | "free" | "paid";
}

// Query response types
export interface EventsQuery {
  events: Event[] | null;
}

export interface CitiesQuery {
  cities: City[];
}

export interface EventTargetsQuery {
  eventTargets: EventTarget[] | null;
}

export interface EventFormatsQuery {
  eventFormats: EventFormat[] | null;
}

export interface EventBySlugQueryVariables {
  slug: string;
}

export interface EventBySlugQuery {
  eventBySlug: Event | null;
}
