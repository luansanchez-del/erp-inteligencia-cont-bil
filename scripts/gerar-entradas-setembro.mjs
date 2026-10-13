// Gera src/data/nitaplast-entradas-setembro.ts — notas de entrada de 09/2026 (Matriz e Filial SP).
//
// Fontes:
//  - Questor (ENTRADAS - NITAPLAST MATRIZ.xlsx): lista oficial das notas da Matriz. Toda nota do Questor entra.
//  - Softdib (RELATORIO CENTRO DE CUSTO ENTRADAS ... 092026.csv): conta gerencial e rateio por centro de custo.
//    Linhas sem número de nota são continuação do rateio da linha anterior (notas com mais de 4 CCs).
//  - Filial: o Questor da Filial só tem as notas fiscais de mercadoria (sem os serviços), então a base da
//    Filial é o relatório do Softdib, como em agosto.
//
// Valor: o da nota completa. Quando a nota está nas duas fontes, o Softdib traz o total da nota (produto +
// frete + despesas + IPI) e o Questor traz o valor do item; as diferenças conferidas estão em `diferencas`.
// Conta: mapa conta gerencial + CC herdado de agosto (scripts/gerar-despesas-documentais-agosto.mjs),
// com os complementos de setembro. Crédito em Fornecedores (1496), salvo energia (25218) e importação (25116).
//
// Fora daqui: devoluções de venda (receitas), transferências entre estabelecimentos (CPV), retornos de
// industrialização sem cobrança (NOP 1902, 1903 e 1925 — o material já é da empresa).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const QUESTOR_MATRIZ = "C:/092026/ENTRADAS - NITAPLAST MATRIZ.xlsx";
const SOFTDIB_MATRIZ = "C:/092026/NITAPLAST - SET 26/RELATORIO CENTRO DE CUSTO ENTRADAS NITAPLAST 092026.csv";
const SOFTDIB_FILIAL = "C:/092026/FILIAL - SET 26/ENTRADAS SOFTDIB POR CENTRO DE CUSTO NITAPLAST FILIAL 092026.csv";
const SAIDA = "src/data/nitaplast-entradas-setembro.ts";

const num = (t) => (typeof t === "number" ? t : Number(String(t ?? "").trim().replace(/\./g, "").replace(",", ".")) || 0);
const limpo = (t = "") => String(t).trim().replace(/\s+/g, " ");
const cent = (v) => Math.round(v * 100);
const arred = (v) => Math.round(v * 100) / 100;
const normCc = (t) => (/^\d+$/.test(limpo(t)) ? String(Number(limpo(t))) : limpo(t));

// ---------- Softdib: notas com linhas por conta gerencial e rateio por CC ----------
function lerSoftdib(arquivo) {
  const linhas = readFileSync(arquivo, "latin1").split(/\r?\n/).slice(1).filter((l) => l.trim());
  const notas = [];
  let ultima = null;
  for (const texto of linhas) {
    const c = texto.split(";");
    const ccs = [];
    for (const i of [84, 87, 90, 93]) {
      const v = num(c[i + 2]);
      if (limpo(c[i]) && v) ccs.push({ cc: normCc(c[i]), centro: limpo(c[i + 1]), valor: v });
    }
    const numero = Number(limpo(c[2]));
    if (!numero) {
      if (ultima && ccs.length) ultima.ccs.push(...ccs);
      continue;
    }
    const [codigo, ...nome] = limpo(c[6]).split(" -");
    const linha = {
      data: limpo(c[0]), numero, serie: limpo(c[3]), codigo: limpo(codigo), fornecedor: limpo(nome.join(" -")),
      nop: limpo(c[8]), totalNota: num(c[40]), gerencial: limpo(c[81]), descGerencial: limpo(c[82]),
      valor: num(c[83]), ccs,
    };
    ultima = linha;
    const chave = `${numero}|${linha.codigo}`;
    let nota = notas.find((n) => n.chave === chave);
    if (!nota) notas.push((nota = { chave, numero, codigo: linha.codigo, fornecedor: linha.fornecedor, data: linha.data, serie: linha.serie, totalNota: linha.totalNota, linhas: [], impostos: { icms: num(c[52]), ipi: num(c[55]), pis: num(c[56]), cofins: num(c[57]) } }));
    nota.linhas.push(linha);
  }
  for (const n of notas) n.total = arred(n.linhas.reduce((t, l) => t + l.valor, 0));
  return notas;
}

