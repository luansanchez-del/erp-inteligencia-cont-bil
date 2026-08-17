import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import {
  lancamentosIntegradosJulhoFinal as lancamentosBaseJulhoFinal,
  totalDebitosJulhoFinal as totalDebitosBaseJulhoFinal,
  totalCreditosJulhoFinal as totalCreditosBaseJulhoFinal,
  pendenciasJulhoFinal as pendenciasBaseJulhoFinal,
  resumoFechamentoJulhoFinal as resumoBaseJulhoFinal,
} from "./nitaplast-razao-julho-final";
import { lancamentosFinanceirosJulho, resumoFinanceiroJulho } from "./nitaplast-financeiro-julho";

const arred = (v: number) => Math.round(v * 100) / 100;

export const lancamentosIntegradosJulhoFinalV2: LancamentoIntegrado[] = [
  ...lancamentosBaseJulhoFinal,
  ...lancamentosFinanceirosJulho,
];

export const totalDebitosJulhoFinalV2 = arred(lancamentosIntegradosJulhoFinalV2.reduce((s, x) => s + x.valor, 0));
export const totalCreditosJulhoFinalV2 = totalDebitosJulhoFinalV2;
export const pendenciasJulhoFinalV2 = lancamentosIntegradosJulhoFinalV2.filter((x) => x.status === "revisar");

export const resumoFechamentoJulhoFinalV2 = {
  ...resumoBaseJulhoFinal,
  lancamentos: lancamentosIntegradosJulhoFinalV2.length,
  debitos: totalDebitosJulhoFinalV2,
  creditos: totalCreditosJulhoFinalV2,
  pendencias: pendenciasJulhoFinalV2.length,
  financeiro: resumoFinanceiroJulho,
  baseAnterior: {
    debitos: totalDebitosBaseJulhoFinal,
    creditos: totalCreditosBaseJulhoFinal,
    pendencias: pendenciasBaseJulhoFinal.length,
  },
} as const;
