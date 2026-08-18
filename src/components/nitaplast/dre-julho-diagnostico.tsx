import { useMemo } from "react";
import { CheckCircle2 } from "lucide-react";
import { calcularBalanceteJulho } from "@/data/nitaplast-balancete-julho-engine";
import { calcularDreJulhoFinal } from "@/data/nitaplast-dre-julho-final";
import { lancamentosIntegradosJulhoFinal } from "@/data/nitaplast-razao-julho-final-v2";
import { useReclassificacoesInteligentes } from "@/hooks/use-reclassificacoes-inteligentes";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const arred = (v: number) => Math.round(v * 100) / 100;

export function DreJulhoDiagnostico() {
  const { aplicar } = useReclassificacoesInteligentes("2026-07");
  const razao = useMemo(() => aplicar(lancamentosIntegradosJulhoFinal), [aplicar]);
  const balancete = useMemo(() => calcularBalanceteJulho(razao), [razao]);
  const { dre } = useMemo(() => calcularDreJulhoFinal(razao), [razao]);

  const mov4736 = balancete.movimentoPorConta.get("4736")?.movimento ?? 0;
  const mov4760 = balancete.movimentoPorConta.get("4760")?.movimento ?? 0;
  const resultadoAntesAlienacao = arred(dre.resultado - dre.resultadoAlienacaoImobilizado);
  const alienacoesNoRazao = razao.filter((x) => x.id.startsWith("JUL-ALIEN-")).length;
  const conciliado =
    Math.abs(-mov4736 - dre.receitaAlienacaoImobilizado) < 0.01 &&
    Math.abs(mov4760 - dre.custoAlienacaoImobilizado) < 0.01 &&
    Math.abs(arred(dre.receitaAlienacaoImobilizado - dre.custoAlienacaoImobilizado) - dre.resultadoAlienacaoImobilizado) < 0.01;

  return (
    <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-50/50 p-4 text-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-emerald-950">Conciliação do resultado de julho</p>
          <p className="text-xs text-emerald-900/70">Razão → Balancete → DRE. Este quadro usa exatamente a mesma base da DRE abaixo.</p>
        </div>
        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
          <CheckCircle2 className="size-4" /> {conciliado ? "Alienação conciliada" : "Revisar conciliação"}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div><p className="text-xs text-muted-foreground">Resultado antes da alienação</p><p className="font-semibold tabular-nums">{brl.format(resultadoAntesAlienacao)}</p></div>
        <div><p className="text-xs text-muted-foreground">4736 · Receita alienação</p><p className="font-semibold tabular-nums">{brl.format(dre.receitaAlienacaoImobilizado)}</p></div>
        <div><p className="text-xs text-muted-foreground">4760 · Custo residual</p><p className="font-semibold tabular-nums">{brl.format(dre.custoAlienacaoImobilizado)}</p></div>
        <div><p className="text-xs text-muted-foreground">Ganho Mini + Corolla</p><p className="font-semibold tabular-nums text-emerald-700">+ {brl.format(dre.resultadoAlienacaoImobilizado)}</p></div>
        <div><p className="text-xs text-muted-foreground">Resultado final 07/2026</p><p className="font-semibold tabular-nums text-emerald-700">{brl.format(dre.resultado)}</p></div>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Razão contém {alienacoesNoRazao} partidas de alienação. Balancete: conta 4736 = {brl.format(mov4736)} de movimento assinado; conta 4760 = {brl.format(mov4760)}. O transformador de R$ 60.000,00 permanece fora do resultado até definição do valor residual.
      </p>
    </div>
  );
}
