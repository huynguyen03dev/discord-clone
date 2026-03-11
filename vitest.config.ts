import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test-utils/setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**", ".hive/**"],
    coverage: {
      provider: "v8",
      include: ["app/api/**", "components/**", "hooks/**", "lib/**"],
      exclude: ["**/__tests__/**", "**/*.d.ts"],
    },
  },
});
