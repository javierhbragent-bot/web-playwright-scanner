import type { PageArtifact } from '../types/artifacts.js';
import type { PageCapture } from '../explore/route-explorer.js';

export function buildPages(captures: PageCapture[]): PageArtifact[] {
  return captures.map((capture) => ({
    id: capture.pageId,
    route: capture.route,
    title: capture.title,
    dom: capture.dom,
    screenshotIds: capture.screenshots.map((s) => s.id),
    componentIds: [], // populated by cross-reference
    apiCallIds: capture.apiCalls.map((c) => c.id),
    authRequired: capture.authRequired,
    states: capture.states.filter((s) => s.detected).map((s) => ({ name: s.name })),
  }));
}
