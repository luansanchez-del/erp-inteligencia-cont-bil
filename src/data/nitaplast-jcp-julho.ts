import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import { calculoJcpJulho } from "./nitaplast-fechamento-julho";
import { descricaoContaJulho } from "./nitaplast-saldos-julho";

const nomeConta = (codigo: string) => `${codigo} - ${descricaoContaJulho.get(codigo) ?? "Conta a revisar"}`;

/**
 * JCP de 07/2026 autorizado para contabilização.
 *
 * Orientação operacional desta competência:
 * - contabilizar somente o JCP bruto;
 * - NÃO contabilizar IRRF nesta etapa;
 * - manter eventual IRRF apenas como informação/pendência tributária no fechamento.
 */
export const lancamentosJcpJulho: LancamentoIntegrado[] = [
  {
    id: "JUL-JCP-RECON-072026",
    data: "31/07/2026",
    origem: "RECONHECIMENTO JCP 07/2026",
    debitoCodigo: "25107",
    debito: nomeConta("25107"),
    creditoCodigo: "25253",
    credito: nomeConta("25253"),
    historico: "Reconhecimento de juros sobre capital próprio de julho/2026",
    documento: "JCP 07/2026",
    cc: "902",
    centroCusto: "DESPESAS FINANCEIRAS",
    valor: calculoJcpJulho.jcpCalculado,
    status: "validado",
    observacao: "JCP de julho autorizado para contabilização pelo valor bruto. IRRF não contabilizado nesta etapa por orientação operacional; manter como pendência tributária separada.",
    rastreio: "derivado",
    fonte: "Cálculo JCP 07/2026 do ERP + autorização de contabilização",
  },
];

export const resumoJcpJulho = {
  bruto: calculoJcpJulho.jcpCalculado,
  contabilizado: calculoJcpJulho.jcpCalculado,
  irrfContabilizado: 0,
  irrfPotencial: calculoJcpJulho.irrfPotencialSeCreditado,
  aliquotaIrrfReferencia: 17.5,
  contabilizadoNoRazao: true,
  pago: false,
} as const;
