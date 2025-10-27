// Utility to collect and export locations missing lat/long coordinates during development

interface MissingLocation {
  locationId: string;
  locationName: string | null;
  address: string | null;
  cityName: string | null;
  count: number;
  firstSeen: string;
}

class MissingLocationsCollector {
  private missing: Map<string, MissingLocation> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.NODE_ENV === 'development';
  }

  add(
    locationId: string,
    locationName: string | null,
    address: string | null,
    cityName: string | null
  ) {
    if (!this.enabled || !locationId) return;

    const existing = this.missing.get(locationId);

    if (existing) {
      existing.count++;
    } else {
      this.missing.set(locationId, {
        locationId,
        locationName,
        address,
        cityName,
        count: 1,
        firstSeen: new Date().toISOString(),
      });
    }
  }

  getAll(): MissingLocation[] {
    return Array.from(this.missing.values()).sort((a, b) => b.count - a.count);
  }

  exportAsJSON(): string {
    return JSON.stringify(this.getAll(), null, 2);
  }

  exportAsCSV(): string {
    const locations = this.getAll();
    if (locations.length === 0) return '';

    const headers = ['Location ID', 'Location Name', 'Address', 'City', 'Count', 'First Seen'];
    const rows = locations.map((loc) => [
      loc.locationId,
      loc.locationName || '',
      loc.address || '',
      loc.cityName || '',
      loc.count.toString(),
      new Date(loc.firstSeen).toLocaleString(),
    ]);

    return [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');
  }

  exportAsTypeScriptTemplate(): string {
    const locations = this.getAll();
    let output = '// Missing locations without coordinates found during development\n\n';
    output += 'export const missingLocations = [\n';

    locations.forEach((loc) => {
      output += '  {\n';
      output += `    locationId: '${loc.locationId}',\n`;
      output += `    locationName: '${loc.locationName || ''}',\n`;
      output += `    address: '${loc.address || ''}',\n`;
      output += `    cityName: '${loc.cityName || ''}',\n`;
      output += `    // Used ${loc.count}x, first seen: ${new Date(loc.firstSeen).toLocaleString()}\n`;
      output += '  },\n';
    });

    output += '];\n';
    return output;
  }

  downloadAsFile(format: 'json' | 'typescript' | 'csv' = 'csv') {
    if (typeof window === 'undefined') return;

    let content = '';
    let filename = '';
    let mimeType = 'text/plain';

    switch (format) {
      case 'json':
        content = this.exportAsJSON();
        filename = 'missing-locations.json';
        mimeType = 'application/json';
        break;
      case 'typescript':
        content = this.exportAsTypeScriptTemplate();
        filename = 'missing-locations.ts';
        break;
      case 'csv':
        content = this.exportAsCSV();
        filename = 'missing-locations.csv';
        mimeType = 'text/csv';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  clear() {
    this.missing.clear();
  }

  getStats() {
    const all = this.getAll();

    return {
      total: all.length,
      totalOccurrences: all.reduce((sum, item) => sum + item.count, 0),
      topLocations: all.slice(0, 10),
    };
  }
}

// Singleton instance
export const missingLocationsCollector = new MissingLocationsCollector();

// Browser console helper (accessible via window.__locations)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__locations = {
    collector: missingLocationsCollector,
    getAll: () => missingLocationsCollector.getAll(),
    getStats: () => missingLocationsCollector.getStats(),
    export: (format?: 'json' | 'typescript' | 'csv') => {
      console.log(
        format === 'json'
          ? missingLocationsCollector.exportAsJSON()
          : format === 'csv'
          ? missingLocationsCollector.exportAsCSV()
          : missingLocationsCollector.exportAsTypeScriptTemplate()
      );
    },
    download: (format?: 'json' | 'typescript' | 'csv') =>
      missingLocationsCollector.downloadAsFile(format),
    clear: () => missingLocationsCollector.clear(),
  };

  console.log(
    '%c🗺️ Missing Locations Collector Active',
    'background: #2196F3; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;',
    '\n\nUse these commands in the console:\n' +
      '  __locations.getStats()    - View statistics\n' +
      '  __locations.getAll()      - See all missing locations\n' +
      '  __locations.export()      - Log TypeScript template\n' +
      "  __locations.export('csv') - Log CSV format\n" +
      '  __locations.download()    - Download as .csv file\n' +
      "  __locations.download('json') - Download as .json file\n" +
      '  __locations.clear()       - Clear collected data'
  );
}
