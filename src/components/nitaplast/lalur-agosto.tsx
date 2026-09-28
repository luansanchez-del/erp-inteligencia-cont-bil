import { useMemo } from "react";
import { calcularApuracaoIrpjCsllAgosto } from "@/data/nitaplast-irpj-csll-agosto";
import { contaIrrfAplicacoesFinanceirasNitaplast } from "@/data/nitaplast-irpj-csll-julho";
import { useLalurAjustes } from "@/hooks/use-lalur-ajustes";
import { useLancamentosCompetencia } from "@/hooks/use-lancamentos-competencia";
import { calcularResultadoAgosto } from "./contabil-agosto-completo";
import { useApuracaoLalurJulho } from "./lalur-julho";
import { brl, LalurApuracaoCard } from "./lalur-apuracao";

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

  const memoria = (rotulo: string, pagosAteJunho: number, darfJulho: number) => (
    <>
      <tr className="border-b text-xs text-muted-foreground">
        <td className="py-1 pl-4">· pagos até junho/2026 (planilha do escritório)</td>
        <td className="py-1 text-right tabular-nums">{brl.format(pagosAteJunho)}</td>
      </tr>
      <tr className="border-b text-xs text-muted-foreground">
        <td className="py-1 pl-4">· DARF {rotulo} de julho/2026 (conforme LALUR 07/2026)</td>
        <td className="py-1 text-right tabular-nums">{brl.format(darfJulho)}</td>
      </tr>
    </>
  );

  return (
    <LalurApuracaoCard
      competencia={COMPETENCIA}
      rotulo="08/2026"
      dataLancamento="31/08/2026"
      descricao={
        <>
          Balanço de Suspensão/Redução (mesmo método de janeiro-julho/2026): lucro real acumulado
          de janeiro a agosto ± ajustes do LALUR (julho e agosto), abatidos os DARFs de estimativa
          pagos até julho e o IRRF sobre aplicações retido até agosto.
        </>
      }
      periodoAcumulado="janeiro a agosto/2026"
      periodoAcumuladoCurto="Jan-Ago"
      mesesAcumulados={8}
      periodoPagamentos="jan-jul/2026"
      rotuloDre="Resultado da DRE de agosto"
      lucroContabilDoMes={irpjCsll.lucroContabilDoMes}
      lucroContabilAcumulado={irpjCsll.lucroContabilAcumuladoJaneiroAAgosto}
      irpjCsll={irpjCsll}
      lalur={lalur}
      memoriaIrpj={memoria("IRPJ", apuracaoJulho.pagamentosEstimativaIrpjAnteriores, irpjCsll.darfIrpjJulho)}
      memoriaCsll={memoria("CSLL", apuracaoJulho.pagamentosEstimativaCsllAnteriores, irpjCsll.darfCsllJulho)}
      observacao={
        <div className="rounded-md border border-amber-400 bg-amber-100/50 p-3 text-xs text-amber-900">
          O resultado de agosto inclui a provisão de receita não operacional de{" "}
          {brl.format(400_000)} (25950, ajuste manual autorizado pelo cliente, a estornar em
          09/2026) e o estorno da provisão de custo de julho ({brl.format(100_000)}, 25948). O DARF
          de julho usado como pagamento anterior é o valor calculado no LALUR 07/2026 — conferir
          com o DARF efetivamente recolhido. IRRF sobre aplicações retido em agosto (25118):{" "}
          {brl.format(irpjCsll.irrfAplicacoesFinanceirasAgosto)}.
        </div>
      }
    />
  );
}
