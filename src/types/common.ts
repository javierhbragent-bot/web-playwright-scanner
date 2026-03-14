export type ArtifactId = string;
export type Timestamp = string; // ISO 8601

export interface Screenshot {
  id: ArtifactId;
  filePath: string;
  label: string;
  timestamp: Timestamp;
  pageId: ArtifactId;
}
