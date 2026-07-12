import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { metrics, NodeSDK } from "@opentelemetry/sdk-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { logger } from "./lib/logger.ts";

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

if (endpoint) {
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: "flick-api",
    }),
    traceExporter: new OTLPTraceExporter({ url: `${endpoint}/v1/traces` }),
    metricReader: new metrics.PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({ url: `${endpoint}/v1/metrics` }),
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  try {
    sdk.start();
    logger.info({ endpoint }, "otel enabled");
  } catch (err) {
    logger.error({ err }, "otel failed to start");
  }

  const shutdownOtel = (signal: string): void => {
    sdk
      .shutdown()
      .catch((err) => {
        logger.error({ err }, "otel shutdown failed");
      })
      .finally(() => {
        logger.info({ signal }, "otel shut down");
      });
  };

  process.once("SIGTERM", () => shutdownOtel("SIGTERM"));
  process.once("SIGINT", () => shutdownOtel("SIGINT"));
}
