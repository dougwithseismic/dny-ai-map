"use client";

import { useEffect, useState } from "react";
import { missingTranslationsCollector } from "@/lib/translations/missing-collector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, Trash2, X } from "lucide-react";

/**
 * Development widget for collecting and exporting missing translations
 * Only shows in development mode
 * Add to your layout.tsx for easy access during development
 */
export function TranslationCollectorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof missingTranslationsCollector.getStats> | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Update stats periodically
    const interval = setInterval(() => {
      setStats(missingTranslationsCollector.getStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (process.env.NODE_ENV !== 'development' || !stats) return null;

  const hasTranslations = stats.total > 0;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && hasTranslations && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 bg-orange-500 hover:bg-orange-600 text-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
          title="Missing Translations"
        >
          <div className="relative">
            <span className="text-sm font-bold">🌍</span>
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {stats.total}
            </Badge>
          </div>
        </button>
      )}

      {/* Widget Panel */}
      {isOpen && (
        <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-2xl border-orange-500">
          <CardHeader className="bg-orange-50 dark:bg-orange-950 border-b flex flex-row items-center justify-between p-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span>🌍</span>
              Missing Translations
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground text-xs">Unique Terms</div>
                <div className="font-bold text-lg">{stats.total}</div>
              </div>
              <div className="bg-muted p-2 rounded">
                <div className="text-muted-foreground text-xs">Total Uses</div>
                <div className="font-bold text-lg">{stats.totalOccurrences}</div>
              </div>
            </div>

            {/* Breakdown by Type */}
            <div className="space-y-1">
              <div className="text-sm font-semibold">By Type:</div>
              {stats.byType.filter(t => t.count > 0).map((typeStats) => (
                <div key={typeStats.type} className="flex justify-between text-sm">
                  <span className="capitalize">{typeStats.type}</span>
                  <Badge variant="secondary">{typeStats.count}</Badge>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t">
              <Button
                onClick={() => {
                  console.log(missingTranslationsCollector.exportAsTypeScriptTemplate());
                  alert('Check your browser console for the TypeScript template!');
                }}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Eye className="mr-2 h-4 w-4" />
                Log to Console
              </Button>

              <Button
                onClick={() => missingTranslationsCollector.downloadAsFile('typescript')}
                variant="default"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="mr-2 h-4 w-4" />
                Download .ts File
              </Button>

              <Button
                onClick={() => missingTranslationsCollector.downloadAsFile('copypaste')}
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Download className="mr-2 h-4 w-4" />
                Download .txt (Copy/Paste)
              </Button>

              <Button
                onClick={() => {
                  if (confirm('Clear all collected missing translations?')) {
                    missingTranslationsCollector.clear();
                    setStats(missingTranslationsCollector.getStats());
                  }
                }}
                variant="destructive"
                size="sm"
                className="w-full justify-start"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p className="mb-1">💡 <strong>Console Commands:</strong></p>
              <code className="block bg-muted p-1 rounded mb-1">__translations.getAll()</code>
              <code className="block bg-muted p-1 rounded">__translations.download()</code>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
