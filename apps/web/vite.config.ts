import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    host: "127.0.0.1",
    port: 5175,
    strictPort: true,
  },
  resolve: {
    alias: {
      "@qm/calc-core": resolve(__dirname, "../../packages/calc-core/src/index.ts"),
    },
  },
});
