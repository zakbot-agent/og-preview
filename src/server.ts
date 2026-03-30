import http from "http";
import fs from "fs";
import path from "path";
import { fetchUrl } from "./fetcher";
import { parseMetaTags, getOGData } from "./parser";
import { calculateScore } from "./scorer";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

export function startServer(port: number): void {
  const publicDir = path.join(__dirname, "..", "public");

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);

    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // API endpoint
    if (url.pathname === "/api/analyze") {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) {
        sendJson(res, 400, { error: "Missing 'url' query parameter" });
        return;
      }

      try {
        const result = await fetchUrl(targetUrl);
        const parsed = parseMetaTags(result.html);
        const ogData = getOGData(parsed.meta);
        const scoreResult = calculateScore(ogData);

        sendJson(res, 200, {
          url: targetUrl,
          finalUrl: result.finalUrl,
          statusCode: result.statusCode,
          pageTitle: parsed.title,
          favicon: parsed.favicon,
          ogData,
          allMeta: parsed.meta,
          score: scoreResult,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        sendJson(res, 500, { error: message });
      }
      return;
    }

    // Health check
    if (url.pathname === "/api/health") {
      sendJson(res, 200, { status: "ok", version: "1.0.0" });
      return;
    }

    // Serve static files
    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    filePath = path.join(publicDir, filePath);

    // Security: prevent directory traversal
    if (!filePath.startsWith(publicDir)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) throw new Error("Not a file");

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      const content = fs.readFileSync(filePath);

      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch {
      // Fallback to index.html for SPA
      try {
        const indexPath = path.join(publicDir, "index.html");
        const content = fs.readFileSync(indexPath);
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end("Not Found");
      }
    }
  });

  server.listen(port, () => {
    console.log(`\x1b[32m\x1b[1m  OG Preview Server\x1b[0m`);
    console.log(`\x1b[90m  ─────────────────────────────────\x1b[0m`);
    console.log(`  \x1b[36mLocal:\x1b[0m   http://localhost:${port}`);
    console.log(`  \x1b[36mAPI:\x1b[0m     http://localhost:${port}/api/analyze?url=<URL>`);
    console.log(`\x1b[90m  ─────────────────────────────────\x1b[0m`);
    console.log(`  \x1b[90mPress Ctrl+C to stop\x1b[0m\n`);
  });
}

function sendJson(
  res: http.ServerResponse,
  status: number,
  data: unknown
): void {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(data, null, 2));
}
