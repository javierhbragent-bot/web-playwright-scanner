import type { EndpointArtifact } from "../types/artifacts.js";
import type { CapturedApiCall } from "../types/network.js";
import { endpointId } from "../utils/id.js";

export function buildEndpoints(apiCalls: CapturedApiCall[]): EndpointArtifact[] {
  // Group by endpoint pattern
  const groups = new Map<string, CapturedApiCall[]>();

  for (const call of apiCalls) {
    const key = call.endpointPattern;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(call);
  }

  const endpoints: EndpointArtifact[] = [];

  for (const [pattern, calls] of groups) {
    const methods = [...new Set(calls.map((c) => c.method))];
    const pageIds = [...new Set(calls.map((c) => c.pageId))];

    // Collect request/response examples (one per method)
    const requestExamples: { method: string; payload: unknown }[] = [];
    const responseExamples: { method: string; status: number; payload: unknown }[] = [];
    const seenMethods = new Set<string>();

    for (const call of calls) {
      if (!seenMethods.has(call.method)) {
        seenMethods.add(call.method);
        if (call.requestPayload !== undefined) {
          requestExamples.push({
            method: call.method,
            payload: call.requestPayload,
          });
        }
        responseExamples.push({
          method: call.method,
          status: call.responseStatus,
          payload: call.responsePayload,
        });
      }
    }

    endpoints.push({
      id: endpointId(methods[0], pattern),
      endpointPattern: pattern,
      methods,
      requestExamples,
      responseExamples,
      pageIds,
      flowIds: [], // populated by cross-reference
      componentIds: [], // populated by cross-reference
    });
  }

  return endpoints;
}
