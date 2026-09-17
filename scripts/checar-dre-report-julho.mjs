import { build } from "vite";
import { fileURLToPath, pathToFileURL } from "node:url";
import { writeFileSync, unlinkSync } from "node:fs";

const srcDir = fileURLToPath(new URL("../src", import.meta.url));

const resultado = await build({
  configFile: false,
  logLevel: "silent",
  resolve: { alias: { "@": srcDir } },
  build: {
    ssr: "scripts/checar-dre-report-julho-entry.ts",
    write: false,
    minify: false,
    rollupOptions: { treeshake: false, output: { format: "es" } },
  },
});
const entryChunk = resultado.output.find((o) => o.isEntry) ?? resultado.output[0];
const tmpFile = new URL("./__checar-dre-report-julho.tmp.mjs", import.meta.url);
writeFileSync(tmpFile, entryChunk.code);
try {
  await import(pathToFileURL(fileURLToPath(tmpFile)).href);
} finally {
  unlinkSync(tmpFile);
}
