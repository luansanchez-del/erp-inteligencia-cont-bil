// Gera src/data/nitaplast-itau-agosto.ts — movimento do Itaú 04114-0 de 08/2026 que não estava no Razão.
// O extrato (NITA - ITAU.pdf) é o documento oficial: o total de cada dia do movimento financeiro do
// Softdib bate com o extrato nos 21 dias (conferido abaixo), então cada linha usa o detalhe do Softdib
// (fornecedor/título/conta gerencial) só para identificar a contrapartida.
// Critério acordado com o usuário em 07/10/2026: o resultado de agosto não muda.
//  - títulos com documento (nota/entrada) baixam o passivo; contas mensais sem nota e tarifas da Matriz
//    ficam na transitória 4859 e vão para despesa em setembro.
import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const SOFTDIB = "C:/082026/EXTRATOS 082026/EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv";
const PAGAMENTOS = "C:/092026/PAGAMENTOS 082026.csv";
const ENTRADAS = "C:/082026/FISCAL/RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO -  SOFTDIB 082026.csv";
const EXTRATO = "C:/082026/EXTRATOS 082026/08 - AGOSTO - 2026/NITA - ITAU.pdf";
const SAIDA = "src/data/nitaplast-itau-agosto.ts";

const num = (s) => (s && s.trim() ? Number(s.trim().replace(/\./g, "").replace(",", ".")) : 0);
const cent = (v) => Math.round(v * 100);
const linhasCsv = (arq) => readFileSync(arq, "latin1").split(/\r?\n/).map((l) => l.split(";").map((c) => c.trim()));

// 1. Extrato oficial, lido e conferido pelo leitor do Itaú.
const tmp = `${process.env.TEMP ?? "."}/itau-agosto-extrato.json`;
execFileSync("node", ["scripts/ler-extrato-itau.mjs", EXTRATO, tmp], { stdio: "ignore" });
const extrato = JSON.parse(readFileSync(tmp, "utf8"));

// 2. Movimento do Softdib (Itaú), sem as linhas repetidas por rateio de CC.
const vistos = new Set();
const movimentos = [];
for (const c of linhasCsv(SOFTDIB)) {
  if (c.length < 31 || c[3] !== "B34100") continue;
  const chave = [c[5], c[8], c[9], c[10], c[11]].join("|");
  if (vistos.has(chave)) continue;
  vistos.add(chave);
  const partes = c[14].split("/");
  movimentos.push({
    data: c[5], historico: c[15], complemento: c[14].replace(/\s+/g, " "), gerencial: c[21], descGerencial: c[22],
    valor: Math.round((num(c[12]) + num(c[13])) * 100) / 100,
    filial: /^\d{3}\/\d{3}\//.test(c[14]) ? partes[1] : "",
    codigo: /^[A-Z]\d{5}$/.test(partes[4] ?? "") ? partes[4] : "",
    documento: /^\d+$/.test(partes[2] ?? "") ? String(Number(partes[2])) : "",
    parcela: /^\d+$/.test(partes[3] ?? "") ? String(Number(partes[3])) : "",
    nome: c[27] || partes[5] || "", observacao: c[32],
  });
}

// Conferência dia a dia Softdib x extrato.
const porDia = (lista, f) => lista.reduce((m, x) => m.set(x.data, (m.get(x.data) ?? 0) + f(x)), new Map());
const dExt = porDia(extrato.linhas, (l) => l.valor);
const dSof = porDia(movimentos, (m) => m.valor);
for (const d of new Set([...dExt.keys(), ...dSof.keys()])) {
  if (cent(dExt.get(d) ?? 0) !== cent(dSof.get(d) ?? 0)) throw new Error(`Dia ${d}: extrato ${dExt.get(d)} x Softdib ${dSof.get(d)}`);
}

// 3. Data de recepção dos títulos (Relação de Pagamentos) e documentos das entradas de agosto.
const recepcao = new Map();
const pag = linhasCsv(PAGAMENTOS);
for (const c of pag.slice(1)) {
  if (c.length < 26 || c[14] !== "B34100") continue;
  const [doc, parc] = c[4].split("/");
  recepcao.set([c[3].split("-")[0], Number(doc), Number(parc), c[10]].join("|"), c[25]);
}
const entradasAgosto = new Set(linhasCsv(ENTRADAS).slice(1).filter((c) => c.length > 10).map((c) => `${c[6].split(/[ -]/)[0]}|${Number(c[2])}`));

