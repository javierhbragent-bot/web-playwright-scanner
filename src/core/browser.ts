import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";
import type { ScanConfig } from "../config/schema.js";
import { createChildLogger } from "../utils/logger.js";

const log = createChildLogger("browser");

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  constructor(private config: ScanConfig) {}

  async launch(): Promise<BrowserContext> {
    log.info("Launching browser");
    this.browser = await chromium.launch({
      headless: this.config.browser.headless,
    });
    this.context = await this.browser.newContext({
      viewport: this.config.browser.viewport,
    });
    this.context.setDefaultTimeout(this.config.browser.timeout);
    return this.context;
  }

  async newPage(): Promise<Page> {
    if (!this.context) throw new Error("Browser not launched");
    return this.context.newPage();
  }

  getContext(): BrowserContext {
    if (!this.context) throw new Error("Browser not launched");
    return this.context;
  }

  async close(): Promise<void> {
    if (this.browser) {
      log.info("Closing browser");
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }
}
