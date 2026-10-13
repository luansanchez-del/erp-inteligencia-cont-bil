// Gera src/data/nitaplast-juros-descontos-setembro.ts — juros e descontos de 09/2026.
//
// Os bancos (gerar-itau/bradesco-setembro.mjs) baixam Fornecedores (1496) e Duplicatas a Receber (25111)
// pelo valor pago/recebido. A diferença para o valor do título é juro ou desconto:
//  - Pagamentos (PAGAMENTOS 092026.csv, colunas Juros Pagos e Desconto Auferido), só títulos baixados na 1496:
//      desconto obtido: D 1496 / C 4927; juro pago: D 25103 / C 1496.
//  - Recebimentos (Títulos Liquidados "Recebidos 01-09 a 30-09.pdf"), títulos recebidos no banco:
//      juro recebido: D 25111 / C 25095; desconto concedido: D 25106 / C 25111.
//    Recebimento parcial (o restante do título continua em aberto) não é desconto e fica de fora.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PAGAMENTOS = "C:/092026/PAGAMENTOS 092026.csv";
const RECEBIDOS = "C:/092026/EXTRATOS 092026/Recebidos 01-09 a 30-09.pdf";
const BANCOS = ["src/data/nitaplast-itau-setembro.ts", "src/data/nitaplast-bradesco-6349-setembro.ts", "src/data/nitaplast-bancos-setembro.ts"];
const SAIDA = "src/data/nitaplast-juros-descontos-setembro.ts";

const arred = (v) => Math.round(v * 100) / 100;
const num = (s = "") => { const t = s.trim(); return (Number(t.replace(/-$/, "").replace(/\./g, "").replace(",", ".")) || 0) * (t.endsWith("-") ? -1 : 1); };

// ---------- Pagamentos ----------
const bancos = BANCOS.map((f) => readFileSync(f, "utf8")).join("\n");
const pagamentos = [];
for (const linha of readFileSync(PAGAMENTOS, "latin1").split(/\r?\n/).slice(1)) {
  const c = linha.split(";");
  if (c.length < 26) continue;
  const juros = num(c[21]) + num(c[22]);
  const desconto = num(c[24]);
  if (!juros && !desconto) continue;
  const [codigo, ...nome] = c[3].trim().split("-");
  const [doc, parc] = c[4].trim().split("/");
  // Só títulos que o banco baixou contra Fornecedores (título com nota); os pagos direto na despesa já saem líquidos.
  const naFornecedores = new RegExp(`"${codigo} ${Number(doc)}/${Number(parc)}","[^"]*",-?[0-9.]+,"1496"`).test(bancos)
    || (codigo === "T00766" && /Campinense[^\n]*"1496"|"1496"[^\n]*Campinense/.test(bancos));
  if (!naFornecedores) continue;
  pagamentos.push({ data: c[10].trim(), codigo, fornecedor: nome.join("-").trim(), documento: c[4].trim(), titulo: num(c[6]), pago: num(c[9]), juros: arred(juros), desconto: arred(desconto) });
}

// ---------- Recebimentos ----------
const txt = `${process.env.TEMP ?? "."}/recebidos-setembro.txt`;
writeFileSync(txt, execFileSync("node", ["scripts/extrair-pdf-texto.mjs", RECEBIDOS], { maxBuffer: 64 * 1024 * 1024 }));
const texto = readFileSync(txt, "utf8");
const n = (v) => Number(v.replace(/\./g, "").replace(",", "."));
const titulos = [];
for (const p of texto.split(/(?=[CF]\d{5}-)/).slice(1)) {
  const m = p.match(/^([CF]\d{5})-(.{1,22}?)\s+(\d{3})\s+(\w{2})\s+(\S+)\s+(\d{3})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}\/\d{2}\/\d{4})\s+(.*?)\s+(B\d{5}|CART|C\d{5})?\s*(\*?\d{2})\s+(\d{2})\b/);
  if (!m) throw new Error(`Título não reconhecido: ${p.slice(0, 120)}`);
  let nums = m[10].trim().split(/\s+/).filter(Boolean);
  if (nums.length && /^-?\d+$/.test(nums[0])) nums = nums.slice(1);
  const v = nums.map(n);
  let juros = 0, desconto = 0;
  if (v.length === 2 && v[1] > v[0]) juros = v[1] - v[0];
  if (v.length === 3 && Math.abs(v[0] + v[1] - v[2]) < 0.011) juros = v[1];
  if (v.length === 3 && Math.abs(v[0] - v[1] - v[2]) < 0.011 && v[2] > 0) desconto = v[1];
  titulos.push({ cliente: m[1], nome: m[2].trim(), numero: m[5], parcela: m[6], recto: m[9], dup: v[0], juros: arred(juros), desconto: arred(desconto), valores: v });
}
const totalDup = arred(titulos.reduce((t, x) => t + x.dup, 0));
if (Math.abs(totalDup - 3_692_532.61) > 0.01) throw new Error(`Títulos liquidados: ${totalDup} x 3.692.532,61 do relatório`);

