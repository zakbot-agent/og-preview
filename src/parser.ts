export interface MetaTag {
  property: string;
  content: string;
}

export interface ParsedOG {
  meta: MetaTag[];
  title: string;
  favicon: string;
}

/**
 * Extract meta tags from raw HTML using regex.
 * Handles both orderings: property/name before content, and content before property/name.
 */
export function parseMetaTags(html: string): ParsedOG {
  const meta: MetaTag[] = [];
  const seen = new Set<string>();

  // Pattern 1: property/name first, then content
  const pattern1 =
    /<meta\s+(?:[^>]*?\s)?(?:property|name)=["']([^"']+)["']\s+content=["']([^"']*?)["'][^>]*?\/?>/gi;

  // Pattern 2: content first, then property/name
  const pattern2 =
    /<meta\s+(?:[^>]*?\s)?content=["']([^"']*?)["']\s+(?:property|name)=["']([^"']+)["'][^>]*?\/?>/gi;

  let match: RegExpExecArray | null;

  while ((match = pattern1.exec(html)) !== null) {
    const property = match[1].toLowerCase();
    const content = decodeHtmlEntities(match[2]);
    const key = property;
    if (!seen.has(key)) {
      seen.add(key);
      meta.push({ property, content });
    }
  }

  while ((match = pattern2.exec(html)) !== null) {
    const content = decodeHtmlEntities(match[1]);
    const property = match[2].toLowerCase();
    const key = property;
    if (!seen.has(key)) {
      seen.add(key);
      meta.push({ property, content });
    }
  }

  // Extract <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1].trim()) : "";

  // Extract favicon
  const faviconMatch = html.match(
    /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i
  );
  const favicon = faviconMatch ? faviconMatch[1] : "";

  return { meta, title, favicon };
}

/**
 * Get a specific meta tag value by property name.
 */
export function getMetaValue(
  meta: MetaTag[],
  property: string
): string | undefined {
  return meta.find((m) => m.property === property)?.content;
}

/**
 * Get OG-specific tags as a convenient map.
 */
export function getOGData(meta: MetaTag[]): Record<string, string> {
  const ogTags = [
    "og:title",
    "og:description",
    "og:image",
    "og:url",
    "og:type",
    "og:site_name",
    "og:locale",
    "og:image:width",
    "og:image:height",
    "og:image:alt",
    "twitter:card",
    "twitter:title",
    "twitter:description",
    "twitter:image",
    "twitter:site",
    "twitter:creator",
  ];

  const result: Record<string, string> = {};
  for (const tag of ogTags) {
    const value = getMetaValue(meta, tag);
    if (value !== undefined) {
      result[tag] = value;
    }
  }
  return result;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/");
}
