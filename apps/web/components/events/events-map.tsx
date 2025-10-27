"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder";
import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
import type { Event } from "@/lib/types/graphql";
import { missingLocationsCollector } from "@/lib/locations/missing-locations-collector";
import { getLocationCoordinates } from "@/lib/locations/coordinates-mapping";
import { shouldTrackMissingLocation, parseCityCoordinates } from "@/lib/locations/location-utils";
import { geocodeCities, getCachedCityCoordinates } from "@/lib/locations/geocoding-service";
import { Card } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Star, AlertCircle, MapPin } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { useTranslations } from "@/hooks/use-translations";
import { useWishlistStore } from "@/lib/stores/wishlist-store";
import { cn } from "@/lib/utils";

interface EventsMapProps {
  events: Event[];
}

export function EventsMap({ events }: EventsMapProps) {
  const { translateTarget, translateLanguage } = useTranslations();
  const { isEventSaved, toggleEvent } = useWishlistStore();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Event[]>([]);
  const [hasCoordinates, setHasCoordinates] = useState(true);
  const [geocodedCities, setGeocodedCities] = useState<Map<string, { latitude: number; longitude: number }>>(new Map());
  const [isGeocoding, setIsGeocoding] = useState(false);
  const router = useRouter();

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let resizeObserver: ResizeObserver | null = null;

    try {
      // Initialize map centered on Czech Republic (Prague)
      // Using OpenStreetMap tiles (free and open source)
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            },
          },
          layers: [
            {
              id: "osm",
              type: "raster",
              source: "osm",
            },
          ],
        },
        center: [14.4378, 50.0755], // Prague coordinates
        zoom: 11,
      });

      // Add navigation controls
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      // Add geocoder control with Nominatim (OpenStreetMap) API
      const geocoderApi = {
        forwardGeocode: async (config: any) => {
          const features = [];
          try {
            const request = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
              config.query
            )}&format=geojson&limit=5&countrycodes=cz`;
            const response = await fetch(request);
            const geojson = await response.json();
            for (const feature of geojson.features) {
              const center = [
                feature.geometry.coordinates[0],
                feature.geometry.coordinates[1],
              ];
              const point = {
                type: "Feature" as const,
                id: feature.properties.place_id || feature.properties.osm_id || `${center[0]},${center[1]}`,
                geometry: {
                  type: "Point" as const,
                  coordinates: center,
                },
                place_name: feature.properties.display_name,
                properties: feature.properties,
                text: feature.properties.display_name,
                place_type: ["place"],
                center,
              };
              features.push(point);
            }
          } catch (e) {
            console.error(`Failed to forwardGeocode with error: ${e}`);
          }

          return {
            type: "FeatureCollection" as const,
            features,
          };
        },
      };

      const geocoder = new MaplibreGeocoder(geocoderApi, {
        maplibregl: maplibregl,
        placeholder: "Search for places in Czech Republic...",
        marker: false,
        showResultsWhileTyping: true,
      });

      map.current.addControl(geocoder, "top-left");

      // Disable automatic panning to popups
      map.current.on("movestart", (e) => {
        // Allow user-initiated moves but prevent popup-triggered moves
        if (
          e.originalEvent?.type === "wheel" ||
          e.originalEvent?.type === "mousemove" ||
          e.originalEvent?.type === "touchmove"
        ) {
          return;
        }
      });

      // Handle map resize when layout changes
      resizeObserver = new ResizeObserver(() => {
        map.current?.resize();
      });

      if (mapContainer.current) {
        resizeObserver.observe(mapContainer.current);
      }

      // Wait for map to load before resizing to ensure proper rendering
      map.current.on("load", () => {
        map.current?.resize();
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map.");
    }

    return () => {
      resizeObserver?.disconnect();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Geocode missing cities on mount and when events change
  useEffect(() => {
    async function geocodeMissingCities() {
      // Collect unique city names that need geocoding
      const citiesToGeocode = new Set<string>();

      for (const event of events) {
        if (!event.location) continue;

        const { latitude, longitude } = event.location;
        const cityName = event.location.city?.name;

        // Skip if we already have venue coordinates
        if (latitude != null && longitude != null) continue;

        // Skip if we have geocoded coordinates
        const geocodedCoords = getLocationCoordinates(event.location.id);
        if (geocodedCoords) continue;

        // Skip if we have city coordinates
        const cityCoords = parseCityCoordinates(event.location.city?.coordinates);
        if (cityCoords) continue;

        // Skip online events
        if (!shouldTrackMissingLocation(event.location.name, event.location.address, cityName)) {
          continue;
        }

        // Skip if already cached
        if (cityName && getCachedCityCoordinates(cityName)) {
          continue;
        }

        // This city needs geocoding
        if (cityName) {
          citiesToGeocode.add(cityName);
        }
      }

      // Geocode missing cities
      if (citiesToGeocode.size > 0) {
        setIsGeocoding(true);
        try {
          const results = await geocodeCities(Array.from(citiesToGeocode));
          setGeocodedCities(results);
        } catch (error) {
          console.error("Error geocoding cities:", error);
        } finally {
          setIsGeocoding(false);
        }
      }
    }

    geocodeMissingCities();
  }, [events]);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Create enhanced events with coordinates (including geocoded and city fallback)
    const eventsWithCoords = events
      .map((event) => {
        if (!event.location) return null;

        let { latitude, longitude } = event.location;
        let isApproximate = false;

        // Try to get coordinates from geocoded mapping if missing
        if (latitude == null || longitude == null) {
          const geocodedCoords = getLocationCoordinates(event.location.id);
          if (geocodedCoords) {
            // Use geocoded coordinates - create new object to avoid mutation
            const enhancedEvent = {
              ...event,
              location: {
                ...event.location,
                latitude: geocodedCoords.latitude,
                longitude: geocodedCoords.longitude,
              },
              _isApproximate: false,
            };
            return enhancedEvent;
          } else {
            // Try city coordinates from database as fallback
            const cityCoords = parseCityCoordinates(event.location.city?.coordinates);
            if (cityCoords) {
              // Use city coordinates - mark as approximate
              const enhancedEvent = {
                ...event,
                location: {
                  ...event.location,
                  latitude: cityCoords.latitude,
                  longitude: cityCoords.longitude,
                },
                _isApproximate: true,
              };
              return enhancedEvent;
            } else {
              // Try runtime geocoded city coordinates
              const cityName = event.location.city?.name;
              const runtimeGeocodedCoords = cityName ? (geocodedCities.get(cityName) || getCachedCityCoordinates(cityName)) : null;

              if (runtimeGeocodedCoords) {
                // Use runtime geocoded coordinates - mark as approximate
                const enhancedEvent = {
                  ...event,
                  location: {
                    ...event.location,
                    latitude: runtimeGeocodedCoords.latitude,
                    longitude: runtimeGeocodedCoords.longitude,
                  },
                  _isApproximate: true,
                };
                return enhancedEvent;
              } else {
                // Still no coordinates, track as missing (unless it's an online event)
                if (
                  shouldTrackMissingLocation(
                    event.location.name,
                    event.location.address,
                    event.location.city?.name
                  )
                ) {
                  missingLocationsCollector.add(
                    event.location.id,
                    event.location.name,
                    event.location.address,
                    event.location.city?.name || null
                  );
                }
                return null;
              }
            }
          }
        }

        return { ...event, _isApproximate: false };
      })
      .filter((event): event is Event & { _isApproximate: boolean } => event !== null);

    // Update hasCoordinates state
    setHasCoordinates(eventsWithCoords.length > 0);

    // If no events with coordinates, don't render markers
    if (eventsWithCoords.length === 0) {
      return;
    }

    // Group events by location coordinates (round to 4 decimals to cluster nearby events)
    type EnhancedEvent = Event & { _isApproximate: boolean };
    const locationGroups = new Map<string, EnhancedEvent[]>();
    eventsWithCoords.forEach((event) => {
      if (!event.location?.latitude || !event.location?.longitude) return;

      const lat = event.location.latitude.toFixed(4);
      const lng = event.location.longitude.toFixed(4);
      const key = `${lat},${lng}`;

      if (!locationGroups.has(key)) {
        locationGroups.set(key, []);
      }
      locationGroups.get(key)!.push(event);
    });

    // Create markers for each location group
    locationGroups.forEach((groupEvents) => {
      const firstEvent = groupEvents[0];
      if (!firstEvent || !firstEvent.location?.latitude || !firstEvent.location?.longitude)
        return;

      const { latitude, longitude } = firstEvent.location;
      const eventCount = groupEvents.length;

      // Validate coordinates
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        console.warn(
          "Invalid coordinates for events:",
          groupEvents.map((e) => e.name),
          latitude,
          longitude
        );
        return;
      }

      // Check if any event in the group has approximate coordinates
      const hasApproximate = groupEvents.some((e) => e._isApproximate);

      // Create popup content for single or multiple events
      const isDarkMode = document.documentElement.classList.contains("dark");
      const bgClass = isDarkMode ? "bg-zinc-900" : "bg-white";
      const textClass = isDarkMode ? "text-zinc-100" : "text-zinc-900";
      const mutedClass = isDarkMode ? "text-zinc-400" : "text-zinc-600";
      const borderClass = isDarkMode ? "border-zinc-800" : "border-zinc-200";

      let popupContent = `<div class="${bgClass} ${textClass} rounded-lg shadow-lg max-w-sm">`;

      if (eventCount === 1) {
        const event = groupEvents[0];
        if (!event) return;

        const isSaved = isEventSaved(event.id);
        const starFill = isSaved ? "fill-yellow-400 text-yellow-400" : "text-zinc-400";

        // Determine if event is free or paid
        const isFree = event.price === 0 || event.price === null;
        const priceText = isFree ? "Free" : "Paid";
        const priceClass = isFree ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400";

        // Format languages - translate before building HTML
        const languagesText = event.languages && event.languages.length > 0
          ? event.languages.map(lang => translateLanguage(lang) || lang).join(", ")
          : "";

        const isApproximate = (event as any)._isApproximate;

        popupContent += `
          <div class="p-3 relative">
            <button
              class="wishlist-star absolute top-0 right-0 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              data-event-id="${event.id}"
              aria-label="${isSaved ? 'Remove from wishlist' : 'Add to wishlist'}"
            >
              <svg class="size-4 ${starFill} transition-colors" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
            <h3 class="font-semibold text-sm mb-2 pr-8">${event.name || "Untitled Event"}</h3>
            <p class="text-xs ${mutedClass} mb-2">
              📍 ${event.location?.name || ""}${event.location?.city?.name ? `, ${event.location.city.name}` : ""}
              ${isApproximate ? '<span class="text-orange-500 dark:text-orange-400 font-medium ml-1">(Approx.)</span>' : ''}
            </p>
            ${
              event.term
                ? `
              <p class="text-xs ${mutedClass} mb-2">
                📅 ${new Date(event.term).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            `
                : ""
            }
            <p class="text-xs font-medium ${priceClass} mb-2">
              💵 ${priceText}
            </p>
            ${
              languagesText
                ? `
              <p class="text-xs ${mutedClass} mb-2">
                🌐 ${languagesText}
              </p>
            `
                : ""
            }
            ${
              event.slug
                ? `
              <a href="#" data-event-slug="${event.slug}" class="event-details-link inline-flex items-center text-xs text-blue-500 hover:text-blue-600 font-medium">
                View Details →
              </a>
            `
                : ""
            }
          </div>
        `;
      } else {
        popupContent += `
          <div class="p-3">
            <h3 class="font-semibold text-sm mb-2">${eventCount} events at this location</h3>
            <p class="text-xs ${mutedClass} mb-3">
              📍 ${firstEvent.location?.name || ""}${firstEvent.location?.city?.name ? `, ${firstEvent.location.city.name}` : ""}
              ${hasApproximate ? '<span class="text-orange-500 dark:text-orange-400 font-medium ml-1">(Approx.)</span>' : ''}
            </p>
            <div class="space-y-2 max-h-64 overflow-y-auto">
              ${groupEvents
                .map(
                  (event) => {
                    const isSaved = isEventSaved(event.id);
                    const starFill = isSaved ? "fill-yellow-400 text-yellow-400" : "text-zinc-400";

                    // Determine if event is free or paid
                    const isFree = event.price === 0 || event.price === null;
                    const priceText = isFree ? "Free" : "Paid";
                    const priceClass = isFree ? "text-green-600 dark:text-green-400" : "text-orange-600 dark:text-orange-400";

                    // Format languages - translate before building HTML
                    const languagesText = event.languages && event.languages.length > 0
                      ? event.languages.map(lang => translateLanguage(lang) || lang).join(", ")
                      : "";

                    return `
                <div class="pb-2 ${borderClass} border-b last:border-0 relative pr-8">
                  <button
                    class="wishlist-star absolute top-0 right-0 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    data-event-id="${event.id}"
                    aria-label="${isSaved ? 'Remove from wishlist' : 'Add to wishlist'}"
                  >
                    <svg class="size-3.5 ${starFill} transition-colors" fill="${isSaved ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                  <p class="font-medium text-sm mb-1">${event.name || "Untitled Event"}</p>
                  ${
                    event.term
                      ? `
                    <p class="text-xs ${mutedClass} mb-1">
                      📅 ${new Date(event.term).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  `
                      : ""
                  }
                  <p class="text-xs font-medium ${priceClass} mb-1">
                    💵 ${priceText}
                  </p>
                  ${
                    languagesText
                      ? `
                    <p class="text-xs ${mutedClass} mb-1">
                      🌐 ${languagesText}
                    </p>
                  `
                      : ""
                  }
                  ${
                    event.slug
                      ? `
                    <a href="#" data-event-slug="${event.slug}" class="event-details-link inline-flex items-center text-xs text-blue-500 hover:text-blue-600">
                      View Details →
                    </a>
                  `
                      : ""
                  }
                </div>
              `;
                  }
                )
                .join("")}
            </div>
          </div>
        `;
      }

      popupContent += "</div>";

      // Create custom marker element
      const el = document.createElement("div");
      el.className =
        "flex items-center justify-center font-bold text-white cursor-pointer";
      el.style.width = eventCount > 1 ? "40px" : "32px";
      el.style.height = eventCount > 1 ? "40px" : "32px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = firstEvent?.targets?.[0]?.color || "#3b82f6";

      // Different border style for approximate locations
      if (hasApproximate) {
        el.style.border = "3px dashed white";
        el.style.opacity = "0.8";
      } else {
        el.style.border = "3px solid white";
      }

      el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";

      // Show count if multiple events
      if (eventCount > 1) {
        el.style.fontSize = "14px";
        el.style.fontWeight = "700";
        el.textContent = eventCount.toString();
      }

      try {
        // Create marker with no auto-panning
        const marker = new maplibregl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([longitude, latitude])
          .addTo(map.current!);

        // Create popup (not attached to marker to prevent auto-panning)
        const popup = new maplibregl.Popup({
          offset: eventCount > 1 ? 30 : 25,
          closeButton: true,
          closeOnClick: true,
          maxWidth: "400px",
          className: "map-popup",
          anchor: "bottom",
          focusAfterOpen: false,
        }).setHTML(popupContent);

        // Store popup reference on marker for access
        (marker as any)._customPopup = popup;

        // Hover to show popup on desktop, click on mobile
        el.addEventListener("mouseenter", () => {
          if (!isMobile) {
            // Desktop: Show popup on hover
            // Close all other popups
            markers.current.forEach((m) => {
              const otherPopup = (m as any)._customPopup;
              if (otherPopup && otherPopup !== popup && otherPopup.isOpen()) {
                otherPopup.remove();
              }
            });

            popup.setLngLat([longitude, latitude]);
            popup.addTo(map.current!);

            // Add click handlers for "View Details" links and wishlist stars after popup opens
            setTimeout(() => {
              const links = document.querySelectorAll("a.event-details-link");
              links.forEach((link) => {
                const slug = link.getAttribute("data-event-slug");
                if (slug) {
                  link.addEventListener("click", (e) => {
                    e.preventDefault();
                    router.push(`/${slug}`);
                  });
                }
              });

              // Add wishlist star handlers
              const starButtons = document.querySelectorAll("button.wishlist-star");
              starButtons.forEach((button) => {
                const eventId = button.getAttribute("data-event-id");
                if (eventId) {
                  button.addEventListener("click", (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    // Find the event from groupEvents
                    const event = groupEvents.find(ev => ev.id === eventId);
                    if (event) {
                      toggleEvent(event);

                      // Update star appearance
                      const svg = button.querySelector('svg');
                      if (svg) {
                        const isSaved = isEventSaved(eventId);
                        if (isSaved) {
                          svg.classList.remove('text-zinc-400');
                          svg.classList.add('fill-yellow-400', 'text-yellow-400');
                          svg.setAttribute('fill', 'currentColor');
                        } else {
                          svg.classList.remove('fill-yellow-400', 'text-yellow-400');
                          svg.classList.add('text-zinc-400');
                          svg.setAttribute('fill', 'none');
                        }
                      }
                    }
                  });
                }
              });
            }, 0);
          }
        });

        el.addEventListener("mouseleave", () => {
          if (!isMobile) {
            // Keep popup open briefly to allow moving mouse to popup
            setTimeout(() => {
              const popupEl = popup.getElement();
              if (popupEl && !popupEl.matches(':hover') && !el.matches(':hover')) {
                popup.remove();
              }
            }, 100);
          }
        });

        // Mobile click handler
        el.addEventListener("click", (e) => {
          e.stopPropagation();

          if (isMobile) {
            // Mobile: Open drawer
            setSelectedEvents(groupEvents);
            setDrawerOpen(true);
          }
        });

        markers.current.push(marker);
      } catch (error) {
        console.error(
          "Error creating marker for events:",
          groupEvents.map((e) => e.name),
          error
        );
      }
    });

    // Fit map bounds to show all markers or default to Czech Republic view
    if (locationGroups.size > 0) {
      const bounds = new maplibregl.LngLatBounds();

      locationGroups.forEach((groupEvents) => {
        const firstEvent = groupEvents[0];
        if (firstEvent?.location?.latitude && firstEvent?.location?.longitude) {
          bounds.extend([
            firstEvent.location.longitude,
            firstEvent.location.latitude,
          ]);
        }
      });

      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
      });
    } else {
      // No events with coordinates - show whole Czech Republic
      // Czech Republic bounds: SW corner (12.09, 48.55), NE corner (18.86, 51.06)
      const czechBounds = new maplibregl.LngLatBounds(
        [12.09, 48.55], // Southwest coordinates
        [18.86, 51.06]  // Northeast coordinates
      );

      map.current.fitBounds(czechBounds, {
        padding: 30,
      });
    }

  }, [events, router, isMobile, geocodedCities, translateLanguage]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Date TBA";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "";
    return timeString;
  };

  const sortedEvents = [...events].sort((a, b) => {
    if (!a.term) return 1;
    if (!b.term) return -1;
    return new Date(a.term).getTime() - new Date(b.term).getTime();
  });

  if (mapError) {
    return (
      <Card className="border-destructive bg-destructive/10 text-destructive p-4">
        <p>{mapError}</p>
      </Card>
    );
  }

  return (
    <>
      <div className="flex gap-4 w-full h-full overflow-hidden">
        {/* Left Side - Map */}
        <div className="relative flex-1 overflow-hidden rounded-lg border shadow-sm min-h-0">
          {!hasCoordinates && events.length > 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-muted/20">
              <Card className="max-w-md p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="rounded-full bg-muted p-4">
                    <MapPin className="size-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">No Location Data Available</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  We don't have location information for any of these events yet.
                </p>
                <p className="text-sm text-muted-foreground">
                  Switch to <span className="font-medium">List View</span> to see all events.
                </p>
              </Card>
            </div>
          ) : (
            <>
              <div ref={mapContainer} className="w-full h-full" />
              {isGeocoding && (
                <div className="absolute top-4 right-4 z-10 bg-background/95 backdrop-blur-sm border rounded-lg px-4 py-2 shadow-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-muted-foreground">Geocoding cities...</span>
                  </div>
                </div>
              )}
            </>
          )}


        <style jsx global>{`
          .maplibregl-canvas {
            outline: none;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: optimize-contrast;
          }
          .maplibregl-marker {
            will-change: auto !important;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
          }
          .maplibregl-popup-content {
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .maplibregl-popup-close-button {
            font-size: 20px;
            padding: 4px 8px;
            color: inherit;
            opacity: 0.6;
          }
          .maplibregl-popup-close-button:hover {
            opacity: 1;
            background: transparent;
          }
          .maplibregl-popup-tip {
            border-top-color: transparent !important;
          }
          .dark .maplibregl-popup-tip {
            border-top-color: transparent !important;
          }
        `}</style>
        </div>

        {/* Right Sidebar - Events List (Scrollable) */}
        <div className="w-80 flex-shrink-0 border-l bg-background hidden lg:flex flex-col overflow-hidden h-full">
          <div className="p-4 border-b bg-background z-10 flex-shrink-0">
            <h2 className="text-lg font-semibold">Events</h2>
            {events.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {events.length} {events.length === 1 ? 'event' : 'events'}
              </span>
            )}
          </div>

          <ScrollArea className="flex-1 min-h-0 [&>[data-slot=scroll-area-scrollbar]]:w-3 [&>[data-slot=scroll-area-scrollbar]]:bg-muted/30 [&_[data-slot=scroll-area-thumb]]:bg-muted-foreground/40 hover:[&_[data-slot=scroll-area-thumb]]:bg-muted-foreground/60">
            <div className="p-4 space-y-3 h-full">
{sortedEvents.map((event) => {
                const isSaved = isEventSaved(event.id);
                return (
                  <Card key={event.id} className="group hover:shadow-md transition-shadow relative">
                    {/* Wishlist Star Button - Top Right */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleEvent(event);
                      }}
                      className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors z-10"
                      aria-label={isSaved ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Star
                        className={cn(
                          "size-4 transition-colors",
                          isSaved ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        )}
                      />
                    </button>

                    <div className="p-3">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2 pr-6">{event.name}</h3>

                      <div className="space-y-1.5 text-xs mb-3">
                        {/* Date & Time */}
                        <div className="flex items-center text-muted-foreground gap-1.5">
                          <Calendar className="size-3.5 shrink-0" />
                          <span>{formatDate(event.term)}</span>
                        </div>

                        {event.start_time && (
                          <div className="flex items-center text-muted-foreground gap-1.5">
                            <Clock className="size-3.5 shrink-0" />
                            <span>{formatTime(event.start_time)}</span>
                          </div>
                        )}

                        {/* Location */}
                        {event.location?.city?.name && (
                          <div className="text-muted-foreground">
                            📍 {event.location.city.name}
                          </div>
                        )}

                        {/* Price */}
                        <div className={cn(
                          "font-medium",
                          event.price === 0 || event.price === null
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-600 dark:text-orange-400"
                        )}>
                          💵 {event.price === 0 || event.price === null ? "Free" : "Paid"}
                        </div>

                        {/* Languages */}
                        {event.languages && event.languages.length > 0 && (
                          <div className="text-muted-foreground">
                            🌐 {event.languages.map(lang => translateLanguage(lang) || lang).join(", ")}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {event.targets?.slice(0, 2).map((target) => (
                          <Badge key={target.id} variant="outline" className="text-xs h-5">
                            {translateTarget(target.name)}
                          </Badge>
                        ))}
                      </div>

                      {/* Action Button */}
                      {event.slug && (
                        <Button asChild size="sm" className="w-full h-8 text-xs">
                          <Link href={`/${event.slug}`}>View Details</Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Mobile drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {selectedEvents.length === 1
                ? selectedEvents[0]?.name
                : `${selectedEvents.length} events at this location`}
            </DrawerTitle>
            {selectedEvents.length > 0 && selectedEvents[0]?.location && (
              <DrawerDescription>
                📍 {selectedEvents[0].location.name}
                {selectedEvents[0].location.city?.name &&
                  `, ${selectedEvents[0].location.city.name}`}
              </DrawerDescription>
            )}
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 max-h-96 overflow-y-auto">
            {selectedEvents.map((event, idx) => (
              <div key={idx} className="border-b pb-3 last:border-0">
                <h3 className="font-semibold mb-1">{event.name}</h3>
                {event.term && (
                  <p className="text-sm text-muted-foreground mb-2">
                    📅{" "}
                    {new Date(event.term).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
                {event.slug && (
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      router.push(`/${event.slug}`);
                    }}
                    className="text-sm text-blue-500 hover:text-blue-600 font-medium"
                  >
                    View Details →
                  </button>
                )}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
