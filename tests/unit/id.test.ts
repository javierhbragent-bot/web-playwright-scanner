import { describe, it, expect } from "vitest";
import {
  pageId,
  endpointId,
  flowId,
  flowStepId,
  componentId,
} from "../../src/utils/id.js";

describe("ID generation", () => {
  it("generates page IDs", () => {
    expect(pageId("/dashboard")).toBe("page:/dashboard");
    expect(pageId("/")).toBe("page:/");
  });

  it("normalizes trailing slashes", () => {
    expect(pageId("/dashboard/")).toBe("page:/dashboard");
  });

  it("generates endpoint IDs", () => {
    expect(endpointId("GET", "/api/users")).toBe("endpoint:GET:/api/users");
    expect(endpointId("post", "/api/users")).toBe("endpoint:POST:/api/users");
  });

  it("generates flow IDs", () => {
    expect(flowId("login")).toBe("flow:login");
  });

  it("generates flow step IDs", () => {
    expect(flowStepId("login", 0)).toBe("flowstep:login:0");
  });

  it("generates component IDs", () => {
    expect(componentId("form", "/login", 0)).toBe("component:form:/login:0");
  });
});
