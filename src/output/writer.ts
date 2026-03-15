import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ScanOutput } from "../types/artifacts.js";
import { createChildLogger } from "../utils/logger.js";


const log = createChildLogger("writer");

export async function writeOutput(
  output: ScanOutput,
  outputDir: string,
): Promise<void> {
  await mkdir(outputDir, { recursive: true });

  const outputPath = join(outputDir, "scan-output.json");
  await writeFile(outputPath, JSON.stringify(output, null, 2), "utf-8");
  log.info({ path: outputPath }, "Scan output written");

  // Write individual artifact files for convenience
  const artifacts: Record<string, unknown> = {
    pages: output.pages,
    flows: output.flows,
    endpoints: output.endpoints,
    components: output.components,
    screenshots: output.screenshots,
  };

  if (output.authentication) {
    artifacts.authentication = output.authentication;
  }

  for (const [name, data] of Object.entries(artifacts)) {
    const filePath = join(outputDir, `${name}.json`);
    await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  log.info({ outputDir }, "All artifact files written");
}
