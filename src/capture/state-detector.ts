import type { Page } from 'playwright';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('state-detector');

export interface DetectedState {
  name: string;
  detected: boolean;
  selector?: string;
}

export async function detectStates(page: Page): Promise<DetectedState[]> {
  const states = await page.evaluate(() => {
    const results: { name: string; detected: boolean; selector?: string }[] = [];

    // Loading state: spinners, skeleton screens, progress bars
    const loadingSelectors = [
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="skeleton"]',
      '[role="progressbar"]',
      '[class*="progress"]',
      '.loader',
      '[aria-busy="true"]',
    ];
    for (const sel of loadingSelectors) {
      const el = document.querySelector(sel);
      if (el && getComputedStyle(el).display !== 'none') {
        results.push({ name: 'loading', detected: true, selector: sel });
        break;
      }
    }

    // Empty state
    const emptySelectors = [
      '[class*="empty"]',
      '[class*="no-data"]',
      '[class*="no-results"]',
      '[class*="placeholder"]',
    ];
    for (const sel of emptySelectors) {
      const el = document.querySelector(sel);
      if (el && getComputedStyle(el).display !== 'none') {
        results.push({ name: 'empty', detected: true, selector: sel });
        break;
      }
    }

    // Error state
    const errorSelectors = [
      '[class*="error"]',
      '[role="alert"]',
      '[class*="danger"]',
      '[class*="failure"]',
    ];
    for (const sel of errorSelectors) {
      const el = document.querySelector(sel);
      if (
        el &&
        getComputedStyle(el).display !== 'none' &&
        (el.textContent ?? '').trim().length > 0
      ) {
        results.push({ name: 'error', detected: true, selector: sel });
        break;
      }
    }

    // Success state
    const successSelectors = ['[class*="success"]', '[class*="toast"]', '[class*="notification"]'];
    for (const sel of successSelectors) {
      const el = document.querySelector(sel);
      if (el && getComputedStyle(el).display !== 'none') {
        results.push({ name: 'success', detected: true, selector: sel });
        break;
      }
    }

    // Disabled elements
    const disabledEls = document.querySelectorAll('button:disabled, input:disabled, [disabled]');
    if (disabledEls.length > 0) {
      results.push({ name: 'disabled', detected: true });
    }

    // Open dialogs/modals
    const dialogSelectors = [
      'dialog[open]',
      '[role="dialog"]',
      '.modal.show',
      '[class*="modal"][class*="open"]',
    ];
    for (const sel of dialogSelectors) {
      const el = document.querySelector(sel);
      if (el && getComputedStyle(el).display !== 'none') {
        results.push({ name: 'dialog_open', detected: true, selector: sel });
        break;
      }
    }

    // Validation messages
    const validationSelectors = [
      '[class*="validation"]',
      '[class*="invalid"]',
      '.field-error',
      '[aria-invalid="true"]',
    ];
    for (const sel of validationSelectors) {
      const el = document.querySelector(sel);
      if (el && getComputedStyle(el).display !== 'none') {
        results.push({ name: 'validation', detected: true, selector: sel });
        break;
      }
    }

    return results;
  });

  log.debug({ stateCount: states.length }, 'Detected UI states');
  return states;
}
