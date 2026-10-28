import { describe, expect, it } from 'vitest';
import {
  ConfigError,
  DEFAULT_CORS_ORIGINS,
  DEFAULT_KEY,
  DEFAULT_PATH,
  DEFAULT_PORT,
  parseConfig,
} from '../src/config.js';

describe('parseConfig', () => {
  it('uses port 9000 when PORT is unset', () => {
    expect(parseConfig({}).port, 'default port').toBe(DEFAULT_PORT);
  });

  it('uses the Blockbench path /sessions when SIGNALING_PATH is unset', () => {
    expect(parseConfig({}).path, 'default path').toBe(DEFAULT_PATH);
  });

  it('uses the Blockbench key edit_session when SIGNALING_KEY is unset', () => {
    expect(parseConfig({}).key, 'default key').toBe(DEFAULT_KEY);
  });

  it('serves plain HTTP when no TLS files are configured', () => {
    expect(parseConfig({}).tls, 'tls without files').toBeNull();
  });

  it('uses the default CORS origins when CORS_ORIGINS is unset', () => {
    expect(parseConfig({}).corsOrigins, 'default origins').toEqual(DEFAULT_CORS_ORIGINS);
  });

  it('reads the port from PORT', () => {
    expect(parseConfig({ PORT: '9010' }).port, 'configured port').toBe(9010);
  });

  it('rejects a port that is not a number', () => {
    expect(() => parseConfig({ PORT: 'nine' }), 'non-numeric port').toThrow(ConfigError);
  });

  it('rejects a port above 65535', () => {
    expect(() => parseConfig({ PORT: '65536' }), 'port out of range').toThrow(ConfigError);
  });

  it('rejects a path that does not start with a slash', () => {
    expect(() => parseConfig({ SIGNALING_PATH: 'sessions' }), 'relative path').toThrow(ConfigError);
  });

  it('reads the TLS file paths when both are set', () => {
    const config = parseConfig({ TLS_KEY_FILE: '/certs/key.pem', TLS_CERT_FILE: '/certs/cert.pem' });

    expect(config.tls, 'tls files').toEqual({ keyFile: '/certs/key.pem', certFile: '/certs/cert.pem' });
  });

  it('rejects a TLS key file without a certificate file', () => {
    expect(() => parseConfig({ TLS_KEY_FILE: '/certs/key.pem' }), 'key without cert').toThrow(ConfigError);
  });

  it('rejects a TLS certificate file without a key file', () => {
    expect(() => parseConfig({ TLS_CERT_FILE: '/certs/cert.pem' }), 'cert without key').toThrow(ConfigError);
  });

  it('splits CORS_ORIGINS on commas and trims whitespace', () => {
    expect(parseConfig({ CORS_ORIGINS: ' null , https://vulpes.example ' }).corsOrigins, 'origin list').toEqual([
      'null',
      'https://vulpes.example',
    ]);
  });

  it('skips empty entries in CORS_ORIGINS', () => {
    expect(parseConfig({ CORS_ORIGINS: 'null,,file://' }).corsOrigins, 'origin list').toEqual(['null', 'file://']);
  });

  it('rejects a CORS_ORIGINS value that lists no origin', () => {
    expect(() => parseConfig({ CORS_ORIGINS: ' , ' }), 'empty origin list').toThrow(ConfigError);
  });
});
