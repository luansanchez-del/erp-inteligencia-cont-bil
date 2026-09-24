// Gera src/data/nitaplast-bradesco-6349-agosto.ts a partir do extrato oficial
// Bradesco 6349/3035-0 de 08/2026 (PDF). O extrato é o documento oficial; o
// EXTRATO MOVIMENTO SOFTDIB só apoia a identificação da contrapartida.
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { readFileSync, writeFileSync } from "node:fs";

const CAMINHO = "C:/082026/EXTRATOS 082026/08 - AGOSTO - 2026/NITA - BRADESCO.pdf";
const SAIDA = "src/data/nitaplast-bradesco-6349-agosto.ts";

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

// Linhas do extrato já representadas por outros arquivos do Razão de agosto.
function jaLancado(m) {
  const h = m.historico;
  if (/^RESGATE FUNDOS|^APLICACAO EM FUNDOS/.test(h)) return "Fundo Bradesco Maxi DI (AGO-BRADFUNDO-*)";
  if (/^RENTAB\.INVEST FACIL/.test(h)) return "CDB Invest Fácil (AGO-BRAD6349-RESG-REND/IOF/IRRF-*)";
  if (/^CAMBIO IMPORTACAO/.test(h)) return m.dcto === "4925166" ? "AGO-CAMBIO-621680690" : "AGO-CAMBIO-622836291";
  if (/^TARIFA|^DESPESAS DE PROTESTO/.test(h)) return "Tarifas Bradesco (AGO-TARIFA-BRAD-*)";
  if (/^PAGTO ELETRONICO TRIBUTO \/ PUCOMEX/.test(h) && m.valor === -125620.99) return "AGO-CAMBIO-GREATLAND-TRIB-94222";
  if (/^PAGTO ELETRONICO TRIBUTO \/ PUCOMEX/.test(h) && m.valor === -24302.23) return "AGO-CAMBIO-GREATLAND-TRIB-94251";
  return null;
}

