"use client";

import { useState, useEffect } from "react";
import { missingLocationsCollector } from "@/lib/locations/missing-locations-collector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Download,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  Zap,
  Loader2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

export function MissingLocationsWidget() {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState(missingLocationsCollector.getStats());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  // Update stats every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(missingLocationsCollector.getStats());

      // Auto-show widget if missing locations are found
      if (missingLocationsCollector.getStats().total > 0 && !isVisible) {
        setIsVisible(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleDownload = (format: "json" | "typescript" | "csv") => {
    missingLocationsCollector.downloadAsFile(format);
  };

  const handleClear = () => {
    missingLocationsCollector.clear();
    setStats(missingLocationsCollector.getStats());
  };

  const handleGeocodeAll = async () => {
    const locations = missingLocationsCollector.getAll();

    if (locations.length === 0) {
      toast.error('No locations to geocode');
      return;
    }

    setIsGeocoding(true);

    const estimatedMinutes = (locations.length * 0.5 / 60).toFixed(1);
    const toastId = toast.loading(`Starting geocoding...`, {
      description: `Estimated time: ${estimatedMinutes} minutes`,
    });

    try {
      const response = await fetch('/api/dev/geocode-locations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locations }),
      });

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let allResults: any[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'start') {
              toast.loading(`Geocoding 0/${data.total}...`, {
                id: toastId,
                description: `Starting...`,
              });
            } else if (data.type === 'progress') {
              const locationName = data.location.locationName || 'Unknown';
              const status = data.location.skipped ? '⏭️' : data.location.geocoded ? '✓' : '✗';
              const skippedText = data.skipped ? ` ⏭️${data.skipped}` : '';
              toast.loading(
                `Geocoding ${data.current}/${data.total}...`,
                {
                  id: toastId,
                  description: `${status} ${locationName} (✓${data.successful} ✗${data.failed}${skippedText})`,
                }
              );
            } else if (data.type === 'complete') {
              allResults = data.results;

              // Download the results automatically
              const blob = new Blob([JSON.stringify(allResults, null, 2)], {
                type: 'application/json',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'locations-with-coordinates.json';
              a.click();
              URL.revokeObjectURL(url);

              const skippedText = data.skipped ? ` ⏭️${data.skipped} skipped` : '';
              toast.success('File downloaded!', {
                id: toastId,
                description: `locations-with-coordinates.json saved to Downloads (✓${data.successful} ✗${data.failed}${skippedText})`,
                duration: 10000,
              });
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          }
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Geocoding failed', {
        id: toastId,
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-md">
      <Card className="shadow-lg border-2 border-blue-500/20 bg-background/95 backdrop-blur">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-blue-500" />
              <CardTitle className="text-sm font-semibold">
                Missing Locations
              </CardTitle>
              {stats.total > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.total}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsVisible(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {stats.total === 0 ? (
            <p className="text-sm text-muted-foreground">
              All events have location coordinates! 🎉
            </p>
          ) : (
            <>
              <div className="text-xs space-y-1">
                <p className="text-muted-foreground">
                  {stats.total} location{stats.total > 1 ? "s" : ""} without
                  coordinates
                </p>
                <p className="text-muted-foreground">
                  {stats.totalOccurrences} total occurrence
                  {stats.totalOccurrences > 1 ? "s" : ""}
                </p>
              </div>

              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8">
                    {isExpanded ? (
                      <ChevronDown className="size-4" />
                    ) : (
                      <ChevronRight className="size-4" />
                    )}
                    <span className="text-xs">
                      View top locations ({Math.min(stats.topLocations.length, 5)})
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {stats.topLocations.slice(0, 5).map((loc) => (
                    <div
                      key={loc.locationId}
                      className="text-xs p-2 rounded bg-muted/50"
                    >
                      <div className="font-medium">
                        {loc.locationName || "Unnamed Location"}
                      </div>
                      {loc.cityName && (
                        <div className="text-muted-foreground">{loc.cityName}</div>
                      )}
                      {loc.address && (
                        <div className="text-muted-foreground text-[10px]">
                          {loc.address}
                        </div>
                      )}
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {loc.count}x
                      </Badge>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 text-xs w-full"
                  onClick={handleGeocodeAll}
                  disabled={isGeocoding}
                >
                  {isGeocoding ? (
                    <>
                      <Loader2 className="size-3 mr-1 animate-spin" />
                      Geocoding...
                    </>
                  ) : (
                    <>
                      <Zap className="size-3 mr-1" />
                      Geocode All
                    </>
                  )}
                </Button>

                <div className="flex flex-wrap gap-1 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleDownload("csv")}
                    disabled={isGeocoding}
                  >
                    <Download className="size-3 mr-1" />
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleDownload("json")}
                    disabled={isGeocoding}
                  >
                    <Download className="size-3 mr-1" />
                    JSON
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => handleDownload("typescript")}
                    disabled={isGeocoding}
                  >
                    <Download className="size-3 mr-1" />
                    TS
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 text-xs ml-auto"
                    onClick={handleClear}
                    disabled={isGeocoding}
                  >
                    <Trash2 className="size-3 mr-1" />
                    Clear
                  </Button>
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground pt-2 border-t">
                Console: <code className="bg-muted px-1 rounded">__locations</code>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
