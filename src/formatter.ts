import { MetaTag } from "./parser";
import { ScoreResult, scoreColor } from "./scorer";

// ANSI color codes
const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgRed: "\x1b[41m",
  bgBlue: "\x1b[44m",
  bgWhite: "\x1b[47m",
  black: "\x1b[30m",
};

const CRITICAL_TAGS = new Set(["og:title", "og:description", "og:image"]);
const RECOMMENDED_TAGS = new Set([
  "og:url", "og:type", "og:site_name",
  "twitter:card", "twitter:title", "twitter:description", "twitter:image",
]);

/**
 * Format the OG tags table for CLI output.
 */
export function formatTable(
  ogData: Record<string, string>,
  scoreResult: ScoreResult,
  url: string
): string {
  const lines: string[] = [];
  const divider = `${C.gray}${"─".repeat(70)}${C.reset}`;

  lines.push("");
  lines.push(`${C.bold}${C.cyan}  OG Preview${C.reset}  ${C.dim}${url}${C.reset}`);
  lines.push(divider);

  // Score line
  const sc = scoreResult.score;
  const sColor = sc >= 80 ? C.green : sc >= 50 ? C.yellow : C.red;
  const sBg = sc >= 80 ? C.bgGreen : sc >= 50 ? C.bgYellow : C.bgRed;
  lines.push(
    `  ${sBg}${C.black}${C.bold} SCORE: ${sc}/100 ${C.reset}  ${sColor}${C.bold}${scoreLabel(sc)}${C.reset}`
  );
  lines.push(divider);

  // OG tags
  const allOgTags = [
    "og:title", "og:description", "og:image", "og:url",
    "og:type", "og:site_name", "og:locale",
    "og:image:width", "og:image:height", "og:image:alt",
    "twitter:card", "twitter:title", "twitter:description",
    "twitter:image", "twitter:site", "twitter:creator",
  ];

  for (const tag of allOgTags) {
    const value = ogData[tag];
    const tagLabel = padRight(tag, 24);

    if (value && value.trim()) {
      const truncated = truncate(value, 42);
      lines.push(`  ${C.green}${"●"}${C.reset} ${C.bold}${tagLabel}${C.reset}${truncated}`);
    } else if (CRITICAL_TAGS.has(tag)) {
      lines.push(`  ${C.red}${"✗"}${C.reset} ${C.bold}${tagLabel}${C.reset}${C.red}MISSING (critical)${C.reset}`);
    } else if (RECOMMENDED_TAGS.has(tag)) {
      lines.push(`  ${C.yellow}${"○"}${C.reset} ${C.bold}${tagLabel}${C.reset}${C.yellow}missing (recommended)${C.reset}`);
    } else {
      lines.push(`  ${C.dim}${"·"} ${tagLabel}not set${C.reset}`);
    }
  }

  lines.push(divider);

  // Summary
  if (scoreResult.critical.length > 0) {
    lines.push(
      `  ${C.red}${C.bold}! Critical missing:${C.reset} ${scoreResult.critical.join(", ")}`
    );
  }
  if (scoreResult.recommended.length > 0) {
    lines.push(
      `  ${C.yellow}Recommended missing:${C.reset} ${scoreResult.recommended.join(", ")}`
    );
  }
  lines.push(
    `  ${C.dim}Tags found: ${scoreResult.present.length}/${scoreResult.present.length + scoreResult.missing.length}${C.reset}`
  );
  lines.push("");

  return lines.join("\n");
}

/**
 * Format all meta tags (--all flag).
 */
export function formatAllMeta(meta: MetaTag[]): string {
  const lines: string[] = [];
  lines.push("");
  lines.push(`${C.bold}${C.cyan}  All Meta Tags${C.reset} (${meta.length} found)`);
  lines.push(`${C.gray}${"─".repeat(70)}${C.reset}`);

  for (const { property, content } of meta) {
    const label = padRight(property, 30);
    const value = truncate(content, 36);
    lines.push(`  ${C.dim}●${C.reset} ${C.bold}${label}${C.reset}${value}`);
  }

  lines.push(`${C.gray}${"─".repeat(70)}${C.reset}`);
  lines.push("");
  return lines.join("\n");
}

/**
 * Render ASCII art social media card previews.
 */
