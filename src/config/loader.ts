import { readFile } from 'node:fs/promises';
import { ScanConfigSchema, type ScanConfig } from './schema.js';

export async function loadConfig(filePath: string): Promise<ScanConfig> {
  const raw = await readFile(filePath, 'utf-8');
  const json = JSON.parse(raw);
  return ScanConfigSchema.parse(json);
}