// ---------- Questor: notas da Matriz ----------
const tmp = `${process.env.TEMP ?? "."}/questor-entradas-matriz-setembro.json`;
execFileSync("python", ["scripts/xlsx-para-json.py", QUESTOR_MATRIZ, tmp], { stdio: "ignore" });
const questorLinhas = JSON.parse(readFileSync(tmp, "utf8"));
const questor = new Map();
for (const r of questorLinhas.slice(1)) {
  if (!r[0]) continue;
  const chave = `${Number(r[0])}|${limpo(r[5])}`;
  const nota = questor.get(chave) ?? { numero: Number(r[0]), serie: limpo(r[2]), data: limpo(r[4]), fornecedor: limpo(r[5]), naturezas: new Set(), valor: 0, ipi: 0 };
  nota.naturezas.add(limpo(r[7]));
  nota.valor += num(r[14]);
  nota.ipi += num(r[17]);
  questor.set(chave, nota);
}
for (const n of questor.values()) { n.valor = arred(n.valor); n.ipi = arred(n.ipi); n.natureza = [...n.naturezas].join("/"); }

// ---------- Cruzamento Questor x Softdib ----------
const palavras = (s) => s.normalize("NFD").replace(/[^A-Z0-9 ]/gi, " ").toUpperCase().split(/\s+/).filter((w) => w.length > 2 && !["LTDA", "DOS", "DAS", "COM", "IND", "SERVICOS", "COMERCIO", "BRASIL"].includes(w));
const parecido = (a, b) => { const B = new Set(palavras(b)); return palavras(a).some((w) => B.has(w)); };
const mesmoNumero = (q, s) => s === q || s === q * 100 || (String(s).startsWith(String(q)) && String(s).length - String(q).length <= 2);
const mesmoValor = (q, s) => [q.valor, q.valor + q.ipi].some((v) => Math.abs(v - s.total) < 0.05);

const softdibMatriz = lerSoftdib(SOFTDIB_MATRIZ);
const usados = new Set();
const pares = [];
const tentativas = [
  (q, s) => mesmoNumero(q.numero, s.numero) && parecido(q.fornecedor, s.fornecedor) && mesmoValor(q, s),
  (q, s) => mesmoNumero(q.numero, s.numero) && (parecido(q.fornecedor, s.fornecedor) || mesmoValor(q, s)),
  // Mesmo número longo (NFS-e) ou nota de importação emitida pela própria empresa (U01001): o nome muda
  // (Sodexo virou Pluxee; o Softdib registra a Nitaplast como emitente da nota de importação).
  (q, s) => s.numero === q.numero && (String(q.numero).length >= 6 || s.codigo === "U01001"),
  (q, s) => parecido(q.fornecedor, s.fornecedor) && mesmoValor(q, s) && q.valor > 0,
];
const pendentesQuestor = [...questor.values()];
for (const regra of tentativas) {
  for (const q of [...pendentesQuestor]) {
    const s = softdibMatriz.find((x) => !usados.has(x.chave) && regra(q, x));
    if (!s) continue;
    usados.add(s.chave);
    pares.push({ q, s });
    pendentesQuestor.splice(pendentesQuestor.indexOf(q), 1);
  }
}
const soSoftdib = softdibMatriz.filter((s) => !usados.has(s.chave));

