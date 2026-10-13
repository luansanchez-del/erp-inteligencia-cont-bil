// Gera src/data/nitaplast-bradesco-6349-setembro.ts — movimento do Bradesco 6349/3035-0 de 09/2026 (derivado do gerador do Itaú).
// O extrato (NITA - ITAU.pdf) é o documento oficial; o movimento financeiro do Softdib bate com ele no
// total do mês (há só deslocamento de data entre 08/09 e 09/09 por causa do feriado) e identifica a
// contrapartida de cada linha. Transferências entre contas próprias (Bradesco, BB, Trust DI) são
// lançadas uma única vez, aqui; os geradores dos outros bancos devem ignorá-las.
// Títulos sem nota de setembro (contas mensais, tarifas) vão direto para a despesa pelo mapa de
// conta gerencial + centro de custo; títulos com nota baixam o fornecedor (1496).
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const SOFTDIB = "C:/092026/NITAPLAST - SET 26/RELATORIO MOVIMENTO FINANCEIRO NITAPLAST 092026.csv";
const PAGAMENTOS = "C:/092026/PAGAMENTOS 092026.csv";
const ENTRADAS = [
  "C:/082026/FISCAL/RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO -  SOFTDIB 082026.csv",
  "C:/092026/NITAPLAST - SET 26/RELATORIO CENTRO DE CUSTO ENTRADAS NITAPLAST 092026.csv",
  "C:/092026/FILIAL - SET 26/ENTRADAS SOFTDIB POR CENTRO DE CUSTO NITAPLAST FILIAL 092026.csv",
];
const EXTRATO = "C:/092026/EXTRATOS 092026/NITA - BRADESCO.pdf";
const SAIDA = "src/data/nitaplast-bradesco-6349-setembro.ts";
const BANCO = "B23700";
const CONTA = "9";

const num = (s) => (s && s.trim() ? Number(s.trim().replace(/\./g, "").replace(",", ".")) : 0);
const cent = (v) => Math.round(v * 100);
const arred = (v) => Math.round(v * 100) / 100;
const linhasCsv = (arq) => readFileSync(arq, "latin1").split(/\r?\n/).map((l) => l.split(";").map((c) => c.trim()));

const tmp = `${process.env.TEMP ?? "."}/bradesco-setembro-extrato.json`;
execFileSync("node", ["scripts/ler-extrato-bradesco.mjs", EXTRATO, tmp], { stdio: "ignore" });
const ext = JSON.parse(readFileSync(tmp, "utf8"));
const extrato = { saldoAnterior: ext.saldoInicial, saldoFinal: ext.saldoFinal, linhas: ext.movimentos };

const vistos = new Set();
const movimentos = [];
for (const c of linhasCsv(SOFTDIB)) {
  if (c.length < 31 || c[3] !== BANCO) continue;
  const chave = [c[5], c[8], c[9], c[10], c[11]].join("|");
  if (vistos.has(chave)) continue;
  vistos.add(chave);
  const partes = c[14].split("/");
  movimentos.push({
    data: c[5], historico: c[15], complemento: c[14].replace(/\s+/g, " "), gerencial: c[21], descGerencial: c[22],
    cc: /^\d+$/.test(c[23]) ? String(Number(c[23])) : "",
    valor: arred(num(c[12]) + num(c[13])),
    filial: /^\d{3}\/\d{3}\//.test(c[14]) ? partes[1] : "",
    codigo: /^[A-Z]\d{5}$/.test(partes[4] ?? "") ? partes[4] : "",
    documento: /^\d+$/.test(partes[2] ?? "") ? String(Number(partes[2])) : "",
    parcela: /^\d+$/.test(partes[3] ?? "") ? String(Number(partes[3])) : "",
    nome: c[27] || partes[5] || "", observacao: c[32],
  });
}
const totalExtrato = arred(extrato.linhas.reduce((t, l) => t + l.valor, 0));
const totalSoftdib = arred(movimentos.reduce((t, m) => t + m.valor, 0));
// O extrato inclui os rendimentos do Invest Fácil automático; o Softdib registra só parte deles.
const rendimentoNaoRegistrado = arred(totalExtrato - totalSoftdib);
if (rendimentoNaoRegistrado < 0 || rendimentoNaoRegistrado > 20) throw new Error(`Total do mês: extrato ${totalExtrato} x Softdib ${totalSoftdib}`);