export function formatCardPreviews(
  ogData: Record<string, string>,
  pageTitle: string
): string {
  const lines: string[] = [];
  const title = ogData["og:title"] || pageTitle || "No title";
  const desc = ogData["og:description"] || "No description";
  const image = ogData["og:image"] || "";
  const siteName = ogData["og:site_name"] || "";
  const url = ogData["og:url"] || "";

  const twitterCard = ogData["twitter:card"] || "summary";
  const twitterTitle = ogData["twitter:title"] || title;
  const twitterDesc = ogData["twitter:description"] || desc;

  // Facebook Card
  lines.push(`${C.bold}${C.blue}  Facebook Preview${C.reset}`);
  lines.push(`  ${C.gray}┌${"─".repeat(50)}┐${C.reset}`);
  if (image) {
    lines.push(`  ${C.gray}│${C.reset} ${C.dim}[IMAGE: ${truncate(image, 40)}]${C.reset} ${C.gray}│${C.reset}`);
    lines.push(`  ${C.gray}│${" ".repeat(50)}│${C.reset}`);
  }
  lines.push(`  ${C.gray}│${C.reset} ${C.dim}${padRight(siteName.toUpperCase() || extractDomain(url), 49)}${C.reset}${C.gray}│${C.reset}`);
  lines.push(`  ${C.gray}│${C.reset} ${C.bold}${padRight(truncate(title, 48), 49)}${C.reset}${C.gray}│${C.reset}`);
  lines.push(`  ${C.gray}│${C.reset} ${C.dim}${padRight(truncate(desc, 48), 49)}${C.reset}${C.gray}│${C.reset}`);
  lines.push(`  ${C.gray}└${"─".repeat(50)}┘${C.reset}`);
  lines.push("");

  // Twitter Card
  const cardType = twitterCard === "summary_large_image" ? "Large Image" : "Summary";
  lines.push(`${C.bold}${C.cyan}  Twitter Preview${C.reset} ${C.dim}(${cardType})${C.reset}`);
  lines.push(`  ${C.gray}┌${"─".repeat(50)}┐${C.reset}`);
  if (image && twitterCard === "summary_large_image") {
    lines.push(`  ${C.gray}│${C.reset} ${C.dim}[IMAGE: ${truncate(ogData["twitter:image"] || image, 40)}]${C.reset} ${C.gray}│${C.reset}`);
    lines.push(`  ${C.gray}│${" ".repeat(50)}│${C.reset}`);
  }
  lines.push(`  ${C.gray}│${C.reset} ${C.bold}${padRight(truncate(twitterTitle, 48), 49)}${C.reset}${C.gray}│${C.reset}`);
  lines.push(`  ${C.gray}│${C.reset} ${C.dim}${padRight(truncate(twitterDesc, 48), 49)}${C.reset}${C.gray}│${C.reset}`);
  lines.push(`  ${C.gray}│${C.reset} ${C.dim}${padRight(extractDomain(url), 49)}${C.reset}${C.gray}│${C.reset}`);
  if (twitterCard === "summary" && image) {
    lines.push(`  ${C.gray}│${C.reset} ${C.dim}[THUMB: ${truncate(ogData["twitter:image"] || image, 39)}]${C.reset} ${C.gray}│${C.reset}`);
  }
  lines.push(`  ${C.gray}└${"─".repeat(50)}┘${C.reset}`);
  lines.push("");

  // LinkedIn Card
  lines.push(`${C.bold}${C.blue}  LinkedIn Preview${C.reset}`);
  lines.push(`  ${C.gray}┌${"─".repeat(50)}┐${C.reset}`);
  if (image) {
    lines.push(`  ${C.gray}│${C.reset} ${C.dim}[IMAGE: ${truncate(image, 40)}]${C.reset} ${C.gray}│${C.reset}`);
    lines.push(`  ${C.gray}│${" ".repeat(50)}│${C.reset}`);
  }
  lines.push(`  ${C.gray}│${C.reset} ${C.bold}${padRight(truncate(title, 48), 49)}${C.reset}${C.gray}│${C.reset}`);
  lines.push(`  ${C.gray}│${C.reset} ${C.dim}${padRight(extractDomain(url), 49)}${C.reset}${C.gray}│${C.reset}`);
  lines.push(`  ${C.gray}└${"─".repeat(50)}┘${C.reset}`);
  lines.push("");

  return lines.join("\n");
}

/**
 * Format JSON output.
 */
export function formatJson(
  ogData: Record<string, string>,
  allMeta: MetaTag[],
  scoreResult: ScoreResult,
  url: string,
  pageTitle: string
): string {
  return JSON.stringify(
    {
      url,
      pageTitle,
      ogData,
      allMeta,
      score: scoreResult,
    },
    null,
    2
  );
}

// --- Helpers ---

function padRight(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + " ".repeat(len - str.length);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "\u2026";
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
}
