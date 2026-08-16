import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, ChevronRight, CircleAlert, ExternalLink, FileSearch } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  tributosFederaisFilialDocumentados,
  type ComposicaoDre,
} from "@/data/nitaplast-dre-detalhada";
import { useDreComReclassificacoes } from "@/hooks/use-dre-com-reclassificacoes";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const tolerancia = 0.01;

function DrePage() {
  useNitaplastJunho();
  const { comparacaoDreDetalhada, resumoDreDetalhada, reclassificacoes } = useDreComReclassificacoes();
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["receita", "deducoes", "custos", "fin-liq", "fin-desp"]));

  const receitaResumo = comparacaoDreDetalhada.find((linha) => linha.id === "receita");
  const deducoesResumo = comparacaoDreDetalhada.find((linha) => linha.id === "deducoes");
  const pisFilialEnviado = comparacaoDreDetalhada.find((linha) => linha.id === "pis-f")?.enviado ?? 0;
  const cofinsFilialEnviado = comparacaoDreDetalhada.find((linha) => linha.id === "cofins-f")?.enviado ?? 0;
  const duplicidadeFederaisFilial = Math.round((pisFilialEnviado + cofinsFilialEnviado) * 100) / 100;
  const diferencaDeducoes = Math.abs(deducoesResumo?.diferenca ?? 0);
  const creditosReversoesDeducoes = Math.max(0, Math.round((diferencaDeducoes - duplicidadeFederaisFilial) * 100) / 100);
  const todosIds = comparacaoDreDetalhada.map((linha) => linha.id);
  const todaDreAberta = todosIds.length > 0 && todosIds.every((id) => abertas.has(id));

  function alternar(id: string) {
    setAbertas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id); else proximo.add(id);
      return proximo;
    });
  }

  function alternarTodaDre() {
    setAbertas(todaDreAberta ? new Set() : new Set(todosIds));
  }

  return (
    <PageShell>
      <PageHeader
        titulo="DRE enviada x DRE calculada — Nitaplast 06/2026"
        descricao="A DRE Enviada é a referência de controle. A DRE Calculada nasce do Razão/Balancete e agora também incorpora reclassificações inteligentes contabilizadas pelo usuário."
        acoes={
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Consolidado Matriz + Filial</Badge>
            {reclassificacoes.length > 0 ? <Badge variant="outline">{reclassificacoes.length} reclassificação(ões)</Badge> : null}
            <Button variant="outline" size="sm" onClick={alternarTodaDre}>
              {todaDreAberta ? "Recolher toda DRE" : "Expandir toda DRE"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CompareMetric
          label="Receita Operacional Bruta"
          enviada={receitaResumo?.enviado ?? 0}
          calculada={receitaResumo?.calculado ?? resumoDreDetalhada.receitaCalculada}
        />
        <CompareMetric
          label="Deduções da Receita Bruta"
          enviada={deducoesResumo?.enviado ?? 0}
          calculada={deducoesResumo?.calculado ?? resumoDreDetalhada.deducoesCalculadas}
          alert={Math.abs(deducoesResumo?.diferenca ?? 0) > tolerancia}
        />
        <CompareMetric
          label="Lucro Líquido"
          enviada={resumoDreDetalhada.resultadoLiquidoEnviado}
          calculada={resumoDreDetalhada.resultadoLiquidoCalculado}
          success={resumoDreDetalhada.resultadoLiquidoCalculado >= 0}
          alert={Math.abs(resumoDreDetalhada.diferencaResultado) > tolerancia}
        />
        <Metric
          label="Diferença do resultado"
          value={resumoDreDetalhada.diferencaResultado}
          alert={Math.abs(resumoDreDetalhada.diferencaResultado) > tolerancia}
        />
      </div>

      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="grid gap-3 pt-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-medium">Regra única aplicada à DRE inteira</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Toda linha segue DRE Enviada → DRE Calculada → Diferença → Status. Reclassificações contabilizadas no Razão são aplicadas à conta de destino e recalculam os subtotais e o resultado.
            </p>
          </div>
          <Button asChild variant="outline" size="sm"><Link to="/contabil/balancete">Abrir Balancete <ExternalLink className="ml-2 size-4" /></Link></Button>
        </CardContent>
      </Card>

      <Card className="border-sky-500/30 bg-sky-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileSearch className="mt-0.5 size-5 shrink-0 text-sky-700" />
            <div>
              <p className="font-medium">JCP classificado como despesa financeira</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A conta 25107 — Juros s/ Capital Próprio possui classificação 5.8.01.005 e pertence a Despesas Financeiras. O grupo de despesas não repete mais o lançamento bruto na composição geral; abra “Despesas Financeiras” para conferir o JCP e demais encargos financeiros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-violet-500/30 bg-violet-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <FileSearch className="mt-0.5 size-5 shrink-0 text-violet-700" />
            <div>
              <p className="font-medium">Filial São Paulo incluída na análise do Balancete</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Receita, ICMS, IPI, folha, provisões e estoque utilizam os documentos identificados como filial. PIS e COFINS permanecem contabilizados pelo total consolidado das contas 2829/2830; a abertura Matriz x Filial é analítica e documental, sem duplicar lançamento.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                PIS documental da filial: {brl.format(tributosFederaisFilialDocumentados.pisDebitoFilial)} · COFINS documental da filial: {brl.format(tributosFederaisFilialDocumentados.cofinsDebitoFilial)}. Créditos de devoluções: PIS {brl.format(tributosFederaisFilialDocumentados.pisCreditoDevolucoesFilialIdentificado)} e COFINS {brl.format(tributosFederaisFilialDocumentados.cofinsCreditoDevolucoesFilialIdentificado)}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {deducoesResumo && Math.abs(deducoesResumo.diferenca) > tolerancia ? (
        <Card className="border-amber-500/40 bg-amber-50/60">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
              <div className="w-full">
                <p className="font-medium">Diagnóstico da diferença nas deduções</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A DRE enviada soma PIS/COFINS da filial em linhas próprias, embora as apurações federais estejam consolidadas nas contas 2829/2830. A DRE calculada também abate créditos e reversões fiscais registrados no Razão. Por isso o total calculado não deve ser forçado para o valor enviado.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MiniMetric label="Diferença total" value={diferencaDeducoes} />
                  <MiniMetric label="PIS/COFINS filial somados por fora" value={duplicidadeFederaisFilial} />
                  <MiniMetric label="Créditos/reversões abatidos" value={creditosReversoesDeducoes} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">DRE enviada x DRE calculada — detalhamento completo</CardTitle>
              <CardDescription>
                Abra qualquer linha para rever Enviada, Calculada, Diferença e Status, além do critério e da composição contábil. Ajustes inteligentes aparecem na composição da conta de destino.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{resumoDreDetalhada.linhasComDiferenca} linhas com diferença</Badge>
              <Button variant="outline" size="sm" onClick={alternarTodaDre}>
                {todaDreAberta ? "Recolher todas" : "Expandir todas"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b bg-muted text-left text-xs shadow-sm">
                <th className="p-2">Linha da DRE</th>
                <th className="p-2 text-right">DRE Enviada</th>
                <th className="p-2 text-right">DRE Calculada (Balancete)</th>
                <th className="p-2 text-right">Diferença</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {comparacaoDreDetalhada.map((linha) => {
                const aberta = abertas.has(linha.id);
                const ok = Math.abs(linha.diferenca) <= tolerancia;
                const diagnostico = linha.tipo === "diagnostico";
                const financeira = linha.id === "fin-liq" || linha.id === "fin-desp" || linha.id === "fin-rec";
                const classe = linha.tipo === "resultado"
                  ? "border-y-2 bg-primary/5 font-semibold"
                  : financeira
                    ? "border-b bg-sky-50/70"
                    : linha.tipo === "grupo"
                      ? "border-y bg-slate-100/80 font-semibold"
                      : diagnostico
                        ? "border-b bg-amber-50/60"
                        : "border-b";

                return [
                  <tr key={linha.id} className={classe}>
                    <td className="p-2" style={{ paddingLeft: 8 + linha.nivel * 22 }}>
                      <button
                        type="button"
                        aria-expanded={aberta}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-left hover:text-primary"
                        onClick={() => alternar(linha.id)}
                      >
                        {aberta ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                        <span>{linha.descricao}</span>
                        {diagnostico ? <Badge variant="outline" className="ml-2 border-amber-400 text-[10px] text-amber-800">Diagnóstico</Badge> : null}
                        {financeira ? <Badge variant="outline" className="ml-2 border-sky-400 text-[10px] text-sky-800">Financeiro</Badge> : null}
                      </button>
                    </td>
                    <Money value={linha.enviado} />
                    <Money value={linha.calculado} strong={linha.tipo !== "detalhe"} />
                    <td className={`p-2 text-right font-semibold tabular-nums ${ok ? "text-emerald-700" : "text-amber-700"}`}>{brl.format(linha.diferenca)}</td>
                    <td className="p-2 text-center">
                      {ok
                        ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Confere</span>
                        : <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />Investigar</span>}
                    </td>
                  </tr>,
                  aberta ? (
                    <tr key={`${linha.id}-detalhe`} className="border-b bg-slate-50/70">
                      <td colSpan={5} className="p-3 pl-8">
                        <DetalheComparacao enviada={linha.enviado} calculada={linha.calculado} diferenca={linha.diferenca} />
                        <p className="mb-2 mt-3 text-xs text-muted-foreground"><span className="font-medium text-foreground">Critério:</span> {linha.criterio}</p>
                        {linha.id === "despesas" ? (
                          <div className="rounded-md border border-sky-300 bg-sky-50 p-3 text-xs text-sky-900">
                            Esta linha é um subtotal. Para evitar duplicidade visual, os lançamentos não são repetidos aqui. Abra as sublinhas de despesas e, para JCP/juros/tarifas, abra <strong>Despesas Financeiras</strong>.
                          </div>
                        ) : linha.composicao.length > 0 ? (
                          <>
                            <p className="mb-2 text-xs font-medium text-foreground">Composição da DRE Calculada pelo Razão/Balancete</p>
                            <TabelaComposicao contas={linha.composicao} />
                          </>
                        ) : (
                          <div className="rounded-md border border-dashed bg-background p-3 text-xs text-muted-foreground">
                            Esta linha não possui composição contábil no Razão de junho. O comparativo acima continua válido e o critério informa por que o valor calculado está zerado ou é derivado de subtotal/resultado.
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function DetalheComparacao({ enviada, calculada, diferenca }: { enviada: number; calculada: number; diferenca: number }) {
  const ok = Math.abs(diferenca) <= tolerancia;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-md border bg-background p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">DRE Enviada</p><p className="mt-1 text-base font-semibold tabular-nums">{brl.format(enviada)}</p></div>
      <div className="rounded-md border bg-background p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">DRE Calculada</p><p className="mt-1 text-base font-semibold tabular-nums">{brl.format(calculada)}</p></div>
      <div className={`rounded-md border p-3 ${ok ? "bg-emerald-50" : "border-amber-300 bg-amber-50"}`}><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Diferença</p><p className={`mt-1 text-base font-semibold tabular-nums ${ok ? "text-emerald-700" : "text-amber-700"}`}>{brl.format(diferenca)}</p></div>
      <div className={`rounded-md border p-3 ${ok ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}><p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Status</p><p className={`mt-1 inline-flex items-center gap-1 text-sm font-semibold ${ok ? "text-emerald-700" : "text-amber-700"}`}>{ok ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}{ok ? "Confere" : "Investigar"}</p></div>
    </div>
  );
}

function TabelaComposicao({ contas }: { contas: ComposicaoDre[] }) {
  return (
    <div className="overflow-x-auto rounded-md border bg-background">
      <table className="w-full min-w-[1080px] text-xs">
        <thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2">CC</th><th className="p-2 text-right">Débitos no Razão</th><th className="p-2 text-right">Créditos no Razão</th><th className="p-2 text-right">Impacto na DRE Calculada</th><th className="p-2 text-right">Razão</th></tr></thead>
        <tbody>
          {contas.map((conta) => (
            <tr key={conta.chave} className="border-b last:border-0 align-top">
              <td className="p-2 font-mono font-medium">{conta.codigo}</td>
              <td className="p-2 font-mono">{conta.classificacao}</td>
              <td className="p-2"><p>{conta.descricao}</p><p className="mt-0.5 max-w-xl text-[10px] text-muted-foreground">{conta.observacao ?? conta.fonte}</p></td>
              <td className="p-2"><span className="font-mono">{conta.cc || "0"}</span><br /><span className="text-[10px] text-muted-foreground">{conta.centroCusto}</span></td>
              <td className="p-2 text-right tabular-nums">{brl.format(conta.debitos)}</td>
              <td className="p-2 text-right tabular-nums">{brl.format(conta.creditos)}</td>
              <td className={`p-2 text-right font-semibold tabular-nums ${conta.valorLinha < 0 ? "text-rose-700" : ""}`}>{brl.format(conta.valorLinha)}</td>
              <td className="p-2 text-right"><Button variant="outline" size="sm" onClick={() => window.location.assign(`/contabil/razao?conta=${encodeURIComponent(conta.codigo)}`)}>Abrir</Button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompareMetric({ label, enviada, calculada, success = false, alert = false }: { label: string; enviada: number; calculada: number; success?: boolean; alert?: boolean }) {
  const diferenca = Math.round((calculada - enviada) * 100) / 100;
  const ok = Math.abs(diferenca) <= tolerancia;
  return (
    <Card className={alert && !ok ? "border-amber-400/60" : undefined}>
      <CardContent className="pt-5">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">DRE Enviada</p><p className="mt-1 text-base font-semibold tabular-nums">{brl.format(enviada)}</p></div>
          <div className="border-l pl-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">DRE Calculada</p><p className={`mt-1 text-base font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{brl.format(calculada)}</p></div>
        </div>
        <p className={`mt-3 text-xs font-medium tabular-nums ${ok ? "text-emerald-700" : "text-amber-700"}`}>Diferença: {brl.format(diferenca)}</p>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md border bg-background/80 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 font-semibold tabular-nums">{brl.format(value)}</p></div>;
}

function Metric({ label, value, success = false, alert = false }: { label: string; value: number; success?: boolean; alert?: boolean }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-semibold tabular-nums ${alert ? "text-amber-700" : success ? "text-emerald-700" : ""}`}>{brl.format(value)}</p></CardContent></Card>;
}

function Money({ value, strong = false }: { value: number; strong?: boolean }) {
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{brl.format(value)}</td>;
}
