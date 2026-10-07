// Lê o extrato Bradesco (PDF) linha a linha conferindo o saldo corrido. Uso: node scripts/ler-extrato-bradesco.mjs <pdf> <saida.json>
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const [CAMINHO, SAIDA] = process.argv.slice(2);

const moeda = (s) => Number(s.replace(/\./g, "").replace(",", "."));
const centavos = (v) => Math.round(v * 100);

async function lerLinhas() {
  const pdf = await getDocument({ data: new Uint8Array(readFileSync(CAMINHO)), verbosity: 0 }).promise;
  const linhas = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const itens = (await (await pdf.getPage(p)).getTextContent()).items.filter((i) => i.str.trim());
    const grupos = new Map();
    for (const i of itens) {
      const y = Math.round(i.transform[5]);
      const chave = [...grupos.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave).push({ x: Math.round(i.transform[4]), t: i.str.trim() });
    }
    for (const [y, celulas] of [...grupos].sort((a, b) => b[0] - a[0])) linhas.push({ p, y, celulas: celulas.sort((a, b) => a.x - b.x) });
  }
  return linhas;
}

const soTexto = (l) => l.celulas.every((c) => c.x >= 100 && c.x < 250);

async function lerExtrato() {
  const linhas = await lerLinhas();
  const movimentos = [];
  let data = null;
  let saldo = null;
  let saldoInicial = null;
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    const texto = l.celulas.map((c) => c.t).join(" ");
    if (/Últimos Lançamentos/.test(texto)) break;
    if (/^Total\b/.test(texto)) continue;
    const celulaData = l.celulas.find((c) => c.x < 70 && /^\d\d\/\d\d\/\d{4}$/.test(c.t));
    if (celulaData) data = celulaData.t;
    if (/SALDO ANTERIOR/.test(texto)) { saldo = moeda(l.celulas.at(-1).t); saldoInicial = saldo; continue; }
    const celulaSaldo = l.celulas.find((c) => c.x >= 480 && /^-?[\d.]+,\d\d$/.test(c.t));
    const celulaValor = l.celulas.find((c) => c.x >= 300 && c.x < 480 && /^-?[\d.]+,\d\d$/.test(c.t));
    if (!celulaSaldo || !celulaValor) continue;
    const historico = l.celulas.filter((c) => c.x >= 100 && c.x < 250).map((c) => c.t);
    if (!historico.length) {
      const anterior = linhas[i - 1];
      const seguinte = linhas[i + 1];
      if (anterior && anterior.p === l.p && anterior.y - l.y <= 6 && soTexto(anterior)) historico.push(anterior.celulas.map((c) => c.t).join(" "));
      if (seguinte && seguinte.p === l.p && l.y - seguinte.y <= 6 && soTexto(seguinte)) historico.push(seguinte.celulas.map((c) => c.t).join(" "));
    }
    const valor = moeda(celulaValor.t);
    const saldoLinha = moeda(celulaSaldo.t);
    if (centavos(saldo + valor) !== centavos(saldoLinha)) throw new Error(`Saldo não fecha na linha ${movimentos.length + 1} (${data} ${historico.join(" / ")})`);
    saldo = saldoLinha;
    movimentos.push({ seq: movimentos.length + 1, data, dcto: l.celulas.find((c) => c.x >= 250 && c.x < 300)?.t ?? "", historico: historico.join(" / "), valor });
  }
  return { movimentos, saldoInicial, saldoFinal: saldo };
}

const { movimentos, saldoInicial, saldoFinal } = await lerExtrato();
const soma = (f) => movimentos.filter(f).reduce((t, m) => t + m.valor, 0);
writeFileSync(SAIDA, JSON.stringify({ arquivo: CAMINHO, saldoInicial, saldoFinal, movimentos }, null, 1));
console.log(`${CAMINHO}: ${movimentos.length} linhas, saldo inicial ${saldoInicial.toFixed(2)}, créditos ${soma((m) => m.valor > 0).toFixed(2)}, débitos ${soma((m) => m.valor < 0).toFixed(2)}, saldo final ${saldoFinal.toFixed(2)} (saldo corrido conferido em todas as linhas)`);
