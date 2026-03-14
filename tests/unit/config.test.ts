import { describe, it, expect } from "vitest";
import { ScanConfigSchema } from "../../src/config/schema.js";

describe("ScanConfigSchema", () => {
  it("parses minimal valid config", () => {
    const config = ScanConfigSchema.parse({
      targetUrl: "https://example.com",
      routes: ["/", "/dashboard"],
    });

    expect(config.targetUrl).toBe("https://example.com");
    expect(config.routes).toEqual(["/", "/dashboard"]);
    expect(config.browser.headless).toBe(true);
    expect(config.flows).toEqual([]);
    expect(config.safety.blockDestructiveMethods).toBe(true);
  });

  it("parses full config with auth", () => {
    const config = ScanConfigSchema.parse({
      targetUrl: "https://example.com",
      routes: ["/"],
      auth: {
        loginUrl: "/login",
        credentials: {
          username: "admin",
          password: "pass",
        },
      },
    });

    expect(config.auth?.loginUrl).toBe("/login");
    expect(config.auth?.credentials.usernameField).toBe("email");
  });

  it("rejects invalid URL", () => {
    expect(() =>
      ScanConfigSchema.parse({
        targetUrl: "not-a-url",
        routes: ["/"],
      }),
    ).toThrow();
  });

  it("parses flow config", () => {
    const config = ScanConfigSchema.parse({
      targetUrl: "https://example.com",
      routes: ["/"],
      flows: [
        {
          name: "login",
          steps: [
            {
              action: "click",
              selector: "#btn",
              description: "Click button",
            },
          ],
        },
      ],
    });

    expect(config.flows[0].name).toBe("login");
    expect(config.flows[0].steps[0].waitAfter).toBe(1000);
  });
});
