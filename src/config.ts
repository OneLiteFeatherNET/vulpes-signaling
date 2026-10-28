export const DEFAULT_PORT = 9000;
export const DEFAULT_PATH = '/sessions';
export const DEFAULT_KEY = 'edit_session';
export const DEFAULT_CORS_ORIGINS: readonly string[] = [
  'null',
  'file://',
  'http://localhost',
  'https://localhost',
  'http://127.0.0.1',
];

export interface TlsFiles {
  readonly keyFile: string;
  readonly certFile: string;
}

export interface SignalingConfig {
  readonly port: number;
  readonly path: string;
  readonly key: string;
  /** Null means plain HTTP, for running behind a TLS-terminating proxy. */
  readonly tls: TlsFiles | null;
  readonly corsOrigins: readonly string[];
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export type Env = Readonly<Record<string, string | undefined>>;

function readVariable(env: Env, name: string): string | undefined {
  const value = env[name]?.trim();
  return value === undefined || value === '' ? undefined : value;
}

function parsePort(raw: string | undefined): number {
  if (raw === undefined) {
    return DEFAULT_PORT;
  }
  const port = Number(raw);
  if (!/^\d+$/.test(raw) || port < 1 || port > 65535) {
    throw new ConfigError(`PORT must be an integer between 1 and 65535, got "${raw}"`);
  }
  return port;
}

function parsePath(raw: string | undefined): string {
  const path = raw ?? DEFAULT_PATH;
  if (!path.startsWith('/')) {
    throw new ConfigError(`SIGNALING_PATH must start with "/", got "${path}"`);
  }
  return path;
}

function parseTls(keyFile: string | undefined, certFile: string | undefined): TlsFiles | null {
  if (keyFile === undefined && certFile === undefined) {
    return null;
  }
  if (keyFile === undefined || certFile === undefined) {
    throw new ConfigError('TLS_KEY_FILE and TLS_CERT_FILE must be set together or not at all');
  }
  return { keyFile, certFile };
}

function parseCorsOrigins(raw: string | undefined): readonly string[] {
  if (raw === undefined) {
    return DEFAULT_CORS_ORIGINS;
  }
  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin !== '');
  if (origins.length === 0) {
    throw new ConfigError('CORS_ORIGINS lists no origin');
  }
  return origins;
}

/** Builds the server configuration from environment variables. Pure: reads only `env`. */
export function parseConfig(env: Env): SignalingConfig {
  return {
    port: parsePort(readVariable(env, 'PORT')),
    path: parsePath(readVariable(env, 'SIGNALING_PATH')),
    key: readVariable(env, 'SIGNALING_KEY') ?? DEFAULT_KEY,
    tls: parseTls(readVariable(env, 'TLS_KEY_FILE'), readVariable(env, 'TLS_CERT_FILE')),
    corsOrigins: parseCorsOrigins(readVariable(env, 'CORS_ORIGINS')),
  };
}
