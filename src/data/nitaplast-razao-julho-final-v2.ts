import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import {
  lancamentosIntegradosJulhoFinal as lancamentosBaseJulhoFinal,
  totalDebitosJulhoFinal as totalDebitosBaseJulhoFinal,
  totalCreditosJulhoFinal as totalCreditosBaseJulhoFinal,
  pendenciasJulhoFinal as pendenciasBaseJulhoFinal,
  resumoFechamentoJulhoFinal as resumoBaseJulhoFinal,
} from "./nitaplast-razao-julho-final-base";
import { lancamentosFinanceirosJulho, resumoFinanceiroJulho } from "./nitaplast-financeiro-julho";

const arred = (v: number) => Math.round(v * 100) / 100;

export const lancamentosIntegradosJulhoFinal: LancamentoIntegrado[] = [
  ...lancamentosBaseJulhoFinal,
  ...lancamentosFinanceirosJulho,
];

export const totalDebitosJulhoFinal = arred(lancamentosIntegradosJulhoFinal.reduce((s, x) => s + x.valor, 0));
export const totalCreditosJulhoFinal = totalDebitosJulhoFinal;
export const pendenciasJulhoFinal = lancamentosIntegradosJulhoFinal.filter((x) => x.status === "revisar");

export const resumoFechamentoJulhoFinal = {
  ...resumoBaseJulhoFinal,
  lancamentos: lancamentosIntegradosJulhoFinal.length,
  debitos: totalDebitosJulhoFinal,
  creditos: totalCreditosJulhoFinal,
  pendencias: pendenciasJulhoFinal.length,
  financeiro: resumoFinanceiroJulho,
  baseAnterior: {
    debitos: totalDebitosBaseJulhoFinal,
    creditos: totalCreditosBaseJulhoFinal,
    pendencias: pendenciasBaseJulhoFinal.length,
  },
} as const;