// Contrapartida de cada linha nova. [contrapartida, cc, status, nota]
function classificar(m) {
  const h = m.historico;
  const credito = m.valor > 0;
  if (/^LIQUIDACAO DE COBRANCA/.test(h)) return ["25111", "0", "validado", "Liquidação de duplicatas por cobrança bancária; títulos identificados no SOFTDIB (RECEBIMENTO DE DUPLICATAS, portador B23700)."];
  if (credito && /ROSSI ELETROPORTATEIS|TORNIFUSO|Solange da Silva|WS SPORTS COMERCIO DE 18\/08/.test(h)) return ["25111", "0", "validado", "Recebimento de duplicata fora da cobrança, identificado no SOFTDIB (RECEBIMENTO DE DUPLICATAS)."];
  if (credito && /WS SPORTS COMERCIO DE 11\/08/.test(h)) return ["1712", "0", "validado", "SOFTDIB classifica como ADIANTAMENTO DE CLIENTES (sem duplicata vinculada)."];
  if (credito && /NPLOG LOGISTICA/.test(h)) return ["2892", "0", "validado", "SOFTDIB: REEMBOLSO GERAIS — reembolso das últimas 3 parcelas do seguro Jeep pela NPLOG."];
  if (credito && /^TED-TRANSF ELET DISPON \/ REMET\.NITAPLAST/.test(h)) return ["21", "0", "validado", "Transferência da conta corrente Greencred (SOFTDIB: TRANSF DO B00002), após o resgate parcial AGO-BAN-GREENCRED-RESG."];
  if (/LUIZ FERNANDO/.test(h)) return ["4859", "0", "validado", "TED para titularidade diferente estornada pelo próprio banco no mesmo dia (débito e estorno se anulam)."];
  if (/DEST\. NITAPLAST INDUSTRIA|DES: NITAPLAST IND E COM D/.test(h)) return ["11", "0", "validado", "Transferência para a conta própria Itaú (SOFTDIB: TRANSF P/ B34100). Ao lançar o extrato Itaú, o crédito correspondente não deve ser lançado de novo."];
  if (/^TRANSF CC PARA CC PJ \/ NITAPLAST/.test(h)) return ["25001", "0", "validado", "Transferência para a conta própria Bradesco 895/27418-6 (SOFTDIB: TRANSF P/ B23702), usada para as obrigações CCEE."];
  if (/MVS ADMINISTRADORA/.test(h)) return ["4898", "0", "validado", "Transferência à MVS Administradora de Bens — Adiantamento de Lucros, mesmo critério de julho/2026 (JUL-BAN-OP-052/053)."];
  if (/NPL INDUSTRIA E COMER/.test(h)) return ["1496", "0", "validado", "Pagamento ao fornecedor NPL Indústria (SOFTDIB: TRANSFERENCIA FORNECEDOR, NF 492)."];
  if (/MARCELO NALON/.test(h)) return ["1496", "0", "validado", "Pagamento ao fornecedor Marcelo Nalon (SOFTDIB: TRANSFERENCIA FORNECEDOR, NF 79 parcela 2)."];
  if (/SM RESINAS/.test(h)) return ["1496", "0", "validado", "Pagamento de título do fornecedor SM Resinas (SOFTDIB: PAGAMENTO TITULOS BANCO, NF 33249 parcela 3)."];
  if (/^PAGTO ELETRON COBRANCA \/ PAG COBRANCA NET EMPRESA/.test(h)) return ["1496", "0", "revisar", "SOFTDIB: PAGAMENTO TITULOS BANCO a SAO PAULO TRIBUNAL DE JUSTICA (despesas legais/judiciais, CC 304). Natureza (custas x depósito judicial) e registro da obrigação pendentes de documento."];
  if (/SEFAZ/.test(h)) return ["1541", "0", "validado", "Pagamento de ICMS (SOFTDIB: PAGAMENTO TITULOS BANCO — ICMS A RECOLHER)."];
  if (/^PAGTO ELETRONICO TRIBUTO \/ PUCOMEX/.test(h)) return ["25116", "209", "revisar", "Tributos federais da DUIMP 26BR0001377844-8 (Licharz), débito automático no registro (SOFTDIB: DÉBITO AUTOMÁTICO IMPORTAÇÃO). A NF de entrada da Licharz ainda não está no Razão de agosto."];
  if (/^DOC\/TED INTERNET/.test(h)) return ["25104", "0", "validado", "Tarifa de TED (não incluída em AGO-TARIFA-BRAD-*)."];
  if (/CAROLINA LINDEMANN/.test(h) && m.data === "24/08/2026") return ["4546", "304", "revisar", "SOFTDIB: REEMBOLSO GERAIS — compra de frutas da semana. CC atribuído à administração por falta de CC na fonte."];
  if (/^PGTO SALARIO|^PGTO RESCISAO/.test(h)) return ["1634", "0", "validado", "Pagamento de salário/rescisão da folha (SOFTDIB: PAGAMENTO SALARIO / RESCISÕES)."];
  if (/^ADIANT SALARIO/.test(h)) return ["312", "0", "validado", "Adiantamento salarial de agosto (SOFTDIB: ADIANTAMENTO SALARIO)."];
  if (/^PAGTO 13 SALARIO/.test(h)) return ["25238", "0", "validado", "Pagamento de 13º salário (SOFTDIB: 13º SALÁRIO - PROVISÃO)."];
  if (/^TRANSF CC PARA CC \/ (CAROLINA|THAUANY|BIANCA|EDER)/.test(h)) {
    if (m.data === "05/08/2026") return ["1634", "0", "validado", "Salário de julho pago por transferência (SOFTDIB: PAGAMENTO SALARIO)."];
    if (m.data === "17/08/2026") return ["312", "0", "validado", "Adiantamento salarial pago por transferência (SOFTDIB: ADIANTAMENTO SALARIO)."];
    if (m.data === "31/08/2026") return ["25238", "0", "validado", "13º salário pago por transferência (SOFTDIB: 13º SALÁRIO - PROVISÃO)."];
  }
  throw new Error(`Linha sem classificação: ${m.seq} ${m.data} ${h} ${m.valor}`);
}

