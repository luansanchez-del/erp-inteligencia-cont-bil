import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const pasta = process.argv[2] ?? "C:/082026/FOLHA";
const fontes = [
  ["matriz", "ferias", "Provisao_Ferias - MATRIZ 08.2026.pdf", 6837.99, 12],
  ["filial", "ferias", "Provisao_Ferias - FILIAL 08.2026.pdf", 1741.65, 4],
  ["matriz", "decimo", "Provisao_13o_Salario - MATRIZ 08.2026.pdf", 4892.85, 12],
  ["filial", "decimo", "Provisao_13o_Salario - FILIAL 08.2026.pdf", 1305.12, 4],
];
const arred = (n) => Math.round(n * 100) / 100;
const numero = (s) => Number(s.replaceAll(".", "").replace(",", "."));
const dados = [];
for (const [unidade, tipo, arquivo, esperado, pessoas] of fontes) {
  const loading = getDocument({ data: new Uint8Array(fs.readFileSync(path.join(pasta, arquivo))) });
  const pdf = await loading.promise;
  const campos = tipo === "ferias" ? ["principal", "terco", "inss", "fgts", "pis"] : ["principal", "inss", "fgts", "pis"];
  const labels = { anterior: "Saldo Anterior", ajuste: "Ajuste", mensal: "Provisão Mês", pago: "Pago", diferencaPagamento: "Diferença Pgto", saldo: "Saldo" };
  function valores(texto, label, nomes = campos) {
    const expr = new RegExp(`(?:^|\\s)${label}\\s+${nomes.map(() => "(-?[\\d.]+,\\d{2})").join("\\s+")}(?=\\s|$)`);
    const match = texto.match(expr);
    assert.ok(match, `${arquivo}: linha ${label} ausente`);
    return Object.fromEntries(nomes.map((nome, i) => [nome, numero(match[i + 1])]));
  }
  function linhas(texto) {
    const result = Object.fromEntries(Object.entries(labels).map(([key, label]) => [key, valores(texto, label)]));
    if (tipo === "decimo") result.adiantamento = valores(texto, "Adiantamento", ["principal", "fgts"]);
    return result;
  }
  const itens = [];
  let total;
  for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
    const content = await (await pdf.getPage(pagina)).getTextContent();
    const texto = content.items.map((x) => x.str).join(" ").replace(/\s+/g, " ");
    assert.ok(texto.includes("08/2026"), `${arquivo}: competência não identificada`);
    const matches = [...texto.matchAll(/\b(3\d{4})\s+([A-ZÀ-Ü ]+?)\s+(\d{2}\/\d{2}\/\d{4})/g)];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      itens.push({ matricula: match[1], nomeDocumento: match[2].trim(), pagina, ...linhas(texto.slice(match.index, matches[i + 1]?.index)) });
    }
    const pos = texto.indexOf("Total da Empresa:");
    if (pos >= 0) total = { pagina, ...linhas(texto.slice(pos)) };
  }
  assert.ok(total, `${arquivo}: total ausente`);
  assert.equal(new Set(itens.map((x) => x.matricula)).size, pessoas);
  for (const categoria of Object.keys(labels)) {
    for (const campo of campos) {
      assert.equal(arred(itens.reduce((s, x) => s + x[categoria][campo], 0)), total[categoria][campo], `${arquivo}: ${categoria}/${campo}`);
    }
  }
  assert.equal(arred(Object.values(total.mensal).reduce((a, b) => a + b, 0)), esperado);
  dados.push({ unidade, tipo, arquivo, competencia: "08/2026", itens, total });
  console.log(`${arquivo}: ${itens.length} períodos aquisitivos, mensal ${esperado.toFixed(2)}, totais conferidos`);
  await loading.destroy();
}
fs.writeFileSync("src/data/nitaplast-provisoes-agosto-documentos.ts", `// Gerado por scripts/extrair-provisoes-agosto.mjs a partir dos quatro PDFs de 08/2026.\n// Saldos e demais movimentos são memória documental; não geram partidas automaticamente.\nexport const documentosProvisoesAgosto = ${JSON.stringify(dados, null, 2)} as const;\n`);
