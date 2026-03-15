import type { ScanConfig } from '../config/schema.js';
import { matchesPattern } from '../utils/url.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('safety');

export class SafetyGuard {
  private requestTimestamps: number[] = [];

  constructor(private config: ScanConfig) {}

  shouldBlockRequest(method: string, url: string): boolean {
    if (this.config.safety.blockDestructiveMethods && method.toUpperCase() === 'DELETE') {
      log.warn({ method, url }, 'Blocked destructive request');
      return true;
    }

    for (const pattern of this.config.safety.blockedUrlPatterns) {
      if (matchesPattern(url, pattern)) {
        log.warn({ url, pattern }, 'Blocked URL matching pattern');
        return true;
      }
    }

    return false;
  }

  checkRateLimit(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60_000;
    this.requestTimestamps = this.requestTimestamps.filter((ts) => ts > oneMinuteAgo);

    if (this.requestTimestamps.length >= this.config.safety.maxRequestsPerMinute) {
      log.warn('Rate limit reached');
      return false;
    }

    this.requestTimestamps.push(now);
    return true;
  }

  async waitForRateLimit(): Promise<void> {
    while (!this.checkRateLimit()) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
