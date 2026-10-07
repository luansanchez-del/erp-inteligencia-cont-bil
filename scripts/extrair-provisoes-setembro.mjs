import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// Em 09/2026 o relatório de férias veio só com o total da empresa; o de 13º veio por funcionário.
const pasta = process.argv[2] ?? "C:/092026/FOLHA MATRIZ E FILIAL";
const fontes = [
  ["matriz", "ferias", "Provisao_Ferias_09.2026 - Matriz.pdf", 12],
  ["filial", "ferias", "Provisao_Ferias_09.2026 - Filial.pdf", 4],
  ["matriz", "decimo", "Provisao_13o_Salario 09.2026 - Matriz.pdf", 12],
  ["filial", "decimo", "Provisao_13o_Salario 09.2026 - Filial.pdf", 4],
];
const arred = (n) => Math.round(n * 100) / 100;
const numero = (s) => Number(s.replaceAll(".", "").replace(",", "."));
const dados = [];
for (const [unidade, tipo, arquivo, pessoas] of fontes) {
  const loading = getDocument({ data: new Uint8Array(fs.readFileSync(path.join(pasta, arquivo))) });
  const pdf = await loading.promise;
  const campos = tipo === "ferias" ? ["principal", "terco", "inss", "fgts", "pis"] : ["principal", "inss", "fgts", "pis"];
  const labels = tipo === "ferias"
    ? { anterior: "Saldo Anterior", ajuste: "Ajuste", mensal: "Provisão Mês", pago: "Pago", diferencaPagamento: "Diferença Pgto", transferencia: "Transf. Filial", saldo: "Saldo" }
    : { anterior: "Saldo Anterior", ajuste: "Ajuste", mensal: "Provisão Mês", saldo: "Saldo", pago: "Pago", diferencaPagamento: "Diferença Pgto" };
  function valores(texto, label, nomes = campos) {
    const expr = new RegExp(`(?:^|\\s)${label.replace(".", "\\.")}\\s+${nomes.map(() => "(-?[\\d.]+,\\d{2})").join("\\s+")}(?=\\s|$)`);
    const match = texto.match(expr);
    assert.ok(match, `${arquivo}: linha ${label} ausente`);
    return Object.fromEntries(nomes.map((nome, i) => [nome, numero(match[i + 1])]));
  }
  function linhas(texto) {
    const result = Object.fromEntries(Object.entries(labels).map(([key, label]) => [key, valores(texto, label)]));
    if (tipo === "decimo") {
      result.indenizacao = valores(texto, "Indenização", ["principal", "inss", "fgts"]);
      result.adiantamento = valores(texto, "Adiantamento", ["principal", "fgts"]);
      result.adiantamentoAnterior = valores(texto, "Adto Anterior", ["principal", "fgts"]);
    }
    return result;
  }
  const itens = [];
  let total;
  let totalFuncionarios;
  for (let pagina = 1; pagina <= pdf.numPages; pagina++) {
    const content = await (await pdf.getPage(pagina)).getTextContent();
    const texto = content.items.map((x) => x.str).join(" ").replace(/\s+/g, " ");
    assert.ok(texto.includes("09/2026"), `${arquivo}: competência não identificada`);
    const matches = [...texto.matchAll(/\b(3\d{4})\s+([A-ZÀ-Ü ]+?)\s+(\d{2}\/\d{2}\/\d{4})/g)];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const fim = Math.min(...[matches[i + 1]?.index, texto.indexOf("Total d", match.index)].filter((x) => x !== undefined && x >= 0), texto.length);
      itens.push({ matricula: match[1], nomeDocumento: match[2].trim(), pagina, ...linhas(texto.slice(match.index, fim)) });
    }
    const pos = texto.indexOf("Total da Empresa:");
    if (pos >= 0) {
      total = { pagina, ...linhas(texto.slice(pos)) };
      totalFuncionarios = Number(texto.slice(pos).match(/Total Func: (\d+)/)?.[1]);
    }
  }
  assert.ok(total, `${arquivo}: total ausente`);
  if (tipo === "ferias") assert.equal(totalFuncionarios, pessoas, `${arquivo}: quantidade de funcionários`);
  else {
    assert.equal(new Set(itens.map((x) => x.matricula)).size, pessoas);
    for (const categoria of Object.keys(labels)) {
      for (const campo of campos) {
        assert.equal(arred(itens.reduce((s, x) => s + x[categoria][campo], 0)), total[categoria][campo], `${arquivo}: ${categoria}/${campo}`);
      }
    }
  }
  for (const campo of campos) {
    assert.equal(arred(total.anterior[campo] + total.ajuste[campo] + total.mensal[campo] + (tipo === "ferias" ? total.pago[campo] + total.diferencaPagamento[campo] + total.transferencia[campo] : -total.pago[campo] - total.diferencaPagamento[campo])), total.saldo[campo], `${arquivo}: saldo ${campo}`);
  }
  const mensal = arred(Object.values(total.mensal).reduce((a, b) => a + b, 0));
  dados.push({ unidade, tipo, arquivo, competencia: "09/2026", itens, total });
  console.log(`${arquivo}: ${tipo === "ferias" ? `${totalFuncionarios} funcionários (só total)` : `${itens.length} funcionários`}, mensal ${mensal.toFixed(2)}, ajuste ${arred(Object.values(total.ajuste).reduce((a, b) => a + b, 0)).toFixed(2)}, totais conferidos`);
  await loading.destroy();
}
fs.writeFileSync("src/data/nitaplast-provisoes-setembro-documentos.ts", `// Gerado por scripts/extrair-provisoes-setembro.mjs a partir dos quatro PDFs de 09/2026.\n// Saldos e demais movimentos são memória documental; não geram partidas automaticamente.\nexport const documentosProvisoesSetembro = ${JSON.stringify(dados, null, 2)} as const;\n`);
