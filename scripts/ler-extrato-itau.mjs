// Lê o extrato Itaú (PDF do internet banking, colunas Data / Lançamentos / Razão Social /
// CNPJ/CPF / Valor / Saldo) e confere a soma corrida contra cada "SALDO TOTAL DISPONÍVEL DIA".
// Uso: node scripts/ler-extrato-itau.mjs <pdf> <saida.json>
import fs from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const [arquivo, saida] = process.argv.slice(2);
const moeda = (s) => Number(s.replace(/\./g, "").replace(",", "."));
const centavos = (v) => Math.round(v * 100);
const ehValor = (s) => /^-?[\d.]+,\d\d$/.test(s);

const pdf = await getDocument({ data: new Uint8Array(fs.readFileSync(arquivo)), verbosity: 0 }).promise;
const linhas = [];
let saldoAnterior = null;
const saldosDia = [];
for (let p = 1; p <= pdf.numPages; p++) {
  const itens = (await (await pdf.getPage(p)).getTextContent()).items
    .filter((i) => i.str.trim())
    .map((i) => ({ x: i.transform[4], fim: i.transform[4] + i.width, y: i.transform[5], t: i.str.trim() }));
  const ancoras = itens.filter((i) => i.x < 60 && /^\d\d\/\d\d\/\d{4}$/.test(i.t)).sort((a, b) => b.y - a.y);
  const grupos = ancoras.map((a) => ({ data: a.t, y: a.y, celulas: [] }));
  for (const i of itens) {
    if (i.x < 60 && /^\d\d\/\d\d\/\d{4}$/.test(i.t)) continue;
    if (i.y > (ancoras[0]?.y ?? 0) + 14) continue; // cabeçalho
    let melhor = null;
    for (const g of grupos) if (!melhor || Math.abs(g.y - i.y) < Math.abs(melhor.y - i.y)) melhor = g;
    if (melhor && Math.abs(melhor.y - i.y) <= 16) melhor.celulas.push(i);
  }
  for (const g of grupos) {
    const col = (min, max) => g.celulas.filter((c) => c.x >= min && c.x < max).sort((a, b) => b.y - a.y || a.x - b.x).map((c) => c.t).join(" ");
    const lancamento = col(80, 222);
    const numeros = g.celulas.filter((c) => c.x >= 440 && ehValor(c.t));
    const valorCel = numeros.find((c) => c.fim < 535);
    const saldoCel = numeros.find((c) => c.fim >= 535);
    if (/SALDO ANTERIOR/.test(lancamento)) { saldoAnterior = moeda(saldoCel.t); continue; }
    if (/SALDO TOTAL DISPON/.test(lancamento)) { saldosDia.push({ data: g.data, saldo: moeda(saldoCel.t), indice: linhas.length }); continue; }
    if (!valorCel) throw new Error(`Linha sem valor: p${p} ${g.data} ${lancamento}`);
    linhas.push({ seq: linhas.length + 1, pagina: p, data: g.data, lancamento, razaoSocial: col(222, 360), documento: col(360, 440), valor: moeda(valorCel.t) });
  }
}
let saldo = saldoAnterior;
let conferidos = 0;
for (const s of saldosDia) {
  const acumulado = saldoAnterior + linhas.slice(0, s.indice).reduce((t, l) => t + l.valor, 0);
  if (centavos(acumulado) !== centavos(s.saldo)) throw new Error(`Saldo do dia ${s.data} não fecha: calculado ${acumulado.toFixed(2)} x extrato ${s.saldo.toFixed(2)}`);
  conferidos++;
}
saldo = saldoAnterior + linhas.reduce((t, l) => t + l.valor, 0);
const entradas = linhas.filter((l) => l.valor > 0).reduce((t, l) => t + l.valor, 0);
const saidas = linhas.filter((l) => l.valor < 0).reduce((t, l) => t + l.valor, 0);
fs.writeFileSync(saida, JSON.stringify({ arquivo, saldoAnterior, saldoFinal: Math.round(saldo * 100) / 100, entradas, saidas, saldosDia, linhas }, null, 1));
console.log(`${arquivo}: ${linhas.length} lançamentos, saldo anterior ${saldoAnterior.toFixed(2)}, entradas ${entradas.toFixed(2)}, saídas ${saidas.toFixed(2)}, saldo final ${saldo.toFixed(2)}, ${conferidos}/${saldosDia.length} saldos diários conferidos`);
