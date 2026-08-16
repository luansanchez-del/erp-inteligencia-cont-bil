import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, ChevronRight, CircleAlert, ExternalLink } from "lucide-react";
import { PageHeader, PageShell } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cadastroFiscalNitaplast, dreCompletaJunho } from "@/data/nitaplast-dre-completa";
import {
  comparacaoDreBalancete,
  contasResultadoPorGrupo,
  diferencaAbsolutaDre,
  resultadoLiquidoBalancete,
  resumoDreBalancete,
  type GrupoDreBalancete,
} from "@/data/nitaplast-dre-balancete";
import { useNitaplastJunho } from "@/hooks/use-nitaplast-junho";

export const Route = createFileRoute("/contabil/dre")({ component: DrePage });

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const tolerancia = 0.01;
const valorControle = (id: string) => dreCompletaJunho.find((linha) => linha.id === id)?.valor ?? 0;

function DrePage() {
  useNitaplastJunho();
  const [abertas, setAbertas] = useState<Set<string>>(new Set(["receita", "deducoes", "custos"]));
  const lucroControle = valorControle("lucro-liq");

  function alternar(id: string) {
    setAbertas((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(id)) proximo.delete(id); else proximo.add(id);
      return proximo;
    });
  }

  return (
    <PageShell>
      <PageHeader
        titulo="DRE contábil — Nitaplast 06/2026"
        descricao="A DRE calculada nasce do Razão/Balancete. A DRE enviada permanece intacta como referência de controle para localizar e explicar diferenças — sem criar lançamentos para fazê-las bater."
        acoes={<Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">DRE calculada pelo Balancete</Badge>}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Receita — DRE calculada" value={resumoDreBalancete.receitaBruta} />
        <Metric label="Resultado — DRE calculada" value={resultadoLiquidoBalancete} success={resultadoLiquidoBalancete >= 0} />
        <Metric label="Resultado — DRE enviada" value={lucroControle} success={lucroControle >= 0} />
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground">Diferenças ainda a explicar</p>
            <p className={`mt-1 text-xl font-semibold tabular-nums ${diferencaAbsolutaDre <= tolerancia ? "text-emerald-700" : "text-amber-700"}`}>{brl.format(diferencaAbsolutaDre)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div>
            <p className="font-medium">Regime tributário confirmado</p>
            <p className="text-sm text-muted-foreground">{cadastroFiscalNitaplast.regimeTributario} por {cadastroFiscalNitaplast.formaApuracaoIrpjCsll.toLocaleLowerCase("pt-BR")}.</p>
          </div>
          <Badge variant="outline">Confirmado pelo cliente</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">DRE calculada x DRE enviada</CardTitle>
              <CardDescription>
                “DRE calculada” vem exclusivamente do movimento contábil. “DRE enviada” é a referência recebida. Abra uma linha para ver as contas que formam o valor e a origem da discrepância.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm"><Link to="/contabil/balancete">Abrir Balancete <ExternalLink className="ml-2 size-4" /></Link></Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs">
                <th className="p-2">Linha da DRE</th>
                <th className="p-2 text-right">DRE calculada (Balancete)</th>
                <th className="p-2 text-right">DRE enviada</th>
                <th className="p-2 text-right">Diferença</th>
                <th className="p-2 text-center">Análise</th>
              </tr>
            </thead>
            <tbody>
              {comparacaoDreBalancete.map((linha) => {
                const grupo = linha.id === "resultado" ? undefined : linha.id as GrupoDreBalancete;
                const contas = grupo ? contasResultadoPorGrupo[grupo] : [];
                const podeAbrir = contas.length > 0;
                const aberta = abertas.has(linha.id);
                const ok = Math.abs(linha.diferenca) <= tolerancia;
                return [
                  <tr key={linha.id} className={linha.id === "resultado" ? "border-y-2 bg-primary/5 font-semibold" : "border-b"}>
                    <td className="p-2">
                      <button type="button" className={`inline-flex items-center gap-1.5 text-left ${podeAbrir ? "cursor-pointer hover:text-primary" : "cursor-default"}`} onClick={() => podeAbrir && alternar(linha.id)}>
                        {podeAbrir ? (aberta ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />) : <span className="inline-block w-4" />}
                        {linha.descricao}
                      </button>
                    </td>
                    <Money value={linha.apuradoBalancete} strong={linha.id === "resultado"} />
                    <Money value={linha.controleEsperado} />
                    <td className={`p-2 text-right font-medium tabular-nums ${ok ? "text-emerald-700" : "text-amber-700"}`}>{brl.format(linha.diferenca)}</td>
                    <td className="p-2 text-center">{ok
                      ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="size-4" />Confere</span>
                      : <span className="inline-flex items-center gap-1 text-amber-700"><CircleAlert className="size-4" />Investigar</span>}
                    </td>
                  </tr>,
                  podeAbrir && aberta ? (
                    <tr key={`${linha.id}-contas`} className="border-b bg-slate-50/70">
                      <td colSpan={5} className="p-3 pl-8">
                        {grupo === "deducoes" ? <AnaliseDeducoes diferenca={linha.diferenca} calculada={linha.apuradoBalancete} enviada={linha.controleEsperado} /> : null}
                        <TabelaContas grupo={grupo!} />
                      </td>
                    </tr>
                  ) : null,
                ];
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {resumoDreBalancete.contasSemVinculo > 0 ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><CircleAlert className="size-5 text-amber-700" />Contas de resultado ainda sem vínculo na estrutura da DRE</CardTitle>
            <CardDescription>
              São contas 4.x/5.x movimentadas no balancete que não foram silenciosamente descartadas. Elas permanecem expostas até definirmos a linha correta da DRE.
            </CardDescription>
          </CardHeader>
          <CardContent><TabelaContas grupo="sem-vinculo" /></CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/40 bg-emerald-500/5"><CardContent className="flex items-center gap-2 pt-6 text-sm"><CheckCircle2 className="size-5 text-emerald-700" />Todas as contas de resultado movimentadas possuem grupo na DRE calculada.</CardContent></Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">DRE enviada — referência original</CardTitle>
          <CardDescription>Esta tabela permanece como foi recebida. Ela não gera lançamentos e não é alterada para acompanhar o balancete.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b bg-muted/40 text-left text-xs"><th className="p-2">Linha</th><th className="p-2">Origem do controle</th><th className="p-2 text-right">Valor enviado</th></tr></thead>
            <tbody>{dreCompletaJunho.map((linha) => <tr key={linha.id} className={linha.tipo === "resultado" ? "border-y bg-muted/20 font-semibold" : "border-b"}>
              <td className="p-2" style={{ paddingLeft: 8 + linha.nivel * 22 }}>{linha.descricao}</td>
              <td className="p-2 text-xs text-muted-foreground">{linha.origem}</td>
              <td className="p-2 text-right tabular-nums">{brl.format(linha.valor)}</td>
            </tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function AnaliseDeducoes({ diferenca, calculada, enviada }: { diferenca: number; calculada: number; enviada: number }) {
  const creditosReais = contasResultadoPorGrupo.deducoes.reduce((total, conta) => total + conta.creditos, 0);
  const pisCofinsFilialNaDreEnviada = valorControle("pis-f") + valorControle("cofins-f");
  const diferencaExplicada = creditosReais + pisCofinsFilialNaDreEnviada;
  const residual = Math.max(0, Math.abs(diferenca) - diferencaExplicada);

  return (
    <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <Resumo label="DRE calculada" value={calculada} />
        <Resumo label="DRE enviada" value={enviada} />
        <Resumo label="Diferença a explicar" value={Math.abs(diferenca)} destaque />
      </div>
      <div className="mt-3 grid gap-2 lg:grid-cols-2">
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Referência enviada, sem gerar lançamento</p>
          <p className="mt-1 text-sm">PIS Filial + COFINS Filial existentes na DRE enviada: <strong>{brl.format(pisCofinsFilialNaDreEnviada)}</strong>.</p>
          <p className="mt-1 text-xs text-muted-foreground">Esses valores permanecem visíveis apenas para explicar a referência enviada. Não existe lançamento técnico de reversão no Razão calculado.</p>
        </div>
        <div className="rounded-md border bg-background p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Movimento real do balancete</p>
          <p className="mt-1 text-sm">Créditos existentes nas contas de dedução: <strong>{brl.format(creditosReais)}</strong>.</p>
          <p className="mt-1 text-xs text-muted-foreground">São créditos efetivamente presentes nos lançamentos que formam o balancete; abra as contas abaixo para identificar cada origem documental.</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Diferença explicada nesta linha: <strong>{brl.format(diferencaExplicada)}</strong>{residual > tolerancia ? <> · Ainda sem explicação: <strong className="text-amber-800">{brl.format(residual)}</strong></> : " · diferença integralmente localizada."}
      </div>
    </div>
  );
}

function TabelaContas({ grupo }: { grupo: GrupoDreBalancete }) {
  const contas = contasResultadoPorGrupo[grupo];
  return <div className="overflow-x-auto rounded-md border bg-background">
    <table className="w-full min-w-[900px] text-xs">
      <thead><tr className="border-b bg-muted/50 text-left"><th className="p-2">Conta</th><th className="p-2">Classificação</th><th className="p-2">Descrição</th><th className="p-2 text-right">Débitos reais</th><th className="p-2 text-right">Créditos reais</th><th className="p-2 text-right">Efeito na DRE calculada</th></tr></thead>
      <tbody>{contas.map((conta) => <tr key={conta.codigo} className="border-b last:border-0"><td className="p-2 font-mono font-medium">{conta.codigo}</td><td className="p-2 font-mono">{conta.classificacao}</td><td className="p-2">{conta.descricao}</td><td className="p-2 text-right tabular-nums">{brl.format(conta.debitos)}</td><td className="p-2 text-right tabular-nums">{brl.format(conta.creditos)}</td><td className={`p-2 text-right font-medium tabular-nums ${conta.resultado >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{brl.format(conta.resultado)}</td></tr>)}</tbody>
    </table>
  </div>;
}

function Resumo({ label, value, destaque = false }: { label: string; value: number; destaque?: boolean }) {
  return <div className="rounded-md border bg-background p-2"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`font-semibold tabular-nums ${destaque ? "text-amber-800" : ""}`}>{brl.format(value)}</p></div>;
}

function Metric({ label, value, success = false }: { label: string; value: number; success?: boolean }) {
  return <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-semibold tabular-nums ${success ? "text-emerald-700" : ""}`}>{brl.format(value)}</p></CardContent></Card>;
}

function Money({ value, strong = false }: { value: number; strong?: boolean }) {
  return <td className={`p-2 text-right tabular-nums ${strong ? "font-semibold" : ""}`}>{brl.format(value)}</td>;
}
