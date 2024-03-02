import { defineConfig } from "@solidjs/start/config";
import uno from "unocss/vite";

export default defineConfig({
  ssr: true,
  server: {
    preset: process.env.DEVELOPMENT ? "node-server" : "cloudflare-pages-static",
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
  },
});
