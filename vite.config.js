import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    host: true,
    port: 3000,
    allowedHosts: ["armory-anemia-provoke.ngrok-free.dev"],
    hmr: { clientPort: 443 },
  },
  preview: {
    allowedHosts: [
      "fundapp.onrender.com",
      "armory-anemia-provoke.ngrok-free.dev",
    ],
  },
  plugins: [tanstackStart({ srcDirectory: "src" }), react()],
});
