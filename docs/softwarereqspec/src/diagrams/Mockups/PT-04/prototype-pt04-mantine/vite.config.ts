import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `pnpm build` produce dist/index.html: un solo file con JS e CSS inclusi, da aprire con un doppio clic.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
});
