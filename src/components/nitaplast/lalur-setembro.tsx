import { useMemo } from "react";
import { calcularApuracaoIrpjCsllSetembro } from "@/data/nitaplast-irpj-csll-setembro";
import { contaIrrfAplicacoesFinanceirasNitaplast, idsIrProvisionadoNaoRetido } from "@/data/nitaplast-irpj-csll-julho";
import { useLalurAjustes } from "@/hooks/use-lalur-ajustes";
import { useLancamentosCompetencia } from "@/hooks/use-lancamentos-competencia";
import { calcularResultadoAgosto } from "./contabil-agosto-completo";
import { useApuracaoLalurAgosto } from "./lalur-agosto";
import { LalurApuracaoCard } from "./lalur-apuracao";

const COMPETENCIA = "2026-09";
const arred = (v: number) => Math.round(v * 100) / 100;

export function LalurSetembro() {
  // Mesma base e mesmo motor do DRE de setembro (Razão + lançamentos manuais da competência).
  const { lancamentos } = useLancamentosCompetencia("nitaplast-matriz", COMPETENCIA);
  const { resultado: resultadoSetembro } = useMemo(() => calcularResultadoAgosto(lancamentos), [lancamentos]);
  const irrfSetembro = useMemo(
    () =>
      arred(
        lancamentos
          .filter((l) => l.debitoCodigo === contaIrrfAplicacoesFinanceirasNitaplast && !idsIrProvisionadoNaoRetido.has(l.id))
          .reduce((s, l) => s + l.valor, 0),
      ),
    [lancamentos],
  );

  const { irpjCsll: apuracaoAgosto, lalur: lalurAgosto, lalurJulho } = useApuracaoLalurAgosto();
  const lalur = useLalurAjustes(COMPETENCIA);
  const { totais } = lalur;

  const irpjCsll = useMemo(
    () =>
      calcularApuracaoIrpjCsllSetembro(
        apuracaoAgosto,
        lalurJulho.totais,
        lalurAgosto.totais,
        resultadoSetembro,
        irrfSetembro,
        totais,
      ),
    [apuracaoAgosto, lalurJulho.totais, lalurAgosto.totais, resultadoSetembro, irrfSetembro, totais],
  );

  return (
    <LalurApuracaoCard
      competencia={COMPETENCIA}
      rotulo="09/2026"
      dataLancamento="30/09/2026"
      lucroContabilDoMes={irpjCsll.lucroContabilDoMes}
      lucroContabilAcumulado={irpjCsll.lucroContabilAcumuladoJaneiroASetembro}
      irpjCsll={irpjCsll}
      lalur={lalur}
    />
  );
}
