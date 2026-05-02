import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@config": path.resolve(__dirname, "src/config"),
      "@core": path.resolve(__dirname, "src/core"),
      "@data": path.resolve(__dirname, "src/data"),
      "@gameplay": path.resolve(__dirname, "src/gameplay"),
      "@scenes": path.resolve(__dirname, "src/scenes"),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
