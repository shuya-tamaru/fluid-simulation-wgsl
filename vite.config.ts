import { defineConfig } from "vite";
import { string } from "rollup-plugin-string";

export default defineConfig({
  plugins: [
    string({
      include: "**/*.wgsl",
    }),
  ],
});
