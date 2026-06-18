import "dotenv/config";
import { buildApp } from "./app.js";
import { config } from "./config/index.js";
import { startBlockchainSyncEngine } from "./modules/blockchain/sync-engine.js";

async function main() {
  const app = await buildApp();

  await app.listen({ port: config.port, host: config.host });

  console.log(`LAE Analytics API running on http://${config.host}:${config.port}`);
  console.log(`OpenAPI docs at http://${config.host}:${config.port}/docs`);

  startBlockchainSyncEngine();
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
