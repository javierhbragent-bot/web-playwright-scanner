import type { FlowArtifact } from '../types/artifacts.js';
import type { FlowCapture } from '../explore/flow-runner.js';
import { flowId } from '../utils/id.js';

export function buildFlows(captures: FlowCapture[]): FlowArtifact[] {
  return captures.map((capture) => ({
    id: flowId(capture.name),
    name: capture.name,
    steps: capture.steps.map((step) => ({
      id: step.stepId,
      order: step.order,
      description: step.description,
      pageId: step.pageId,
      action: step.action,
      apiCallIds: step.apiCalls.map((c) => c.id),
      resultingState: step.states.find((s) => s.detected)?.name,
      screenshotId: step.screenshot?.id,
    })),
    pageIds: capture.pageIds,
    apiCallIds: capture.allApiCalls.map((c) => c.id),
  }));
}
