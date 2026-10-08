import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// GitHub Pages serves the site under /skin-advisor-ops/. The hash router keeps deep links working.
export default defineConfig({
  base: "/skin-advisor-ops/",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: {
    // Split the heavy vendors so the main bundle stays under the chunk size warning.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: "effect", test: /node_modules\/effect\// },
            { name: "charts", test: /node_modules\/(recharts|d3-|victory-|@reduxjs|immer|redux)/ },
            { name: "tanstack", test: /node_modules\/@tanstack\// },
            {
              name: "react",
              test: /node_modules\/(react|react-dom|scheduler|motion|framer-motion)\//,
            },
          ],
        },
      },
    },
  },
});
