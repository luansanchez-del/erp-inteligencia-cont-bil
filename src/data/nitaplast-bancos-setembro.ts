import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

type Linha = readonly [id: string, data: string, valor: number, conta: string, contrapartida: string, historico: string, observacao: string, cc?: string];

/**
 * Banco do Brasil, Bradesco 895 (energia), Invest Fácil, Itaú Trust DI e Greencred — setembro/2026.
 * Aplicações pelos extratos de C:/092026/APLICAÇÕES FINANCEIRAS 092026, pelo saldo bruto (Greencred líquido do IR provisionado).
 * Valor = efeito na conta do banco/aplicação (positivo entra, negativo sai). As transferências entre
 * contas próprias já estão no Itaú (SET-ITAU-EXT-*) e no Bradesco (SET-BRAD6349-EXT-*) e não se repetem aqui.
 */
const linhas: Linha[] = [
  // Banco do Brasil 3275-1/30807-2 — extrato 01 a 30/09/2026: 7.283,15 → 3.983,18.
  ["BB-01", "03/09/2026", 3_218.31, "10", "1712", "Isolution Soluções Termo — adiantamento de cliente", "Softdib: ADIANTAMENTO DE CLIENTES."],
  ...([["412", "001"], ["415", "002"], ["423", "003"], ["437", "004"], ["439", "005"], ["443", "006"]] as const).map(([cc, parcela], i): Linha =>
    [`BB-02-${i + 1}`, "04/09/2026", -94.61, "10", "4663", `Detran PR — licenciamento de veículo (título 4092026/${parcela})`, "Licenciamento sem documento de entrada — despesa no pagamento.", cc]),
  ["BB-03", "04/09/2026", -722.5, "10", "288", "Darci Francisco dos Reis (Vidraçaria Reis) — adiantamento de OC 17091", "Softdib: TRANSFERENCIA FORNECEDOR com observação ADTO OC."],
  ["BB-04", "10/09/2026", -211.3, "10", "25104", "Tarifa pacote de serviços BB", "Tarifa bancária."],
  ["BB-05", "11/09/2026", -4.6, "10", "25104", "Tarifa pacote de serviços BB (parcela)", "Tarifa bancária."],
  ["BB-06", "23/09/2026", 3_790.76, "10", "25111", "So Nylon Comercial — duplicata NF 94838/01 (3.777,26 + 13,50)", "Recebimento de duplicata."],
  ["BB-07", "23/09/2026", -202.98, "10", "1496", "Campinense Transporte — frete CT-e 329314 (devolução de cliente)", "Pagamento de título de frete."],
  // Bradesco 895/27418-6 (energia) — conta corrente pelo Softdib (B23702); Invest Fácil pelo extrato de CDB da 895
  // (Nitaplast Bradesco energia.pdf): aplicações 3.589,59, resgates 3.037,49. A conta corrente fica em R$ 1,00.
  ["895-01", "09/09/2026", 600.31, "25001", "3494", "Crédito do Mercado de Energia (CCEE) na conta 895", "Recuperação de custo de energia.", "102"],
  ["895-02", "15/09/2026", -48.21, "25001", "25104", "Tarifa SERV DEP QUALIF da conta 895", "Tarifa bancária."],
  ["895-04", "21/09/2026", -2_927.52, "25001", "3494", "Encargo CCEE — energia de reserva", "Débito automático da CCEE na conta 895.", "102"],
  ["895-05", "23/09/2026", -1_828.36, "25001", "3494", "Encargo CCEE — reserva de capacidade", "Débito automático da CCEE na conta 895.", "102"],
  ["895-08", "28/09/2026", -1_890.12, "25001", "3494", "Débito na conta 895 coberto por resgate do Invest Fácil em 28/09 — provável encargo CCEE", "O extrato do Invest Fácil mostra resgate de R$ 1.890,12 em 28/09 (certificado 1262792672953) sem débito correspondente no Softdib. A conta 895 só movimenta energia (CCEE). Falta o extrato da conta corrente 895 para confirmar.", "102"],
  ["895-07", "30/09/2026", -552.1, "25001", "62", "Aplicação líquida no Invest Fácil da conta 895 no mês (aplicações 3.589,59 − resgates 3.037,49)", "Extrato de CDB da 895, setembro/2026."],
  ["62-AJ", "30/09/2026", 2.41, "62", "25098", "Rendimento apropriado do Invest Fácil (6349 e 895) — ajuste ao saldo bruto de 30/09", "Saldo bruto dos extratos em 30/09: 6349 R$ 24.072,40 + 895 R$ 6.918,32 = R$ 30.990,72."],
  // Itaú Trust DI — extrato do fundo (Nitaplast Itau Fundo.pdf), saldo bruto: 266.854,01 + aplicações 1.847.390,00
  // − resgates brutos 741.050,15 + rendimento 10.457,47 = 1.383.651,33 (líquido para resgate 1.380.222,47).
  // Resgates líquidos já lançados pelo Itaú: 738.800,00; a diferença é o IOF e o IR retidos.
  ["TRUST-AJ-0831", "01/09/2026", 172.38, "25002", "25098", "Itaú Trust DI — ajuste da posição de 31/08 ao saldo bruto do extrato", "Sistema em 31/08 (após acertos de junho e agosto): 266.681,63; extrato: saldo bruto anterior 266.854,01."],
  ["TRUST-REND", "30/09/2026", 10_457.47, "25002", "25098", "Rendimento bruto do Itaú Trust DI em setembro/2026", "Extrato do fundo: rendimento bruto no mês."],
  ["TRUST-IR", "30/09/2026", -814.11, "25002", "25118", "IR retido nos resgates do Itaú Trust DI em setembro/2026", "Extrato do fundo: IR retido no período (resgates de 14, 21, 25, 28 e 30/09)."],
  ["TRUST-IOF", "30/09/2026", -1_436.04, "25002", "25105", "IOF retido nos resgates do Itaú Trust DI em setembro/2026", "Extrato do fundo: IOF retido no período."],
  // Itaú Aplic Aut Mais 1656/04114-0 (Nitaplast Itau resumo.pdf): saldo bruto 67.787,94 em 31/08 → 80.088,29 em 30/09.
  // Aplicações e resgates automáticos do mês estão somados na conta corrente (11), como no saldo total do extrato.
  ["AUT-MAIS", "30/09/2026", 12_300.35, "54", "11", "Itaú Aplic Aut Mais — posição de 30/09 (aplicações 511.041,11 − resgates 498.748,36 + rendimento 7,60)", "Transfere da conta corrente para a aplicação o movimento líquido do mês; a conta corrente fica com R$ 0,17."],
  // Greencred — Relação de Saldos de Aplicações em 31/08 e 30/09: Jur+Corr 224.591,31 → 241.039,18;
  // IR 42.953,36 → 46.244,41; líquido 1.536.985,11 → 1.550.141,93. Saldo mantido líquido do IR provisionado (como JUL-APL-GREEN-004).
  ["GREEN-AJ-0831", "01/09/2026", 114.2, "25110", "25098", "Greencred — ajuste da posição de 31/08 ao extrato (líquido 1.536.985,11)", "Sistema em 31/08: 1.536.870,91."],
  ["GREEN-REND", "30/09/2026", 16_447.87, "25110", "25098", "Rendimento bruto da aplicação Greencred em setembro/2026", "Jur+Corr Mon: 241.039,18 em 30/09 − 224.591,31 em 31/08."],
  ["GREEN-IR-PROV", "30/09/2026", -3_291.05, "25110", "25118", "IR provisionado sobre os títulos Greencred em setembro/2026 (não retido)", "Vl.Imp.Renda: 46.244,41 em 30/09 − 42.953,36 em 31/08. Provisão, sem resgate no mês: não compensa no LALUR até a retenção."],
];

