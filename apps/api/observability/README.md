# Local observability (Grafana LGTM)

Local-only OpenTelemetry backend for the Flick API. Runs the all-in-one
`grafana/otel-lgtm` image (OpenTelemetry Collector + Prometheus + Tempo +
Loki + Grafana) so you can see request traces, per-query spans (including
`pg-pool.connect` pool-wait time), and metrics while load-testing.

This is a dev/portfolio tool. The API only exports telemetry when
`OTEL_EXPORTER_OTLP_ENDPOINT` is set (see below); with it unset the API is a
strict no-op and adds zero overhead.

## Start

```sh
docker compose -f apps/api/observability/docker-compose.yml up -d
```

- Grafana: http://localhost:3300 (login `admin` / `admin`) — mapped off `:3000` so it does not clash with the API
- OTLP gRPC ingest: `localhost:4317`
- OTLP HTTP ingest: `localhost:4318`

Tempo (traces), Prometheus (metrics), and Loki (logs) are pre-wired as Grafana
data sources inside the image — open **Explore** and pick **Tempo** to view
traces from `service.name = flick-api`.

## Point the API at it

Set the endpoint before starting the API in dev, then run as usual:

```sh
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 pnpm --filter api dev
```

The API's `src/otel.ts` reads `OTEL_EXPORTER_OTLP_ENDPOINT`; when present it
starts a `NodeSDK` with auto-instrumentation (Node `http` + node-postgres),
exporting traces to `${endpoint}/v1/traces` and metrics to
`${endpoint}/v1/metrics`. Load `apps/api/.env` can also carry the variable
(`--env-file-if-exists=.env` is already used by `pnpm --filter api dev`).

## Stop

```sh
docker compose -f apps/api/observability/docker-compose.yml down
```

Add `-v` to also drop the Grafana/Prometheus/Loki volumes.
