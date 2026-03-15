import type { ScanConfig } from '../config/schema.js';
import type { ScanOutput } from '../types/artifacts.js';
import { BrowserManager } from './browser.js';
import { SafetyGuard } from './safety.js';
import { NetworkInterceptor } from '../capture/network-interceptor.js';
import { ScreenshotCapture } from '../capture/screenshot.js';
import { handleAuthentication } from '../explore/auth-handler.js';
import { exploreRoutes } from '../explore/route-explorer.js';
import { runFlows } from '../explore/flow-runner.js';
import { buildArtifacts } from '../build/artifact-builder.js';
import { writeOutput } from '../output/writer.js';
import { createChildLogger } from '../utils/logger.js';

const log = createChildLogger('scanner');

export class Scanner {
  private browserManager: BrowserManager;
  private safety: SafetyGuard;
  private interceptor: NetworkInterceptor;
  private screenshotCapture: ScreenshotCapture;

  constructor(private config: ScanConfig) {
    this.browserManager = new BrowserManager(config);
    this.safety = new SafetyGuard(config);
    this.interceptor = new NetworkInterceptor(config);
    this.screenshotCapture = new ScreenshotCapture(config);
  }

  async run(): Promise<ScanOutput> {
    const startTime = Date.now();
    log.info({ targetUrl: this.config.targetUrl }, 'Starting scan');

    await this.screenshotCapture.init();
    await this.browserManager.launch();

    try {
      const page = await this.browserManager.newPage();
      this.interceptor.attach(page);

      // 1. Authenticate if configured
      const authResult = await handleAuthentication(page, this.config, this.interceptor);
      const isAuthenticated = authResult !== null;

      // 2. Explore configured routes
      const pageCaptures = await exploreRoutes(
        page,
        this.config,
        this.interceptor,
        this.screenshotCapture,
        this.safety,
        isAuthenticated,
      );

      // 3. Run configured flows
      const flowCaptures = await runFlows(
        page,
        this.config,
        this.interceptor,
        this.screenshotCapture,
        this.safety,
      );

      // 4. Build artifacts
      const allApiCalls = this.interceptor.getAllCalls();
      const output = buildArtifacts(
        this.config.targetUrl,
        startTime,
        pageCaptures,
        flowCaptures,
        authResult,
        allApiCalls,
      );

      // 5. Write output
      await writeOutput(output, this.config.output.directory);

      log.info({ duration: Date.now() - startTime }, 'Scan complete');

      return output;
    } finally {
      await this.browserManager.close();
    }
  }
}
