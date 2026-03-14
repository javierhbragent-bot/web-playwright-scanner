const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NUMERIC_REGEX = /^\d+$/;
const MONGO_ID_REGEX = /^[0-9a-f]{24}$/i;

export function normalizeEndpointPattern(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").map((segment) => {
      if (!segment) return segment;
      if (UUID_REGEX.test(segment)) return ":id";
      if (NUMERIC_REGEX.test(segment)) return ":id";
      if (MONGO_ID_REGEX.test(segment)) return ":id";
      return segment;
    });
    return segments.join("/") || "/";
  } catch {
    return url;
  }
}

export function extractPathname(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function isStaticAsset(url: string): boolean {
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".map",
  ];
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return staticExtensions.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

export function matchesPattern(url: string, pattern: string): boolean {
  const regexStr = pattern
    .replace(/\*\*/g, ".*")
    .replace(/\*/g, "[^/]*")
    .replace(/\?/g, ".");
  return new RegExp(regexStr).test(url);
}
