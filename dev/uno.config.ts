import { defineConfig, presetUno, presetWebFonts } from "unocss";

export default defineConfig({
  presets: [
    presetUno(),
    presetWebFonts({
      provider: "google",
      fonts: {
        sans: "Noto Sans:300,400,500,600,700,800",
        mono: "Noto Sans Mono:300,400,500,600,700,800",
      },
    }),
  ],
});
