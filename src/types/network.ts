import type { ArtifactId, Timestamp } from './common.js';

export type ApiCategory = 'page_load' | 'user_action' | 'background';

export interface CapturedApiCall {
  id: ArtifactId;
  endpointPattern: string;
  url: string;
  method: string;
  requestHeaders?: Record<string, string>;
  requestPayload?: unknown;
  responseStatus: number;
  responsePayload?: unknown;
  category: ApiCategory;
  triggerAction: string | null;
  timestamp: Timestamp;
  pageId: ArtifactId;
  flowStepId?: ArtifactId;
}
