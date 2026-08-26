import { calcularIrpjCsllEstimativaMensal, type ApuracaoIrpjCsllEstimativaResultado } from "@/lib/apuracao-irpj-csll";
import type { calcularDreJulhoFinal } from "./nitaplast-dre-julho-final";

type DreJulhoFinal = ReturnType<typeof calcularDreJulhoFinal>["dre"];

export const contaIrrfAplicacoesFinanceirasNitaplast = "25118";

// Nitaplast é indústria e comércio de plásticos (não presta serviço nem revende
// combustível), por isso usa os percentuais de presunção padrão da Lei 9.249/1995,
// art. 15/20: 8% para IRPJ e 12% para CSLL sobre a receita bruta da atividade.
export const percentualPresuncaoIrpjNitaplast = 0.08;
export const percentualPresuncaoCsllNitaplast = 0.12;

export type ApuracaoIrpjCsllJulho = ApuracaoIrpjCsllEstimativaResultado & {
  receitaBrutaAtividade: number;
  outrasReceitasTributaveis: number;
  receitasFinanceiras: number;
  resultadoAlienacaoImobilizado: number;
};

export function calcularApuracaoIrpjCsllJulho(dre: DreJulhoFinal, irrfAplicacoesFinanceiras: number): ApuracaoIrpjCsllJulho {
  const outrasReceitasTributaveis = dre.receitasFinanceiras + dre.resultadoAlienacaoImobilizado;

  const resultado = calcularIrpjCsllEstimativaMensal({
    receitaBrutaAtividade: dre.receitaBruta,
    percentualPresuncaoIrpj: percentualPresuncaoIrpjNitaplast,
    percentualPresuncaoCsll: percentualPresuncaoCsllNitaplast,
    outrasReceitasTributaveis,
    retencoesIrpjCompensaveis: irrfAplicacoesFinanceiras,
  });

  return {
    ...resultado,
    receitaBrutaAtividade: dre.receitaBruta,
    outrasReceitasTributaveis,
    receitasFinanceiras: dre.receitasFinanceiras,
    resultadoAlienacaoImobilizado: dre.resultadoAlienacaoImobilizado,
  };
}
