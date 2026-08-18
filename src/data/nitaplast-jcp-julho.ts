import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import {
  baseJcpJulho,
  taxaTjlpJulho,
  jcpBrutoJulho,
  irrfJcpJulho,
} from "./nitaplast-financeiro-julho";

/**
 * Espelho informativo do JCP de 07/2026.
 * O lançamento contábil efetivo é gerado exclusivamente por
 * `nitaplast-financeiro-julho.ts`, evitando duplicidade no Razão.
 */
export const lancamentosJcpJulho: LancamentoIntegrado[] = [];

export const resumoJcpJulho = {
  competencia: "07/2026",
  dataBase: "31/07/2026",
  base: baseJcpJulho,
  taxaTjlp: taxaTjlpJulho,
  bruto: jcpBrutoJulho,
  contabilizado: jcpBrutoJulho,
  irrfCalculadoInformativo: irrfJcpJulho,
  irrfContabilizado: 0,
  contabilizadoNoRazao: true,
  pago: false,
  observacao: "JCP contabilizado uma única vez em julho. IRRF permanece somente como pendência/informação tributária, sem partida contábil nesta etapa.",
} as const;
