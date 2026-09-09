import { build } from "vite";

const resultado = await build({
  configFile: false,
  logLevel: "silent",
  build: {
    ssr: "scripts/auditar-fechamento-agosto-entry.ts",
    write: false,
    minify: false,
    rollupOptions: { treeshake: false, output: { format: "es" } },
  },
});
const codigo = resultado.output[0].code;
await import(`data:text/javascript;base64,${Buffer.from(codigo).toString("base64")}`);
