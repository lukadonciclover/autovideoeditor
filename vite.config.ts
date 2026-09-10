import { spawn, type ChildProcess } from "node:child_process";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function startMediaService(): Plugin {
  let mediaProcess: ChildProcess | null = null;
  return {
    name: "cutwise-media-service",
    apply: "serve",
    configureServer(server) {
      if (process.env.VITEST) return;
      mediaProcess = spawn(process.execPath, ["--import", "tsx", "server/index.ts"], {
        cwd: process.cwd(),
        stdio: "inherit",
        windowsHide: true,
      });
      server.httpServer?.once("close", () => {
        mediaProcess?.kill();
        mediaProcess = null;
      });
    },
  };
}

export default defineConfig({
  plugins: [startMediaService(), react()],
  server: {
    proxy: {
      "/api": "http://localhost:8787",
      "/media": "http://localhost:8787",
    },
  },
});
