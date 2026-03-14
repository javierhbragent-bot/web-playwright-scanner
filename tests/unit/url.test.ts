import { describe, it, expect } from "vitest";
import {
  normalizeEndpointPattern,
  isStaticAsset,
  matchesPattern,
  extractPathname,
} from "../../src/utils/url.js";

describe("normalizeEndpointPattern", () => {
  it("replaces numeric IDs with :id", () => {
    expect(
      normalizeEndpointPattern("https://example.com/api/users/123"),
    ).toBe("/api/users/:id");
  });

  it("replaces UUIDs with :id", () => {
    expect(
      normalizeEndpointPattern(
        "https://example.com/api/users/550e8400-e29b-41d4-a716-446655440000",
      ),
    ).toBe("/api/users/:id");
  });

  it("replaces MongoDB ObjectIds with :id", () => {
    expect(
      normalizeEndpointPattern(
        "https://example.com/api/users/507f1f77bcf86cd799439011",
      ),
    ).toBe("/api/users/:id");
  });

  it("handles multiple ID segments", () => {
    expect(
      normalizeEndpointPattern("https://example.com/api/users/123/posts/456"),
    ).toBe("/api/users/:id/posts/:id");
  });

  it("preserves non-ID segments", () => {
    expect(
      normalizeEndpointPattern("https://example.com/api/users/settings"),
    ).toBe("/api/users/settings");
  });

  it("returns / for root path", () => {
    expect(normalizeEndpointPattern("https://example.com/")).toBe("/");
  });
});

describe("isStaticAsset", () => {
  it("identifies JS files", () => {
    expect(isStaticAsset("https://example.com/bundle.js")).toBe(true);
  });

  it("identifies CSS files", () => {
    expect(isStaticAsset("https://example.com/styles.css")).toBe(true);
  });

  it("identifies image files", () => {
    expect(isStaticAsset("https://example.com/logo.png")).toBe(true);
    expect(isStaticAsset("https://example.com/photo.jpg")).toBe(true);
  });

  it("rejects API URLs", () => {
    expect(isStaticAsset("https://example.com/api/users")).toBe(false);
  });
});

describe("matchesPattern", () => {
  it("matches wildcard patterns", () => {
    expect(
      matchesPattern("https://example.com/api/users", "**/api/**"),
    ).toBe(true);
  });

  it("rejects non-matching patterns", () => {
    expect(
      matchesPattern("https://example.com/static/file.js", "**/api/**"),
    ).toBe(false);
  });
});

describe("extractPathname", () => {
  it("extracts pathname from URL", () => {
    expect(extractPathname("https://example.com/api/users?page=1")).toBe(
      "/api/users",
    );
  });
});
