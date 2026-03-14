import type { Page, Request, Response } from "playwright";
import type { CapturedApiCall, ApiCategory } from "../types/network.js";
import type { ArtifactId } from "../types/common.js";
import type { ScanConfig } from "../config/schema.js";
import { normalizeEndpointPattern, isStaticAsset, matchesPattern } from "../utils/url.js";
import { apiCallId } from "../utils/id.js";
import { createChildLogger } from "../utils/logger.js";

const log = createChildLogger("network-interceptor");

export class NetworkInterceptor {
  private calls: CapturedApiCall[] = [];
  private currentPageId: ArtifactId = "";
  private lastNavigationTime = 0;
  private actionInProgress = false;
  private currentActionDescription: string | null = null;
  private navigationWindow: number;
  private pendingRequests = new Map<string, { method: string; url: string; headers: Record<string, string>; postData: string | null; timestamp: string; category: ApiCategory; triggerAction: string | null }>();

  constructor(private config: ScanConfig) {
    this.navigationWindow = config.browser.networkIdleTimeout;
  }

  attach(page: Page): void {
    page.on("framenavigated", () => {
      this.lastNavigationTime = Date.now();
    });

    page.on("request", (request: Request) => {
      this.onRequest(request);
    });

    page.on("response", (response: Response) => {
      this.onResponse(response);
    });
  }

  setCurrentPage(pageId: ArtifactId): void {
    this.currentPageId = pageId;
  }

  markActionStart(description: string): void {
    this.actionInProgress = true;
    this.currentActionDescription = description;
  }

  markActionEnd(): void {
    this.actionInProgress = false;
    this.currentActionDescription = null;
  }

  private shouldCapture(url: string): boolean {
    if (isStaticAsset(url)) return false;

    const hasInclude = this.config.apiCapture.includePatterns.some((p) =>
      matchesPattern(url, p),
    );
    if (!hasInclude) return false;

    const isExcluded = this.config.apiCapture.excludePatterns.some((p) =>
      matchesPattern(url, p),
    );
    return !isExcluded;
  }

  private categorize(): ApiCategory {
    if (this.actionInProgress) return "user_action";
    if (Date.now() - this.lastNavigationTime < this.navigationWindow)
      return "page_load";
    return "background";
  }

  private onRequest(request: Request): void {
    const url = request.url();
    if (!this.shouldCapture(url)) return;

    const timestamp = new Date().toISOString();
    const category = this.categorize();

    this.pendingRequests.set(url + timestamp, {
      method: request.method(),
      url,
      headers: this.config.apiCapture.captureHeaders ? request.headers() : {},
      postData: request.postData(),
      timestamp,
      category,
      triggerAction: this.currentActionDescription,
    });
  }

  private async onResponse(response: Response): Promise<void> {
    const url = response.url();

    // Find matching pending request
    let pendingKey: string | undefined;
    for (const key of this.pendingRequests.keys()) {
      if (key.startsWith(url)) {
        pendingKey = key;
        break;
      }
    }

    if (!pendingKey) return;
    const pending = this.pendingRequests.get(pendingKey)!;
    this.pendingRequests.delete(pendingKey);

    let requestPayload: unknown = undefined;
    if (this.config.apiCapture.capturePayloads && pending.postData) {
      try {
        requestPayload = JSON.parse(pending.postData);
      } catch {
        requestPayload = pending.postData.slice(
          0,
          this.config.apiCapture.maxPayloadSize,
        );
      }
    }

    let responsePayload: unknown = undefined;
    if (this.config.apiCapture.capturePayloads) {
      try {
        const body = await response.text();
        try {
          responsePayload = JSON.parse(body);
        } catch {
          responsePayload = body.slice(0, this.config.apiCapture.maxPayloadSize);
        }
      } catch {
        // Response body may not be available
      }
    }

    const endpointPattern = normalizeEndpointPattern(url);
    const call: CapturedApiCall = {
      id: apiCallId(pending.method, url, pending.timestamp),
      endpointPattern,
      url,
      method: pending.method,
      requestHeaders: Object.keys(pending.headers).length > 0 ? pending.headers : undefined,
      requestPayload,
      responseStatus: response.status(),
      responsePayload,
      category: pending.category,
      triggerAction: pending.triggerAction,
      timestamp: pending.timestamp,
      pageId: this.currentPageId,
    };

    this.calls.push(call);
    log.debug(
      { method: call.method, url: call.endpointPattern, category: call.category },
      "Captured API call",
    );
  }

  setFlowStepId(stepId: ArtifactId): void {
    // Tag subsequent calls with the flow step
    // Applied retroactively after markActionEnd
    const recentCalls = this.calls.filter(
      (c) => c.category === "user_action" && !c.flowStepId,
    );
    for (const call of recentCalls) {
      call.flowStepId = stepId;
    }
  }

  getCallsForPage(pageId: ArtifactId): CapturedApiCall[] {
    return this.calls.filter((c) => c.pageId === pageId);
  }

  getCallsSince(timestamp: string): CapturedApiCall[] {
    return this.calls.filter((c) => c.timestamp >= timestamp);
  }

  getAllCalls(): CapturedApiCall[] {
    return [...this.calls];
  }

  clear(): void {
    this.calls = [];
    this.pendingRequests.clear();
  }
}
