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
    <>
      <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-50/50 p-4 text-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-emerald-950">Alienação de Imobilizado — 07/2026</p>
            <p className="text-xs text-emerald-900/70">Mini Cooper + Corolla já reconhecidos no Razão, Balancete e DRE. A receita de alienação fica fora da Receita Operacional Bruta.</p>
          </div>
          <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
            <CheckCircle2 className="size-4" /> {conciliado ? "Alienação conciliada" : "Revisar conciliação"}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div><p className="text-xs text-muted-foreground">Resultado antes da alienação</p><p className="font-semibold tabular-nums">{brl.format(resultadoAntesAlienacao)}</p></div>
          <div><p className="text-xs font-medium text-emerald-900">(+) Receita de Alienação de Imobilizado</p><p className="font-semibold tabular-nums text-emerald-800">{brl.format(dre.receitaAlienacaoImobilizado)}</p><p className="text-[11px] text-muted-foreground">Conta 4736</p></div>
          <div><p className="text-xs font-medium">(-) Custo dos Ativos Vendidos</p><p className="font-semibold tabular-nums">{brl.format(dre.custoAlienacaoImobilizado)}</p><p className="text-[11px] text-muted-foreground">Conta 4760</p></div>
          <div><p className="text-xs font-medium text-emerald-900">(=) Ganho na Alienação</p><p className="font-semibold tabular-nums text-emerald-700">{brl.format(dre.resultadoAlienacaoImobilizado)}</p><p className="text-[11px] text-muted-foreground">Mini + Corolla</p></div>
          <div><p className="text-xs font-medium text-emerald-900">Resultado final 07/2026</p><p className="font-semibold tabular-nums text-emerald-700">{brl.format(dre.resultado)}</p></div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Razão contém {alienacoesNoRazao} partidas de alienação. Balancete: conta 4736 = {brl.format(mov4736)} de movimento assinado; conta 4760 = {brl.format(mov4760)}. O transformador de R$ 60.000,00 (NF 93639) já compõe o resultado: valor contábil líquido R$ 57.638,86 na venda (14/07), ganho de R$ 2.361,14.
        </p>
      </div>

      <div className="mb-4 rounded-lg border p-4 text-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold">Simulação de saneamento do CPV — 07/2026</p>
            <p className="text-xs text-muted-foreground">Custos industriais 5.3 entram no CPV somente quando ligados à produção. Serviços administrativos e comerciais continuam em despesas operacionais.</p>
          </div>
          <span className="inline-flex items-center gap-1 font-medium">
            <CheckCircle2 className="size-4" /> Resultado preservado
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div><p className="text-xs text-muted-foreground">CPV antes</p><p className="font-semibold tabular-nums">{brl.format(dre.simulacaoCpv.cpvAntes)}</p></div>
          <div><p className="text-xs text-muted-foreground">Reclassificado para CPV</p><p className="font-semibold tabular-nums">{brl.format(dre.simulacaoCpv.reclassificadoParaCpv)}</p></div>
          <div><p className="text-xs text-muted-foreground">CPV depois</p><p className="font-semibold tabular-nums">{brl.format(dre.simulacaoCpv.cpvDepois)}</p></div>
          <div><p className="text-xs text-muted-foreground">Desp. operacionais antes</p><p className="font-semibold tabular-nums">{brl.format(dre.simulacaoCpv.despesasOperacionaisAntes)}</p></div>
          <div><p className="text-xs text-muted-foreground">Desp. operacionais depois</p><p className="font-semibold tabular-nums">{brl.format(dre.simulacaoCpv.despesasOperacionaisDepois)}</p></div>
          <div><p className="text-xs text-muted-foreground">Impacto no resultado</p><p className="font-semibold tabular-nums">{brl.format(dre.simulacaoCpv.impactoResultado)}</p></div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          Resultado simulado antes: {brl.format(dre.simulacaoCpv.resultadoAntes)} · resultado depois: {brl.format(dre.simulacaoCpv.resultadoDepois)}. A alteração é apenas de classificação entre CPV e despesas, sem criar ou excluir lançamento do Razão.
        </p>
      </div>
    </>
  );
}