// Gera src/data/nitaplast-cartao-setembro.ts — despesas dos cartões corporativos lançadas em 09/2026,
// a partir de DESPESAS CARTÃO CRÉDITO.xlsx (uma aba por fatura):
//  - SETEMBRO 26: fatura com vencimento em 01/10/2026 (compras de setembro); contrapartida em
//    Fornecedores (1496), que o Itaú baixa quando debita a fatura (F22542 ITAU UNIBANCO).
//  - AGOSTO 26: fatura paga em 01/09/2026 baixando a 1496 sem que a despesa tivesse sido lançada;
//    fica de fora o que agosto já reconheceu (Jussara e Rodrigo, nitaplast-cartao-4005-jussara-rodrigo-agosto.ts).
//  - JULHO 26: fatura paga em 03/08/2026 e lançada na transitória 4859 (AGO-CARTAO-ITAU-4005/6202);
//    a despesa sai da transitória.
// Julho e agosto ficam como estão; as despesas dessas faturas entram em setembro.
//
// Conta por natureza a partir do sub-centro (conta gerencial), do CC e da descrição — mesmo critério de
// agosto. Compras cuja nota já está no Razão (julho, agosto ou entradas de setembro) não são relançadas.
// Gastos pessoais (chácara, casa do Marcos) vão para a conta corrente do Marcos (25129); itens que o
// portador reembolsa vão para Empréstimos a Funcionários (25115) até o reembolso; a ração de agosto,
// reembolsada pelo Marcos no Itaú em 03/09 (lançado na 4859), vai para a 4859 e se anula com o reembolso.
//
// Requer os Razões exportados: SAIDA=$TEMP node scripts/exportar-razoes.mjs
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const PLANILHA = "C:/092026/DESPESAS CARTÃO CRÉDITO.xlsx";
const TEMP = process.env.TEMP ?? ".";
const SAIDA = "src/data/nitaplast-cartao-setembro.ts";

const faturas = [
  { nome: "lancamentosCartaoSetembro", aba: "SETEMBRO 26", mesesValor: ["set"], prefixo: "SET-CARTAO", data: "30/09/2026", credito: "1496", totais: [46_189.79, 18_896.46], vencimento: "01/10/2026" },
  { nome: "lancamentosCartaoFaturaAgosto", aba: "AGOSTO 26 ", mesesValor: ["ago"], prefixo: "SET-CARTAO-AGO", data: "01/09/2026", credito: "1496", totais: [40_109.75, 25_669.7], vencimento: "01/09/2026", jaLancados: /JUSSARA|RODRIGO A LIMA/, reembolsadosNoBanco: [1118.56] },
  { nome: "lancamentosCartaoFaturaJulho", aba: "JULHO 26", mesesValor: ["jul", "ago"], prefixo: "SET-CARTAO-JUL", data: "01/09/2026", credito: "4859", pago: 46_528.06, totais: [28_030.58, 18_497.38], vencimento: "01/08/2026", ajuste: { valor: 0.1, observacao: "Diferença entre o débito do Itaú em 03/08 (R$ 28.030,68) e a planilha (R$ 28.030,58)." } },
];

const arred = (v) => Math.round(v * 100) / 100;

