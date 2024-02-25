import { defineConfig } from "@solidjs/start/config";
import uno from "unocss/vite";

export default defineConfig({
  start: {
    ssr: true,
    server: {
      preset: "cloudflare-pages-static",
    },
  },
  ssr: {
    optimizeDeps: {
      include: ["prismjs"],
    },
    noExternal: ["prismjs"],
  },
  plugins: [uno()],
  optimizeDeps: {
    include: ["prismjs"],
  },
});
