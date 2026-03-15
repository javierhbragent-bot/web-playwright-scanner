import type { ArtifactId } from '../types/common.js';

export function pageId(route: string): ArtifactId {
  return `page:${normalizeRoute(route)}`;
}

export function endpointId(method: string, pattern: string): ArtifactId {
  return `endpoint:${method.toUpperCase()}:${pattern}`;
}

export function flowId(name: string): ArtifactId {
  return `flow:${name}`;
}

export function flowStepId(flowName: string, order: number): ArtifactId {
  return `flowstep:${flowName}:${order}`;
}

export function componentId(type: string, pageRoute: string, index: number): ArtifactId {
  return `component:${type}:${normalizeRoute(pageRoute)}:${index}`;
}

export function screenshotId(pageRoute: string, label: string, timestamp: string): ArtifactId {
  return `screenshot:${normalizeRoute(pageRoute)}:${label}:${timestamp}`;
}

export function apiCallId(method: string, url: string, timestamp: string): ArtifactId {
  return `apicall:${method.toUpperCase()}:${url}:${timestamp}`;
}

function normalizeRoute(route: string): string {
  return route.replace(/\/+$/, '') || '/';
}
