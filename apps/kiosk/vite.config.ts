import { fileURLToPath, URL } from "node:url";
import { themeInitScript } from "@flick/ui/theme-script";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type PluginOption } from "vite";

function themeInit(): PluginOption {
  return {
    name: "flick-theme-init",
    transformIndexHtml() {
      return [
        {
          tag: "script",
          children: themeInitScript(),
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), themeInit()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