const { movimentos, saldoInicial, saldoFinal } = await lerExtrato();
const registros = [];
const representados = [];
for (const m of movimentos) {
  const ref = jaLancado(m);
  if (ref) { representados.push([m.seq, m.data, m.historico, m.valor, ref]); continue; }
  const [contrapartida, cc, status, nota] = classificar(m);
  registros.push([m.seq, m.data, m.dcto, m.historico, m.valor, contrapartida, cc, status, nota]);
}
const lista = (itens) => ["[", ...itens.map((x) => `  ${JSON.stringify(x)},`), "]"].join("\n");
const soma = (lista, idx) => lista.reduce((s, x) => s + x[idx], 0);
const creditos = movimentos.filter((m) => m.valor > 0).reduce((s, m) => s + m.valor, 0);
const debitos = movimentos.filter((m) => m.valor < 0).reduce((s, m) => s + m.valor, 0);

const ts = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => \`\${codigo} - \${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}\`;

// Arquivo gerado por scripts/gerar-bradesco-6349-agosto.mjs — não editar à mão.
//
// Extrato oficial Bradesco 6349/3035-0 de 01/08 a 31/08/2026 ("NITA - BRADESCO.pdf"),
// lido linha a linha com conferência do saldo corrido em cada linha:
//   saldo em 31/07/2026 ${saldoInicial.toFixed(2)} + créditos ${creditos.toFixed(2)} ${debitos.toFixed(2)} = ${saldoFinal.toFixed(2)} em 31/08/2026.
// O saldo do extrato inclui o Invest Fácil automático (R$ 274.483,97 em 31/08, na conta 62);
// a conta 9 representa só a conta corrente.
//
// O extrato é o documento oficial. O EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE
// SOFTDIB é apoio para identificar a contrapartida: as duplicatas recebidas no
// Bradesco (B23700) somam R$ 2.856.973,42, exatamente a liquidação de cobrança do
// extrato mais os 4 recebimentos de duplicata por PIX/TED.
//
// ${movimentos.length} linhas no extrato: ${registros.length} lançadas aqui e ${representados.length} já representadas por outros
// arquivos do Razão (fundo Maxi DI, CDB Invest Fácil, câmbio BASF, tarifas e tributos da
// importação Greatland), listadas em \`linhasBradesco6349JaLancadasAgosto\` para rastreio.

type Linha = readonly [seq: number, data: string, dcto: string, historico: string, valor: number, contrapartida: string, cc: string, status: "validado" | "revisar", nota: string];

const linhas: Linha[] = ${lista(registros)};

export const linhasBradesco6349JaLancadasAgosto: readonly (readonly [seq: number, data: string, historico: string, valor: number, representadoPor: string])[] = ${lista(representados)};

export const lancamentosBradesco6349Agosto: LancamentoIntegrado[] = linhas.map(([seq, data, dcto, historico, valor, contrapartida, cc, status, nota]) => {
  const entrada = valor > 0;
  const debitoCodigo = entrada ? "9" : contrapartida;
  const creditoCodigo = entrada ? contrapartida : "9";
  return {
    id: \`AGO-BRAD6349-EXT-\${String(seq).padStart(3, "0")}\`,
    data,
    origem: "EXTRATO BRADESCO 6349/3035-0 08/2026",
    debitoCodigo,
    debito: nome(debitoCodigo),
    creditoCodigo,
    credito: nome(creditoCodigo),
    historico,
    documento: \`Extrato Bradesco 6349/3035-0 — linha \${seq}, dcto \${dcto}\`,
    cc,
    centroCusto: cc === "0" ? "SEM CENTRO DE CUSTO" : cc === "209" ? "IMPORTAÇÃO" : "ADM GERAL",
    valor: Math.abs(valor),
    status,
    observacao: nota,
    rastreio: "documento",
    fonte: "NITA - BRADESCO.pdf (extrato 08/2026) + EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv (apoio à identificação)",
  };
});
`;
writeFileSync(SAIDA, ts);
console.log(`linhas ${movimentos.length}: lançadas ${registros.length} (líquido ${soma(registros, 4).toFixed(2)}), já representadas ${representados.length} (líquido ${soma(representados, 3).toFixed(2)})`);
console.log(`extrato: ${saldoInicial.toFixed(2)} -> ${saldoFinal.toFixed(2)}`);
