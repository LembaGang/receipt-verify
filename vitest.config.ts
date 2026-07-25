import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // src/ uses NodeNext-style relative imports ("./x.js") that point at .ts
    // sources. Strip the extension so Vite resolves them to the TypeScript file.
    alias: [{ find: /^(\.{1,2}\/.*)\.js$/, replacement: "$1" }],
  },
  test: {
    include: ["test/**/*.test.ts"],
    environment: "node",
  },
});
