"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Card } from "@/components/ui/card";

interface EventDetailMapProps {
  latitude: number;
  longitude: number;
  locationName: string;
  address?: string | null;
  cityName?: string | null;
}

export function EventDetailMap({
  latitude,
  longitude,
  locationName,
  address,
  cityName,
}: EventDetailMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center: [longitude, latitude],
      zoom: 14,
      attributionControl: false,
    });

    // Add marker
    const el = document.createElement("div");
    el.className = "event-marker";
    el.style.width = "32px";
    el.style.height = "32px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = "hsl(var(--primary))";
    el.style.border = "3px solid white";
    el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
    el.style.cursor = "pointer";

    new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    // Add navigation controls
    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Cleanup
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [latitude, longitude]);

  return (
    <Card className="overflow-hidden">
      <div ref={mapContainer} className="h-[300px] w-full" />
      <div className="p-4 space-y-1">
        <h3 className="font-semibold">{locationName}</h3>
        {address && <p className="text-sm text-muted-foreground">{address}</p>}
        {cityName && <p className="text-sm text-muted-foreground">{cityName}</p>}
      </div>
    </Card>
  );
}
