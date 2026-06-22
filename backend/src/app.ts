import Fastify from "fastify";
import cors from "@fastify/cors";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { config } from "./config/index.js";
import { errorHandler } from "./middleware/auth.js";
import authPlugin from "./plugins/auth.plugin.js";
import { analyticsRoutes } from "./modules/analytics/analytics.routes.js";
import { adminRoutes } from "./modules/admin/lae-admin.routes.js";
import { laeUserRoutes } from "./modules/lae/lae-user.routes.js";

/**
 * LAE Analytics API — read-only indexed blockchain data.
 * Legacy MLM engines and write routes are disabled.
 */
export async function buildApp() {
  const app = Fastify({
    logger: config.nodeEnv === "development",
  });

  app.setErrorHandler(errorHandler);

  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "LAE Analytics API",
        description: "Blockchain event indexer + read-only analytics (BSC Testnet)",
        version: "2.0.0",
      },
    },
  });

  await app.register(swaggerUi, { routePrefix: "/docs" });
  await app.register(authPlugin);

  app.get("/health", async () => ({
    status: "ok",
    service: "lae-analytics-api",
    mode: "indexer-only",
    timestamp: new Date().toISOString(),
  }));

  await app.register(analyticsRoutes, { prefix: "/api" });
  await app.register(adminRoutes, { prefix: "/api" });
  await app.register(laeUserRoutes, { prefix: "/api" });

  return app;
}
