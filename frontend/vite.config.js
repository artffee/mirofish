import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: "decision-lab-entry",
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url?.split("?")[0] === "/decision-lab")
            req.url = "/decision-lab.html";
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        decision: fileURLToPath(
          new URL("./decision-lab.html", import.meta.url),
        ),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: true,
    proxy: {
      // Preserve the browser Host so the local-only API can enforce same-origin POSTs.
      "/api/decision-lab": {
        target: "http://localhost:5001",
        changeOrigin: false,
      },
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
