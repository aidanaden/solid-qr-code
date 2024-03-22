import { defineConfig } from "@solidjs/start/config";
import uno from "unocss/vite";

export default defineConfig({
  ssr: true,
  server: {
    preset: process.env.DEVELOPMENT ? "node-server" : "cloudflare-pages",
    // We will need to enable CF Pages node compatiblity
    // https://developers.cloudflare.com/workers/runtime-apis/nodejs/asynclocalstorage/
    rollupConfig: {
      external: ["node:async_hooks"],
    },
  },
  vite: {
    ssr: {
      optimizeDeps: {
        include: ["prismjs"],
      },
      noExternal: ["prismjs"],
    },
    optimizeDeps: {
      include: ["prismjs"],
    },
    plugins: [uno()],
    build: {
      rollupOptions: {
        external: ["prismjs"],
      },
    },
  },
});
