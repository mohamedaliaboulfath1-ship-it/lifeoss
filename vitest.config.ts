import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/domains/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/domains/intelligence/engines/**", "src/domains/**/entities/**"],
      thresholds: {
        lines: 25,
        functions: 20,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
