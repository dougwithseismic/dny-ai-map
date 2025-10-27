// Utility to collect and export missing translations during development

interface MissingTranslation {
  term: string;
  type: 'language' | 'target' | 'format' | 'category' | 'city' | 'general' | 'unknown';
  count: number;
  firstSeen: string;
}

class MissingTranslationsCollector {
  private missing: Map<string, MissingTranslation> = new Map();
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.NODE_ENV === 'development';
  }

  add(term: string, type: 'language' | 'target' | 'format' | 'category' | 'city' | 'general' | 'unknown' = 'unknown') {
    if (!this.enabled || !term) return;

    const key = `${type}:${term}`;
    const existing = this.missing.get(key);

    if (existing) {
      existing.count++;
    } else {
      this.missing.set(key, {
        term,
        type,
        count: 1,
        firstSeen: new Date().toISOString(),
      });
    }
  }

  getAll(): MissingTranslation[] {
    return Array.from(this.missing.values()).sort((a, b) => b.count - a.count);
  }

  getAllGroupedByType(): Record<string, MissingTranslation[]> {
    const all = this.getAll();
    const grouped: Record<string, MissingTranslation[]> = {
      language: [],
      target: [],
      format: [],
      category: [],
      city: [],
      general: [],
      unknown: [],
    };

    all.forEach((item) => {
      const group = grouped[item.type];
      if (group) {
        group.push(item);
      }
    });

    return grouped;
  }

  exportAsJSON(): string {
    return JSON.stringify(this.getAllGroupedByType(), null, 2);
  }

  exportAsTypeScriptTemplate(): string {
    const grouped = this.getAllGroupedByType();
    let output = '// Missing translations found during development\n\n';
    output += 'export const missingTranslations = {\n';

    Object.entries(grouped).forEach(([type, items]) => {
      if (items.length === 0) return;

      output += `  // ${type.charAt(0).toUpperCase() + type.slice(1)} translations (${items.length} items)\n`;
      output += `  ${type}s: {\n`;

      items.forEach((item) => {
        output += `    '${item.term}': '', // Count: ${item.count}, First seen: ${new Date(item.firstSeen).toLocaleString()}\n`;
      });

      output += `  },\n\n`;
    });

    output += '};\n';
    return output;
  }

  exportAsCopyPaste(): string {
    const grouped = this.getAllGroupedByType();
    let output = '';

    Object.entries(grouped).forEach(([type, items]) => {
      if (items.length === 0) return;

      output += `\n// ${type.charAt(0).toUpperCase() + type.slice(1)}s (${items.length} items)\n`;

      items.forEach((item) => {
        output += `'${item.term}': '', // used ${item.count}x\n`;
      });
    });

    return output;
  }

  downloadAsFile(format: 'json' | 'typescript' | 'copypaste' = 'typescript') {
    if (typeof window === 'undefined') return;

    let content = '';
    let filename = '';

    switch (format) {
      case 'json':
        content = this.exportAsJSON();
        filename = 'missing-translations.json';
        break;
      case 'typescript':
        content = this.exportAsTypeScriptTemplate();
        filename = 'missing-translations.ts';
        break;
      case 'copypaste':
        content = this.exportAsCopyPaste();
        filename = 'missing-translations.txt';
        break;
    }

    const blob = new Blob([content], { type: 'text/plain' });
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
    const grouped = this.getAllGroupedByType();

    return {
      total: all.length,
      byType: Object.entries(grouped).map(([type, items]) => ({
        type,
        count: items.length,
      })),
      totalOccurrences: all.reduce((sum, item) => sum + item.count, 0),
    };
  }
}

// Singleton instance
export const missingTranslationsCollector = new MissingTranslationsCollector();

// Browser console helper (accessible via window.__translations)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__translations = {
    collector: missingTranslationsCollector,
    getAll: () => missingTranslationsCollector.getAll(),
    getStats: () => missingTranslationsCollector.getStats(),
    export: (format?: 'json' | 'typescript' | 'copypaste') => {
      console.log(format === 'json'
        ? missingTranslationsCollector.exportAsJSON()
        : format === 'copypaste'
        ? missingTranslationsCollector.exportAsCopyPaste()
        : missingTranslationsCollector.exportAsTypeScriptTemplate()
      );
    },
    download: (format?: 'json' | 'typescript' | 'copypaste') =>
      missingTranslationsCollector.downloadAsFile(format),
    clear: () => missingTranslationsCollector.clear(),
  };

  console.log(
    '%c🌍 Translation Collector Active',
    'background: #4CAF50; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold;',
    '\n\nUse these commands in the console:\n' +
    '  __translations.getStats()    - View statistics\n' +
    '  __translations.getAll()      - See all missing translations\n' +
    '  __translations.export()      - Log TypeScript template\n' +
    "  __translations.export('copypaste') - Log copy-paste format\n" +
    '  __translations.download()    - Download as .ts file\n' +
    "  __translations.download('json') - Download as .json file\n" +
    '  __translations.clear()       - Clear collected data'
  );
}
