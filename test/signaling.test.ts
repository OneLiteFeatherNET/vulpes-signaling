import { request, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createClientIdGenerator } from '../src/client-id.js';
import { startSignalingServer } from '../src/signaling.js';

interface HttpReply {
  readonly status: number | undefined;
  readonly headers: IncomingHttpHeaders;
  readonly body: string;
}

let server: Server | undefined;
let port = 0;

function get(path: string, origin: string): Promise<HttpReply> {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port, path, method: 'GET', headers: { Origin: origin } },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk: string) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({ status: res.statusCode, headers: res.headers, body });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

beforeEach(async () => {
  // Fixed-value random source: the test does not depend on real randomness.
  const started = await startSignalingServer({
    port: 0,
    path: '/sessions',
    key: 'edit_session',
    corsOrigins: ['null'],
    tls: null,
    generateClientId: createClientIdGenerator(() => 7),
  });
  server = started;
  port = (started.address() as AddressInfo).port;
});

afterEach(async () => {
  const running = server;
  server = undefined;
  if (running !== undefined) {
    await new Promise<void>((resolve, reject) => {
      running.close((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
});

describe('signaling server id endpoint', () => {
  it('answers a session id of 16 characters', async () => {
    const reply = await get('/sessions/edit_session/id', 'null');

    expect(reply.body, 'session id body').toMatch(/^[a-z0-9]{16}$/);
  });

  it('allows the null origin that Blockbench sends', async () => {
    const reply = await get('/sessions/edit_session/id', 'null');

    expect(reply.headers['access-control-allow-origin'], 'CORS header for null origin').toBe('null');
  });
});