// ---------- Lançamentos já existentes, para não duplicar ----------
const ler = (arquivo, mes) => JSON.parse(readFileSync(`${TEMP}/${arquivo}`, "utf8")).filter((l) => !String(l.id).includes("CARTAO")).map((l) => ({ ...l, mes }));
const existentes = [...ler("razao-julho.json", "jul"), ...ler("razao-agosto.json", "ago"), ...ler("entradas-setembro.json", "set")];
const texto = (l) => `${l.documento} ${l.historico}`.toUpperCase();
const porNota = (n) => existentes.filter((l) => new RegExp(`\\bNF ${n}\\b`).test(l.documento ?? ""));
const genericas = new Set(["MERCADO", "LIVRE", "COMERCIO", "LTDA", "LANCHES", "REFEICOES", "MATERIAL", "CONSUMO", "AUTO", "POSTO", "BRASIL"]);
const palavras = (s) => s.toUpperCase().normalize("NFD").replace(/[^A-Z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !genericas.has(w));

// ---------- Leitura de uma aba: blocos por portador; faturas separadas pela linha de traços ----------
function lerAba(aba) {
  const tmp = `${TEMP}/cartao-${aba.trim().replace(/\s+/g, "-")}.json`;
  execFileSync("python", ["scripts/xlsx-para-json.py", PLANILHA, tmp, aba], { stdio: "ignore" });
  const linhas = JSON.parse(readFileSync(tmp, "utf8")).map((r) => r.filter((c) => c !== null && c !== "" && c !== " "));
  const itens = [];
  let fatura = 0;
  let portador = "";
  for (const r of linhas) {
    const p = String(r[0] ?? "");
    if (/^-{10,}/.test(p)) { fatura++; continue; }
    if (/^T O T A L|Sub-Total|^Total$|^C\. Custo|^Tipo de Despesa|^\d{2}\/\d{2}\/\d{4}$|^Marcos Victor Siedel$|BANCO ITAU/.test(p)) continue;
    if (r.length === 1 && typeof r[0] === "number") continue;
    if (typeof r[0] === "number" && r.length === 2 && typeof r[1] === "string" && !/ESTORNO/.test(r[1])) continue;
    if (r.length === 1 && typeof r[0] === "string") { portador = r[0].trim(); continue; }
    if (/LAN[ÇC]AMENTOS INTERNACIONAIS|DESPESAS INTERNACIONAIS/.test(p)) { portador = `${String(r[1] ?? portador).trim()} (internacional)`; continue; }
    let item = null;
    if (typeof r[0] === "number" && typeof r[1] === "string" && typeof r[2] === "number") item = { cc: String(r[0]), sub: "", descricao: r[1], valor: r[2], nota: r[3] };
    else if (typeof r[0] === "number" && typeof r[3] === "number") item = { cc: String(r[0]), sub: String(r[1]).replace(/,/g, "."), descricao: String(r[2]), valor: r[3], nota: r[4] };
    else if (typeof r[1] === "number") item = { cc: "", sub: "", descricao: p, valor: r[1], nota: r[2] };
    if (item && item.valor !== 0) itens.push({ ...item, descricao: String(item.descricao).trim(), nota: item.nota ? String(item.nota) : "", fatura, portador });
  }
  // A primeira linha de traços separa o bloco vazio do topo em algumas abas: renumera pelas faturas com itens.
  const usadas = [...new Set(itens.map((i) => i.fatura))];
  for (const i of itens) i.fatura = usadas.indexOf(i.fatura) + 1;
  return itens;
}

// ---------- Classificação ----------
const producao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "10032", "19999"]);
const comercial = new Set(["201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "501", "502", "505"]);
const area = (cc) => (producao.has(cc) ? "P" : comercial.has(cc) ? "C" : "A");

// Por número da nota: qualquer mês. Por valor + fornecedor: só o mês da fatura (assinaturas repetem o valor todo mês).
const usadosPorValor = new Set();
function jaNoRazao(i, fat) {
  const d = i.descricao.toUpperCase();
  const nf = d.match(/\bNF[FS]? ?(\d{3,})/);
  if (nf) {
    const ls = porNota(nf[1]);
    const ja = arred(ls.reduce((t, l) => t + l.valor, 0));
    if (ls.length && (Math.abs(ja - i.valor) < 0.02 || ja > i.valor)) return { pular: `NF ${nf[1]} já no Razão (${ls[0].id}, R$ ${ja.toFixed(2)}).` };
    if (ls.length && ja < i.valor) return { diferenca: arred(i.valor - ja), obs: `NF ${nf[1]}: R$ ${ja.toFixed(2)} já no Razão (${ls[0].id}); lança só a diferença.` };
  }
  if (i.valor > 0) {
    const ws = palavras(i.descricao);
    const hit = existentes.find((l) => !usadosPorValor.has(l.id) && fat.mesesValor.includes(l.mes) && Math.abs(l.valor - i.valor) < 0.01 && ["1496", "4859"].includes(l.creditoCodigo) && ws.some((w) => texto(l).includes(w)));
    if (hit) usadosPorValor.add(hit.id);
    if (hit) return { pular: `Já no Razão pelo mesmo valor e fornecedor (${hit.id}).` };
  }
  return null;
}

function classificar(i, fat) {
  const d = i.descricao.toUpperCase();
  if (i.valor > 0 && /RA[ÇC][ÃA]O/.test(d) && fat.reembolsadosNoBanco?.includes(i.valor)) return { conta: "4859", obs: "Ração reembolsada pelo Marcos no Itaú (03/09/2026, lançado na 4859): as duas pontas se anulam." };
  if (/CH[ÁA]CARA|CASA MARCOS/.test(d)) return { conta: "25129", revisar: true, obs: "Gasto pessoal (chácara/casa do Marcos) pago com cartão da empresa — conta corrente do Marcos." };
  if (i.valor > 0 && (/REEMBOLSAD/.test(d) || /reembols/i.test(i.nota))) return { conta: "25115", revisar: true, obs: "Item reembolsado/a reembolsar pelo portador — a receber até o reembolso entrar no banco." };
  if (/IOF/.test(d)) return { conta: "25105", obs: "IOF de compra internacional." };
  if (/ANTHROPIC|GITHUB|ADOBE|CAPCUT|CANVA|GOOGLEWORKSPACE|RD S[TA]A?TION|SALESBUD|PLAYINFORMA|READ LAN/.test(d) && !/GOOGLE ADS/.test(d)) return { conta: "25074", obs: "Assinatura de software/serviço de informática." };
  if (/GOOGLE ADS|FACEBOOK|ZUL /.test(d) || /^ZUL/.test(d) || i.sub === "15.01.008") return { conta: "4085", obs: "Publicidade e marketing digital." };
  if (/PASSAGE|DECOLAR|AIRLINE|LINHAS|LATAM|AZUL|GOL |LOCA[ÇC][ÃA]O|MOVIDA|LOCALIZA|ASS?IST CARD|UBER|TAXI|99APP|BOOKING/.test(d) || i.sub === "15.01.015") return { conta: /99APP|UBER|TAXI/.test(d) && area(i.cc) === "A" ? "4544" : "25063", obs: "Viagens, passagens, locação de veículos e deslocamentos." };
  if (/HOTEL|HOSPEDAGEM/.test(d)) return { conta: "4115", obs: "Hospedagem." };
  if (/ESTACIONAMEN|SEM PARAR/.test(d)) return { conta: "4544", obs: "Estacionamento e pedágio." };
  if (/SEGURO/.test(d)) return { conta: "4611", obs: "Seguro de veículo." };
  if (/REVIS[ÃA]O|MOLDURA|LANTERNA|AUTO PE[ÇC]AS|PNEU/.test(d) || i.sub === "15.03.002" || i.sub === "13.02.004") return { conta: "4215", obs: "Manutenção de veículos." };
  if (/POSTO|COMBUST/.test(d) || i.sub === "15.03.001") return { conta: "4213", obs: "Combustíveis e lubrificantes." };
  if (/LANCHE|REFEI|ALMO[ÇC]O|ALIMENTA/.test(d) || i.sub === "15.02.012") return { conta: area(i.cc) === "C" ? "25066" : "4546", obs: "Lanches e refeições." };
  if (i.sub === "12.03.007" || /UNIFORME/.test(d)) return { conta: "4038", obs: "Uniformes." };
  if (/TREINAMENTO|CURSO/.test(d)) return { conta: "4250", obs: "Cursos e treinamentos." };
  if (/MEM[OÓ]RIA|KABUM|DESK TOP|STARLINK|CHIP|TONER|NOTEBOOK/.test(d)) return { conta: "25068", obs: "Material de informática." };
  if (/BRINDE|TA[ÇC]A/.test(d)) return { conta: "4085", obs: "Brindes (publicidade)." };
  return { conta: area(i.cc) === "P" ? "3244" : area(i.cc) === "C" ? "25064" : "4912", obs: "Material de uso e consumo / despesas gerais." };
}

// ---------- Geração ----------
const blocos = [];
const resumo = {};
for (const fat of faturas) {
  const itens = lerAba(fat.aba);
  fat.totais.forEach((total, k) => {
    const soma = arred(itens.filter((i) => i.fatura === k + 1).reduce((t, i) => t + i.valor, 0));
    if (Math.abs(soma - total) > 0.01) throw new Error(`${fat.aba} fatura ${k + 1}: planilha ${soma} x ${total}`);
  });
  const lancamentos = [];
  const pulados = [];
  for (const i of itens) {
    if (fat.jaLancados?.test(i.portador)) { pulados.push({ ...i, motivo: "Já lançado em agosto (cartões de Jussara e Rodrigo)." }); continue; }
    const ja = jaNoRazao(i, fat);
    if (ja?.pular) { pulados.push({ ...i, motivo: ja.pular }); continue; }
    const c = classificar(i, fat);
    const valor = ja?.diferenca ?? i.valor;
    if (Math.abs(valor) < 0.005) continue;
    lancamentos.push({ ...i, conta: c.conta, valor, revisar: Boolean(c.revisar || /FALTA|SEM DOCS/i.test(i.nota)), obs: [ja?.obs, c.obs, i.nota && `Planilha: ${i.nota}.`].filter(Boolean).join(" ") });
  }
  if (fat.ajuste) lancamentos.push({ fatura: 1, portador: "diferença do débito", cc: "", sub: "", descricao: "Diferença entre o débito do banco e a planilha", valor: fat.ajuste.valor, conta: "25104", revisar: false, obs: fat.ajuste.observacao });
  // Fatura paga pela transitória: a parte cuja nota já está no Razão (contra Fornecedores) sai da 4859 contra a 1496.
  if (fat.pago) {
    const resto = arred(fat.pago - lancamentos.reduce((t, l) => t + l.valor, 0));
    if (Math.abs(resto) >= 0.005) lancamentos.push({ fatura: 1, portador: "notas já no Razão", cc: "", sub: "", descricao: "Compras da fatura com nota já lançada contra Fornecedores", valor: resto, conta: "1496", revisar: false, obs: `Pagas pelo cartão; a despesa já está no Razão (${pulados.map((p) => p.motivo).join(" ")}). Baixa de Fornecedores.` });
  }
  const q = JSON.stringify;
  const tuplas = lancamentos.map((l) => `  [${[l.fatura, l.portador, l.cc || "0", l.sub, l.descricao, arred(l.valor), l.conta, l.revisar ? 1 : 0, l.obs].map(q).join(", ")}],`).join("\n");
  blocos.push(`// Aba "${fat.aba.trim()}" — fatura com vencimento em ${fat.vencimento}; contrapartida ${fat.credito}.
export const ${fat.nome}: LancamentoIntegrado[] = montar("${fat.prefixo}", "${fat.data}", "${fat.credito}", "${fat.aba.trim()}", "${fat.vencimento}", [
${tuplas}
]);`);
  resumo[fat.aba.trim()] = {
    faturas: fat.totais, lancado: arred(lancamentos.reduce((t, l) => t + l.valor, 0)), jaNoRazao: arred(pulados.reduce((t, p) => t + p.valor, 0)),
    pulados: pulados.map((p) => ({ descricao: p.descricao, valor: p.valor, motivo: p.motivo })),
  };
  const porConta = {};
  for (const l of lancamentos) porConta[l.conta] = arred((porConta[l.conta] ?? 0) + l.valor);
  console.log(fat.aba, JSON.stringify({ lancado: resumo[fat.aba.trim()].lancado, jaNoRazao: resumo[fat.aba.trim()].jaNoRazao, porConta }));
}

const conteudo = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

// Arquivo gerado por scripts/gerar-cartao-setembro.mjs — não editar à mão.
// Despesas dos cartões corporativos lançadas em 09/2026 (DESPESAS CARTÃO CRÉDITO.xlsx).
type ItemCartao = readonly [fatura: number, portador: string, cc: string, subCentro: string, descricao: string, valor: number, conta: string, revisar: 0 | 1, observacao: string];

const nome = (codigo: string) => \`\${codigo} - \${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}\`;

function montar(prefixo: string, data: string, credito: string, aba: string, vencimento: string, itens: ItemCartao[]): LancamentoIntegrado[] {
  return itens.map((item, indice) => {
    const [fatura, portador, cc, subCentro, descricao, valor, conta, revisar, observacao] = item;
    const estorno = valor < 0;
    return {
      id: \`\${prefixo}-\${String(indice + 1).padStart(3, "0")}\`,
      data,
      origem: \`CARTÕES CORPORATIVOS — FATURA \${vencimento}\`,
      debitoCodigo: estorno ? credito : conta,
      debito: nome(estorno ? credito : conta),
      creditoCodigo: estorno ? conta : credito,
      credito: nome(estorno ? conta : credito),
      historico: \`\${descricao} — cartão \${portador}\`,
      documento: \`Fatura \${fatura} venc. \${vencimento}\${subCentro ? \` / sub-centro \${subCentro}\` : ""}\`,
      cc,
      centroCusto: cc === "0" ? "SEM CENTRO DE CUSTO" : \`CC \${cc}\`,
      valor: Math.abs(valor),
      status: revisar ? "revisar" : "validado",
      observacao,
      rastreio: "documento",
      fonte: \`C:/092026/DESPESAS CARTÃO CRÉDITO.xlsx — aba \${aba}\`,
    };
  });
}

${blocos.join("\n\n")}

export const resumoCartoesSetembro = ${JSON.stringify(resumo, null, 2)} as const;
`;
writeFileSync(SAIDA, conteudo, "utf8");
