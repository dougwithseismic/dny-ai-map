/**
 * Add UTM parameters to an external URL
 * @param url - The URL to add UTM parameters to
 * @param options - Optional UTM parameter overrides
 * @returns URL with UTM parameters added
 */
export function addUtmParams(
  url: string | null | undefined,
  options?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  }
): string | null {
  if (!url) return null;

  try {
    const urlObj = new URL(url);

    // Default UTM parameters
    const params = {
      utm_source: options?.source || 'withseismic.com',
      utm_medium: options?.medium || 'referral',
      utm_campaign: options?.campaign || 'doug-withseismic',
      ...(options?.term && { utm_term: options.term }),
      ...(options?.content && { utm_content: options.content }),
    };

    // Add UTM parameters to the URL
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        urlObj.searchParams.set(key, value);
      }
    });

    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn('Failed to parse URL for UTM parameters:', url, error);
    return url;
  }
}

/**
 * Check if a URL is external (not part of the current site)
 */
export function isExternalUrl(url: string | null | undefined): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    const currentHost = typeof window !== 'undefined' ? window.location.host : '';
    return urlObj.host !== currentHost && urlObj.protocol.startsWith('http');
  } catch {
    // Relative URLs are not external
    return false;
  }
}
