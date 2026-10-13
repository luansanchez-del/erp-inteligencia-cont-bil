import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

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

export const lancamentosAjustesSetembro: LancamentoIntegrado[] = [
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
