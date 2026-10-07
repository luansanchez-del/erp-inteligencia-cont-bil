// Lê a "Relação dos Pagamentos Efetuados" do Softdib (PDF) pela posição das colunas.
// Uso: node scripts/ler-relacao-pagamentos.mjs <pdf> <saida.json>
// Cada linha é um rateio por CC; o JSON agrupa por fornecedor + documento/parcela + data + banco.
import fs from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const [arquivo, saida] = process.argv.slice(2);
const moeda = (s) => Number(s.replace(/[()+\s]/g, "").replace(/\./g, "").replace(",", "."));
const pdf = await getDocument({ data: new Uint8Array(fs.readFileSync(arquivo)), verbosity: 0 }).promise;
const linhas = [];
const naoLidas = [];
for (let p = 1; p <= pdf.numPages; p++) {
  const itens = (await (await pdf.getPage(p)).getTextContent()).items
    .filter((i) => i.str.trim())
    .map((i) => ({ x: i.transform[4], fim: i.transform[4] + i.width, y: i.transform[5], t: i.str.trim() }));
  const grupos = new Map();
  for (const i of itens) {
    const chave = [...grupos.keys()].find((k) => Math.abs(k - i.y) <= 2) ?? i.y;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(i);
  }
  for (const [, cel] of [...grupos].sort((a, b) => b[0] - a[0])) {
    cel.sort((a, b) => a.x - b.x);
    const inicio = cel[0]?.t ?? "";
    if (!/^\d{3} [A-Z]\d{5}-/.test(inicio)) continue;
    const texto = cel.map((c) => c.t).join(" ");
    const cabeca = texto.match(/^\d{3} ([A-Z]\d{5})-(.*?)\s?(\d+)\/(\d{1,3})\s/);
    const doc = cabeca ? { t: `${cabeca[3]}/${cabeca[4]}` } : null;
    const nomeCompleto = cabeca ? `${cabeca[1]}-${cabeca[2].trim()}` : inicio.replace(/^\d{3} /, "");
    const valorEm = (min, max) => cel.find((c) => c.fim > min && c.fim <= max && /^\(?\+?\)?\s*-?[\d.]+,\d\d$/.test(c.t.replace(/^\(\+\)\s*/, "")));
    const valorDoc = valorEm(180, 218);
    const acrescimo = valorEm(218, 250);
    const valorPago = cel.find((c) => c.fim > 280 && c.fim <= 326 && /[\d.]+,\d\d$/.test(c.t));
    const dataPagto = cel.find((c) => c.x >= 325 && c.x < 362 && /^\d\d\/\d\d\/\d{4}$/.test(c.t));
    const gerencial = cel.find((c) => c.x >= 395 && c.x < 470)?.t ?? "";
    const banco = (texto.match(/\b(B\d{5})\b/) ?? [])[1] ?? "";
    const cc = cel.find((c) => c.x >= 565)?.t ?? "";
    if (!doc || !valorPago || !dataPagto) { naoLidas.push({ p, texto }); continue; }
    linhas.push({
      pagina: p, codigo: nomeCompleto.split("-")[0], fornecedor: nomeCompleto.split("-").slice(1).join("-"),
      documento: doc.t.split("/")[0], parcela: doc.t.split("/")[1], valorDoc: valorDoc ? moeda(valorDoc.t) : null,
      acrescimo: acrescimo ? moeda(acrescimo.t) : 0, valorPago: moeda(valorPago.t.replace(/^\(\+\)\s*/, "")),
      dataPagto: dataPagto.t, gerencial: gerencial.replace(/\s*B\d{5}$/, ""), banco, cc,
    });
  }
}
const titulos = new Map();
for (const l of linhas) {
  const k = [l.codigo, l.documento, l.parcela, l.dataPagto, l.banco].join("|");
  const t = titulos.get(k) ?? { ...l, valorPago: 0, ccs: [] };
  t.valorPago = Math.round((t.valorPago + l.valorPago) * 100) / 100;
  t.ccs.push(l.cc);
  titulos.set(k, t);
}
const porBanco = {};
for (const t of titulos.values()) porBanco[t.banco] = Math.round(((porBanco[t.banco] ?? 0) + t.valorPago) * 100) / 100;
fs.writeFileSync(saida, JSON.stringify({ arquivo, titulos: [...titulos.values()], naoLidas }, null, 1));
console.log(`${linhas.length} linhas, ${titulos.size} títulos, ${naoLidas.length} não lidas`, porBanco);
for (const n of naoLidas.slice(0, 10)) console.log("  ?", n.p, n.texto.slice(0, 160));
