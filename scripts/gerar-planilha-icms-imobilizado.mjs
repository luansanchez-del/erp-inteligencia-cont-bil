import { build } from "vite";

const result = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    ssr: "scripts/gerar-planilha-icms-imobilizado-entry.ts",
    write: false,
    minify: false,
    rollupOptions: { output: { format: "es" } },
  },
});

const code = result.output[0].code;
await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