// Gerenciais de contas mensais/avulsas sem nota (vão para a transitória quando o título é de agosto e não tem entrada).
const semNota = /^(15\.02\.019|15\.02\.020|15\.02\.021|15\.02\.010|15\.02\.022|15\.02\.033|15\.03\.004|15\.03\.005|15\.01\.013|15\.03\.003|15\.02\.007|12\.03\.010|15\.02\.002|15\.02\.027|12\.03\.004|15\.01\.011|15\.01\.002|15\.02\.025|15\.02\.03|11\.02\.002)/;
const jaNoRazao = [];
const transitoria = (nota) => ["4859", "0", "revisar", `${nota} Lançado na transitória em agosto para não alterar o resultado já fechado; vai para despesa em setembro/2026 (decisão do usuário em 07/10/2026).`];

function classificar(m) {
  const c = m.complemento;
  const h = m.historico;
  if (/^TRANSF DO B23700/.test(c)) return { ja: "Transferência do Bradesco 6349 — já lançada pelo lado do Bradesco (AGO-BRAD6349-EXT-*, D 11)" };
  if (m.codigo === "F22542") return { ja: "Fatura do cartão Itaú — já lançada (AGO-CARTAO-ITAU-*)" };
  if (["I00011", "I00010"].includes(m.codigo) && m.data === "31/08/2026") return { ja: "DARF IRPJ/CSLL 07/2026 — já lançado (AGO-DARF-IRPJ/CSLL-072026)" };
  if (m.codigo === "F02474" && m.documento === "29") return { ja: "Haustin NF 29 — já lançado (AGO-PAG-HAUSTIN-NF29)" };
  if (/^PAGAMENTO RESCIS/.test(h) && m.codigo === "P00006" && m.documento === "30355") return { ja: "Pagamento e estorno da rescisão 30355 no mesmo dia (R$ 829,81) — se anulam; a rescisão foi paga pelo Bradesco" };
  if (/^TRANSF P\/ B34101/.test(c)) return ["25002", "0", "validado", "Aplicação Itaú Trust DI (Softdib: TRANSF P/ B34101)."];
  if (/^TRANSF DO B34101/.test(c)) return ["25002", "0", "validado", "Resgate Itaú Trust DI (Softdib: TRANSF DO B34101)."];
  if (/NITA P\/ MVS/.test(c)) return ["4898", "0", "validado", "Transferência à MVS Administradora de Bens (empresa sócia) — Adiantamento de Lucros, mesmo critério de julho/agosto."];
  if (/^RECEBIMENTO DE DUPLICATAS/.test(h)) return ["25111", "0", "validado", "Recebimento de duplicata (Softdib: RECEBIMENTO DE DUPLICATAS)."];
  if (/^ADIANTAMENTO DE CLIENTES/.test(h)) return ["1712", "0", "validado", "Adiantamento de cliente (Softdib: ADIANTAMENTO DE CLIENTES)."];
  if (/^RENDIMENTO APLIC/.test(h)) return ["54", "0", "validado", "Rendimento da aplicação automática creditado na conta corrente; já reconhecido em AGO-BAN-ITAU-AUTO-REND."];
  if (/^ADIANTAMENTO FORNECEDORES/.test(h) && /BARCO/.test(c)) return ["25129", "0", "validado", "Compra do barco do Marcos (Estaleiro Atlântico Sul) — devolvida pelo Marcos em 26/08 (ESTORNO PGTO INDEVIDO); conta corrente do Marcos, se anula."];
  if (/^ESTORNO DE PAGAMENTO INDEVIDO/.test(h)) return ["25129", "0", "validado", "PIX do Marcos Victor Siedel devolvendo o pagamento do barco de 20/08 (R$ 4.000,00)."];
  if (/^ADIANTAMENTO FORNECEDORES/.test(h) && /CARRO MARCOS/.test(c)) return ["288", "0", "revisar", "PIX a Luiz Fernando de Oliveira Chireia (CPF 031.835.239-73) — compra do Karmann Ghia, sem documento fiscal. Mantido em adiantamento a fornecedores até o documento do veículo (decisão do usuário em 07/10/2026)."];
  if (/^ADIANTAMENTO FORNECEDORES/.test(h)) return ["288", "0", "validado", "Adiantamento a fornecedor (Softdib: ADIANTAMENTO FORNECEDORES)."];
  if (!m.codigo) return transitoria(`${h} sem título vinculado (tarifa, reembolso ou ajuste do financeiro).`);
  const p = m.codigo[0];
  if (m.codigo === "I00002") return [m.filial === "002" ? "25236" : "1543", "0", "validado", `Pagamento de IPI a recolher ${m.filial === "002" ? "da Filial SP" : "da Matriz"}.`];
  if (m.codigo === "I00017") return ["1542", "0", "validado", "Pagamento de ICMS ST a recolher."];
  if (m.codigo === "I00012") return ["1580", "0", "validado", "Pagamento de contribuições retidas (CSLL/PIS/COFINS)."];
  if (m.codigo === "I00006") return ["25233", "0", "validado", "Pagamento de IRRF retido de terceiros."];
  if (m.codigo === "I00013") return ["1582", "0", "validado", "Pagamento de ISS retido de terceiros."];
  if (m.codigo === "O00002") return ["25227", "0", "validado", "Pagamento de INSS a recolher."];
  if (["O00003", "O00004"].includes(m.codigo)) return ["25228", "0", "validado", "Pagamento de FGTS a recolher."];
  if (m.codigo === "P00002" || m.codigo === "P00006") return ["1634", "0", "validado", "Pagamento de salários/rescisão."];
  if (m.codigo === "P00004") return ["25238", "0", "validado", "Pagamento de 13º salário."];
  if (["P00009", "P00005"].includes(m.codigo)) return ["312", "0", "validado", "Pagamento de adiantamento salarial/de férias (baixado na folha contra 312)."];
  if (m.codigo === "F01528" && ["54", "55", "56"].includes(m.documento)) return ["25254", "0", "validado", `NPLOG documento ${m.documento} (abril a junho) — baixa da dívida com a NPLOG da implantação (25254).`];
  if (m.codigo === "F02221") return /VEICULO/i.test(m.observacao) ? ["25225", "0", "validado", "Parcela de consórcio de veículo Ademicon (ativo)."] : ["25172", "0", "revisar", "Parcela de consórcio Ademicon (ativo) — grupo 760 cota 1762; conferir o contrato."];
  if (m.codigo === "I00009") return transitoria("IPVA em atraso, sem documento de entrada.");
  const rec = recepcao.get([m.codigo, Number(m.documento), Number(m.parcela), m.data].join("|")) ?? "";
  const doAgosto = rec.endsWith("/08/2026");
  const comEntrada = entradasAgosto.has(`${m.codigo}|${Number(m.documento)}`);
  if (m.codigo === "F00001" && m.documento === "3082026") return ["1496", "0", "validado", "Reembolso ao Marcos das passagens e estadias (Lazlo/Bianca/Bira) já reconhecidas em julho (JUL-ENT-CC-066/068) — baixa do fornecedor."];
  if (doAgosto && !comEntrada && p !== "T" && semNota.test(m.gerencial) && !(m.codigo === "F02605" && cent(m.valor) === -5447)) {
    if (m.codigo === "F00001") return transitoria(`Reembolso ao Marcos (${m.descGerencial}) — sem documento; natureza (imóvel da Nitaplast ou da MVS) a confirmar.`);
    return transitoria(`${m.descGerencial} — título de agosto sem nota/entrada no Razão.`);
  }
  return ["1496", "0", "validado", `Pagamento de título${rec ? ` recebido em ${rec}` : ""} — baixa do fornecedor (documento já no Razão).`];
}

