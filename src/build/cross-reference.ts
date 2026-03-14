import type { ScanOutput } from "../types/artifacts.js";
import type { CapturedApiCall } from "../types/network.js";

export function crossReference(
  output: ScanOutput,
  allApiCalls: CapturedApiCall[],
): void {
  // Build lookup maps
  const endpointByPattern = new Map(
    output.endpoints.map((e) => [e.endpointPattern, e]),
  );

  // 1. Pages <-> Components
  for (const component of output.components) {
    for (const compPageId of component.pageIds) {
      const page = output.pages.find((p) => p.id === compPageId);
      if (page && !page.componentIds.includes(component.id)) {
        page.componentIds.push(component.id);
      }
    }
  }

  // 2. Flows <-> Endpoints
  for (const flow of output.flows) {
    const flowEndpointPatterns = new Set<string>();
    for (const step of flow.steps) {
      for (const callId of step.apiCallIds) {
        const call = allApiCalls.find((c) => c.id === callId);
        if (call) flowEndpointPatterns.add(call.endpointPattern);
      }
    }
    for (const pattern of flowEndpointPatterns) {
      const endpoint = endpointByPattern.get(pattern);
      if (endpoint && !endpoint.flowIds.includes(flow.id)) {
        endpoint.flowIds.push(flow.id);
      }
    }
  }

  // 3. Auth -> protected pages and flows
  if (output.authentication) {
    output.authentication.protectedPageIds = output.pages
      .filter((p) => p.authRequired)
      .map((p) => p.id);

    // Find login-related flows
    output.authentication.relatedFlowIds = output.flows
      .filter(
        (f) =>
          f.name.toLowerCase().includes("login") ||
          f.name.toLowerCase().includes("auth"),
      )
      .map((f) => f.id);
  }

  // 4. Components <-> Flows (if a flow step visited a page that has a component)
  for (const flow of output.flows) {
    for (const step of flow.steps) {
      const page = output.pages.find((p) => p.id === step.pageId);
      if (!page) continue;
      for (const compId of page.componentIds) {
        const component = output.components.find((c) => c.id === compId);
        if (component && !component.relatedFlowIds.includes(flow.id)) {
          component.relatedFlowIds.push(flow.id);
        }
      }
    }
  }

  // 5. Components <-> API calls (associate page API calls with page components)
  for (const page of output.pages) {
    for (const compId of page.componentIds) {
      const component = output.components.find((c) => c.id === compId);
      if (!component) continue;
      for (const callId of page.apiCallIds) {
        if (!component.relatedApiCallIds.includes(callId)) {
          component.relatedApiCallIds.push(callId);
        }
      }
    }
  }

  // 6. Flag pages with no API calls (missing API detection)
  for (const page of output.pages) {
    if (page.apiCallIds.length === 0) {
      page.states.push({ name: "no_api_interactions" });
    }
  }
}
