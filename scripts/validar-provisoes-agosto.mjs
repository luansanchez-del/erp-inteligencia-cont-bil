import assert from "node:assert/strict";
import { build } from "vite";

const result = await build({
  configFile: false, logLevel: "silent",
  build: { ssr: "src/data/nitaplast-razao-agosto.ts", write: false, minify: false, rollupOptions: { output: { format: "es" } } },
});
const { lancamentosIntegradosAgosto } = await import(`data:text/javascript;base64,${Buffer.from(result.output[0].code).toString("base64")}`);
const linhas = lancamentosIntegradosAgosto.filter((linha) => linha.id.startsWith("AGO-PROV-"));
const arred = (valor) => Math.round(valor * 100) / 100;
const esperado = [
  ["matriz", "ferias", 6837.99], ["filial", "ferias", 1741.65],
  ["matriz", "decimo", 4892.85], ["filial", "decimo", 1305.12],
];
for (const [unidade, tipo, total] of esperado) {
  const itens = linhas.filter((linha) => linha.id.startsWith(`AGO-PROV-${unidade}-${tipo}-`));
  assert.equal(arred(itens.reduce((soma, linha) => soma + linha.valor, 0)), total);
  assert.ok(itens.every((linha) => unidade === "filial" ? linha.cc === "502" : linha.cc !== "502"));
}
assert.equal(arred(linhas.reduce((soma, linha) => soma + linha.valor, 0)), 14777.61);
assert.equal(new Set(linhas.map((linha) => linha.id)).size, linhas.length);
const pares = new Map([["25057", "25237"], ["25058", "25230"], ["25059", "25238"], ["25060", "25229"]]);
for (const linha of linhas) {
  assert.equal(pares.get(linha.debitoCodigo), linha.creditoCodigo);
  assert.equal(linha.data, "31/08/2026");
  assert.equal(linha.rastreio, "documento");
  assert.ok(linha.valor > 0 && Number.isFinite(linha.valor));
  assert.ok(linha.fonte.includes(".pdf — página "));
  assert.equal(lancamentosIntegradosAgosto.filter((item) => item.id === linha.id).length, 1);
}
// Gleicy: férias do mês são documentadas, mas 13º do mês é zero na rescisão.
assert.equal(linhas.filter((linha) => linha.id.includes("-decimo-30355-")).length, 0);
assert.equal(arred(linhas.filter((linha) => linha.id.includes("-ferias-30355-")).reduce((soma, linha) => soma + linha.valor, 0)), 270.60);
// Jussara tem dois períodos de férias no PDF; o período quitado não gera nova provisão.
assert.equal(linhas.filter((linha) => linha.id.includes("-ferias-30323-")).length, 2);
console.log(`${linhas.length} partidas documentadas; R$ 14.777,61; matriz/filial, contas e integração conferidas.`);