const fonteAplicacao: Record<string, string> = {
  "54": "Nitaplast Itau resumo.pdf + Nitaplast Itau consolidado.pdf",
  "62": "Nitaplast Bradesco Invest fácil.pdf + Nitaplast Bradesco energia.pdf",
  "25002": "Nitaplast Itau Fundo.pdf",
  "25110": "Nitaplast Greencred.pdf",
};

export const lancamentosBancosSetembro: LancamentoIntegrado[] = linhas.map(([id, data, valor, conta, contrapartida, historico, observacao, cc]) => {
  const entrada = valor > 0;
  const debitoCodigo = entrada ? conta : contrapartida;
  const creditoCodigo = entrada ? contrapartida : conta;
  return {
    id: `SET-BAN-${id}`,
    data,
    origem: conta === "10" ? "EXTRATO BANCO DO BRASIL 09/2026" : conta === "25001" ? "BRADESCO 895 ENERGIA 09/2026" : "APLICAÇÕES FINANCEIRAS 09/2026",
    debitoCodigo,
    debito: nome(debitoCodigo),
    creditoCodigo,
    credito: nome(creditoCodigo),
    historico,
    documento: conta === "10" ? "Extrato BB 3275-1/30807-2 09/2026" : (fonteAplicacao[conta] ?? "Movimento financeiro Softdib 09/2026"),
    cc: cc ?? "0",
    centroCusto: cc === "102" ? "PRODUÇÃO" : cc ? `CC ${cc}` : "SEM CENTRO DE CUSTO",
    valor: Math.abs(valor),
    status: ["895-08", "TRUST-AJ-0831", "GREEN-AJ-0831"].includes(id) ? "revisar" : "validado",
    observacao,
    rastreio: "documento",
    fonte: conta === "10" ? "NITA - BB.pdf (09/2026) + RELATORIO MOVIMENTO FINANCEIRO NITAPLAST 092026.csv" : fonteAplicacao[conta] ? `C:/092026/APLICAÇÕES FINANCEIRAS 092026/${fonteAplicacao[conta]}` : "RELATORIO MOVIMENTO FINANCEIRO NITAPLAST 092026.csv",
  };
});
