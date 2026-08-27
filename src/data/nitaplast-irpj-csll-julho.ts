import { calcularIrpjCsllLucroRealMensal, type ApuracaoIrpjCsllLucroRealMensalResultado } from "@/lib/apuracao-irpj-csll";
import type { calcularDreJulhoFinal } from "./nitaplast-dre-julho-final";

type DreJulhoFinal = ReturnType<typeof calcularDreJulhoFinal>["dre"];

export const contaIrrfAplicacoesFinanceirasNitaplast = "25118";

export type ApuracaoIrpjCsllJulho = ApuracaoIrpjCsllLucroRealMensalResultado & {
  lucroContabilDoMes: number;
};

export type AjustesLalurJulho = {
  adicoesIrpj: number;
  exclusoesIrpj: number;
  adicoesCsll: number;
  exclusoesCsll: number;
};

// Nitaplast antecipa o DARF mensal com base no lucro contábil do próprio mês, ajustado
// pelas adições/exclusões do LALUR informadas pelo contador na tela de Apuração. Sem
// ajustes informados, a base fica igual ao lucro contábil do mês.
export function calcularApuracaoIrpjCsllJulho(
  dre: DreJulhoFinal,
  irrfAplicacoesFinanceiras: number,
  ajustesLalur?: AjustesLalurJulho,
): ApuracaoIrpjCsllJulho {
  const resultado = calcularIrpjCsllLucroRealMensal({
    lucroContabilDoMes: dre.resultado,
    retencoesIrpjCompensaveis: irrfAplicacoesFinanceiras,
    adicoesIrpj: ajustesLalur?.adicoesIrpj ?? 0,
    exclusoesIrpj: ajustesLalur?.exclusoesIrpj ?? 0,
    adicoesCsll: ajustesLalur?.adicoesCsll ?? 0,
    exclusoesCsll: ajustesLalur?.exclusoesCsll ?? 0,
  });

  return {
    ...resultado,
    lucroContabilDoMes: dre.resultado,
  };
}
