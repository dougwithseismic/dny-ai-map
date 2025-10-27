// Fragment for event fields
export const EVENT_FIELDS = `
  id
  name
  slug
  term
  start_time
  end_time
  content
  price
  maxPrice
  attend
  registration_link
  languages
  tags
  location {
    id
    name
    address
    city {
      id
      name
      coordinates
    }
  }
  targets {
    id
    name
    color
  }
  formats {
    id
    name
  }
  categories {
    id
    name
  }
  organisers {
    id
    name
    map_link
    social_networks {
      link
      type
    }
  }
  partners {
    id
    name
    link
    hero {
      original_url
      preview_url
    }
  }
`;

// Get all events with optional filters
export const EVENTS_QUERY = `
  query GetEvents(
    $cities: [ID!]
    $dates: [String!]
    $topic: [ID!]
    $targets: [ID!]
    $formats: [ID!]
    $year: [String!]
  ) {
    events(
      cities: $cities
      dates: $dates
      topic: $topic
      targets: $targets
      formats: $formats
      year: $year
    ) {
      ${EVENT_FIELDS}
    }
  }
`;

// Get single event by slug
export const EVENT_BY_SLUG_QUERY = `
  query GetEventBySlug($slug: String!) {
    eventBySlug(slug: $slug) {
      ${EVENT_FIELDS}
      program {
        anchor
        name
        start_time
        end_time
        speaker
        content
      }
      promoters {
        name
        email
        phone
      }
    }
  }
`;

// Get all cities with locations
export const CITIES_QUERY = `
  query GetCities {
    cities {
      id
      name
      coordinates
      locations {
        id
        name
        address
      }
    }
  }
`;

// Get all event targets
export const EVENT_TARGETS_QUERY = `
  query GetEventTargets {
    eventTargets {
      id
      name
      color
    }
  }
`;

// Get all event formats
export const EVENT_FORMATS_QUERY = `
  query GetEventFormats {
    eventFormats {
      id
      name
    }
  }
`;
