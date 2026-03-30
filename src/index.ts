#!/usr/bin/env node

import { fetchUrl } from "./fetcher";
import { parseMetaTags, getOGData } from "./parser";
import { calculateScore } from "./scorer";
import {
  formatTable,
  formatAllMeta,
  formatCardPreviews,
  formatJson,
} from "./formatter";
import { startServer } from "./server";

interface CliFlags {
  url: string;
  json: boolean;
  all: boolean;
  serve: boolean;
  port: number;
}

function parseArgs(args: string[]): CliFlags {
  const flags: CliFlags = {
    url: "",
    json: false,
    all: false,
    serve: false,
    port: 3456,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--json") {
      flags.json = true;
    } else if (arg === "--all") {
      flags.all = true;
    } else if (arg === "--serve") {
      flags.serve = true;
    } else if (arg === "--port" && args[i + 1]) {
      flags.port = parseInt(args[++i], 10);
    } else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg.startsWith("--") && !flags.url) {
      flags.url = arg;
    }
  }

  return flags;
}

function printHelp(): void {
  console.log(`
\x1b[1m\x1b[36mog-preview\x1b[0m — Open Graph meta tag analyzer

\x1b[1mUsage:\x1b[0m
  og-preview <url>              Analyze a URL
  og-preview <url> --json       Output as JSON
  og-preview <url> --all        Show ALL meta tags
  og-preview --serve            Start web server
  og-preview --serve --port N   Custom port (default: 3456)

\x1b[1mExamples:\x1b[0m
  og-preview https://github.com
  og-preview https://twitter.com --json
  og-preview --serve --port 8080
`);
}

async function analyzeUrl(flags: CliFlags): Promise<void> {
  if (!flags.url) {
    console.error("\x1b[31mError: No URL provided.\x1b[0m");
    printHelp();
    process.exit(1);
  }

  // Ensure URL has protocol
  let url = flags.url;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    console.log(`\x1b[90m  Fetching ${url}...\x1b[0m`);
    const result = await fetchUrl(url);
    const parsed = parseMetaTags(result.html);
    const ogData = getOGData(parsed.meta);
    const scoreResult = calculateScore(ogData);

    if (flags.json) {
      console.log(formatJson(ogData, parsed.meta, scoreResult, url, parsed.title));
      return;
    }

    // Print table
    console.log(formatTable(ogData, scoreResult, url));

    // Print card previews
    console.log(formatCardPreviews(ogData, parsed.title));

    // Print all meta tags if --all
    if (flags.all) {
      console.log(formatAllMeta(parsed.meta));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\x1b[31m  Error: ${message}\x1b[0m`);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const flags = parseArgs(args);

  if (flags.serve) {
    startServer(flags.port);
    return;
  }

  if (!flags.url && !flags.serve) {
    if (args.length === 0) {
      printHelp();
      process.exit(0);
    }
  }

  await analyzeUrl(flags);
}

main().catch((err) => {
  console.error(`\x1b[31mFatal: ${err.message || err}\x1b[0m`);
  process.exit(1);
});
