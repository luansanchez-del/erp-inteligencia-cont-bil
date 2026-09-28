import { useMemo } from "react";
import {
  calcularApuracaoIrpjCsllJulho,
  contaIrrfAplicacoesFinanceirasNitaplast,
} from "@/data/nitaplast-irpj-csll-julho";
import { calcularDreJulhoFinal } from "@/data/nitaplast-dre-julho-final";
import { calcularBalanceteJulho } from "@/data/nitaplast-balancete-julho-engine";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { useLalurAjustes } from "@/hooks/use-lalur-ajustes";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";
import { LalurApuracaoCard } from "./lalur-apuracao";

const COMPETENCIA = "2026-07";

/**
 * Apuração de julho exatamente como a tela do LALUR 07/2026 mostra (Razão com
 * reclassificações + ajustes do LALUR de julho). Reusada pelo LALUR de agosto,
 * que encadeia o acumulado e o DARF de julho a partir daqui.
 */
export function useApuracaoLalurJulho() {
  const { aplicar } = useReclassificacoesInteligentes(COMPETENCIA);
  const razaoAjustado = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const dre = useMemo(() => calcularDreJulhoFinal(razaoAjustado).dre, [razaoAjustado]);
  const balanceteJulho = useMemo(() => calcularBalanceteJulho(razaoAjustado), [razaoAjustado]);
  const irrfAplicacoesFinanceiras = balanceteJulho.movimentoPorConta.get(contaIrrfAplicacoesFinanceirasNitaplast)?.debitos ?? 0;

  const lalur = useLalurAjustes(COMPETENCIA);
  const { totais } = lalur;

  const irpjCsll = useMemo(
    () => calcularApuracaoIrpjCsllJulho(dre, irrfAplicacoesFinanceiras, totais),
    [dre, irrfAplicacoesFinanceiras, totais],
  );

  return { irpjCsll, lalur };
}

export function LalurJulho() {
  const { irpjCsll, lalur } = useApuracaoLalurJulho();

  return (
    <LalurApuracaoCard
      competencia={COMPETENCIA}
      rotulo="07/2026"
      dataLancamento="31/07/2026"
      lucroContabilDoMes={irpjCsll.lucroContabilDoMes}
      lucroContabilAcumulado={irpjCsll.lucroContabilAcumuladoJaneiroAJulho}
      irpjCsll={irpjCsll}
      lalur={lalur}
    />
  );
}
