import type { Page } from 'playwright';
import type { ScanConfig } from '../config/schema.js';
import type { NetworkInterceptor } from '../capture/network-interceptor.js';
import type { ScreenshotCapture } from '../capture/screenshot.js';
import type { SafetyGuard } from '../core/safety.js';
import type { Screenshot } from '../types/common.js';
import type { DomSnapshot } from '../types/dom.js';
import type { CapturedApiCall } from '../types/network.js';
import type { DetectedState } from '../capture/state-detector.js';
import { analyzeDom } from '../capture/dom-analyzer.js';
import { detectStates } from '../capture/state-detector.js';
import { pageId } from '../utils/id.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('route-explorer');

export interface PageCapture {
  route: string;
  pageId: string;
  title: string;
  dom: DomSnapshot;
  screenshots: Screenshot[];
  apiCalls: CapturedApiCall[];
  states: DetectedState[];
  authRequired: boolean;
}

export async function exploreRoutes(
  page: Page,
  config: ScanConfig,
  interceptor: NetworkInterceptor,
  screenshotCapture: ScreenshotCapture,
  safety: SafetyGuard,
  isAuthenticated: boolean,
): Promise<PageCapture[]> {
  const captures: PageCapture[] = [];

  for (const route of config.routes) {
    log.info({ route }, 'Exploring route');
    await safety.waitForRateLimit();

    const fullUrl = new URL(route, config.targetUrl).href;
    const pid = pageId(route);
    interceptor.setCurrentPage(pid);

    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle' });
    } catch (err) {
      log.error({ route, error: (err as Error).message }, 'Failed to navigate');
      continue;
    }

    const title = await page.title();
    const dom = await analyzeDom(page);
    const states = await detectStates(page);

    const screenshots: Screenshot[] = [];
    const defaultScreenshot = await screenshotCapture.captureFullPage(page, route, 'default', pid);
    screenshots.push(defaultScreenshot);

    const apiCalls = interceptor.getCallsForPage(pid);

    captures.push({
      route,
      pageId: pid,
      title,
      dom,
      screenshots,
      apiCalls,
      states,
      authRequired: isAuthenticated,
    });

    log.info(
      {
        route,
        title,
        apiCalls: apiCalls.length,
        states: states.filter((s) => s.detected).map((s) => s.name),
      },
      'Route explored',
    );
  }

  return captures;
}
