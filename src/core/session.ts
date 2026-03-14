import type { BrowserContext } from "playwright";
import { createChildLogger } from "../utils/logger.js";

const log = createChildLogger("session");

export interface SessionState {
  cookies: Awaited<ReturnType<BrowserContext["cookies"]>>;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
}

export class SessionManager {
  private savedState: SessionState | null = null;

  async save(context: BrowserContext, page: { evaluate: (fn: () => Record<string, string>) => Promise<Record<string, string>> }): Promise<void> {
    const cookies = await context.cookies();
    const localStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) items[key] = window.localStorage.getItem(key) ?? "";
      }
      return items;
    });
    const sessionStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) items[key] = window.sessionStorage.getItem(key) ?? "";
      }
      return items;
    });
    this.savedState = { cookies, localStorage, sessionStorage };
    log.info({ cookieCount: cookies.length }, "Session state saved");
  }

  async restore(context: BrowserContext, page: { evaluate: (fn: (data: Record<string, string>) => void, data: Record<string, string>) => Promise<void> }): Promise<void> {
    if (!this.savedState) {
      log.warn("No session state to restore");
      return;
    }
    await context.addCookies(this.savedState.cookies);
    if (Object.keys(this.savedState.localStorage).length > 0) {
      await page.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          window.localStorage.setItem(key, value);
        }
      }, this.savedState.localStorage);
    }
    if (Object.keys(this.savedState.sessionStorage).length > 0) {
      await page.evaluate((data) => {
        for (const [key, value] of Object.entries(data)) {
          window.sessionStorage.setItem(key, value);
        }
      }, this.savedState.sessionStorage);
    }
    log.info("Session state restored");
  }

  detectMechanism(): SessionState["cookies"] extends [] ? "unknown" : string {
    if (!this.savedState) return "unknown" as never;
    if (this.savedState.cookies.length > 0) return "cookie" as never;
    if (Object.keys(this.savedState.localStorage).length > 0)
      return "localStorage" as never;
    if (Object.keys(this.savedState.sessionStorage).length > 0)
      return "sessionStorage" as never;
    return "unknown" as never;
  }

  getSessionMechanism(): "cookie" | "localStorage" | "sessionStorage" | "token" | "unknown" {
    if (!this.savedState) return "unknown";
    if (this.savedState.cookies.length > 0) return "cookie";
    if (Object.keys(this.savedState.localStorage).length > 0) return "localStorage";
    if (Object.keys(this.savedState.sessionStorage).length > 0) return "sessionStorage";
    return "unknown";
  }
}
