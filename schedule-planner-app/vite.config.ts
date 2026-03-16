import path from "path";
import crypto from "crypto";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const buildId = crypto.randomBytes(4).toString("hex");
const buildTime = new Date().toISOString();

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
});
