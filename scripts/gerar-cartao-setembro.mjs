// Gera src/data/nitaplast-cartao-setembro.ts — despesas dos cartões corporativos da fatura com
// vencimento em 01/10/2026 (compras de setembro), aba "SETEMBRO 26" de DESPESAS CARTÃO CRÉDITO.xlsx.
//
// Mesmo critério de agosto (nitaplast-cartao-4005-jussara-rodrigo-agosto.ts): conta por natureza a
// partir do sub-centro (conta gerencial), do CC e da descrição. Contrapartida em Fornecedores (1496),
// a mesma conta que o Itaú baixa quando debita a fatura (F22542 ITAU UNIBANCO).
// Compras cuja nota já entrou pelas notas de entrada de setembro não são lançadas de novo.
// Gastos pessoais (chácara, casa do Marcos) vão para a conta corrente do Marcos (25129); itens que o
// funcionário reembolsa vão para a transitória até o reembolso entrar no banco (mesmo critério do Itaú).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PLANILHA = "C:/092026/DESPESAS CARTÃO CRÉDITO.xlsx";
const ABA = "SETEMBRO 26";
const ENTRADAS = "src/data/nitaplast-entradas-setembro.ts";
const SAIDA = "src/data/nitaplast-cartao-setembro.ts";

const arred = (v) => Math.round(v * 100) / 100;
const tmp = `${process.env.TEMP ?? "."}/cartao-setembro.json`;
execFileSync("python", ["scripts/xlsx-para-json.py", PLANILHA, tmp, ABA], { stdio: "ignore" });
const linhas = JSON.parse(readFileSync(tmp, "utf8")).map((r) => r.filter((c) => c !== null && c !== "" && c !== " "));

// Notas de entrada de setembro (número -> total), para não duplicar.
const ent = readFileSync(ENTRADAS, "utf8");
const ini = ent.indexOf("const notas: NotaEntrada[] = [") + 30;
const notasEntrada = JSON.parse(`[${ent.slice(ini, ent.indexOf("];", ini)).replace(/,(\s*\])/g, "$1").trim().replace(/,$/, "")}]`);
const totalEntrada = new Map();
for (const n of notasEntrada) totalEntrada.set(n[2], arred((totalEntrada.get(n[2]) ?? 0) + n[11]));

// ---------- Leitura da aba: blocos por portador; duas faturas separadas pela linha de traços ----------
const itens = [];
let fatura = 1;
let portador = "";
const totaisPlanilha = [];
for (const r of linhas) {
  const primeiro = String(r[0] ?? "");
  if (/^-{10,}/.test(primeiro)) { fatura++; continue; }
  if (/^T O T A L/.test(primeiro)) { totaisPlanilha.push(r[1]); continue; }
  if (r.length === 1 && typeof r[0] === "number") { totaisPlanilha.push(r[0]); continue; }
  if (/Sub-Total|^Total$|^C\. Custo|^Tipo de Despesa|^\d{2}\/\d{2}\/\d{4}$|ESTORNO DESPESAS FACEBOOK|^Marcos Victor Siedel$|BANCO ITAU/.test(primeiro) || typeof r[0] === "number" && r.length === 2 && typeof r[1] === "string") continue;
  if (r.length === 1 && typeof r[0] === "string") { portador = r[0].trim(); continue; }
  if (/LAN[ÇC]AMENTOS INTERNACIONAIS|DESPESAS INTERNACIONAIS/.test(primeiro)) { portador = `${r[1] ?? portador} (internacional)`.trim(); continue; }
  if (typeof r[0] === "number") {
    const [cc, sub, descricao, valor, nota] = r;
    if (typeof valor !== "number") continue;
    itens.push({ fatura, portador, cc: String(cc), sub: String(sub).replace(/,/g, "."), descricao: String(descricao).trim(), valor, nota: nota ? String(nota) : "" });
  } else if (typeof r[1] === "number") {
    itens.push({ fatura, portador, cc: "", sub: "", descricao: primeiro.trim(), valor: r[1], nota: r[2] ? String(r[2]) : "" });
  }
}
const somaFatura = (f) => arred(itens.filter((i) => i.fatura === f).reduce((t, i) => t + i.valor, 0));
if (Math.abs(somaFatura(1) - 46_189.79) > 0.01 || Math.abs(somaFatura(2) - 18_896.46) > 0.01) {
  throw new Error(`Faturas não fecham com a planilha: ${somaFatura(1)} x 46.189,79 e ${somaFatura(2)} x 18.896,46`);
}

