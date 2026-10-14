import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";
import { lancamentosCartaoJussaraRodrigoAgosto } from "./nitaplast-cartao-4005-jussara-rodrigo-agosto";

const nome = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * Compras nacionais de matéria-prima de agosto creditadas na 25116 (Importações em Andamento) dentro de
 * AGO-CUSTO-MP-NAC, em vez de Fornecedores (1496). Os títulos foram pagos em setembro debitando a 1496.
 * Agosto fica como está; a reclassificação é patrimonial e não muda o resultado.
 * Ficam na 25116 as duas notas de importação que também estavam em AGO-CUSTO-MP-NAC (94262 Licharz e 94251 Greatland).
 */
const comprasNacionaisAgosto = [
  { nf: "15223", fornecedor: "TRICON ENERGY DO BRASIL", valor: 202_901.1 },
  { nf: "33500", fornecedor: "SM RESINAS BRASIL", valor: 90_636.72 },
  { nf: "125820", fornecedor: "AVIENT BRASIL", valor: 6_842.29 },
  { nf: "8064", fornecedor: "ACTIVAS PLASTICOS INDUSTRIAIS", valor: 153_894.13 },
  { nf: "15277", fornecedor: "TRICON ENERGY DO BRASIL", valor: 108_213.92 },
];

/**
 * Despesas de Jussara e Rodrigo da fatura de agosto (aba AGOSTO 26, vencimento 01/09/2026), lançadas em
 * agosto contra a transitória 4859 em vez de Fornecedores. A fatura foi paga em 01/09 baixando a 1496
 * (Itaú, F22542). A reclassificação leva a dívida para Fornecedores; a 4859 fica só com a fatura de julho
 * paga em 03/08. A despesa continua em agosto; não muda o resultado.
 */
const cartaoAgostoNaTransitoria = Math.round(
  lancamentosCartaoJussaraRodrigoAgosto.reduce((t, l) => t + (l.creditoCodigo === "4859" ? l.valor : l.debitoCodigo === "4859" ? -l.valor : 0), 0) * 100,
) / 100;

export const lancamentosAjustesSetembro: LancamentoIntegrado[] = [
  {
    id: "SET-RECLASS-CARTAO-AGOSTO",
    data: "01/09/2026",
    origem: "RECLASSIFICAÇÃO 08/2026",
    debitoCodigo: "4859",
    debito: nome("4859"),
    creditoCodigo: "1496",
    credito: nome("1496"),
    historico: "Fatura dos cartões de agosto (venc. 01/09/2026) — despesas de Jussara e Rodrigo lançadas contra a transitória",
    documento: "DESPESAS CARTÃO CRÉDITO.xlsx aba AGOSTO 26 / F22542 1092026",
    cc: "0",
    centroCusto: "SEM CENTRO DE CUSTO",
    valor: cartaoAgostoNaTransitoria,
    status: "validado",
    observacao: "Leva para Fornecedores a dívida do cartão já reconhecida como despesa em agosto (AGO-CARTAO-4005-JUSSARA-* e RODRIGO-*), para fechar com o pagamento de 01/09. Sem efeito no resultado.",
    rastreio: "derivado",
    fonte: "nitaplast-cartao-4005-jussara-rodrigo-agosto.ts + extrato Itaú 01/09/2026",
  },
  ...comprasNacionaisAgosto.map((n) => ({
    id: `SET-RECLASS-MP-NAC-${n.nf}`,
    data: "01/09/2026",
    origem: "RECLASSIFICAÇÃO 08/2026",
    debitoCodigo: "25116",
    debito: nome("25116"),
    creditoCodigo: "1496",
    credito: nome("1496"),
    historico: `Reclassificação do fornecedor de matéria-prima nacional de agosto — NF ${n.nf} ${n.fornecedor}`,
    documento: `NF ${n.nf} / AGO-CUSTO-MP-NAC`,
    cc: "102",
    centroCusto: "PRODUÇÃO",
    valor: n.valor,
    status: "validado" as const,
    observacao: "Compra nacional creditada em agosto na 25116 em vez de Fornecedores; os títulos foram pagos em setembro contra a 1496. Sem efeito no resultado.",
    rastreio: "derivado" as const,
    fonte: "RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO - SOFTDIB 082026.csv + PAGAMENTOS 092026.csv",
  })),
  {
    id: "SET-EST-AGO-DUPLIC-94251",
    data: "01/09/2026",
    origem: "CORREÇÃO 08/2026",
    debitoCodigo: "25116",
    debito: nome("25116"),
    creditoCodigo: "3093",
    credito: nome("3093"),
    historico: "Estorno de lançamento em duplicidade — NF 94251 Greatland Valve no custo de agosto",
    documento: "NF 94251 / AGO-CUSTO-MP-IMP-94251",
    cc: "209",
    centroCusto: "IMPORTAÇÃO",
    valor: 109_923.88,
    status: "validado",
    observacao: "A NF 94251 (R$ 109.923,89 no Softdib) entrou em agosto duas vezes: dentro de AGO-CUSTO-MP-NAC (gerencial 11.01.003, 7 documentos, R$ 856.124,54) e em AGO-CUSTO-MP-IMP-94251. Erro de lançamento do sistema; os relatórios do cliente trazem a nota uma vez. Agosto não é alterado; o estorno entra em setembro por decisão do usuário em 14/10/2026.",
    rastreio: "derivado",
    fonte: "C:/082026/FISCAL/RELATATORIO DETALHADO ENTRADAS POR CENTRO DE CUSTO -  SOFTDIB 082026.csv + DANFE NF 94251",
  },
  {
    id: "SET-CAMBIO-LICHARZ-VCA",
    data: "22/09/2026",
    origem: "CÂMBIO DE IMPORTAÇÃO 09/2026",
    debitoCodigo: "25116",
    debito: nome("25116"),
    creditoCodigo: "25096",
    credito: nome("25096"),
    historico: "Variação cambial ativa — Licharz GmbH, NF 94262 (DUIMP de agosto), contrato 635110685",
    documento: "Contrato de câmbio 635110685 / NF 94262 / INV 2041233",
    cc: "209",
    centroCusto: "IMPORTAÇÃO",
    valor: 2_795.94,
    status: "validado",
    observacao: "Título da mercadoria pela DI: R$ 122.575,60. Liquidação: EUR 20.260,43 × 5,9120 = R$ 119.779,66 (Bradesco, 22/09/2026). Diferença a favor da empresa: R$ 2.795,94 (o próprio Softdib registra o desconto no pagamento).",
    rastreio: "documento",
    fonte: "C:/092026/CONTRATO DE CAMBIO 092026/Licharz 635110685.pdf + PAGAMENTOS 092026.csv",
  },
];