// ---------- Saída ----------
const linhas = [];
for (const p of pagamentos) {
  if (p.desconto) linhas.push({ data: p.data, debito: "1496", credito: "4927", valor: p.desconto, historico: `Desconto obtido — ${p.fornecedor}, título ${p.documento}`, obs: `Título R$ ${p.titulo.toFixed(2)}, pago R$ ${p.pago.toFixed(2)}; o banco baixou Fornecedores pelo valor pago.`, fonte: "PAGAMENTOS 092026.csv (Desconto Auferido)" });
  if (p.juros) linhas.push({ data: p.data, debito: "25103", credito: "1496", valor: p.juros, historico: `Juros pagos — ${p.fornecedor}, título ${p.documento}`, obs: `Título R$ ${p.titulo.toFixed(2)}, pago R$ ${p.pago.toFixed(2)}.`, fonte: "PAGAMENTOS 092026.csv (Juros Pagos)" });
}
for (const t of titulos) {
  if (t.juros) linhas.push({ data: t.recto, debito: "25111", credito: "25095", valor: t.juros, historico: `Juros recebidos — ${t.cliente} ${t.nome}, título ${t.numero}-${t.parcela}`, obs: `Duplicata R$ ${t.dup.toFixed(2)}; o banco baixou Duplicatas a Receber pelo valor recebido, com os juros.`, fonte: "Recebidos 01-09 a 30-09.pdf (Títulos Liquidados)" });
  if (t.desconto) linhas.push({ data: t.recto, debito: "25106", credito: "25111", valor: t.desconto, historico: `Desconto concedido — ${t.cliente} ${t.nome}, título ${t.numero}-${t.parcela}`, obs: `Duplicata R$ ${t.dup.toFixed(2)} liquidada com desconto.`, fonte: "Recebidos 01-09 a 30-09.pdf (Títulos Liquidados)" });
}

const q = JSON.stringify;
const conteudo = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

// Arquivo gerado por scripts/gerar-juros-descontos-setembro.mjs — não editar à mão.
type Linha = readonly [data: string, debito: string, credito: string, valor: number, historico: string, observacao: string, fonte: string];

const linhas: Linha[] = [
${linhas.map((l) => `  [${[l.data, l.debito, l.credito, l.valor, l.historico, l.obs, l.fonte].map(q).join(", ")}],`).join("\n")}
];

const nome = (codigo: string) => \`\${codigo} - \${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}\`;

export const lancamentosJurosDescontosSetembro: LancamentoIntegrado[] = linhas.map(([data, debito, credito, valor, historico, observacao, fonte], i) => ({
  id: \`SET-JUROS-\${String(i + 1).padStart(3, "0")}\`,
  data,
  origem: "JUROS E DESCONTOS 09/2026",
  debitoCodigo: debito,
  debito: nome(debito),
  creditoCodigo: credito,
  credito: nome(credito),
  historico,
  documento: historico.split("título ")[1] ?? "",
  cc: "0",
  centroCusto: "SEM CENTRO DE CUSTO",
  valor,
  status: "validado",
  observacao,
  rastreio: "documento",
  fonte,
}));
`;
writeFileSync(SAIDA, conteudo, "utf8");
const soma = (d, c) => arred(linhas.filter((l) => l.debito === d && l.credito === c).reduce((t, l) => t + l.valor, 0));
console.log(JSON.stringify({ descontosObtidos: soma("1496", "4927"), jurosPagos: soma("25103", "1496"), jurosRecebidos: soma("25111", "25095"), descontosConcedidos: soma("25106", "25111"), pagamentos: pagamentos.map((p) => `${p.fornecedor} ${p.documento} j${p.juros} d${p.desconto}`) }, null, 1));
