#!/usr/bin/env node
import { Command } from "commander";
import { loadConfig } from "./config/loader.js";
import { Scanner } from "./core/scanner.js";
import { logger } from "./utils/logger.js";

const program = new Command();

program
  .name("web-scanner")
  .description(
    "Playwright-based web scanner that documents UI pages, API calls, and their relationships",
  )
  .version("0.1.0")
  .requiredOption("-c, --config <path>", "Path to scan configuration JSON file")
  .option("-o, --output <dir>", "Output directory override")
  .option("--headed", "Run browser in headed mode")
  .option("--verbose", "Enable verbose logging");

program.action(async (options) => {
  if (options.verbose) {
    process.env.LOG_LEVEL = "debug";
  }

  try {
    const config = await loadConfig(options.config);

    if (options.output) {
      config.output.directory = options.output;
    }
    if (options.headed) {
      config.browser.headless = false;
    }

    const scanner = new Scanner(config);
    const output = await scanner.run();

    logger.info(
      {
        pages: output.pages.length,
        flows: output.flows.length,
        endpoints: output.endpoints.length,
        components: output.components.length,
      },
      "Scan results summary",
    );
  } catch (err) {
    logger.error({ error: (err as Error).message }, "Scan failed");
    process.exit(1);
  }
});

program.parse();