const recepcao = new Map();
for (const c of linhasCsv(PAGAMENTOS).slice(1)) {
  if (c.length < 26 || c[14] !== BANCO) continue;
  const [doc, parc] = c[4].split("/");
  recepcao.set([c[3].split("-")[0], Number(doc), Number(parc), c[10]].join("|"), c[25]);
}
const comEntrada = new Set();
for (const arq of ENTRADAS) for (const c of linhasCsv(arq).slice(1)) if (c.length > 10) comEntrada.add(`${c[6].split(/[ -]/)[0]}|${Number(c[2])}`);

const producao = new Set(["101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "503"]);
const comercial = new Set(["201", "202", "203", "204", "205", "206", "207", "209", "210", "501", "502"]);
const area = (cc) => (producao.has(cc) ? "producao" : comercial.has(cc) ? "comercial" : "administrativo");
// Contas mensais/avulsas sem nota: conta de despesa por área (produção, comercial, administrativo).
const despesaSemNota = {
  "15.02.019": { producao: "3493", comercial: "4476", administrativo: "4476" },
  "15.02.020": { producao: "3494", comercial: "4185", administrativo: "4477" },
  "15.02.021": { producao: "25936", comercial: "4186", administrativo: "4478" },
  "15.02.010": { producao: "25936", comercial: "4186", administrativo: "4478" },
  "15.02.022": { producao: "25936", comercial: "4186", administrativo: "4478" },
  "15.02.033": { producao: "3524", comercial: "4430", administrativo: "4430" },
  "15.03.004": "4669", "15.03.007": "4663", "15.03.005": "4581", "15.01.013": "4544", "15.03.003": "4611",
  "15.02.025": { producao: "4024", comercial: "4024", administrativo: "4338" },
  "15.02.007": "4539", "12.03.010": "4553", "15.02.002": "4553", "15.02.027": "4555",
  "12.03.004": { producao: "4037", comercial: "4037", administrativo: "4351" },
  "15.01.002": "4405", "15.02.005": "25104", "15.02.016": "4547",
  "13.01.001": { producao: "3524", comercial: "4138", administrativo: "4430" },
  "15.02.011": "4668", "12.03.005": "4250",
};
const semNota = (g) => Object.prototype.hasOwnProperty.call(despesaSemNota, g);
const contaDespesa = (g, cc) => { const d = despesaSemNota[g]; return typeof d === "string" ? d : d[area(cc)]; };

function classificar(m) {
  const c = m.complemento;
  const h = m.historico;
  if (/^TRANSF (P\/|DO) B34100/.test(c)) return null; // já lançada pelo lado do Itaú (SET-ITAU-EXT-*)
  if (/^TRANSF P\/ B23702/.test(c)) return ["25001", "0", "validado", "Transferência para a conta própria Bradesco 895/27418-6 (obrigações CCEE) — lançada só deste lado."];
  if (/^TRANSF P\/ B00100/.test(c)) return ["10", "0", "validado", "Transferência para o Banco do Brasil — lançada só deste lado."];
  if (/^D[ÉE]BITO AUTOM[ÁA]TICO IMPORTA/.test(h)) return ["25116", m.cc || "209", "revisar", `${m.nome} — débito automático de importação (${m.descGerencial}); Importações em Andamento, mesmo critério da Greatland em agosto. Conferir contrato de câmbio/DUIMP e a NF de entrada.`];
  if (/^TRANSF P\/ B34101/.test(c)) return ["25002", "0", "validado", "Aplicação Itaú Trust DI (Softdib: TRANSF P/ B34101)."];
  if (/^TRANSF DO B34101/.test(c)) return ["25002", "0", "validado", "Resgate Itaú Trust DI (Softdib: TRANSF DO B34101)."];
  if (/NITA P\/ MVS|P\/ MVS/.test(c)) return ["4898", "0", "validado", "Transferência à MVS Administradora de Bens (empresa sócia) — Adiantamento de Lucros."];
  if (/^RECEBIMENTO DE DUPLICATAS/.test(h)) return ["25111", "0", "validado", "Recebimento de duplicata (Softdib: RECEBIMENTO DE DUPLICATAS)."];
  if (/^ADIANTAMENTO DE CLIENTES/.test(h)) return ["1712", "0", "validado", "Adiantamento de cliente (Softdib: ADIANTAMENTO DE CLIENTES)."];
  if (/^RENDIMENTO APLIC/.test(h)) return ["25098", "0", "validado", "Rendimento da aplicação automática Itaú creditado na conta corrente."];
  if (/MARCOS/.test(c) && (/^ADIANTAMENTO FORNECEDORES/.test(h) || /^ESTORNO DE PAGAMENTO INDEVIDO/.test(h))) {
    return ["25129", "0", "revisar", /^ESTORNO/.test(h)
      ? "Devolução de valores pelo Marcos Victor Siedel (Softdib: ESTORNO PGTO INDEVIDO - MARCOS). Conferir se compensa o Karmann Ghia (R$ 90.000,00 em 288) e o barco."
      : "Pagamento do barco do Marcos (Feniz Náutica) — conta corrente do Marcos, não é adiantamento a fornecedor da empresa."];
  }
  if (/^ADIANTAMENTO FORNECEDORES/.test(h)) return ["288", "0", "validado", "Adiantamento a fornecedor (Softdib: ADIANTAMENTO FORNECEDORES)."];
  if (/^PENS[ÃA]O ALIMENT/.test(h)) return ["25231", "0", "validado", "Repasse de pensão alimentícia descontada na folha."];
  if (/^ADIANTAMENTO VIAGEM/.test(h)) return ["4405", "0", "validado", "Adiantamento de viagem — mesmo critério de julho (JUL-BAN-OP-043)."];
  if (/^DESPESAS E TARIFAS/.test(h)) return ["25104", "0", "validado", "Tarifa bancária Itaú."];
  if (/VERISURE/.test(c)) return ["4547", "304", "validado", "Monitoramento Verisure (débito em conta)."];
  if (/CLOUD DRIVE/.test(c)) return ["4478", "304", "revisar", "Assinatura Cloud Drive debitada em conta; classificada em telecomunicações/TI administrativas."];
  if (!m.codigo && /MARCOS/i.test(c) && !/RA[CÇ][AÃ]O/i.test(c)) return ["25129", "0", "revisar", "Pagamento ao Marcos Victor Siedel devolvido no mesmo mês (Softdib: PGTO INDEVIDO / ESTORNO PGTO INDEVIDO) — conta corrente do Marcos, se anula."];
  if (!m.codigo && /FRUTAS/i.test(c)) return ["4546", "304", "validado", "Compra de frutas da semana (reembolso a funcionário)."];
  if (!m.codigo && /REEMBOLSO UNIMED/i.test(c)) return ["4337", "304", "validado", "Reembolso de Unimed recebido de funcionário — reduz a despesa de assistência médica."];
  if (!m.codigo) return ["4859", "0", "revisar", `${h} sem título vinculado — conferir a natureza.`];
  if (m.codigo === "I00001") return ["1541", "0", "validado", "Pagamento de ICMS a recolher."];
  if (m.codigo === "I00002") return [m.filial === "002" ? "25236" : "1543", "0", "validado", `Pagamento de IPI a recolher ${m.filial === "002" ? "da Filial SP" : "da Matriz"}.`];
  if (m.codigo === "I00017") return ["1542", "0", "validado", "Pagamento de ICMS ST a recolher."];
  if (m.codigo === "I00012") return ["1580", "0", "validado", "Pagamento de contribuições retidas (CSLL/PIS/COFINS)."];
  if (m.codigo === "I00006") return ["25233", "0", "validado", "Pagamento de IRRF retido de terceiros."];
  if (m.codigo === "I00013") return ["1582", "0", "validado", "Pagamento de ISS retido de terceiros."];
  if (m.codigo === "I00011") return ["25119", "0", "validado", "DARF IRPJ estimativa 08/2026 (LALUR fechado: R$ 25.546,56) — antecipação, mesmo critério do DARF de julho."];
  if (m.codigo === "I00010") return ["25120", "0", "validado", "DARF CSLL estimativa 08/2026 (LALUR fechado: R$ 10.020,45) — antecipação, mesmo critério do DARF de julho."];
  if (m.codigo === "O00002") return ["25227", "0", "validado", "Pagamento de INSS a recolher."];
  if (["O00003", "O00004"].includes(m.codigo)) return ["25228", "0", "validado", "Pagamento de FGTS a recolher."];
  if (m.codigo === "P00002" || m.codigo === "P00006") return ["1634", "0", "validado", "Pagamento de salários/rescisão."];
  if (m.codigo === "P00004") return ["25238", "0", "validado", "Pagamento de 13º salário."];
  if (["P00009", "P00005"].includes(m.codigo)) return ["312", "0", "validado", "Pagamento de adiantamento salarial/de férias."];
  if (m.codigo === "F01528") return ["25254", "0", "revisar", `NPLOG documento ${m.documento} — baixa da dívida com a NPLOG (25254); conferir se o documento é anterior a julho.`];
  if (m.codigo === "F02221") return /VEICULO/i.test(m.observacao) ? ["25225", "0", "validado", "Parcela de consórcio de veículo Ademicon (ativo)."] : ["25172", "0", "revisar", "Parcela de consórcio Ademicon (ativo) — conferir o contrato."];
  const rec = recepcao.get([m.codigo, Number(m.documento), Number(m.parcela), m.data].join("|")) ?? "";
  const [, mes, ano] = rec.split("/");
  const recente = ano === "2026" && Number(mes) >= 8;
  const temEntrada = comEntrada.has(`${m.codigo}|${Number(m.documento)}`);
  if (m.codigo === "I00009") return ["4669", "304", "validado", "IPVA sem documento de entrada — despesa no pagamento."];
  if (m.gerencial === "15.02.020" && temEntrada) return ["25218", "0", "validado", "Pagamento de fatura de energia com nota de entrada — baixa de Energia Elétrica a Pagar (25218), mesmo critério das entradas de agosto."];
  // Título que só existe no financeiro (sem entrada fiscal): despesa no pagamento, qualquer que seja a data de
  // recepção — julho e agosto não reconheceram essas despesas e ficam como estão (decisão do usuário em 07/10/2026).
  if (!temEntrada && semNota(m.gerencial)) {
    const conta = contaDespesa(m.gerencial, m.cc);
    return [conta, m.cc || "0", m.codigo === "F00001" ? "revisar" : "validado", `${m.descGerencial} — título${rec ? ` de ${rec}` : ""} sem entrada fiscal; despesa reconhecida no pagamento${recente ? "" : " (título anterior a agosto)"}${m.codigo === "F00001" ? " (reembolso ao Marcos; confirmar se o imóvel é da Nitaplast)" : ""}.`];
  }
  return ["1496", "0", "validado", `Pagamento de título${rec ? ` recebido em ${rec}` : ""} — baixa do fornecedor.`];
}

const registros = movimentos.map((m) => ({ m, r: classificar(m) })).filter((x) => x.r);
if (rendimentoNaoRegistrado) registros.push({ m: { data: "30/09/2026", codigo: "", documento: "", parcela: "", historico: "RENTAB.INVEST FACILCRED*", nome: "Rendimentos do Invest Fácil não registrados no Softdib (diferença extrato x Softdib no mês)", complemento: "", valor: rendimentoNaoRegistrado, descGerencial: "" }, r: ["25098", "0", "validado", "Diferença entre o total do extrato e o do Softdib no mês: rendimentos do Invest Fácil automático."] });
// Invest Fácil 6349 (automático, dentro da conta 62): 274.483,97 em 31/08 (extrato 08/2026) e, em 30/09, todo o
// saldo do extrato (24.071,69) está aplicado ("Saldos Invest Fácil / Plus"), com a conta corrente zerada.
const investFacilAnterior = 274_483.97;
const resgateLiquido = arred(investFacilAnterior - extrato.saldoFinal);
registros.push({ m: { data: "30/09/2026", codigo: "", documento: "", parcela: "", historico: "INVEST FÁCIL — resgates líquidos do mês", nome: `Invest Fácil 6349: ${investFacilAnterior.toFixed(2)} em 31/08 → ${extrato.saldoFinal.toFixed(2)} em 30/09`, complemento: "", valor: resgateLiquido, descGerencial: "" }, r: ["62", "0", "validado", "Movimento líquido do Invest Fácil automático no mês (aplicações menos resgates), pelos saldos do extrato; o saldo do extrato de 30/09 está todo aplicado."] });
const esc = (s) => JSON.stringify(s);
const linhasTs = registros.map(({ m, r }, i) => `  [${i + 1},${esc(m.data)},${esc(m.codigo ? `${m.codigo} ${m.documento}/${m.parcela}` : "")},${esc(`${m.historico} — ${m.nome || m.complemento}`.slice(0, 120))},${m.valor},${esc(r[0])},${esc(r[1])},${esc(r[2])},${esc(r[3])}],`);
const conteudo = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { nomesCcFonte } from "./nitaplast-centros-custo-fonte";

const nome = (codigo: string) => \`\${codigo} - \${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}\`;

// Arquivo gerado por scripts/gerar-itau-setembro.mjs — não editar à mão.
//
// Extrato oficial Bradesco 6349/3035-0 de 01/09 a 30/09/2026 ("NITA - BRADESCO.pdf"): saldo (com Invest Fácil)
// ${extrato.saldoAnterior.toFixed(2)} em 31/08 → ${extrato.saldoFinal.toFixed(2)} em 30/09, ${extrato.linhas.length} lançamentos, saldos diários conferidos.
// Movimento financeiro do Softdib: ${movimentos.length} movimentos, mesmo total do extrato no mês (${totalSoftdib.toFixed(2)}).
// Transferências com o Itaú já estão em SET-ITAU-EXT-*; as para a 895 e o BB são lançadas só aqui.

type Linha = readonly [seq: number, data: string, titulo: string, historico: string, valor: number, contrapartida: string, cc: string, status: "validado" | "revisar", nota: string];

const linhas: Linha[] = [
${linhasTs.join("\n")}
];

export const lancamentosBradesco6349Setembro: LancamentoIntegrado[] = linhas.map(([seq, data, titulo, historico, valor, contrapartida, cc, status, nota]) => {
  const entrada = valor > 0;
  const debitoCodigo = entrada ? "9" : contrapartida;
  const creditoCodigo = entrada ? contrapartida : "9";
  return {
    id: \`SET-BRAD6349-EXT-\${String(seq).padStart(3, "0")}\`,
    data,
    origem: "EXTRATO BRADESCO 6349/3035-0 09/2026",
    debitoCodigo,
    debito: nome(debitoCodigo),
    creditoCodigo,
    credito: nome(creditoCodigo),
    historico,
    documento: titulo ? \`Extrato Bradesco 6349/3035-0 — título \${titulo}\` : "Extrato Bradesco 6349/3035-0",
    cc,
    centroCusto: cc === "0" ? "SEM CENTRO DE CUSTO" : nomesCcFonte[cc] ?? \`CC \${cc}\`,
    valor: Math.abs(valor),
    status,
    observacao: nota,
    rastreio: "documento",
    fonte: "NITA - BRADESCO.pdf (extrato 09/2026) + RELATORIO MOVIMENTO FINANCEIRO NITAPLAST 092026.csv + PAGAMENTOS 092026.csv (apoio à identificação)",
  };
});
`;
writeFileSync(SAIDA, conteudo);
const por = new Map();
for (const { m, r } of registros) por.set(r[0], arred((por.get(r[0]) ?? 0) + m.valor));
console.log(`${registros.length} lançamentos, líquido ${totalSoftdib}; extrato ${extrato.saldoAnterior} -> ${extrato.saldoFinal}`);
console.log([...por].sort((a, b) => a[1] - b[1]).map(([k, v]) => `${k}: ${v}`).join("\n"));
console.log("\n--- despesas diretas e revisões");
for (const { m, r } of registros.filter((x) => /^[345]/.test(x.r[0]) || x.r[0] === "4859" || x.r[0] === "25104" || x.r[2] === "revisar")) console.log(m.data, String(m.valor).padStart(10), r[0].padEnd(6), r[1].padEnd(4), m.codigo, m.nome.slice(0, 28), "|", m.descGerencial.slice(0, 24), "|", m.complemento.slice(0, 36));
