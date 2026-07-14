import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/auth": "http://nginx:80",
      "/profiles": "http://nginx:80",
      "/workouts": "http://nginx:80",
      "/stats": "http://nginx:80",
    },
  },
});
