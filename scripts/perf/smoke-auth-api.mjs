import { promises as fs } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const ROOT = process.cwd();
const DEFAULT_BASE_URL = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3000";
const REQUEST_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 8000);
const WARN_MS = Number(process.env.SMOKE_WARN_MS || 1000);
const FAIL_MS = Number(process.env.SMOKE_FAIL_MS || 3000);

const acceptedStatuses = new Set([200, 201, 202, 204, 303, 307, 308, 400, 401, 403, 404, 405]);

function mapDynamicSegment(segment) {
  if (!segment.startsWith("[") || !segment.endsWith("]")) {
    return segment;
  }

  const key = segment.slice(1, -1).toLowerCase();
  if (key.includes("event")) return "1";
  if (key.includes("registration")) return "1";
  if (key.includes("ticket")) return "1";
  if (key.includes("campaign")) return "1";
  if (key.includes("promotion")) return "1";
  if (key.includes("session")) return "1";
  if (key.includes("template")) return "1";
  if (key.includes("addon")) return "1";
  if (key.includes("form")) return "1";
  if (key.includes("id")) return "1";
  if (key.includes("token")) return "sample-token";
  return "1";
}

async function listRouteFiles(baseDir) {
  const found = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    await Promise.all(
      entries.map(async (entry) => {
        const full = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(full);
          return;
        }

        if (entry.isFile() && entry.name === "route.ts") {
          found.push(full);
        }
      })
    );
  }

  await walk(baseDir);
  return found.sort();
}

function routeFileToPath(filePath, prefixDir) {
  const relative = path.relative(prefixDir, filePath).replaceAll("\\", "/");
  const withoutRoute = relative.replace(/\/route\.ts$/, "");
  const mapped = withoutRoute
    .split("/")
    .map((segment) => mapDynamicSegment(segment))
    .join("/");

  return `/${mapped}`;
}

async function timedFetch(url) {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT_MS);
  const start = performance.now();

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      signal: abortController.signal,
    });

    const duration = Math.round(performance.now() - start);
    return {
      ok: true,
      status: response.status,
      duration,
    };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      duration,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const authRouteFiles = await listRouteFiles(path.join(ROOT, "app", "auth"));
  const apiRouteFiles = await listRouteFiles(path.join(ROOT, "app", "api"));

  const authPaths = authRouteFiles.map((file) => routeFileToPath(file, path.join(ROOT, "app")));
  const apiPaths = apiRouteFiles.map((file) => routeFileToPath(file, path.join(ROOT, "app")));
  const paths = [...authPaths, ...apiPaths];

  if (paths.length === 0) {
    throw new Error("No auth/api route files found for smoke check.");
  }

  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, "");
  const warmup = await timedFetch(`${baseUrl}/login`);
  if (!warmup.ok) {
    throw new Error(`Target is unreachable at ${baseUrl}. Error: ${warmup.error}`);
  }

  const results = [];
  for (const routePath of paths) {
    const url = `${baseUrl}${routePath}`;
    const result = await timedFetch(url);
    results.push({ routePath, ...result });
  }

  let failed = false;
  let warnings = 0;

  for (const result of results) {
    if (!result.ok) {
      failed = true;
      console.log(`[FAIL] ${result.routePath} request error in ${result.duration}ms :: ${result.error}`);
      continue;
    }

    if (!acceptedStatuses.has(result.status)) {
      failed = true;
      console.log(`[FAIL] ${result.routePath} unexpected status=${result.status} in ${result.duration}ms`);
      continue;
    }

    if (result.duration > FAIL_MS) {
      failed = true;
      console.log(`[FAIL] ${result.routePath} exceeded fail threshold (${result.duration}ms > ${FAIL_MS}ms)`);
      continue;
    }

    if (result.duration > WARN_MS) {
      warnings += 1;
      console.log(`[WARN] ${result.routePath} exceeded warn threshold (${result.duration}ms > ${WARN_MS}ms)`);
      continue;
    }

    console.log(`[PASS] ${result.routePath} status=${result.status} in ${result.duration}ms`);
  }

  console.log(`\nSmoke summary: routes=${results.length}, warnings=${warnings}, failed=${failed ? "yes" : "no"}`);

  if (failed) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Smoke test failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
