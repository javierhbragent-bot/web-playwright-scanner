import type { ScanOutput } from '../types/artifacts.js';
import type { Screenshot } from '../types/common.js';
import type { CapturedApiCall } from '../types/network.js';
import type { PageCapture } from '../explore/route-explorer.js';
import type { FlowCapture } from '../explore/flow-runner.js';
import type { AuthResult } from '../explore/auth-handler.js';
import { buildPages } from './page-builder.js';
import { buildFlows } from './flow-builder.js';
import { buildEndpoints } from './endpoint-builder.js';
import { buildComponents } from './component-builder.js';
import { buildAuth } from './auth-builder.js';
import { crossReference } from './cross-reference.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('artifact-builder');

export function buildArtifacts(
  targetUrl: string,
  startTime: number,
  pageCaptures: PageCapture[],
  flowCaptures: FlowCapture[],
  authResult: AuthResult | null,
  allApiCalls: CapturedApiCall[],
): ScanOutput {
  log.info('Building artifacts');

  const pages = buildPages(pageCaptures);
  const flows = buildFlows(flowCaptures);
  const endpoints = buildEndpoints(allApiCalls);
  const components = buildComponents(pageCaptures);
  const authentication = buildAuth(authResult);

  // Collect all screenshots
  const screenshots: Screenshot[] = [];
  for (const capture of pageCaptures) {
    screenshots.push(...capture.screenshots);
  }
  for (const flow of flowCaptures) {
    for (const step of flow.steps) {
      if (step.screenshot) screenshots.push(step.screenshot);
    }
  }

  const output: ScanOutput = {
    metadata: {
      targetUrl,
      scanDate: new Date().toISOString(),
      duration: Date.now() - startTime,
    },
    authentication,
    pages,
    flows,
    components,
    endpoints,
    screenshots,
  };

  // Wire up cross-references
  crossReference(output, allApiCalls);

  log.info(
    {
      pages: pages.length,
      flows: flows.length,
      endpoints: endpoints.length,
      components: components.length,
      screenshots: screenshots.length,
    },
    'Artifacts built',
  );

  return output;
}
