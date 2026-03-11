import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

export default defineConfig({
  plugins: [
    ...mochaPlugins(process.env as any),
    react(),
    cloudflare({
      viteWorker: {
        entrypoint: "./src/worker/index.ts",
        configPath: "./wrangler.json"
      }
    }),
  ],
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
    outDir: "dist/client",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