// ---------- Classificação ----------
const producao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "10032", "19999"]);
const comercial = new Set(["201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "501", "502", "505"]);
const area = (cc) => (producao.has(cc) ? "P" : comercial.has(cc) ? "C" : "A");

function classificar(i) {
  const d = i.descricao.toUpperCase();
  const nf = d.match(/\bNFF? ?(\d{3,})/);
  if (nf && totalEntrada.has(Number(nf[1]))) {
    const ja = totalEntrada.get(Number(nf[1]));
    if (Math.abs(ja - i.valor) < 0.02 || /URANO/.test(d)) return { pular: `NF ${nf[1]} já lançada pelas notas de entrada (R$ ${ja.toFixed(2)}).` };
    if (ja < i.valor) return { conta: "25064", valor: arred(i.valor - ja), obs: `NF ${nf[1]}: R$ ${ja.toFixed(2)} já nas notas de entrada; lança só a diferença.` };
  }
  if (/CH[ÁA]CARA|CASA MARCOS/.test(d)) return { conta: "25129", revisar: true, obs: "Gasto pessoal (chácara/casa do Marcos) pago com cartão da empresa — conta corrente do Marcos." };
  if (/REEMBOLSAD/.test(d) || /reembolsad/i.test(i.nota)) return { conta: "4859", revisar: true, obs: "Item reembolsado/a reembolsar pelo portador — na transitória até o reembolso entrar no banco." };
  if (/IOF/.test(d)) return { conta: "25105", obs: "IOF de compra internacional." };
  if (/ANTHROPIC|GITHUB|ADOBE|CAPCUT|CANVA|GOOGLEWORKSPACE|RD SATION|SALESBUD|PLAYINFORMA|READ LAN/.test(d)) return { conta: /GOOGLE ADS/.test(d) ? "4085" : "25074", obs: "Assinatura de software/serviço de informática." };
  if (/GOOGLE ADS|FACEBOOK|ZUL/.test(d) || i.sub === "15.01.008") return { conta: "4085", obs: "Publicidade e marketing digital." };
  if (/PASSAGE|DECOLAR|AIRLINE|LATAM|LOCA[ÇC][ÃA]O|MOVIDA|LOCALIZA|ASSIST CARD|UBER|TAXI|99APP/.test(d) || i.sub === "15.01.015") return { conta: /99APP|UBER|TAXI/.test(d) && area(i.cc) === "A" ? "4544" : "25063", obs: "Viagens, passagens, locação de veículos e deslocamentos." };
  if (/HOTEL|HOSPEDAGEM/.test(d)) return { conta: "4115", obs: "Hospedagem." };
  if (/ESTACIONAMEN/.test(d)) return { conta: "4544", obs: "Estacionamento." };
  if (/SEGURO/.test(d)) return { conta: "4611", obs: "Seguro de veículo." };
  if (/REVIS[ÃA]O|MOLDURA|LANTERNA/.test(d) || i.sub === "15.03.002" || i.sub === "13.02.004") return { conta: "4215", obs: "Manutenção de veículos." };
  if (/POSTO|COMBUST/.test(d) || i.sub === "15.03.001") return { conta: "4213", obs: "Combustíveis e lubrificantes." };
  if (/LANCHE|REFEI|ALMO[ÇC]O|ALIMENTA/.test(d) || i.sub === "15.02.012") return { conta: area(i.cc) === "C" ? "25066" : "4546", obs: "Lanches e refeições." };
  if (i.sub === "12.03.007") return { conta: "4038", obs: "Uniformes." };
  if (/MEM[OÓ]RIA|KABUM|DESK TOP|STARLINK|CHIP/.test(d)) return { conta: "25068", obs: "Material de informática." };
  if (i.sub === "15.02.015" || /MATERIAL|MATEIRAL/.test(d)) return { conta: area(i.cc) === "P" ? "3244" : area(i.cc) === "C" ? "25064" : "4912", obs: "Material de uso e consumo." };
  return { conta: "4859", revisar: true, obs: "Sem natureza identificada — na transitória." };
}

const lancamentos = [];
const pulados = [];
for (const i of itens) {
  const c = classificar(i);
  if (c.pular) { pulados.push({ ...i, motivo: c.pular }); continue; }
  const valor = c.valor ?? i.valor;
  if (Math.abs(valor) < 0.005) continue;
  const revisar = c.revisar || /FALTA/i.test(i.nota);
  lancamentos.push({ ...i, conta: c.conta, valor, revisar, obs: [c.obs, i.nota && `Planilha: ${i.nota}.`].filter(Boolean).join(" ") });
}

const q = JSON.stringify;
const tuplas = lancamentos
  .map((l) => `  [${[l.fatura, l.portador, l.cc || "0", l.sub, l.descricao, arred(l.valor), l.conta, l.revisar ? 1 : 0, l.obs].map(q).join(", ")}],`)
  .join("\n");

const conteudo = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

// Arquivo gerado por scripts/gerar-cartao-setembro.mjs — não editar à mão.
// Fatura dos cartões corporativos com vencimento em 01/10/2026 (compras de setembro), aba "SETEMBRO 26"
// de DESPESAS CARTÃO CRÉDITO.xlsx: fatura 1 R$ 46.189,79 e fatura 2 (cartões do Marcos) R$ 18.896,46.
type ItemCartao = readonly [fatura: number, portador: string, cc: string, subCentro: string, descricao: string, valor: number, conta: string, revisar: 0 | 1, observacao: string];

const itens: ItemCartao[] = [
${tuplas}
];

const nome = (codigo: string) => \`\${codigo} - \${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}\`;

export const lancamentosCartaoSetembro: LancamentoIntegrado[] = itens.map((item, indice) => {
  const [fatura, portador, cc, subCentro, descricao, valor, conta, revisar, observacao] = item;
  const estorno = valor < 0;
  return {
    id: \`SET-CARTAO-\${String(indice + 1).padStart(3, "0")}\`,
    data: "30/09/2026",
    origem: "CARTÕES CORPORATIVOS 09/2026",
    debitoCodigo: estorno ? "1496" : conta,
    debito: nome(estorno ? "1496" : conta),
    creditoCodigo: estorno ? conta : "1496",
    credito: nome(estorno ? conta : "1496"),
    historico: \`\${descricao} — cartão \${portador}\`,
    documento: \`Fatura \${fatura} venc. 01/10/2026\${subCentro ? \` / sub-centro \${subCentro}\` : ""}\`,
    cc,
    centroCusto: cc === "0" ? "SEM CENTRO DE CUSTO" : \`CC \${cc}\`,
    valor: Math.abs(valor),
    status: revisar ? "revisar" : "validado",
    observacao,
    rastreio: "documento",
    fonte: "C:/092026/DESPESAS CARTÃO CRÉDITO.xlsx — aba SETEMBRO 26",
  };
});

export const resumoCartaoSetembro = ${JSON.stringify({ fatura1: somaFatura(1), fatura2: somaFatura(2), lancado: arred(lancamentos.reduce((t, l) => t + l.valor, 0)), jaNasEntradas: arred(pulados.reduce((t, p) => t + p.valor, 0)), pulados: pulados.map((p) => ({ descricao: p.descricao, valor: p.valor, motivo: p.motivo })) }, null, 2)} as const;
`;
writeFileSync(SAIDA, conteudo, "utf8");

const porConta = {};
for (const l of lancamentos) porConta[l.conta] = arred((porConta[l.conta] ?? 0) + l.valor);
console.log(JSON.stringify({ itens: itens.length, lancados: lancamentos.length, pulados: pulados.length, valorPulado: arred(pulados.reduce((t, p) => t + p.valor, 0)), porConta, revisar: lancamentos.filter((l) => l.revisar).map((l) => `${l.descricao} ${l.valor} -> ${l.conta}`) }, null, 1));
