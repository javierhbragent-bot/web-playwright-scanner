import pino from 'pino';

export const logger = pino({
  transport: {
    target: 'pino/file',
    options: { destination: 1 }, // stdout
  },
  level: process.env.LOG_LEVEL ?? 'info',
});

export function createChildLogger(name: string) {
  return logger.child({ module: name });
}
