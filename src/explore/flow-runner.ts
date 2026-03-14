import type { Page } from "playwright";
import type { ScanConfig, FlowConfig } from "../config/schema.js";
import type { NetworkInterceptor } from "../capture/network-interceptor.js";
import type { ScreenshotCapture } from "../capture/screenshot.js";
import type { SafetyGuard } from "../core/safety.js";
import type { Screenshot } from "../types/common.js";
import type { CapturedApiCall } from "../types/network.js";
import type { DetectedState } from "../capture/state-detector.js";
import { detectStates } from "../capture/state-detector.js";
import { Interaction } from "./interaction.js";
import { pageId, flowStepId } from "../utils/id.js";
import { extractPathname } from "../utils/url.js";
import { createChildLogger } from "../utils/logger.js";

const log = createChildLogger("flow-runner");

export interface FlowStepCapture {
  stepId: string;
  order: number;
  description: string;
  pageId: string;
  action: string;
  apiCalls: CapturedApiCall[];
  states: DetectedState[];
  screenshot: Screenshot | null;
}

export interface FlowCapture {
  name: string;
  steps: FlowStepCapture[];
  pageIds: string[];
  allApiCalls: CapturedApiCall[];
}

export async function runFlows(
  page: Page,
  config: ScanConfig,
  interceptor: NetworkInterceptor,
  screenshotCapture: ScreenshotCapture,
  safety: SafetyGuard,
): Promise<FlowCapture[]> {
  const captures: FlowCapture[] = [];

  for (const flow of config.flows) {
    log.info({ flow: flow.name }, "Running flow");
    const flowCapture = await runSingleFlow(
      page,
      config,
      flow,
      interceptor,
      screenshotCapture,
      safety,
    );
    captures.push(flowCapture);
  }

  return captures;
}

async function runSingleFlow(
  page: Page,
  config: ScanConfig,
  flow: FlowConfig,
  interceptor: NetworkInterceptor,
  screenshotCapture: ScreenshotCapture,
  safety: SafetyGuard,
): Promise<FlowCapture> {
  const interaction = new Interaction(page, interceptor, safety);
  const steps: FlowStepCapture[] = [];
  const visitedPageIds = new Set<string>();
  const allApiCalls: CapturedApiCall[] = [];

  for (let i = 0; i < flow.steps.length; i++) {
    const step = flow.steps[i];
    const stepid = flowStepId(flow.name, i);
    const beforeTimestamp = new Date().toISOString();

    const currentRoute = extractPathname(page.url());
    const currentPageId = pageId(currentRoute);
    interceptor.setCurrentPage(currentPageId);
    visitedPageIds.add(currentPageId);

    log.debug(
      { flow: flow.name, step: i, action: step.action, description: step.description },
      "Executing step",
    );

    // Execute the action
    switch (step.action) {
      case "navigate":
        if (step.url) {
          const fullUrl = new URL(step.url, config.targetUrl).href;
          await interaction.navigate(fullUrl, step.description);
        }
        break;
      case "click":
        if (step.selector) await interaction.click(step.selector, step.description);
        break;
      case "fill":
        if (step.selector && step.value !== undefined)
          await interaction.fill(step.selector, step.value, step.description);
        break;
      case "select":
        if (step.selector && step.value !== undefined)
          await interaction.select(step.selector, step.value, step.description);
        break;
      case "hover":
        if (step.selector) await interaction.hover(step.selector, step.description);
        break;
      case "submit":
        if (step.selector) await interaction.submit(step.selector, step.description);
        break;
      case "wait":
        await interaction.wait(step.waitAfter);
        break;
    }

    // Wait after action
    if (step.action !== "wait") {
      await interaction.wait(step.waitAfter);
    }

    // Tag API calls with flow step
    interceptor.setFlowStepId(stepid);

    // Capture state after action
    const afterRoute = extractPathname(page.url());
    const afterPageId = pageId(afterRoute);
    visitedPageIds.add(afterPageId);

    const stepApiCalls = interceptor.getCallsSince(beforeTimestamp);
    allApiCalls.push(...stepApiCalls);

    const states = await detectStates(page);
    const screenshot = await screenshotCapture.captureFullPage(
      page,
      afterRoute,
      `flow_${flow.name}_step_${i}`,
      afterPageId,
    );

    steps.push({
      stepId: stepid,
      order: i,
      description: step.description,
      pageId: afterPageId,
      action: `${step.action}:${step.selector ?? step.url ?? ""}`,
      apiCalls: stepApiCalls,
      states,
      screenshot,
    });
  }

  log.info(
    { flow: flow.name, steps: steps.length, apiCalls: allApiCalls.length },
    "Flow complete",
  );

  return {
    name: flow.name,
    steps,
    pageIds: Array.from(visitedPageIds),
    allApiCalls,
  };
}
