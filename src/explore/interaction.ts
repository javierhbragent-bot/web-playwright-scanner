import type { Page } from "playwright";
import type { NetworkInterceptor } from "../capture/network-interceptor.js";
import type { SafetyGuard } from "../core/safety.js";
import { createChildLogger } from "../utils/logger.js";

const log = createChildLogger("interaction");

export class Interaction {
  constructor(
    private page: Page,
    private interceptor: NetworkInterceptor,
    private safety: SafetyGuard,
  ) {}

  async click(selector: string, description: string): Promise<void> {
    log.debug({ selector, description }, "Click");
    this.interceptor.markActionStart(`click:${description}`);
    try {
      await this.page.locator(selector).first().click();
      await this.page.waitForLoadState("networkidle").catch(() => {});
    } finally {
      this.interceptor.markActionEnd();
    }
  }

  async fill(
    selector: string,
    value: string,
    description: string,
  ): Promise<void> {
    log.debug({ selector, description }, "Fill");
    this.interceptor.markActionStart(`fill:${description}`);
    try {
      await this.page.locator(selector).first().fill(value);
    } finally {
      this.interceptor.markActionEnd();
    }
  }

  async select(
    selector: string,
    value: string,
    description: string,
  ): Promise<void> {
    log.debug({ selector, description }, "Select");
    this.interceptor.markActionStart(`select:${description}`);
    try {
      await this.page.locator(selector).first().selectOption(value);
    } finally {
      this.interceptor.markActionEnd();
    }
  }

  async hover(selector: string, description: string): Promise<void> {
    log.debug({ selector, description }, "Hover");
    this.interceptor.markActionStart(`hover:${description}`);
    try {
      await this.page.locator(selector).first().hover();
    } finally {
      this.interceptor.markActionEnd();
    }
  }

  async submit(selector: string, description: string): Promise<void> {
    log.debug({ selector, description }, "Submit");
    this.interceptor.markActionStart(`submit:${description}`);
    try {
      const form = this.page.locator(selector).first();
      await form.evaluate((el) => {
        if (el instanceof HTMLFormElement) el.submit();
      });
      await this.page.waitForLoadState("networkidle").catch(() => {});
    } finally {
      this.interceptor.markActionEnd();
    }
  }

  async navigate(url: string, description: string): Promise<void> {
    log.debug({ url, description }, "Navigate");
    await this.safety.waitForRateLimit();
    await this.page.goto(url, { waitUntil: "networkidle" });
  }

  async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