const registros = [];
for (const m of movimentos) {
  const r = classificar(m);
  if (!Array.isArray(r)) { jaNoRazao.push({ ...m, motivo: r.ja }); continue; }
  registros.push({ m, r });
}

// Conferências das partes já lançadas.
const somaJa = (re) => Math.round(jaNoRazao.filter((x) => re.test(x.motivo)).reduce((t, x) => t + x.valor, 0) * 100) / 100;
if (somaJa(/Bradesco 6349/) !== 2534000) throw new Error("Transferências do Bradesco divergentes");
if (somaJa(/cartão Itaú/) !== -46528.06) throw new Error("Cartão Itaú divergente");
if (somaJa(/DARF/) !== -41023.21) throw new Error("DARF divergente");
if (somaJa(/Haustin/) !== -10580) throw new Error("Haustin divergente");

const esc = (s) => JSON.stringify(s);
const linhasTs = registros.map(({ m, r }, i) => `  [${i + 1},${esc(m.data)},${esc(m.codigo ? `${m.codigo} ${m.documento}/${m.parcela}` : "")},${esc(`${m.historico} — ${m.nome || m.complemento}`.slice(0, 120))},${m.valor},${esc(r[0])},${esc(r[1])},${esc(r[2])},${esc(r[3])}],`);
const totalNovo = Math.round(registros.reduce((t, x) => t + x.m.valor, 0) * 100) / 100;
const conteudo = `import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => \`\${codigo} - \${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}\`;

// Arquivo gerado por scripts/gerar-itau-agosto.mjs — não editar à mão.
//
// Extrato oficial Itaú 1656/04114-0 de 01/08 a 31/08/2026 ("NITA - ITAU.pdf"): saldo total
// ${extrato.saldoAnterior.toFixed(2)} em 31/07 → ${extrato.saldoFinal.toFixed(2)} em 31/08 (inclui a aplicação automática, conta 54),
// ${extrato.linhas.length} lançamentos, 21 saldos diários conferidos. O movimento financeiro do Softdib bate com o
// extrato em todos os dias e só identifica a contrapartida.
//
// ${movimentos.length} movimentos no Softdib: ${registros.length} lançados aqui (líquido ${totalNovo.toFixed(2)}) e ${jaNoRazao.length} já
// representados no Razão (transferências do Bradesco, cartão, DARF, Haustin, rescisão estornada).
// O resultado de agosto não muda: pagamentos baixam passivos; contas sem nota vão para a transitória 4859.

type Linha = readonly [seq: number, data: string, titulo: string, historico: string, valor: number, contrapartida: string, cc: string, status: "validado" | "revisar", nota: string];

const linhas: Linha[] = [
${linhasTs.join("\n")}
];

export const lancamentosItauAgosto: LancamentoIntegrado[] = linhas.map(([seq, data, titulo, historico, valor, contrapartida, cc, status, nota]) => {
  const entrada = valor > 0;
  const debitoCodigo = entrada ? "11" : contrapartida;
  const creditoCodigo = entrada ? contrapartida : "11";
  return {
    id: \`AGO-ITAU-EXT-\${String(seq).padStart(3, "0")}\`,
    data,
    origem: "EXTRATO ITAÚ 1656/04114-0 08/2026",
    debitoCodigo,
    debito: nome(debitoCodigo),
    creditoCodigo,
    credito: nome(creditoCodigo),
    historico,
    documento: titulo ? \`Extrato Itaú 04114-0 — título \${titulo}\` : "Extrato Itaú 04114-0",
    cc,
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: Math.abs(valor),
    status,
    observacao: nota,
    rastreio: "documento",
    fonte: "NITA - ITAU.pdf (extrato 08/2026) + EXTRATO MOVIMENTO 082026 - SISTEMA CLIENTE SOFTDIB.csv + PAGAMENTOS 082026.csv (apoio à identificação)",
  };
});
`;
writeFileSync(SAIDA, conteudo);
const por = new Map();
for (const { m, r } of registros) por.set(r[0], Math.round(((por.get(r[0]) ?? 0) + m.valor) * 100) / 100);
console.log(`${registros.length} lançamentos novos, líquido ${totalNovo}; ${jaNoRazao.length} já no Razão`);
console.log([...por].sort((a, b) => a[1] - b[1]).map(([k, v]) => `${k}: ${v}`).join("\n"));
console.log("\n--- transitória 4859");
for (const { m, r } of registros.filter((x) => x.r[0] === "4859")) console.log(m.data, String(m.valor).padStart(10), m.codigo, m.nome.slice(0, 30), "|", m.descGerencial.slice(0, 28), "|", m.complemento.slice(0, 40));
