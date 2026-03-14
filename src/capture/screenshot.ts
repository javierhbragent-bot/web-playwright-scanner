import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "playwright";
import type { Screenshot } from "../types/common.js";
import type { ScanConfig } from "../config/schema.js";
import { screenshotId } from "../utils/id.js";
import { createChildLogger } from "../utils/logger.js";

const log = createChildLogger("screenshot");

export class ScreenshotCapture {
  private outputDir: string;

  constructor(private config: ScanConfig) {
    this.outputDir = join(
      config.output.directory,
      config.output.screenshotsDir,
    );
  }

  async init(): Promise<void> {
    await mkdir(this.outputDir, { recursive: true });
  }

  async captureFullPage(
    page: Page,
    pageRoute: string,
    label: string,
    pageId: string,
  ): Promise<Screenshot> {
    const timestamp = new Date().toISOString();
    const safeName = pageRoute.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${safeName}_${label}_${Date.now()}.png`;
    const filePath = join(this.outputDir, fileName);

    await page.screenshot({ path: filePath, fullPage: true });
    log.debug({ filePath, label }, "Screenshot captured");

    return {
      id: screenshotId(pageRoute, label, timestamp),
      filePath: join(this.config.output.screenshotsDir, fileName),
      label,
      timestamp,
      pageId,
    };
  }

  async captureElement(
    page: Page,
    selector: string,
    pageRoute: string,
    label: string,
    pageId: string,
  ): Promise<Screenshot | null> {
    const timestamp = new Date().toISOString();
    const element = page.locator(selector).first();

    if (!(await element.isVisible().catch(() => false))) {
      log.debug({ selector }, "Element not visible, skipping screenshot");
      return null;
    }

    const safeName = pageRoute.replace(/[^a-zA-Z0-9]/g, "_");
    const safeLabel = label.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${safeName}_${safeLabel}_${Date.now()}.png`;
    const filePath = join(this.outputDir, fileName);

    await element.screenshot({ path: filePath });
    log.debug({ filePath, selector }, "Element screenshot captured");

    return {
      id: screenshotId(pageRoute, label, timestamp),
      filePath: join(this.config.output.screenshotsDir, fileName),
      label,
      timestamp,
      pageId,
    };
  }
}
