import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

export default defineConfig({
  // относительные пути нужны, чтобы index.html открывался через file:// в проде
  base: "./",
  plugins: [
    react(),
    electron([
      {
        // главный процесс
        entry: "electron/main.ts",
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              // нативный модуль не бандлим — резолвится из node_modules в рантайме
              external: ["better-sqlite3"],
            },
          },
        },
      },
      {
        // preload
        entry: "electron/preload.ts",
        onstart(args) {
          // перезагрузить окно при изменении preload в dev
          args.reload();
        },
        vite: {
          build: {
            outDir: "dist-electron",
          },
        },
      },
    ]),
    renderer(),
  ],
});
