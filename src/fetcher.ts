import http from "http";
import https from "https";
import { URL } from "url";

export interface FetchResult {
  html: string;
  finalUrl: string;
  statusCode: number;
}

const USER_AGENT =
  "Mozilla/5.0 (compatible; OGPreviewBot/1.0; +https://github.com/zakariadev000/og-preview)";
const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;

export function fetchUrl(url: string): Promise<FetchResult> {
  return followRedirects(url, MAX_REDIRECTS);
}

function followRedirects(
  url: string,
  remainingRedirects: number
): Promise<FetchResult> {
  return new Promise((resolve, reject) => {
    if (remainingRedirects <= 0) {
      return reject(new Error("Too many redirects (max 5)"));
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return reject(new Error(`Invalid URL: ${url}`));
    }

    const client = parsed.protocol === "https:" ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const statusCode = res.statusCode ?? 0;

        // Handle redirects
        if ([301, 302, 303, 307, 308].includes(statusCode) && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          res.resume(); // consume response to free memory
          return resolve(followRedirects(redirectUrl, remainingRedirects - 1));
        }

        if (statusCode < 200 || statusCode >= 400) {
          res.resume();
          return reject(new Error(`HTTP ${statusCode} from ${url}`));
        }

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const html = Buffer.concat(chunks).toString("utf-8");
          resolve({ html, finalUrl: url, statusCode });
        });
        res.on("error", reject);
      }
    );

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout after ${TIMEOUT_MS}ms fetching ${url}`));
    });
    req.on("error", reject);
  });
}
