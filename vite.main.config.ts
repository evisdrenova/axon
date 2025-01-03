import { defineConfig } from "vite";

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: ["better-sqlite3"],
    },
  },
  plugins: [
    {
      name: "configure-better-sqlite3",
      config: () => ({
        optimizeDeps: {
          exclude: ["better-sqlite3"],
        },
      }),
    },
  ],
});
