import { readFileSync } from 'node:fs';
import { createClientIdGenerator } from './client-id.js';
import { ConfigError, type SignalingConfig, parseConfig } from './config.js';
import { startSignalingServer } from './signaling.js';

const SHUTDOWN_TIMEOUT_MS = 5000;

function loadConfig(): SignalingConfig {
  try {
    return parseConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      console.error(`invalid configuration: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

const config = loadConfig();
const tls =
  config.tls === null
    ? null
    : {
        key: readFileSync(config.tls.keyFile, 'utf8'),
        cert: readFileSync(config.tls.certFile, 'utf8'),
      };

const server = await startSignalingServer({
  port: config.port,
  path: config.path,
  key: config.key,
  corsOrigins: config.corsOrigins,
  tls,
  generateClientId: createClientIdGenerator(),
});

const scheme = tls === null ? 'http' : 'https';
console.info(`signaling server listening on ${scheme}://0.0.0.0:${String(config.port)}${config.path} (key ${config.key})`);

function shutdown(signal: NodeJS.Signals): void {
  console.info(`received ${signal}, shutting down`);
  // Open websocket connections keep close() pending, so force the exit after a grace period.
  setTimeout(() => {
    process.exit(0);
  }, SHUTDOWN_TIMEOUT_MS);
  server.close(() => {
    console.info('signaling server stopped');
    process.exit(0);
  });
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
