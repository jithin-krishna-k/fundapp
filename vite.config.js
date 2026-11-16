import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { port: 3000 },
  preview: {
    allowedHosts: ["fundapp.onrender.com"],
  },
  plugins: [tanstackStart({ srcDirectory: "src" }), react()],
});
