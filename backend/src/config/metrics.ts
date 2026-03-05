// src/config/metrics.ts
import { Registry, Counter, Histogram, Gauge } from "prom-client";

export const register = new Registry();

export const httpDuration = new Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const aiRequestCounter = new Counter({
  name: "ai_request_total",
  help: "Total AI API requests",
  labelNames: ["provider", "status"],
  registers: [register],
});

export const aiTokensCounter = new Counter({
  name: "ai_tokens_total",
  help: "Total AI tokens consumed",
  labelNames: ["org_plan"],
  registers: [register],
});

export const queueDepthGauge = new Gauge({
  name: "job_queue_depth",
  help: "Current queue depth",s
  labelNames: ["queue_name"],
  registers: [register],
});

// Expose metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});
