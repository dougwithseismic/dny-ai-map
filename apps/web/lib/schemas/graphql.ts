import { z } from "zod";

// Base schemas - defined with explicit typing to avoid circular reference issues
export const citySchema: z.ZodType<any> = z.object({
  id: z.string(),
  name: z.string().nullable(),
  coordinates: z.string().nullable(),
  locations: z.lazy(() => z.array(locationSchema).nullable()),
});

export const locationSchema: z.ZodType<any> = z.object({
  id: z.string(),
  name: z.string().nullable(),
  address: z.string().nullable(),
  city: z.lazy(() => citySchema.nullable()),
});

export const eventCategorySchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

export const eventTargetSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  color: z.string().nullable(),
});

export const eventFormatSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});

export const socialNetworkSchema = z.object({
  link: z.string().nullable(),
  type: z.string().nullable(),
});

export const organiserSchema = z.object({
  id: z.string().nullable(),
  name: z.string().nullable(),
  map_link: z.string().nullable(),
  social_networks: z.array(socialNetworkSchema).nullable(),
});

export const partnerRoleSchema = z.object({
  id: z.number().nullable(),
  label: z.string().nullable(),
});

export const responsiveImageSchema = z.object({
  url: z.string().nullable(),
  size: z.string().nullable(),
});

export const mediaSchema = z.object({
  original_url: z.string().nullable(),
  preview_url: z.string().nullable(),
  responsive_images: z.array(responsiveImageSchema).nullable(),
});

export const partnerSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  link: z.string().nullable(),
  type: partnerRoleSchema.nullable(),
  hero: z.array(mediaSchema).nullable(),
  size: z.number().nullable(),
});

export const promoterSchema = z.object({
  name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
});

export const programSchema = z.object({
  anchor: z.string().nullable(),
  name: z.string().nullable(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  speaker: z.string().nullable(),
  content: z.string().nullable(),
});

export const eventSchema = z.object({
  id: z.string(),
  eventCategory: eventCategorySchema.nullable(),
  organisers: z.array(organiserSchema).nullable(),
  location: locationSchema.nullable(),
  name: z.string().nullable(),
  slug: z.string().nullable(),
  term: z.string().nullable(), // Date scalar as ISO string
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  content: z.string().nullable(),
  price: z.number().nullable(),
  maxPrice: z.number().nullable(),
  attend: z.number().nullable(),
  registration_link: z.string().nullable(),
  languages: z.array(z.string()).nullable(),
  targets: z.array(eventTargetSchema).nullable(),
  formats: z.array(eventFormatSchema).nullable(),
  tags: z.array(z.string()).nullable(),
  partners: z.array(partnerSchema).nullable(),
  program: z.array(programSchema).nullable(),
  categories: z.array(eventCategorySchema).nullable(),
  promoters: z.array(promoterSchema).nullable(),
});

// Query input schemas
export const eventsQueryVariablesSchema = z.object({
  cities: z.array(z.string()).optional(),
  dates: z.array(z.string()).optional(),
  topic: z.array(z.string()).optional(),
  targets: z.array(z.string()).optional(),
  formats: z.array(z.string()).optional(),
  year: z.array(z.string()).optional(),
});

export const eventBySlugQueryVariablesSchema = z.object({
  slug: z.string(),
});

// Query response schemas
export const eventsQuerySchema = z.object({
  events: z.array(eventSchema).nullable(),
});

export const citiesQuerySchema = z.object({
  cities: z.array(citySchema),
});

export const eventTargetsQuerySchema = z.object({
  eventTargets: z.array(eventTargetSchema).nullable(),
});

export const eventFormatsQuerySchema = z.object({
  eventFormats: z.array(eventFormatSchema).nullable(),
});

export const eventBySlugQuerySchema = z.object({
  eventBySlug: eventSchema.nullable(),
});

// Export types inferred from schemas
export type City = z.infer<typeof citySchema>;
export type Location = z.infer<typeof locationSchema>;
export type EventCategory = z.infer<typeof eventCategorySchema>;
export type EventTarget = z.infer<typeof eventTargetSchema>;
export type EventFormat = z.infer<typeof eventFormatSchema>;
export type Event = z.infer<typeof eventSchema>;
export type EventsQueryVariables = z.infer<typeof eventsQueryVariablesSchema>;
