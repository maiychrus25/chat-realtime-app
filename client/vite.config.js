import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    allowedHosts: ["433e7f3ac972.ngrok-free.app"],
    // Bỏ allowedHosts và proxy
  },
});
