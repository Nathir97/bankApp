import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/auth":         { target: "http://backend:8000", changeOrigin: true },
      "/transactions": { target: "http://backend:8000", changeOrigin: true },
      "/users":        { target: "http://backend:8000", changeOrigin: true },
    },
  },
});
