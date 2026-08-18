import type { LancamentoIntegrado } from "./nitaplast-razao-base";
import {
  lancamentosIntegradosJulhoFinal as lancamentosBaseJulhoFinal,
  totalDebitosJulhoFinal as totalDebitosBaseJulhoFinal,
  totalCreditosJulhoFinal as totalCreditosBaseJulhoFinal,
  pendenciasJulhoFinal as pendenciasBaseJulhoFinal,
  resumoFechamentoJulhoFinal as resumoBaseJulhoFinal,
} from "./nitaplast-razao-julho-final-base";
import { lancamentosFinanceirosJulho, resumoFinanceiroJulho } from "./nitaplast-financeiro-julho";
import { lancamentosProvisoesJulhoReais, resumoProvisoesJulhoReais } from "./nitaplast-provisoes-julho-reais";

const arred = (v: number) => Math.round(v * 100) / 100;

// A primeira versão da folha de julho calculava férias/13º por salário ÷ 12.
// Com os relatórios contínuos reais recebidos, essas estimativas não podem permanecer no Razão.
// Mantemos todos os demais fatos da folha e substituímos somente as apropriações estimadas.
const ehProvisaoEstimadaJulho = (id: string) => id.startsWith("JUL-PROV-M-") || id.startsWith("JUL-PROV-F-");
const lancamentosBaseSemProvisoesEstimadas = lancamentosBaseJulhoFinal.filter((x) => !ehProvisaoEstimadaJulho(x.id));

export const lancamentosIntegradosJulhoFinal: LancamentoIntegrado[] = [
  ...lancamentosBaseSemProvisoesEstimadas,
  ...lancamentosProvisoesJulhoReais,
  ...lancamentosFinanceirosJulho,
];

export const totalDebitosJulhoFinal = arred(lancamentosIntegradosJulhoFinal.reduce((s, x) => s + x.valor, 0));
export const totalCreditosJulhoFinal = totalDebitosJulhoFinal;
export const pendenciasJulhoFinal = lancamentosIntegradosJulhoFinal.filter((x) => x.status === "revisar");

const itensMantidosForaPorDecisao = resumoBaseJulhoFinal.itensMantidosForaPorDecisao.filter(
  (item) => item !== "JCP" && item !== "Variação cambial",
);

export const resumoFechamentoJulhoFinal = {
  ...resumoBaseJulhoFinal,
  lancamentos: lancamentosIntegradosJulhoFinal.length,
  debitos: totalDebitosJulhoFinal,
  creditos: totalCreditosJulhoFinal,
  pendencias: pendenciasJulhoFinal.length,
  itensMantidosForaPorDecisao,
  criterioContabil: "Fato/documento real → Razão → Balancete → DRE. Nenhum valor é criado a partir da DRE para fechar diferença.",
  financeiro: resumoFinanceiroJulho,
  folhaJulho: {
    ...resumoBaseJulhoFinal.folhaJulho,
    provisoes: {
      ferias: resumoProvisoesJulhoReais.consolidado.feriasPrincipal,
      encargosFerias: resumoProvisoesJulhoReais.consolidado.feriasEncargos,
      decimoTerceiro: resumoProvisoesJulhoReais.consolidado.decimoPrincipal,
      encargosDecimoTerceiro: resumoProvisoesJulhoReais.consolidado.decimoEncargos,
      totalFerias: resumoProvisoesJulhoReais.consolidado.feriasTotal,
      totalDecimoTerceiro: resumoProvisoesJulhoReais.consolidado.decimoTotal,
      metodo: resumoProvisoesJulhoReais.metodo,
      fonte: resumoProvisoesJulhoReais.fonte,
      matriz: resumoProvisoesJulhoReais.matriz,
      filial: resumoProvisoesJulhoReais.filial,
    },
  },
  baseAnterior: {
    debitos: totalDebitosBaseJulhoFinal,
    creditos: totalCreditosBaseJulhoFinal,
    pendencias: pendenciasBaseJulhoFinal.length,
  },
} as const;

const provisaoEstimadaRestante = lancamentosIntegradosJulhoFinal.find((x) => ehProvisaoEstimadaJulho(x.id));
if (provisaoEstimadaRestante) throw new Error(`Provisão estimada indevida permaneceu no Razão de julho: ${provisaoEstimadaRestante.id}`);

const cambioSemRastreio = lancamentosIntegradosJulhoFinal.find(
  (x) => x.origem.startsWith("CONTRATO DE CÂMBIO") && (!x.documento || !x.fonte),
);
if (cambioSemRastreio) throw new Error(`Lançamento cambial sem documento/fonte: ${cambioSemRastreio.id}`);