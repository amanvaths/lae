import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      DATABASE_URL: "postgresql://senso:senso_secret@localhost:5432/senso_limitless_test?schema=public",
      REDIS_URL: "redis://localhost:6379",
      JWT_SECRET: "test-secret",
    },
  },
});
