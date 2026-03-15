import type { Page } from 'playwright';
import type { AuthConfig, ScanConfig } from '../config/schema.js';
import type { NetworkInterceptor } from '../capture/network-interceptor.js';
import { SessionManager } from '../core/session.js';
import { analyzeDom } from '../capture/dom-analyzer.js';
import { pageId } from '../utils/id.js';
import { createChildLogger } from '../utils/logger.js';
import type { DomSnapshot } from '../types/dom.js';
import type { CapturedApiCall } from '../types/network.js';

const log = createChildLogger('auth-handler');

export interface AuthResult {
  loginRoute: string;
  loginDom: DomSnapshot;
  loginApiCalls: CapturedApiCall[];
  redirectAfterLogin: string | null;
  sessionManager: SessionManager;
}

export async function handleAuthentication(
  page: Page,
  config: ScanConfig,
  interceptor: NetworkInterceptor,
): Promise<AuthResult | null> {
  if (!config.auth) {
    log.info('No auth configuration, skipping');
    return null;
  }

  const auth = config.auth;
  const loginUrl = new URL(auth.loginUrl, config.targetUrl).href;
  const loginPageId = pageId(auth.loginUrl);

  log.info({ loginUrl }, 'Starting authentication');
  interceptor.setCurrentPage(loginPageId);

  // Navigate to login page
  await page.goto(loginUrl, { waitUntil: 'networkidle' });
  const loginDom = await analyzeDom(page);

  // Fill credentials
  const usernameSelector = `input[name="${auth.credentials.usernameField}"], input[type="email"], input[type="text"]`;
  const passwordSelector = `input[name="${auth.credentials.passwordField}"], input[type="password"]`;

  interceptor.markActionStart('fill:username');
  await page.locator(usernameSelector).first().fill(auth.credentials.username);
  interceptor.markActionEnd();

  interceptor.markActionStart('fill:password');
  await page.locator(passwordSelector).first().fill(auth.credentials.password);
  interceptor.markActionEnd();

  // Submit
  const beforeUrl = page.url();
  interceptor.markActionStart('submit:login');

  if (auth.submitSelector) {
    await page.locator(auth.submitSelector).click();
  } else {
    await page.locator('button[type="submit"], input[type="submit"], button').first().click();
  }

  // Wait for navigation/response
  await page.waitForLoadState('networkidle').catch(() => {});
  interceptor.markActionEnd();

  const afterUrl = page.url();
  const redirectAfterLogin = afterUrl !== beforeUrl ? new URL(afterUrl).pathname : null;

  // Verify login success
  if (auth.successIndicator) {
    const success = await page
      .locator(auth.successIndicator)
      .isVisible()
      .catch(() => false);
    if (!success) {
      log.error('Login success indicator not found');
      throw new Error('Authentication failed: success indicator not visible');
    }
  }

  // Save session
  const sessionManager = new SessionManager();
  await sessionManager.save(page.context(), page);

  const loginApiCalls = interceptor.getCallsForPage(loginPageId);
  log.info(
    { redirect: redirectAfterLogin, apiCalls: loginApiCalls.length },
    'Authentication complete',
  );

  return {
    loginRoute: auth.loginUrl,
    loginDom,
    loginApiCalls,
    redirectAfterLogin,
    sessionManager,
  };
}
