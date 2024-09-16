import { NodeSDK } from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
import { trace, context } from "@opentelemetry/api";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";

export function startSignoz() {
  const serviceName = process.env.SIGNOZ_SERVICE_NAME||"opTrack";
  
  const host = process.env.SIGNOZ_HOST||'http://localhost:4318'

  // Create the exporter
  const exporter = new OTLPTraceExporter({
    url: `${host}/v1/traces`, // Adjust this URL to your SigNoz instance
  });

  // Create a batch span processor with a custom export timeout
  const spanProcessor = new BatchSpanProcessor(exporter, {
    exportTimeoutMillis: 5000, // Adjust this value as needed
  });

  // Configure the SDK
  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
    spanProcessor,
    instrumentations: [], // No auto-instrumentations
  });

  // Start the SDK
  sdk.start();
}

export function sendCustomEvent(eventName, properties) {
  const serviceName = process.env.SIGNOZ_SERVICE_NAME||"opTrack";
  
  console.log("signoz sendCustomEvent", {
    eventName,
    properties,
  });

  const tracer = trace.getTracer(serviceName);

  return new Promise((resolve, reject) => {
    tracer.startActiveSpan(eventName, (span) => {
      try {
        // Add event to the span
        span.addEvent(eventName, properties);

        // Set attributes on the span
        Object.entries(properties).forEach(([key, value]) => {
          if (key !== "duration") {
            span.setAttribute(key, value);
          }
        });

        const duration = properties.duration;
        if (typeof duration === "number" && duration > 0) {
          // If duration is provided, end the span after the specified duration
          setTimeout(() => {
            span.end();
            // Force export of the span
            spanProcessor
              .forceFlush()
              .then(() => {
                resolve({ status: 200, message: "Event sent successfully" });
              })
              .catch(reject);
          }, duration);
        } else {
          // If no duration is provided, end the span immediately
          span.end();
          // Force export of the span
          spanProcessor
            .forceFlush()
            .then(() => {
              resolve({ status: 200, message: "Event sent successfully" });
            })
            .catch(reject);
        }
      } catch (error) {
        // In case of any error, end the span and reject the promise
        span.recordException(error);
        span.setStatus({ code: trace.SpanStatusCode.ERROR });
        span.end();
        spanProcessor
          .forceFlush()
          .then(() => {
            reject(error);
          })
          .catch(reject);
      }
    });
  });
}
