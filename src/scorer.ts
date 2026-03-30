export interface ScoreResult {
  score: number;
  present: string[];
  missing: string[];
  critical: string[];
  recommended: string[];
}

interface TagWeight {
  tag: string;
  weight: number;
  level: "critical" | "recommended" | "optional";
}

const TAG_WEIGHTS: TagWeight[] = [
  { tag: "og:title", weight: 15, level: "critical" },
  { tag: "og:description", weight: 15, level: "critical" },
  { tag: "og:image", weight: 12, level: "critical" },
  { tag: "og:url", weight: 8, level: "recommended" },
  { tag: "og:type", weight: 5, level: "recommended" },
  { tag: "og:site_name", weight: 5, level: "recommended" },
  { tag: "og:locale", weight: 3, level: "optional" },
  { tag: "og:image:width", weight: 2, level: "optional" },
  { tag: "og:image:height", weight: 2, level: "optional" },
  { tag: "og:image:alt", weight: 3, level: "optional" },
  { tag: "twitter:card", weight: 8, level: "recommended" },
  { tag: "twitter:title", weight: 7, level: "recommended" },
  { tag: "twitter:description", weight: 7, level: "recommended" },
  { tag: "twitter:image", weight: 5, level: "recommended" },
  { tag: "twitter:site", weight: 2, level: "optional" },
  { tag: "twitter:creator", weight: 1, level: "optional" },
];

/**
 * Calculate an OG completeness score out of 100.
 */
export function calculateScore(ogData: Record<string, string>): ScoreResult {
  const totalWeight = TAG_WEIGHTS.reduce((sum, t) => sum + t.weight, 0);
  let earnedWeight = 0;

  const present: string[] = [];
  const missing: string[] = [];
  const critical: string[] = [];
  const recommended: string[] = [];

  for (const { tag, weight, level } of TAG_WEIGHTS) {
    const value = ogData[tag];
    if (value && value.trim().length > 0) {
      earnedWeight += weight;
      present.push(tag);
    } else {
      missing.push(tag);
      if (level === "critical") critical.push(tag);
      if (level === "recommended") recommended.push(tag);
    }
  }

  const score = Math.round((earnedWeight / totalWeight) * 100);
  return { score, present, missing, critical, recommended };
}

/**
 * Return a color name based on the score.
 */
export function scoreColor(score: number): "green" | "yellow" | "red" {
  if (score >= 80) return "green";
  if (score >= 50) return "yellow";
  return "red";
}
