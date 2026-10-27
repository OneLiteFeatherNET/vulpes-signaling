# vulpes-signaling

A small PeerJS signaling server for Blockbench's native **Edit Session**
(real-time co-editing of a model). It runs as a sidecar next to Vulpes-Backend.
It only brokers the connection between two Blockbench clients; model data never
passes through it.

## Why the settings are fixed

Blockbench 5.2 creates its session peer with fixed values, so this server must
match them:

- **Port 9000, TLS (WSS/HTTPS), path `/sessions`, key `edit_session`.** Blockbench
  connects to `https://<host>:9000/sessions` with key `edit_session`.
- **16-character session ids of `[a-z0-9]`.** Blockbench accepts a session token
  only in that exact shape (`EditSession.matchToken`). The default PeerJS id
  generator returns UUIDs, which Blockbench refuses to join, so this server
  generates the ids itself with `crypto.randomInt`.
- **CORS for the Blockbench renderer.** Blockbench's Electron renderer sends
  `Origin: null` (or `file://`). The id endpoint answers for those origins by default.

## Configuration

| Variable        | Default                                                                | Meaning                                                                         |
| --------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `PORT`          | `9000`                                                                 | Listening port.                                                                 |
| `SIGNALING_PATH`| `/sessions`                                                            | Path prefix. Named `SIGNALING_PATH` so it does not shadow the shell's `PATH`.   |
| `SIGNALING_KEY` | `edit_session`                                                         | Key Blockbench uses.                                                            |
| `TLS_KEY_FILE`  | unset                                                                  | PEM private key. Must be set together with `TLS_CERT_FILE`.                     |
| `TLS_CERT_FILE` | unset                                                                  | PEM certificate. If neither TLS variable is set, the server speaks plain HTTP.  |
| `CORS_ORIGINS`  | `null,file://,http://localhost,https://localhost,http://127.0.0.1`     | Comma-separated exact origins allowed to call the id endpoint.                  |

Origins are matched exactly, so `http://localhost` does not match
`http://localhost:3000`. Add the full origin string if you need a port.

Plain HTTP is for running behind a proxy that terminates TLS. Blockbench itself
always connects over HTTPS, so the proxy must provide the TLS endpoint on 9000.

## Local development

Blockbench connects with `secure: true`, so local use needs a certificate that
the browser trusts. [mkcert](https://github.com/FiloSottile/mkcert) creates one:

```sh
mkcert -install
mkdir -p certs
mkcert -cert-file certs/localhost.pem -key-file certs/localhost-key.pem localhost 127.0.0.1
```

Then run the server in either of two ways.

With Docker Compose (the `certs/` files are mounted into the container):

```sh
docker compose up --build
```

Or directly with Node 22 or newer:

```sh
npm ci
npm run build
PORT=9000 TLS_KEY_FILE=certs/localhost-key.pem TLS_CERT_FILE=certs/localhost.pem node dist/server.js
```

Check the id endpoint:

```sh
curl -s -H 'Origin: null' https://localhost:9000/sessions/edit_session/id
```

It returns a 16-character id.

Development commands:

- `npm run check` runs typecheck, lint and the Vitest suite.
- `npm run build` typechecks and emits `dist/`.

## Pointing Blockbench at the server

Blockbench creates the session peer with a configured `host`. The Vulpes plugin is
meant to set that host per environment, for example `localhost` in development and
the public signaling host in production. That integration is not in
`vulpes-blockbench` yet.

## Limitations

- **STUN and TURN stay at PeerJS and Google defaults.** Blockbench does not expose
  ICE server configuration, so this server cannot change them. Clients behind
  strict NATs may fail to connect directly. A TURN server would need Blockbench
  changes.
- Discovery of other peers is disabled (`allow_discovery: false`).

## Deployment

Run this as a sidecar container in the Vulpes Helm chart, next to Vulpes-Backend:

- Expose a Service on port 9000 that points at the container.
- Provide TLS either inside the container (mount the certificate and key, set
  `TLS_KEY_FILE` and `TLS_CERT_FILE`) or outside it with TCP passthrough, where
  the TLS certificate is terminated in the container and not by the ingress.
- Set `CORS_ORIGINS` only if Blockbench reaches the id endpoint from another origin.

## License

Apache-2.0. See [LICENSE](LICENSE).
