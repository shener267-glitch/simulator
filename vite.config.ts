/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves this repo from https://<user>.github.io/simulator/, so the
// production build needs that prefix; the dev server stays at the root.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/simulator/" : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setupTests.ts"],
  },
}));
