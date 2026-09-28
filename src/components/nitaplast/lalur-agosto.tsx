import { useMemo } from "react";
import { calcularApuracaoIrpjCsllAgosto, lalurAgostoFechado } from "@/data/nitaplast-irpj-csll-agosto";
import { contaIrrfAplicacoesFinanceirasNitaplast } from "@/data/nitaplast-irpj-csll-julho";
import { useLalurAjustes } from "@/hooks/use-lalur-ajustes";
import { useLancamentosCompetencia } from "@/hooks/use-lancamentos-competencia";
import { calcularResultadoAgosto } from "./contabil-agosto-completo";
import { useApuracaoLalurJulho } from "./lalur-julho";
import { LalurApuracaoCard } from "./lalur-apuracao";

const COMPETENCIA = "2026-08";
const arred = (v: number) => Math.round(v * 100) / 100;

export function LalurAgosto() {
  // Mesma base e mesmo motor do DRE de agosto (Razão + lançamentos manuais da competência).
  const { lancamentos } = useLancamentosCompetencia("nitaplast-matriz", COMPETENCIA);
  const { resultado: resultadoAgosto } = useMemo(() => calcularResultadoAgosto(lancamentos), [lancamentos]);
  const irrfAgosto = useMemo(
    () =>
      arred(
        lancamentos
          .filter((l) => l.debitoCodigo === contaIrrfAplicacoesFinanceirasNitaplast)
          .reduce((s, l) => s + l.valor, 0),
      ),
    [lancamentos],
  );

  const { irpjCsll: apuracaoJulho, lalur: lalurJulho } = useApuracaoLalurJulho();
  const lalur = useLalurAjustes(COMPETENCIA);
  const { totais } = lalur;

  const irpjCsll = useMemo(
    () => calcularApuracaoIrpjCsllAgosto(apuracaoJulho, lalurJulho.totais, resultadoAgosto, irrfAgosto, totais),
    [apuracaoJulho, lalurJulho.totais, resultadoAgosto, irrfAgosto, totais],
  );

  return (
    <LalurApuracaoCard
      competencia={COMPETENCIA}
      rotulo="08/2026"
      dataLancamento="31/08/2026"
      lucroContabilDoMes={irpjCsll.lucroContabilDoMes}
      lucroContabilAcumulado={irpjCsll.lucroContabilAcumuladoJaneiroAAgosto}
      irpjCsll={irpjCsll}
      lalur={lalur}
      fechamento={lalurAgostoFechado}
    />
  );
}
