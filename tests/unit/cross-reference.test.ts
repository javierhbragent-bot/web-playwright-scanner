import { describe, it, expect } from 'vitest';
import { crossReference } from '../../src/build/cross-reference.js';
import type { ScanOutput } from '../../src/types/artifacts.js';
import type { CapturedApiCall } from '../../src/types/network.js';

function createMinimalOutput(): ScanOutput {
  return {
    metadata: {
      targetUrl: 'https://example.com',
      scanDate: new Date().toISOString(),
      duration: 0,
    },
    authentication: null,
    pages: [
      {
        id: 'page:/dashboard',
        route: '/dashboard',
        title: 'Dashboard',
        dom: {
          headings: [],
          buttons: [],
          links: [],
          forms: [],
          tables: [],
          dialogs: [],
          alerts: [],
        },
        screenshotIds: [],
        componentIds: [],
        apiCallIds: ['apicall:GET:https://example.com/api/stats:t1'],
        authRequired: false,
        states: [],
      },
      {
        id: 'page:/about',
        route: '/about',
        title: 'About',
        dom: {
          headings: [],
          buttons: [],
          links: [],
          forms: [],
          tables: [],
          dialogs: [],
          alerts: [],
        },
        screenshotIds: [],
        componentIds: [],
        apiCallIds: [],
        authRequired: false,
        states: [],
      },
    ],
    flows: [
      {
        id: 'flow:navigation',
        name: 'navigation',
        steps: [
          {
            id: 'flowstep:navigation:0',
            order: 0,
            description: 'Go to dashboard',
            pageId: 'page:/dashboard',
            action: 'navigate:/dashboard',
            apiCallIds: ['apicall:GET:https://example.com/api/stats:t1'],
          },
        ],
        pageIds: ['page:/dashboard'],
        apiCallIds: ['apicall:GET:https://example.com/api/stats:t1'],
      },
    ],
    components: [
      {
        id: 'component:table:/dashboard:0',
        name: 'Table: stats',
        type: 'table',
        pageIds: ['page:/dashboard'],
        states: [],
        screenshotIds: [],
        relatedFlowIds: [],
        relatedApiCallIds: [],
      },
    ],
    endpoints: [
      {
        id: 'endpoint:GET:/api/stats',
        endpointPattern: '/api/stats',
        methods: ['GET'],
        requestExamples: [],
        responseExamples: [],
        pageIds: ['page:/dashboard'],
        flowIds: [],
        componentIds: [],
      },
    ],
    screenshots: [],
  };
}

describe('crossReference', () => {
  it('wires page <-> component references', () => {
    const output = createMinimalOutput();
    const apiCalls: CapturedApiCall[] = [
      {
        id: 'apicall:GET:https://example.com/api/stats:t1',
        endpointPattern: '/api/stats',
        url: 'https://example.com/api/stats',
        method: 'GET',
        responseStatus: 200,
        category: 'page_load',
        triggerAction: null,
        timestamp: 't1',
        pageId: 'page:/dashboard',
      },
    ];

    crossReference(output, apiCalls);

    expect(output.pages[0].componentIds).toContain('component:table:/dashboard:0');
  });

  it('wires flow <-> endpoint references', () => {
    const output = createMinimalOutput();
    const apiCalls: CapturedApiCall[] = [
      {
        id: 'apicall:GET:https://example.com/api/stats:t1',
        endpointPattern: '/api/stats',
        url: 'https://example.com/api/stats',
        method: 'GET',
        responseStatus: 200,
        category: 'page_load',
        triggerAction: null,
        timestamp: 't1',
        pageId: 'page:/dashboard',
      },
    ];

    crossReference(output, apiCalls);

    expect(output.endpoints[0].flowIds).toContain('flow:navigation');
  });

  it('flags pages with no API calls', () => {
    const output = createMinimalOutput();
    crossReference(output, []);

    const aboutPage = output.pages.find((p) => p.id === 'page:/about');
    expect(aboutPage?.states.some((s) => s.name === 'no_api_interactions')).toBe(true);
  });

  it('wires component <-> flow references', () => {
    const output = createMinimalOutput();
    const apiCalls: CapturedApiCall[] = [
      {
        id: 'apicall:GET:https://example.com/api/stats:t1',
        endpointPattern: '/api/stats',
        url: 'https://example.com/api/stats',
        method: 'GET',
        responseStatus: 200,
        category: 'page_load',
        triggerAction: null,
        timestamp: 't1',
        pageId: 'page:/dashboard',
      },
    ];

    crossReference(output, apiCalls);

    expect(output.components[0].relatedFlowIds).toContain('flow:navigation');
  });
});