// ---------- Mapa conta gerencial + CC -> conta contábil ----------
const producao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503", "10014", "10029", "10032", "10058", "10061", "19999"]);
const comercial = new Set(["201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "501", "502", "505"]);
const administrativo = new Set(["301", "302", "303", "304", "305", "306", "308", "504"]);
const veiculos = (cc) => /^4\d\d$/.test(cc);
const area = (cc) => (producao.has(cc) ? "P" : comercial.has(cc) ? "C" : administrativo.has(cc) ? "A" : "?");

// [débito, crédito] ou null (fora deste arquivo) ou undefined (sem regra).
function mapa(l, cc, estab) {
  const g = l.gerencial;
  const a = area(cc);
  if (["11.01.008", "11.03.002", "01.01.001"].includes(g) || ["1902", "1903", "1925", "2151", "2152"].includes(l.nop)) return null;
  if (g === "11.01.001") return estab === "F" ? ["25139", "1496"] : ["3035", "1496"];
  if (g === "11.01.002") return ["3244", "1496"];
  if (g === "11.01.003") return l.nop.startsWith("3") ? ["3093", "25116"] : ["3093", "1496"];
  if (g === "11.02.001") return ["25937", "1496"];
  if (g === "11.02.002" || g === "11.02.003") return ["25938", "1496"];
  if (g === "11.04.014" || g === "11.90.004") return ["25070", "1496"];
  if (g === "11.90.001") return estab === "F" ? ["25139", "1496"] : ["3095", "1496"];
  if (g === "11.90.003") return ["4253", "1496"];
  if (g === "12.03.001") return a === "P" || a === "C" ? ["4028", "1496"] : ["4342", "1496"];
  if (g === "12.03.002") return a === "P" ? ["3203", "1496"] : a === "C" ? ["4023", "1496"] : ["4337", "1496"];
  if (g === "12.03.003") return ["5799", "1496"];
  if (g === "12.03.007") return ["4038", "1496"];
  if (g === "12.03.008") return ["25056", "1496"];
  if (g === "13.02.001" || g === "15.02.016" || g === "20.01.001") return ["4189", "1496"];
  if (g === "13.02.004") return veiculos(cc) ? ["4215", "1496"] : ["4431", "1496"];
  if (g === "13.02.007") return ["25071", "1496"];
  if (g === "13.03.013") return ["25061", "1496"];
  if (g === "14.03.001" || g === "14.03.006") return ["4253", "1496"];
  if (g === "15.01.001") return ["4115", "1496"];
  if (g === "15.01.002") return ["4405", "1496"];
  if (g === "15.01.005") return ["25063", "1496"];
  if (g === "15.01.008") return ["4085", "1496"];
  if (g === "15.02.012" || g === "15.02.034") return ["4546", "1496"];
  if (g === "15.02.015") return a === "P" ? ["3244", "1496"] : a === "C" ? ["25064", "1496"] : veiculos(cc) ? ["25028", "1496"] : ["4912", "1496"];
  if (g === "15.02.018") return ["4547", "1496"];
  if (g === "15.02.020") return a === "P" ? ["3494", "25218"] : a === "C" ? ["4185", "25218"] : ["4477", "25218"];
  if (g === "15.02.050") return ["25074", "1496"];
  if (g === "15.03.001") return ["4213", "1496"];
  if (g === "15.03.002") return ["4215", "1496"];
  if (g === "15.03.006") return ["4544", "1496"];
  return undefined;
}

// ---------- Lançamentos ----------
const lancamentos = [];
const excluidos = [];
const semRegra = [];
const diferencas = [];
// Créditos de entrada por conta: impostos de cada nota (Softdib) rateados pela conta de cada parcela da nota.
// Parcelas fora deste arquivo levam o crédito para a conta do fato: devolução de venda (25943),
// transferência entre estabelecimentos (25140) ou o NOP do retorno (para conferência).
const creditos = { M: {}, F: {} };
function acumularCredito(estab, s, valorParte, conta) {
  if (!s.impostos || !s.total) return;
  const alvo = (creditos[estab][conta] ??= { icms: 0, ipi: 0, pis: 0, cofins: 0 });
  // IPI só gera crédito na indústria (Matriz) e fora de uso e consumo; a Filial (comércio) só o recupera na devolução.
  const semIpi = (estab === "F" && conta !== "25943") || s.linhas.every((l) => ["1407", "1556", "1653", "2556"].includes(l.nop));
  for (const k of Object.keys(alvo)) if (!(k === "ipi" && semIpi)) alvo[k] += (s.impostos[k] * valorParte) / s.total;
}
const contaExcluida = (l) => (l.gerencial === "11.01.008" ? "25943" : ["11.03.002", "01.01.001"].includes(l.gerencial) || ["2151", "2152"].includes(l.nop) ? "25140" : `NOP ${l.nop}`);

function lancarNotaSoftdib(s, estab, q) {
  for (const l of s.linhas) {
    const partes = [...l.ccs];
    const rateado = arred(partes.reduce((t, p) => t + p.valor, 0));
    if (l.valor - rateado > 0.009) partes.push({ cc: "0", centro: "SEM CENTRO DE CUSTO", valor: arred(l.valor - rateado), residual: true });
    for (const p of partes) {
      const m = mapa(l, p.cc, estab);
      if (m === null) { excluidos.push({ s, l, p }); acumularCredito(estab, s, p.valor, contaExcluida(l)); continue; }
      const conta = m ?? ["4859", "1496"];
      if (!m) semRegra.push({ s, l, p });
      acumularCredito(estab, s, p.valor, conta[0]);
      lancamentos.push({
        estab, data: q?.data ?? s.data, numero: s.numero, serie: s.serie, codigo: s.codigo, fornecedor: q?.fornecedor ?? s.fornecedor,
        nop: l.nop, gerencial: l.gerencial, descGerencial: l.descGerencial, cc: p.cc, centro: p.centro, valor: arred(p.valor),
        debito: conta[0], credito: conta[1], revisar: !m || !q && estab === "M",
        obs: [
          !m ? `Conta gerencial ${l.gerencial} sem regra de conta — na transitória até classificar.` : `Conta gerencial ${l.gerencial} (${l.descGerencial}), CC ${p.cc}.`,
          p.residual ? "Parcela sem CC no rateio do Softdib." : "",
          q ? (cent(q.valor) === cent(s.total) ? "Valor igual no Questor." : `Questor ${q.valor.toFixed(2)}${q.ipi ? ` + IPI ${q.ipi.toFixed(2)}` : ""}; vale o total da nota.`) : estab === "M" ? "Nota não localizada no Questor de setembro — conferir o lançamento no Questor." : "",
        ].filter(Boolean).join(" "),
        fonte: q ? "Questor ENTRADAS - NITAPLAST MATRIZ.xlsx + Softdib RELATORIO CENTRO DE CUSTO ENTRADAS 092026" : estab === "M" ? "Softdib RELATORIO CENTRO DE CUSTO ENTRADAS 092026" : "Softdib ENTRADAS POR CENTRO DE CUSTO FILIAL 092026",
      });
    }
  }
}

for (const { q, s } of pares) {
  if (!mesmoValor(q, s)) diferencas.push({ numero: q.numero, fornecedor: q.fornecedor, questor: q.valor, ipi: q.ipi, softdib: s.total });
  lancarNotaSoftdib(s, "M", q);
}
for (const s of soSoftdib) lancarNotaSoftdib(s, "M", null);
// Notas só do Questor cuja despesa o banco já reconheceu no pagamento (título sem entrada no Softdib).
const despesaJaNoBanco = new Map([[1274652, "Telefônica R$ 54,47: despesa reconhecida no pagamento do Itaú (4478)."]]);
const foraPorBanco = [];
for (const q of pendentesQuestor) {
  if (despesaJaNoBanco.has(q.numero)) { foraPorBanco.push({ numero: q.numero, fornecedor: q.fornecedor, valor: q.valor, motivo: despesaJaNoBanco.get(q.numero) }); continue; }
  const servico = q.natureza.startsWith("8");
  lancamentos.push({
    estab: "M", data: q.data, numero: q.numero, serie: q.serie, codigo: "", fornecedor: q.fornecedor, nop: q.natureza, gerencial: "", descGerencial: "",
    cc: "0", centro: "SEM CENTRO DE CUSTO", valor: q.valor, debito: servico ? "25938" : "4859", credito: "1496", revisar: true,
    obs: `Nota só no Questor (natureza ${q.natureza}); sem conta gerencial nem CC no Softdib.${servico ? " Serviço tomado — Serviços de Terceiros PJ." : " Na transitória até classificar."}`,
    fonte: "Questor ENTRADAS - NITAPLAST MATRIZ.xlsx",
  });
}
for (const s of lerSoftdib(SOFTDIB_FILIAL)) lancarNotaSoftdib(s, "F", null);

// ---------- Conferências ----------
const soma = (lista) => arred(lista.reduce((t, x) => t + x.valor, 0));
const totalSoftdibMatriz = arred(softdibMatriz.reduce((t, s) => t + s.total, 0));
const totalLancadoMatriz = soma(lancamentos.filter((x) => x.estab === "M"));
const totalExcluidoMatriz = arred(excluidos.filter((x) => x.s && softdibMatriz.includes(x.s)).reduce((t, x) => t + x.p.valor, 0));
const totalSoQuestor = arred(soma(pendentesQuestor) - soma(foraPorBanco));
if (cent(totalLancadoMatriz) !== cent(totalSoftdibMatriz - totalExcluidoMatriz + totalSoQuestor)) {
  throw new Error(`Matriz não fecha: lançado ${totalLancadoMatriz} x Softdib ${totalSoftdibMatriz} - excluído ${totalExcluidoMatriz} + só Questor ${totalSoQuestor}`);
}

// ---------- Saída ----------
const q = (v) => JSON.stringify(v);
const tuplas = lancamentos
  .map((x) => `  [${[x.estab, x.data, x.numero, x.serie, x.codigo, x.fornecedor, x.nop, x.gerencial, x.descGerencial, x.cc, x.centro, x.valor, x.debito, x.credito, x.revisar ? 1 : 0, x.obs, x.fonte].map(q).join(", ")}],`)
  .join("\n");

const porConta = {};
for (const x of lancamentos) porConta[x.debito] = arred((porConta[x.debito] ?? 0) + x.valor);

const conteudo = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

// Arquivo gerado por scripts/gerar-entradas-setembro.mjs — não editar à mão.
// Notas de entrada de 09/2026: Questor (lista oficial da Matriz) + Softdib (conta gerencial e CC).
type NotaEntrada = readonly [
  estab: "M" | "F", data: string, numero: number, serie: string, codigo: string, fornecedor: string, nop: string,
  gerencial: string, descGerencial: string, cc: string, centro: string, valor: number, debito: string, credito: string,
  revisar: 0 | 1, observacao: string, fonte: string,
];

const notas: NotaEntrada[] = [
${tuplas}
];

const nome = (codigo: string) => \`\${codigo} - \${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}\`;

export const lancamentosEntradasSetembro: LancamentoIntegrado[] = notas.map((n, indice) => {
  const [estab, data, numero, serie, codigo, fornecedor, nop, gerencial, descGerencial, cc, centro, valor, debito, credito, revisar, observacao, fonte] = n;
  return {
    id: \`SET-ENT-\${estab}-\${String(indice + 1).padStart(4, "0")}\`,
    data,
    origem: \`ENTRADAS \${estab === "M" ? "MATRIZ" : "FILIAL SP"} 09/2026\`,
    debitoCodigo: debito,
    debito: nome(debito),
    creditoCodigo: credito,
    credito: nome(credito),
    historico: \`\${descGerencial || "Nota de entrada"} - \${fornecedor}\`,
    documento: \`NF \${numero}\${serie ? \` série \${serie}\` : ""} / NOP \${nop}\${codigo ? \` / \${codigo}\` : ""}\${gerencial ? \` / gerencial \${gerencial}\` : ""}\`,
    cc,
    centroCusto: centro,
    valor,
    status: revisar ? "revisar" : "validado",
    observacao,
    rastreio: "documento",
    fonte,
  };
});

export const resumoEntradasSetembro = ${JSON.stringify({
  matriz: { notasQuestor: questor.size, casadas: pares.length, soQuestor: pendentesQuestor.length, soSoftdib: soSoftdib.length, lancado: totalLancadoMatriz, excluido: totalExcluidoMatriz },
  filial: { lancado: soma(lancamentos.filter((x) => x.estab === "F")) },
  diferencas,
  foraPorBanco,
  creditosPorConta: Object.fromEntries(Object.entries(creditos).map(([e, contas]) => [e, Object.fromEntries(Object.entries(contas).map(([c, v]) => [c, Object.fromEntries(Object.entries(v).map(([k, x]) => [k, arred(x)]))]).filter(([, v]) => Object.values(v).some((x) => x)))])),
  porConta,
}, null, 2)} as const;
`;
writeFileSync(SAIDA, conteudo, "utf8");

console.log(JSON.stringify({ questor: questor.size, casadas: pares.length, soQuestor: pendentesQuestor.map((x) => `${x.numero} ${x.fornecedor} ${x.valor}`), soSoftdib: soSoftdib.map((x) => `${x.numero} ${x.fornecedor} ${x.total}`), diferencas, totalLancadoMatriz, totalExcluidoMatriz, filial: soma(lancamentos.filter((x) => x.estab === "F")), semRegra: semRegra.map((x) => `${x.l.gerencial} ${x.p.cc} ${x.p.valor}`), porConta }, null, 1));
