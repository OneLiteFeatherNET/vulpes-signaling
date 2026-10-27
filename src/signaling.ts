import type { Server as HttpServer } from 'node:http';
import type { Server as HttpsServer } from 'node:https';
import { PeerServer } from 'peer';

export interface TlsMaterial {
  readonly key: string;
  readonly cert: string;
}

export interface SignalingServerOptions {
  readonly port: number;
  readonly path: string;
  readonly key: string;
  readonly corsOrigins: readonly string[];
  readonly tls: TlsMaterial | null;
  readonly generateClientId: () => string;
}

/** Starts a PeerJS signaling server and resolves once it listens. Port 0 picks a free port. */
export function startSignalingServer(
  options: SignalingServerOptions,
): Promise<HttpServer | HttpsServer> {
  return new Promise((resolve) => {
    PeerServer(
      {
        port: options.port,
        path: options.path,
        key: options.key,
        generateClientId: options.generateClientId,
        allow_discovery: false,
        corsOptions: { origin: [...options.corsOrigins] },
        ...(options.tls === null ? {} : { ssl: { key: options.tls.key, cert: options.tls.cert } }),
      },
      (server) => {
        resolve(server);
      },
    );
  });
}
