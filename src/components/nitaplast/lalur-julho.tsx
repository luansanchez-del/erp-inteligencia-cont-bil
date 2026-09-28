import { useMemo } from "react";
import {
  calcularApuracaoIrpjCsllJulho,
  contaIrrfAplicacoesFinanceirasNitaplast,
  idsIrProvisionadoNaoRetido,
} from "@/data/nitaplast-irpj-csll-julho";
import { calcularDreJulhoFinal } from "@/data/nitaplast-dre-julho-final";
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
  const irrfAplicacoesFinanceiras = useMemo(
    () =>
      Math.round(
        razaoAjustado
          .filter((l) => l.debitoCodigo === contaIrrfAplicacoesFinanceirasNitaplast && !idsIrProvisionadoNaoRetido.has(l.id))
          .reduce((s, l) => s + l.valor, 0) * 100,
      ) / 100,
    [razaoAjustado],
  );

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
