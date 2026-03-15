import { z } from 'zod';

const AuthConfigSchema = z.object({
  loginUrl: z.string(),
  credentials: z.object({
    usernameField: z.string().default('email'),
    passwordField: z.string().default('password'),
    username: z.string(),
    password: z.string(),
  }),
  submitSelector: z.string().optional(),
  successIndicator: z.string().optional(),
});

const FlowStepConfigSchema = z.object({
  action: z.enum(['navigate', 'click', 'fill', 'select', 'hover', 'wait', 'submit']),
  selector: z.string().optional(),
  value: z.string().optional(),
  url: z.string().optional(),
  description: z.string(),
  waitAfter: z.number().default(1000),
});

const FlowConfigSchema = z.object({
  name: z.string(),
  steps: z.array(FlowStepConfigSchema),
});

export const ScanConfigSchema = z.object({
  targetUrl: z.string().url(),
  auth: AuthConfigSchema.optional(),
  routes: z.array(z.string()),
  flows: z.array(FlowConfigSchema).default([]),
  output: z
    .object({
      directory: z.string().default('./output'),
      screenshotsDir: z.string().default('screenshots'),
    })
    .default({}),
  browser: z
    .object({
      headless: z.boolean().default(true),
      viewport: z
        .object({
          width: z.number().default(1280),
          height: z.number().default(720),
        })
        .default({}),
      timeout: z.number().default(30000),
      networkIdleTimeout: z.number().default(5000),
    })
    .default({}),
  safety: z
    .object({
      maxRequestsPerMinute: z.number().default(60),
      blockedUrlPatterns: z.array(z.string()).default([]),
      blockDestructiveMethods: z.boolean().default(true),
    })
    .default({}),
  apiCapture: z
    .object({
      includePatterns: z.array(z.string()).default(['**/api/**']),
      excludePatterns: z
        .array(z.string())
        .default(['**/*.js', '**/*.css', '**/*.png', '**/*.jpg', '**/*.svg', '**/*.woff*']),
      captureHeaders: z.boolean().default(false),
      capturePayloads: z.boolean().default(true),
      maxPayloadSize: z.number().default(10240),
    })
    .default({}),
});

export type ScanConfig = z.infer<typeof ScanConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
export type FlowConfig = z.infer<typeof FlowConfigSchema>;
export type FlowStepConfig = z.infer<typeof FlowStepConfigSchema>;
