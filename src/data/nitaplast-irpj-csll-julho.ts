import { calcularIrpjCsllLucroRealMensal, type ApuracaoIrpjCsllLucroRealMensalResultado } from "@/lib/apuracao-irpj-csll";
import type { calcularDreJulhoFinal } from "./nitaplast-dre-julho-final";

type DreJulhoFinal = ReturnType<typeof calcularDreJulhoFinal>["dre"];

export const contaIrrfAplicacoesFinanceirasNitaplast = "25118";

export type ApuracaoIrpjCsllJulho = ApuracaoIrpjCsllLucroRealMensalResultado & {
  lucroContabilDoMes: number;
};

// Nitaplast antecipa o DARF mensal com base no lucro contábil do próprio mês (ajustado
// pelo LALUR), não pela estimativa por presunção nem pelo acumulado desde janeiro.
// Nenhuma adição/exclusão de julho foi informada até o momento; os campos ficam
// disponíveis na função genérica para quando o contador definir valores.
export function calcularApuracaoIrpjCsllJulho(dre: DreJulhoFinal, irrfAplicacoesFinanceiras: number): ApuracaoIrpjCsllJulho {
  const resultado = calcularIrpjCsllLucroRealMensal({
    lucroContabilDoMes: dre.resultado,
    retencoesIrpjCompensaveis: irrfAplicacoesFinanceiras,
  });

  return {
    ...resultado,
    lucroContabilDoMes: dre.resultado,
  };
}
