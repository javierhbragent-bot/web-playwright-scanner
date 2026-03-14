import type { ArtifactId, Screenshot, Timestamp } from "./common.js";
import type { DomSnapshot } from "./dom.js";

export interface AuthenticationArtifact {
  id: ArtifactId;
  loginRoute: string;
  authType: "form" | "oauth" | "sso" | "other";
  loginInputs: { name: string; type: string; label?: string }[];
  loginApiEndpoint: string | null;
  redirectAfterLogin: string | null;
  sessionMechanism:
    | "cookie"
    | "localStorage"
    | "sessionStorage"
    | "token"
    | "unknown";
  relatedFlowIds: ArtifactId[];
  protectedPageIds: ArtifactId[];
}

export interface PageArtifact {
  id: ArtifactId;
  route: string;
  title: string;
  dom: DomSnapshot;
  screenshotIds: ArtifactId[];
  componentIds: ArtifactId[];
  apiCallIds: ArtifactId[];
  authRequired: boolean;
  states: { name: string; screenshotId?: ArtifactId }[];
}

export interface FlowStep {
  id: ArtifactId;
  order: number;
  description: string;
  pageId: ArtifactId;
  action: string;
  apiCallIds: ArtifactId[];
  resultingState?: string;
  screenshotId?: ArtifactId;
}

export interface FlowArtifact {
  id: ArtifactId;
  name: string;
  steps: FlowStep[];
  pageIds: ArtifactId[];
  apiCallIds: ArtifactId[];
}

export interface ComponentArtifact {
  id: ArtifactId;
  name: string;
  type: string;
  pageIds: ArtifactId[];
  states: { name: string; screenshotId?: ArtifactId }[];
  screenshotIds: ArtifactId[];
  relatedFlowIds: ArtifactId[];
  relatedApiCallIds: ArtifactId[];
}

export interface EndpointArtifact {
  id: ArtifactId;
  endpointPattern: string;
  methods: string[];
  requestExamples: { method: string; payload: unknown }[];
  responseExamples: { method: string; status: number; payload: unknown }[];
  pageIds: ArtifactId[];
  flowIds: ArtifactId[];
  componentIds: ArtifactId[];
}

export interface ScanOutput {
  metadata: {
    targetUrl: string;
    scanDate: Timestamp;
    duration: number;
  };
  authentication: AuthenticationArtifact | null;
  pages: PageArtifact[];
  flows: FlowArtifact[];
  components: ComponentArtifact[];
  endpoints: EndpointArtifact[];
  screenshots: Screenshot[];
}
